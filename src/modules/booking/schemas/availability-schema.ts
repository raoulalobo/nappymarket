/**
 * availability-schema.ts — Schema Zod pour les creneaux de disponibilite
 *
 * Role : Valider les donnees de creation/modification d'un creneau
 *        de disponibilite hebdomadaire d'une coiffeuse.
 *
 * Interactions :
 *   - Utilise par AvailabilityManager pour valider le formulaire cote client
 *   - Utilise par availability-actions.ts pour valider les inputs cote serveur
 *   - dayOfWeek doit correspondre au format Prisma (0=Dim, 6=Sam)
 *   - startTime/endTime au format "HH:mm" (24h)
 *
 * Exemple :
 *   availabilitySchema.parse({ dayOfWeek: 1, startTime: "09:00", endTime: "18:00" })
 */
import { z } from "zod"

/**
 * Regex pour valider le format "HH:mm" (00:00 a 23:59)
 * - HH : [0-1][0-9] ou [2][0-3]
 * - mm : [0-5][0-9]
 */
const TIME_REGEX = /^([0-1]\d|2[0-3]):[0-5]\d$/

/**
 * availabilitySchema — Validation d'un creneau de disponibilite
 *
 * Regles :
 *   - dayOfWeek : entier de 0 (Dimanche) a 6 (Samedi)
 *   - startTime : format "HH:mm", ex: "09:00"
 *   - endTime : format "HH:mm", doit etre strictement apres startTime
 *
 * Exemple valide :
 *   { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" }
 *
 * Exemple invalide (endTime avant startTime) :
 *   { dayOfWeek: 1, startTime: "18:00", endTime: "09:00" }
 *   // Erreur : "L'heure de fin doit etre apres l'heure de debut"
 */
export const availabilitySchema = z
  .object({
    dayOfWeek: z
      .number()
      .int("Le jour doit etre un entier")
      .min(0, "Le jour doit etre entre 0 (Dimanche) et 6 (Samedi)")
      .max(6, "Le jour doit etre entre 0 (Dimanche) et 6 (Samedi)"),
    startTime: z
      .string()
      .regex(TIME_REGEX, "L'heure de debut doit etre au format HH:mm"),
    endTime: z
      .string()
      .regex(TIME_REGEX, "L'heure de fin doit etre au format HH:mm"),
  })
  .refine(
    (data) => data.endTime > data.startTime,
    {
      message: "L'heure de fin doit etre apres l'heure de debut",
      path: ["endTime"],
    }
  )

/** Type infere du schema de disponibilite */
export type AvailabilitySchema = z.infer<typeof availabilitySchema>
