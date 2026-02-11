/**
 * Module Search — Types TypeScript
 *
 * Role : Definir les types pour la recherche geographique de coiffeuses.
 *
 * Interactions :
 *   - Utilise par les server actions (search-actions.ts) pour typer les reponses
 *   - Utilise par les composants (StylistCard, SearchResults, SearchMap)
 *   - Utilise par les hooks (useSearchStylists, useAddressAutocomplete)
 *   - Utilise par le store Zustand (search-filters-store)
 */

/**
 * SearchStylistResult — Resultat d'une coiffeuse dans les resultats de recherche
 *
 * Contient les informations necessaires pour afficher une carte de coiffeuse
 * dans la liste de resultats et sur la carte Leaflet.
 *
 * Exemple :
 *   { id: "abc", userName: "Marie D.", city: "Paris", distanceKm: 3.2, ... }
 */
export interface SearchStylistResult {
  /** ID du profil coiffeuse (StylistProfile.id) */
  id: string
  /** Nom complet de l'utilisatrice (User.name) */
  userName: string
  /** URL de l'avatar (User.image) */
  userImage: string | null
  /** Bio de la coiffeuse */
  bio: string | null
  /** Ville de la coiffeuse */
  city: string
  /** Latitude GPS */
  latitude: number
  /** Longitude GPS */
  longitude: number
  /** Distance en km entre la coiffeuse et le point de recherche */
  distanceKm: number
  /** Profil verifie par l'admin */
  isVerified: boolean
  /** Nombre de services proposes */
  serviceCount: number
  /** Prix minimum en centimes parmi les services */
  priceMin: number | null
  /** Prix maximum en centimes parmi les services */
  priceMax: number | null
  /** Noms des categories de services (ex: ["Tresses", "Locks"]) */
  categoryNames: string[]
  /** Note moyenne (1.0 a 5.0), null si aucun avis */
  averageRating: number | null
  /** Nombre total d'avis */
  reviewCount: number
}

/**
 * SearchFilters — Filtres envoyes au serveur pour la recherche
 *
 * Le store Zustand construit ces filtres, puis les passe a la server action.
 */
export interface SearchFilters {
  /** Nom de la ville recherchee */
  city: string
  /** Latitude du centre de recherche */
  latitude: number
  /** Longitude du centre de recherche */
  longitude: number
  /** Rayon de recherche en km (1 a 50) */
  radiusKm: number
  /** Filtre par categorie de service (optionnel) */
  categoryId?: string
  /** Tri des resultats */
  sortBy: "distance" | "price_asc" | "price_desc"
  /** Numero de page (1-indexed) */
  page: number
}

/**
 * SearchResponse — Reponse paginee de la recherche
 *
 * Retournee par la server action searchStylists().
 */
export interface SearchResponse {
  /** Liste des coiffeuses trouvees (page courante) */
  stylists: SearchStylistResult[]
  /** Nombre total de resultats (toutes pages) */
  totalCount: number
  /** Page courante */
  page: number
  /** Nombre total de pages */
  totalPages: number
  /** Centre de la recherche (pour centrer la carte) */
  center: {
    latitude: number
    longitude: number
  }
}

/**
 * AddressSuggestion — Suggestion retournee par l'API Adresse Gouv
 *
 * Utilisee par le composant SearchBar pour l'autocompletion des villes.
 *
 * Exemple :
 *   { label: "Paris 75001", city: "Paris", latitude: 48.8566, longitude: 2.3522, postcode: "75001" }
 */
export interface AddressSuggestion {
  /** Label complet affiche dans le dropdown (ex: "Paris 75001") */
  label: string
  /** Nom de la ville */
  city: string
  /** Latitude GPS */
  latitude: number
  /** Longitude GPS */
  longitude: number
  /** Code postal */
  postcode: string
}
