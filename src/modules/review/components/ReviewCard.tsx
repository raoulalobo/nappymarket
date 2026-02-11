/**
 * ReviewCard — Carte d'affichage d'un avis individuel
 *
 * Role : Afficher un avis avec l'avatar de la cliente, son nom, la date
 *        relative, les etoiles et le commentaire. Option de suppression
 *        avec confirmation (AlertDialog).
 *
 * Interactions :
 *   - Utilise par ReviewList (profil public), ClientReviewList, StylistReviewList
 *   - StarRating en mode lecture seule pour afficher la note
 *   - AlertDialog pour confirmer la suppression (si showDelete=true)
 *   - formatRelativeDate() pour afficher "il y a 3 jours", etc.
 *
 * Exemple :
 *   <ReviewCard review={review} />
 *   <ReviewCard review={review} showDelete onDelete={() => handleDelete(review.id)} />
 */
"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
import { Trash2 } from "lucide-react"
import type { ReviewWithDetails } from "../types"

interface ReviewCardProps {
  /** Avis a afficher */
  review: ReviewWithDetails
  /** Afficher le bouton supprimer (defaut : false) */
  showDelete?: boolean
  /** Callback de suppression */
  onDelete?: () => void
  /** Suppression en cours (desactive le bouton) */
  isDeleting?: boolean
}

/**
 * Formater une date en texte relatif francais
 * Exemples : "il y a 2 jours", "il y a 3 semaines", "il y a 2 mois"
 */
function formatRelativeDate(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Hier"
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `Il y a ${months} mois`
  }
  const years = Math.floor(diffDays / 365)
  return `Il y a ${years} an${years > 1 ? "s" : ""}`
}

/**
 * Extraire les initiales d'un nom pour l'avatar fallback
 * Exemple : "Sophie Martin" -> "SM"
 */
function getInitials(firstName?: string | null, lastName?: string | null, name?: string): string {
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase()
  }
  if (name) {
    const parts = name.split(" ").filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return "??"
}

export function ReviewCard({
  review,
  showDelete = false,
  onDelete,
  isDeleting = false,
}: ReviewCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  // Nom affiche de la cliente
  const clientName = review.client.firstName && review.client.lastName
    ? `${review.client.firstName} ${review.client.lastName}`
    : review.client.name

  const initials = getInitials(
    review.client.firstName,
    review.client.lastName,
    review.client.name
  )

  return (
    <>
      <div className="flex gap-3 rounded-lg border p-4">
        {/* Avatar de la cliente */}
        <Avatar className="h-10 w-10 shrink-0">
          {review.client.image && (
            <AvatarImage src={review.client.image} alt={clientName} />
          )}
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Contenu de l'avis */}
        <div className="min-w-0 flex-1">
          {/* En-tete : nom + date + etoiles */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-medium text-sm">{clientName}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeDate(review.createdAt)}
            </span>
          </div>

          {/* Etoiles */}
          <StarRating value={review.rating} size={16} className="mt-1" />

          {/* Commentaire (si present) */}
          {review.comment && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {review.comment}
            </p>
          )}
        </div>

        {/* Bouton supprimer (optionnel) */}
        {showDelete && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => setShowConfirm(true)}
            disabled={isDeleting}
            aria-label="Supprimer cet avis"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
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
              onClick={() => {
                onDelete?.()
                setShowConfirm(false)
              }}
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
