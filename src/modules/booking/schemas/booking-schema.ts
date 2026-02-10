/**
 * booking-schema.ts — Schema Zod pour la creation d'une reservation
 *
 * Role : Valider les donnees du formulaire de reservation multi-etapes
 *        avant envoi a la server action createBooking.
 *
 * Interactions :
 *   - Utilise par BookingStepSummary pour valider avant soumission
 *   - Utilise par booking-actions.ts pour valider les inputs cote serveur
 *   - Les IDs (stylistId, serviceId) referencent les tables Prisma
 *   - La date au format "YYYY-MM-DD" est parsee en DateTime cote serveur
 *
 * Exemple :
 *   bookingSchema.parse({
 *     stylistId: "cl...",
 *     serviceId: "cl...",
 *     date: "2026-03-15",
 *     startTime: "14:00",
 *     address: "12 rue de la Paix",
 *     city: "Paris",
 *   })
 */
import { z } from "zod"

/**
 * Regex pour valider le format "HH:mm" (00:00 a 23:59)
 */
const TIME_REGEX = /^([0-1]\d|2[0-3]):[0-5]\d$/

/**
 * Regex pour valider le format "YYYY-MM-DD"
 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * bookingSchema — Validation d'une demande de reservation
 *
 * Champs obligatoires :
 *   - stylistId : ID du StylistProfile
 *   - serviceId : ID du StylistService choisi
 *   - date : date de la prestation (YYYY-MM-DD)
 *   - startTime : heure de debut (HH:mm)
 *   - address : adresse complete du lieu de prestation (domicile cliente)
 *   - city : ville du lieu de prestation
 *
 * Champ optionnel :
 *   - notes : instructions pour la coiffeuse (acces, interphone, etc.)
 *
 * Exemple :
 *   {
 *     stylistId: "clxyz123",
 *     serviceId: "clxyz456",
 *     date: "2026-03-15",
 *     startTime: "14:00",
 *     address: "12 rue de la Paix, 75002 Paris",
 *     city: "Paris",
 *     notes: "Code interphone : 1234A"
 *   }
 */
export const bookingSchema = z.object({
  stylistId: z
    .string()
    .min(1, "L'identifiant de la coiffeuse est requis"),
  serviceId: z
    .string()
    .min(1, "L'identifiant du service est requis"),
  date: z
    .string()
    .regex(DATE_REGEX, "La date doit etre au format YYYY-MM-DD"),
  startTime: z
    .string()
    .regex(TIME_REGEX, "L'heure doit etre au format HH:mm"),
  address: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caracteres"),
  city: z
    .string()
    .min(2, "La ville doit contenir au moins 2 caracteres"),
  notes: z
    .string()
    .max(500, "Les notes ne peuvent pas depasser 500 caracteres")
    .optional(),
})

/** Type infere du schema de reservation */
export type BookingSchema = z.infer<typeof bookingSchema>
