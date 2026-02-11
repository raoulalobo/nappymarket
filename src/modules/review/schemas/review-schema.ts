/**
 * review-schema.ts — Schema Zod pour la validation des avis
 *
 * Role : Valider les donnees du formulaire de creation d'avis
 *        cote client (React Hook Form) et cote serveur (server action).
 *
 * Interactions :
 *   - Utilise par ReviewForm (composant) via le resolver Zod de RHF
 *   - Utilise par createReview() (server action) pour valider l'input
 *   - Constantes MAX_REVIEW_COMMENT_LENGTH importee de constants.ts
 *
 * Exemple :
 *   const parsed = reviewSchema.safeParse({ bookingId: "abc", rating: 5, comment: "Top !" })
 */

import { z } from "zod"
import { MAX_REVIEW_COMMENT_LENGTH } from "@/shared/lib/constants"

/**
 * reviewSchema — Schema de validation pour creer un avis
 *
 * Champs :
 *   - bookingId : ID de la reservation (requis, non vide)
 *   - rating : note de 1 a 5 (entier)
 *   - comment : commentaire optionnel, max 1000 caracteres
 *
 * Note : comment est un string (vide par defaut) pour compatibilite RHF.
 * Les strings vides sont converties en undefined par la server action.
 */
export const reviewSchema = z.object({
  /** ID de la reservation concernee */
  bookingId: z
    .string()
    .min(1, "L'identifiant de la reservation est requis"),

  /** Note de 1 a 5 etoiles */
  rating: z
    .number()
    .int("La note doit etre un nombre entier")
    .min(1, "La note minimum est 1")
    .max(5, "La note maximum est 5"),

  /** Commentaire optionnel (string vide accepte, sera ignore cote serveur) */
  comment: z
    .string()
    .max(MAX_REVIEW_COMMENT_LENGTH, `Le commentaire ne peut pas depasser ${MAX_REVIEW_COMMENT_LENGTH} caracteres`)
    .optional(),
})

/** Type infere du schema pour le typage des formulaires et actions */
export type ReviewSchema = z.infer<typeof reviewSchema>
