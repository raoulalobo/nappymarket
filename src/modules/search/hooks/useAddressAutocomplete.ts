/**
 * useAddressAutocomplete — Hook d'autocompletion des villes via API Adresse Gouv
 *
 * Role : Fournir des suggestions de villes en temps reel pendant la frappe
 *        dans la barre de recherche. Utilise l'API publique api-adresse.data.gouv.fr
 *        qui retourne des resultats au format GeoJSON.
 *
 * Interactions :
 *   - Utilise useDebounce (shared/hooks) pour limiter les appels API (300ms)
 *   - Utilise TanStack Query pour le cache et la gestion du loading
 *   - Consomme par SearchBar (module search/components)
 *   - Retourne des AddressSuggestion[] (module search/types)
 *
 * API Adresse Gouv :
 *   - URL : https://api-adresse.data.gouv.fr/search/?q=...&type=municipality&limit=5
 *   - Retour : GeoJSON FeatureCollection
 *   - Coordonnees : features[].geometry.coordinates = [longitude, latitude]
 *     (attention : l'ordre GeoJSON est [lng, lat], pas [lat, lng])
 *
 * Exemple :
 *   const { suggestions, isLoading } = useAddressAutocomplete("Par")
 *   // suggestions = [{ label: "Paris", city: "Paris", latitude: 48.85, ... }]
 */
"use client"

import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "@/shared/hooks/useDebounce"
import type { AddressSuggestion } from "../types"

/**
 * Structure brute d'un feature GeoJSON retourne par l'API Adresse Gouv
 */
interface AddressGeoJSONFeature {
  properties: {
    label: string     // Label complet (ex: "Paris 75001")
    city: string      // Nom de la ville
    postcode: string  // Code postal
  }
  geometry: {
    coordinates: [number, number] // [longitude, latitude] — ordre GeoJSON
  }
}

/**
 * fetchAddressSuggestions — Appeler l'API Adresse Gouv et parser le GeoJSON
 *
 * @param query - Texte saisi par l'utilisateur (min 2 caracteres)
 * @returns Liste de suggestions d'adresses
 */
async function fetchAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=5`

  const response = await fetch(url)
  if (!response.ok) return []

  const data = await response.json()

  // Transformer le GeoJSON en AddressSuggestion[]
  // Attention : GeoJSON utilise [longitude, latitude], on inverse pour nos types
  return (data.features ?? []).map((feature: AddressGeoJSONFeature) => ({
    label: feature.properties.label,
    city: feature.properties.city,
    latitude: feature.geometry.coordinates[1],  // Index 1 = latitude
    longitude: feature.geometry.coordinates[0], // Index 0 = longitude
    postcode: feature.properties.postcode,
  }))
}

/**
 * useAddressAutocomplete — Hook d'autocompletion des villes
 *
 * @param query - Texte saisi par l'utilisateur dans le champ de recherche
 * @returns { suggestions, isLoading } — Suggestions et etat de chargement
 */
export function useAddressAutocomplete(query: string) {
  // Debounce la query de 300ms pour eviter de surcharger l'API
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
