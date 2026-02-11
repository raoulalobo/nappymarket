/**
 * ReviewForm — Formulaire de creation d'un avis
 *
 * Role : Permettre a une cliente de noter une coiffeuse (1-5 etoiles)
 *        et d'ajouter un commentaire optionnel apres une prestation terminee.
 *
 * Interactions :
 *   - React Hook Form + Zod resolver pour la validation
 *   - StarRating interactif pour la selection de la note
 *   - useCreateReview() (TanStack Query) pour la mutation
 *   - Compteur de caracteres pour le commentaire (max 1000)
 *   - onSuccess callback pour fermer le dialog parent
 *
 * Exemple :
 *   <ReviewForm bookingId="booking-123" onSuccess={() => setOpen(false)} />
 */
"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { reviewSchema, type ReviewSchema } from "../schemas/review-schema"
import { useCreateReview } from "../hooks/useReviews"
import { StarRating } from "./StarRating"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { MAX_REVIEW_COMMENT_LENGTH } from "@/shared/lib/constants"

interface ReviewFormProps {
  /** ID de la reservation a noter */
  bookingId: string
  /** Callback apres succes (ex: fermer le dialog) */
  onSuccess?: () => void
}

export function ReviewForm({ bookingId, onSuccess }: ReviewFormProps) {
  const { createReview, isPending } = useCreateReview()

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReviewSchema>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      bookingId,
      rating: 0,
      comment: "",
    },
  })

  // Surveiller le commentaire pour le compteur de caracteres
  const commentValue = watch("comment") ?? ""
  const charCount = commentValue.length

  /** Soumettre le formulaire */
  const onSubmit = (data: ReviewSchema) => {
    createReview(data, {
      onSuccess: () => {
        onSuccess?.()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Selection de la note (etoiles interactives) */}
      <div className="space-y-2">
        <Label>Votre note *</Label>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <StarRating
              value={field.value}
              onChange={field.onChange}
              size={32}
            />
          )}
        />
        {errors.rating && (
          <p className="text-sm text-destructive">{errors.rating.message}</p>
        )}
      </div>

      {/* Commentaire optionnel avec compteur de caracteres */}
      <div className="space-y-2">
        <Label htmlFor="review-comment">
          Commentaire <span className="text-muted-foreground">(optionnel)</span>
        </Label>
        <Controller
          name="comment"
          control={control}
          render={({ field }) => (
            <Textarea
              id="review-comment"
              placeholder="Partagez votre experience..."
              rows={4}
              maxLength={MAX_REVIEW_COMMENT_LENGTH}
              {...field}
              value={field.value ?? ""}
            />
          )}
        />
        {/* Compteur de caracteres */}
        <div className="flex justify-between text-xs text-muted-foreground">
          {errors.comment ? (
            <p className="text-destructive">{errors.comment.message}</p>
          ) : (
            <span />
          )}
          <span>
            {charCount}/{MAX_REVIEW_COMMENT_LENGTH}
          </span>
        </div>
      </div>

      {/* Bouton de soumission */}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Publication...
          </>
        ) : (
          "Publier mon avis"
        )}
      </Button>
    </form>
  )
}
