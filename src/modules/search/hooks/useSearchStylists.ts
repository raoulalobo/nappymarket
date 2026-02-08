/**
 * useSearchStylists — Hook TanStack Query pour la recherche de coiffeuses
 *
 * Role : Fetcher les resultats de recherche depuis la server action searchStylists()
 *        en lisant les filtres depuis le store Zustand. TanStack Query gere le cache,
 *        le loading, les erreurs et le stale-while-revalidate.
 *
 * Interactions :
 *   - Lit les filtres depuis useSearchFiltersStore (store Zustand)
 *   - Appelle la server action searchStylists() (module search/actions)
 *   - Retourne un SearchResponse (module search/types)
 *   - Consomme par SearchResults et SearchMap (composants)
 *   - keepPreviousData evite le flash blanc entre les changements de page
 *
 * Separation des responsabilites :
 *   - Zustand = filtres UI (ce que l'utilisateur a selectionne)
 *   - TanStack Query = donnees serveur (resultats, loading, erreur, cache)
 *
 * Exemple :
 *   const { data, isLoading, error } = useSearchStylists()
 *   // data?.stylists = coiffeuses trouvees
 *   // data?.totalCount = nombre total
 */
"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useSearchFiltersStore } from "@/shared/stores/search-filters-store"
import { searchStylists } from "../actions/search-actions"
import type { SearchResponse } from "../types"

/**
 * useSearchStylists — Hook de recherche de coiffeuses
 *
 * La query est activee uniquement si des coordonnees GPS sont disponibles
 * (l'utilisateur a selectionne une ville dans l'autocompletion).
 *
 * @returns TanStack Query result avec SearchResponse comme data
 */
export function useSearchStylists() {
  // Lire les filtres depuis le store Zustand
  const { city, latitude, longitude, radiusKm, categoryId, sortBy, page } =
    useSearchFiltersStore()

  return useQuery<SearchResponse>({
    // Cle de cache unique qui change quand les filtres changent
    // TanStack Query refetch automatiquement quand la cle change
    queryKey: ["search", "stylists", { city, latitude, longitude, radiusKm, categoryId, sortBy, page }],

    queryFn: async () => {
      const result = await searchStylists({
        city,
        latitude,
        longitude,
        radiusKm,
        // Ne pas envoyer categoryId si null (le schema attend undefined, pas null)
        ...(categoryId ? { categoryId } : {}),
        sortBy,
        page,
      })

      // Transformer ActionResult en donnees directes pour TanStack Query
      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },

    // Ne pas fetcher si pas de coordonnees (ville pas encore selectionnee)
    enabled: latitude !== null && longitude !== null,

    // Garder les donnees precedentes pendant le refetch (evite le flash blanc)
    placeholderData: keepPreviousData,

    // Considerer les donnees fraiches pendant 2 minutes
    staleTime: 2 * 60 * 1000,
  })
}
