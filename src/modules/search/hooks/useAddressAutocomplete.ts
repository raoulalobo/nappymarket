/**
 * useAddressAutocomplete — Hook d'autocompletion des villes via Mapbox Geocoding API
 *
 * Role : Fournir des suggestions de villes en temps reel pendant la frappe
 *        dans la barre de recherche. Utilise l'API Mapbox Geocoding v5
 *        qui retourne des resultats JSON avec coordonnees [lng, lat].
 *
 * Interactions :
 *   - Utilise useDebounce (shared/hooks) pour limiter les appels API (300ms)
 *   - Utilise TanStack Query pour le cache et la gestion du loading
 *   - Consomme par SearchBar (module search/components)
 *   - Consomme par BookingStepAddress (module booking/components)
 *   - Retourne des AddressSuggestion[] (module search/types)
 *
 * Mapbox Geocoding API :
 *   - URL : https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json
 *   - Params : access_token, types=place, limit=5, language=fr, country=fr
 *   - Retour : FeatureCollection avec features[].center = [longitude, latitude]
 *     (attention : meme ordre que GeoJSON — [lng, lat], pas [lat, lng])
 *   - Token : NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN (variable d'env publique)
 *
 * Exemple :
 *   const { suggestions, isLoading } = useAddressAutocomplete("Par")
 *   // suggestions = [{ label: "Paris, Île-de-France, France", city: "Paris", latitude: 48.85, ... }]
 */
"use client"

import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "@/shared/hooks/useDebounce"
import type { AddressSuggestion } from "../types"

/**
 * Structure brute d'un feature retourne par Mapbox Geocoding API
 *
 * Exemple de feature :
 *   {
 *     place_name: "Paris, Île-de-France, France",
 *     text: "Paris",
 *     center: [2.3522, 48.8566],
 *     context: [{ id: "postcode.123", text: "75001" }, ...]
 *   }
 */
interface MapboxFeature {
  place_name: string        // Label complet (ex: "Paris, Île-de-France, France")
  text: string              // Nom court de la ville (ex: "Paris")
  center: [number, number]  // Coordonnees [longitude, latitude]
  context?: Array<{
    id: string              // Type du contexte (ex: "postcode.123", "region.456")
    text: string            // Valeur (ex: "75001", "Île-de-France")
  }>
}

/**
 * fetchAddressSuggestions — Appeler Mapbox Geocoding API et parser la reponse
 *
 * @param query - Texte saisi par l'utilisateur (min 2 caracteres)
 * @returns Liste de suggestions d'adresses
 *
 * Exemple :
 *   const results = await fetchAddressSuggestions("Lyon")
 *   // [{ label: "Lyon, Auvergne-Rhône-Alpes, France", city: "Lyon", latitude: 45.76, ... }]
 */
async function fetchAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
  // Token Mapbox depuis les variables d'environnement publiques
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  if (!token) {
    console.warn("[geocode] NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN non defini")
    return []
  }

  // Construire l'URL Mapbox Geocoding v5
  // - types=place : retourne uniquement des villes (pas des rues ou adresses)
  // - language=fr : labels en francais
  // - country=fr : restreint aux villes francaises
  // - limit=5 : maximum 5 suggestions
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&types=place&limit=5&language=fr&country=fr`

  const response = await fetch(url)
  if (!response.ok) return []

  const data = await response.json()

  // Transformer les features Mapbox en AddressSuggestion[]
  // Mapbox utilise center = [longitude, latitude], on inverse pour nos types
  return (data.features ?? []).map((feature: MapboxFeature) => ({
    label: feature.place_name,                                              // "Paris, Île-de-France, France"
    city: feature.text,                                                     // "Paris"
    latitude: feature.center[1],                                            // Index 1 = latitude
    longitude: feature.center[0],                                           // Index 0 = longitude
    postcode: feature.context?.find(c => c.id.startsWith("postcode"))?.text ?? "",  // Code postal depuis le contexte
  }))
}

/**
 * useAddressAutocomplete — Hook d'autocompletion des villes
 *
 * @param query - Texte saisi par l'utilisateur dans le champ de recherche
 * @returns { suggestions, isLoading } — Suggestions et etat de chargement
 *
 * Exemple :
 *   const { suggestions, isLoading } = useAddressAutocomplete(inputValue)
 *   // Afficher les suggestions dans un dropdown
 */
export function useAddressAutocomplete(query: string) {
  // Debounce la query de 300ms pour eviter de surcharger l'API Mapbox
  const debouncedQuery = useDebounce(query, 300)

  const { data: suggestions = [], isLoading } = useQuery({
    // Cle de cache unique basee sur la query debouncee
    queryKey: ["address-autocomplete", debouncedQuery],
    queryFn: () => fetchAddressSuggestions(debouncedQuery),
    // Ne pas fetcher si moins de 2 caracteres (pas assez pour une recherche utile)
    enabled: debouncedQuery.length >= 2,
    // Cache les suggestions 10 minutes (les villes ne changent pas souvent)
    staleTime: 10 * 60 * 1000,
  })

  return { suggestions, isLoading }
}
