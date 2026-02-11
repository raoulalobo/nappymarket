/**
 * ClientReviewList — "Mes avis" dans le dashboard cliente
 *
 * Role : Afficher tous les avis laisses par la cliente connectee
 *        avec le contexte de chaque avis (coiffeuse, prestation, date).
 *        Permet la suppression de ses propres avis.
 *
 * Interactions :
 *   - useClientReviews() pour charger les avis de la cliente
 *   - useDeleteReview() pour supprimer un avis
 *   - StarRating pour afficher la note
 *   - Avatar de la coiffeuse evaluee
 *   - formatDate() pour la date du booking
 *
 * Exemple :
 *   <ClientReviewList />
 */
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { StarRating } from "./StarRating"
import { useClientReviews, useDeleteReview } from "../hooks/useReviews"
import { formatDate } from "@/shared/lib/utils"
import { MessageSquare, Trash2, Scissors, Calendar } from "lucide-react"
import { useState } from "react"

export function ClientReviewList() {
  const { reviews, isLoading } = useClientReviews()
  const { deleteReview, isPending: isDeleting } = useDeleteReview()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  /** Confirmer la suppression d'un avis */
  const handleDelete = () => {
    if (!deleteId) return
    deleteReview(deleteId)
    setDeleteId(null)
  }

  // Skeleton de chargement
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <div className="py-16 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Aucun avis</h3>
        <p className="mt-1 text-muted-foreground">
          Vous n'avez pas encore laisse d'avis.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {reviews.map((review) => {
          // Nom de la coiffeuse evaluee
          const stylistUser = review.booking.stylist.user
          const stylistName = stylistUser.firstName && stylistUser.lastName
            ? `${stylistUser.firstName} ${stylistUser.lastName}`
            : stylistUser.name

          // Initiales pour l'avatar fallback
          const initials = stylistUser.firstName && stylistUser.lastName
            ? (stylistUser.firstName[0] + stylistUser.lastName[0]).toUpperCase()
            : stylistName.slice(0, 2).toUpperCase()

          return (
            <div key={review.id} className="flex gap-3 rounded-lg border p-4">
              {/* Avatar de la coiffeuse */}
              <Avatar className="h-10 w-10 shrink-0">
                {stylistUser.image && (
                  <AvatarImage src={stylistUser.image} alt={stylistName} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Contenu */}
              <div className="min-w-0 flex-1">
                {/* Nom coiffeuse + prestation + date */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium">{stylistName}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Scissors className="h-3 w-3" />
                    {review.booking.service.category.name}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(new Date(review.booking.date))}
                  </span>
                </div>

                {/* Etoiles */}
                <StarRating value={review.rating} size={16} className="mt-1" />

                {/* Commentaire */}
                {review.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {review.comment}
                  </p>
                )}
              </div>

              {/* Bouton supprimer */}
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteId(review.id)}
                disabled={isDeleting}
                aria-label="Supprimer cet avis"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </div>

      {/* Dialog de confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. Votre avis sera definitivement supprime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
