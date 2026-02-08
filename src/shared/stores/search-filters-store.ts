/**
 * search-filters-store.ts — Store Zustand pour les filtres de recherche UI
 *
 * Role : Gerer l'etat UI des filtres de recherche (ville, rayon, categorie, tri,
 *        pagination, mode d'affichage). Ce store ne contient PAS les resultats
 *        de recherche (qui sont geres par TanStack Query dans useSearchStylists).
 *
 * Interactions :
 *   - Ecrit par SearchBar (ville + coordonnees), SearchFilters (rayon, categorie, tri)
 *   - Lu par useSearchStylists (hook TanStack Query) pour construire la requete
 *   - Lu par SearchMap et SearchResults pour determiner le mode d'affichage
 *   - Chaque changement de filtre reset la page a 1 (sauf setPage et setViewMode)
 *
 * Separation des responsabilites :
 *   - Ce store = etat UI pur (filtres selectionnes par l'utilisateur)
 *   - TanStack Query = donnees serveur (resultats, cache, loading, erreur)
 *
 * Exemple :
 *   import { useSearchFiltersStore } from "@/shared/stores/search-filters-store"
 *   const { city, setCity, radiusKm, setRadiusKm } = useSearchFiltersStore()
 */
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { DEFAULT_SEARCH_RADIUS_KM } from "@/shared/lib/constants"

/** Mode d'affichage des resultats de recherche */
export type ViewMode = "list" | "map" | "split"

interface SearchFiltersState {
  /** Ville recherchee (texte affiche) */
  city: string
  /** Latitude du centre de recherche (null = pas de ville selectionnee) */
  latitude: number | null
  /** Longitude du centre de recherche */
  longitude: number | null
  /** Rayon de recherche en km (defaut: DEFAULT_SEARCH_RADIUS_KM) */
  radiusKm: number
  /** ID de la categorie de service selectionnee (null = toutes) */
  categoryId: string | null
  /** Tri des resultats */
  sortBy: "distance" | "price_asc" | "price_desc"
  /** Numero de page courant (1-indexed) */
  page: number
  /** Mode d'affichage : liste, carte, ou split (desktop) */
  viewMode: ViewMode

  // --- Actions ---
  /** Definir la ville + coordonnees GPS (reset page a 1) */
  setCity: (city: string, lat: number, lng: number) => void
  /** Modifier le rayon de recherche (reset page a 1) */
  setRadiusKm: (radius: number) => void
  /** Filtrer par categorie (reset page a 1) */
  setCategoryId: (id: string | null) => void
  /** Changer le tri (reset page a 1) */
  setSortBy: (sort: "distance" | "price_asc" | "price_desc") => void
  /** Changer de page (ne reset PAS les filtres) */
  setPage: (page: number) => void
  /** Changer le mode d'affichage */
  setViewMode: (mode: ViewMode) => void
  /** Reinitialiser tous les filtres a leur valeur par defaut */
  reset: () => void
}

export const useSearchFiltersStore = create<SearchFiltersState>()(
  immer((set) => ({
    city: "",
    latitude: null,
    longitude: null,
    radiusKm: DEFAULT_SEARCH_RADIUS_KM,
    categoryId: null,
    sortBy: "distance" as const,
    page: 1,
    viewMode: "split" as ViewMode,

    setCity: (city, lat, lng) =>
      set((state) => {
        state.city = city
        state.latitude = lat
        state.longitude = lng
        state.page = 1 // Reset page lors d'un changement de ville
      }),

    setRadiusKm: (radius) =>
      set((state) => {
        state.radiusKm = radius
        state.page = 1
      }),

    setCategoryId: (id) =>
      set((state) => {
        state.categoryId = id
        state.page = 1
      }),

    setSortBy: (sort) =>
      set((state) => {
        state.sortBy = sort
        state.page = 1
      }),

    setPage: (page) =>
      set((state) => {
        state.page = page
      }),

    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode
      }),

    reset: () =>
      set((state) => {
        state.city = ""
        state.latitude = null
        state.longitude = null
        state.radiusKm = DEFAULT_SEARCH_RADIUS_KM
        state.categoryId = null
        state.sortBy = "distance"
        state.page = 1
        state.viewMode = "split"
      }),
  }))
)
