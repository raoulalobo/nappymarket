/**
 * stylist-schemas.ts — Schemas Zod pour le module coiffeuse
 *
 * Role : Valider les donnees des formulaires de profil coiffeuse
 *        et de gestion des services.
 *
 * Interactions :
 *   - Utilise par StylistProfileForm et ServiceSelector (resolver Zod)
 *   - Utilise cote serveur dans les server actions pour la double validation
 *
 * Exemple :
 *   import { stylistProfileSchema } from "@/modules/stylist/schemas/stylist-schemas"
 *   const result = stylistProfileSchema.safeParse(formData)
 */
import { z } from "zod"
import {
  MIN_SERVICE_DURATION_MINUTES,
  MAX_SERVICE_DURATION_MINUTES,
} from "@/shared/lib/constants"

/**
 * Schema de validation pour le profil coiffeuse
 * Champs : bio, ville, adresse, rayon de deplacement
 */
export const stylistProfileSchema = z.object({
  bio: z
    .string()
    .max(500, "La bio ne peut pas depasser 500 caracteres")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .min(2, "La ville est requise"),
  address: z
    .string()
    .optional()
    .or(z.literal("")),
  radiusKm: z
    .number()
    .min(1, "Le rayon doit etre d'au moins 1 km")
    .max(50, "Le rayon ne peut pas depasser 50 km"),
})

/**
 * Schema de validation pour ajouter un service
 * Champs : categorie, prix en euros, duree en minutes, description
 */
export const serviceSchema = z.object({
  categoryId: z
    .string()
    .min(1, "Veuillez choisir une categorie"),
  price: z
    .number()
    .min(5, "Le prix minimum est de 5 euros")
    .max(500, "Le prix maximum est de 500 euros"),
  durationMinutes: z
    .number()
    .min(MIN_SERVICE_DURATION_MINUTES, `Duree minimum : ${MIN_SERVICE_DURATION_MINUTES} minutes`)
    .max(MAX_SERVICE_DURATION_MINUTES, `Duree maximum : ${MAX_SERVICE_DURATION_MINUTES / 60} heures`),
  description: z
    .string()
    .max(200, "La description ne peut pas depasser 200 caracteres")
    .optional()
    .or(z.literal("")),
})

/** Type infere du schema profil coiffeuse */
export type StylistProfileSchema = z.infer<typeof stylistProfileSchema>

/** Type infere du schema service */
export type ServiceSchema = z.infer<typeof serviceSchema>
