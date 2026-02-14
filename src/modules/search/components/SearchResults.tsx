/**
 * SearchResults — Liste des coiffeuses trouvees
 *
 * Role : Afficher les resultats de recherche dans une grille responsive
 *        de StylistCard avec gestion des etats loading, vide et erreur.
 *
 * Interactions :
 *   - Utilise useSearchStylists() (TanStack Query) pour les donnees
 *   - Rend un StylistCard par coiffeuse trouvee
 *   - Inclut SearchPagination en bas de la liste
 *   - Affiche des Skeleton pendant le chargement
 *   - Affiche un message si aucun resultat ou si erreur
 *
 * Layout responsive :
 *   - Mobile (< md) : 1 colonne
 *   - Tablette (md) : 2 colonnes
 *   - Desktop (lg+) : 1 colonne (car partage l'espace avec la carte)
 *
 * Exemple :
 *   <SearchResults />
 */
"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { MapPin } from "lucide-react"
import { useSearchStylists } from "../hooks/useSearchStylists"
import { useSearchFiltersStore } from "@/shared/stores/search-filters-store"
import { StylistCard } from "./StylistCard"
import { SearchPagination } from "./SearchPagination"

/**
 * SkeletonCard — Placeholder pendant le chargement
 * Reproduit la structure de StylistCard avec des Skeleton
 */
function SkeletonCard() {
  return (
    <div className="flex gap-4 rounded-lg border p-4">
      <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

export function SearchResults() {
  const { data, isLoading, error } = useSearchStylists()
  const { city, latitude, longitude } = useSearchFiltersStore()

  // Etat initial : pas de ville selectionnee
  if (latitude === null || longitude === null) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MapPin className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-medium">Recherchez une ville</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Saisissez une ville dans la barre de recherche pour trouver des coiffeuses
        </p>
      </div>
    )
  }

  // Etat loading : afficher 6 skeleton cards
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Etat erreur
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-destructive">
          Une erreur est survenue lors de la recherche.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Veuillez reessayer dans quelques instants.
        </p>
      </div>
    )
  }

  // Etat vide : aucun resultat
  if (!data || data.stylists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MapPin className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-medium">Aucune coiffeuse trouvee</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Essayez d&apos;augmenter le rayon de recherche ou de changer de ville
        </p>
      </div>
    )
  }

  // Etat normal : afficher les resultats
  return (
    <div className="space-y-4">
      {/* Nombre total de resultats */}
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{data.totalCount}</span> coiffeuse
        {data.totalCount > 1 ? "s" : ""} trouvee{data.totalCount > 1 ? "s" : ""}
        {city && <> a <span className="font-medium text-foreground">{city}</span></>}
      </p>

      {/* Grille de resultats */}
      <div className="grid gap-3">
        {data.stylists.map((stylist) => (
          <StylistCard key={stylist.id} stylist={stylist} />
        ))}
      </div>

      {/* Pagination */}
      <div className="pt-4">
        <SearchPagination
          currentPage={data.page}
          totalPages={data.totalPages}
        />
      </div>
    </div>
  )
}
