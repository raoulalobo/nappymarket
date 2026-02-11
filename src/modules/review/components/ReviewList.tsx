/**
 * ReviewList — Liste paginee des avis sur le profil public d'une coiffeuse
 *
 * Role : Afficher les avis pagines (10 par page) avec navigation
 *        entre les pages. Affiche un empty state si aucun avis.
 *
 * Interactions :
 *   - useStylistReviews() pour charger les avis pagines
 *   - ReviewCard pour chaque avis (lecture seule, pas de suppression)
 *   - Boutons "Precedent" / "Suivant" pour la pagination
 *
 * Exemple :
 *   <ReviewList stylistId="stylist-123" />
 */
"use client"

import { useState } from "react"
import { useStylistReviews } from "../hooks/useReviews"
import { ReviewCard } from "./ReviewCard"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"

interface ReviewListProps {
  /** ID du StylistProfile */
  stylistId: string
}

export function ReviewList({ stylistId }: ReviewListProps) {
  const [page, setPage] = useState(1)
  const { reviews, totalCount, totalPages, isLoading } = useStylistReviews(stylistId, page)

  // Skeleton de chargement
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    )
  }

  // Empty state
  if (reviews.length === 0 && page === 1) {
    return (
      <div className="py-10 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-muted-foreground">
          Aucun avis pour le moment.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Liste des avis */}
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Precedent
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {page} sur {totalPages} ({totalCount} avis)
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Suivant
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
