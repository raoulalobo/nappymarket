/**
 * StylistReviewList — "Avis recus" dans le dashboard coiffeuse
 *
 * Role : Afficher la note moyenne en en-tete + la liste paginee des avis
 *        recus par la coiffeuse connectee.
 *
 * Interactions :
 *   - Recoit le stylistId en prop (fourni par la page parente via session)
 *   - AverageRating en mode detaille pour l'en-tete
 *   - useStylistRating() pour la note moyenne
 *   - useStylistReviews() pour la liste paginee
 *   - ReviewCard en lecture seule (pas de suppression pour la coiffeuse)
 *
 * Exemple :
 *   <StylistReviewList stylistId="stylist-123" />
 */
"use client"

import { useState } from "react"
import { AverageRating } from "./AverageRating"
import { ReviewCard } from "./ReviewCard"
import { useStylistRating, useStylistReviews } from "../hooks/useReviews"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"

interface StylistReviewListProps {
  /** ID du StylistProfile de la coiffeuse connectee */
  stylistId: string
}

export function StylistReviewList({ stylistId }: StylistReviewListProps) {
  const [page, setPage] = useState(1)
  const { averageRating, reviewCount, isLoading: ratingLoading } = useStylistRating(stylistId)
  const { reviews, totalPages, isLoading: reviewsLoading } = useStylistReviews(stylistId, page)

  const isLoading = ratingLoading || reviewsLoading

  // Skeleton de chargement
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }

  // Empty state
  if (reviewCount === 0) {
    return (
      <div className="py-16 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Aucun avis recu</h3>
        <p className="mt-1 text-muted-foreground">
          Vos clientes pourront laisser un avis apres chaque prestation terminee.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tete : note moyenne detaillee */}
      <AverageRating
        averageRating={averageRating}
        reviewCount={reviewCount}
      />

      <Separator />

      {/* Liste des avis */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
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
            Page {page} sur {totalPages}
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
