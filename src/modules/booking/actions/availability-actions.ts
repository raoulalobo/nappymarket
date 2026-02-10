/**
 * availability-actions.ts — Server actions pour la gestion des disponibilites
 *
 * Role : Fournir les operations CRUD sur les creneaux de disponibilite
 *        hebdomadaires d'une coiffeuse. Reserve exclusivement aux utilisatrices
 *        avec le role STYLIST.
 *
 * Interactions :
 *   - Utilise getSession() pour verifier l'authentification et le role STYLIST
 *   - Utilise Prisma (db) pour les operations BDD sur la table availabilities
 *   - Verifie la non-chevauchement des creneaux sur le meme jour
 *   - Retourne des ActionResult<T> standardises
 *   - Consomme par les hooks TanStack Query dans useAvailabilities.ts
 *
 * Exemple :
 *   const result = await getStylistAvailabilities()
 *   // result = { success: true, data: [{ id: "...", dayOfWeek: 1, ... }] }
 *
 *   await addAvailability({ dayOfWeek: 1, startTime: "09:00", endTime: "18:00" })
 *   await toggleAvailability("avail-id") // active/desactive
 */
"use server"

import { db } from "@/shared/lib/db"
import { getSession } from "@/shared/lib/auth/get-session"
import { availabilitySchema, type AvailabilitySchema } from "../schemas/availability-schema"
import type { ActionResult } from "@/shared/types"
import type { Availability } from "@prisma/client"

/* ------------------------------------------------------------------ */
/* Helpers internes                                                    */
/* ------------------------------------------------------------------ */

/**
 * verifyStylist — Verifie que l'utilisatrice est connectee avec le role STYLIST
 *
 * Retourne le stylistProfile.id si OK, ou un ActionResult d'erreur sinon.
 * Le StylistProfile doit exister en BDD pour gerer les disponibilites.
 *
 * Exemple :
 *   const result = await verifyStylist()
 *   if ("error" in result) return result.error
 *   const stylistId = result.stylistId
 */
async function verifyStylist(): Promise<
  { stylistId: string } | { error: ActionResult<never> }
> {
  const session = await getSession()
  if (!session) {
    return { error: { success: false, error: "Non authentifie" } }
  }
  if (session.user.role !== "STYLIST") {
    return { error: { success: false, error: "Acces reserve aux coiffeuses" } }
  }

  // Recuperer l'ID du profil coiffeuse via le userId
  const profile = await db.stylistProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!profile) {
    return { error: { success: false, error: "Profil coiffeuse introuvable" } }
  }

  return { stylistId: profile.id }
}

/**
 * checkOverlap — Verifier si un creneau chevauche un creneau existant
 *
 * Deux creneaux se chevauchent si : newStart < existEnd ET newEnd > existStart
 *
 * @param stylistId - ID du profil coiffeuse
 * @param dayOfWeek - Jour de la semaine (0-6)
 * @param startTime - Heure de debut "HH:mm"
 * @param endTime - Heure de fin "HH:mm"
 * @param excludeId - ID du creneau a exclure (pour la modification)
 * @returns true si un chevauchement est detecte
 *
 * Exemple :
 *   // Creneau existant : 09:00-12:00
 *   checkOverlap(id, 1, "10:00", "14:00") // true (chevauchement 10:00-12:00)
 *   checkOverlap(id, 1, "13:00", "17:00") // false (pas de chevauchement)
 */
async function checkOverlap(
  stylistId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<boolean> {
  // Charger tous les creneaux du meme jour pour cette coiffeuse
  const existingSlots = await db.availability.findMany({
    where: {
      stylistId,
      dayOfWeek,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })

  // Verifier le chevauchement : newStart < existEnd ET newEnd > existStart
  return existingSlots.some(
    (slot) => startTime < slot.endTime && endTime > slot.startTime
  )
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

/**
 * getStylistAvailabilities — Recuperer toutes les disponibilites de la coiffeuse
 *
 * Retourne les creneaux tries par jour de semaine puis par heure de debut.
 * Inclut les creneaux actifs et inactifs pour la gestion complete.
 *
 * Exemple de retour :
 *   {
 *     success: true,
 *     data: [
 *       { id: "abc", dayOfWeek: 1, startTime: "09:00", endTime: "12:00", isActive: true },
 *       { id: "def", dayOfWeek: 1, startTime: "14:00", endTime: "18:00", isActive: true },
 *       { id: "ghi", dayOfWeek: 3, startTime: "10:00", endTime: "20:00", isActive: false },
 *     ]
 *   }
 */
export async function getStylistAvailabilities(): Promise<ActionResult<Availability[]>> {
  const result = await verifyStylist()
  if ("error" in result) return result.error

  const availabilities = await db.availability.findMany({
    where: { stylistId: result.stylistId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  })

  return { success: true, data: availabilities }
}

/**
 * addAvailability — Ajouter un nouveau creneau de disponibilite
 *
 * Valide les donnees avec Zod, verifie qu'il n'y a pas de chevauchement
 * avec les creneaux existants sur le meme jour, puis cree le creneau.
 *
 * @param input - Donnees du creneau (dayOfWeek, startTime, endTime)
 *
 * Exemple :
 *   await addAvailability({ dayOfWeek: 1, startTime: "09:00", endTime: "12:00" })
 *   // Cree un creneau le lundi de 09h a 12h
 */
export async function addAvailability(
  input: AvailabilitySchema
): Promise<ActionResult<Availability>> {
  const result = await verifyStylist()
  if ("error" in result) return result.error

  // Valider avec Zod
  const parsed = availabilitySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { dayOfWeek, startTime, endTime } = parsed.data

  // Verifier le chevauchement avec les creneaux existants
  const hasOverlap = await checkOverlap(result.stylistId, dayOfWeek, startTime, endTime)
  if (hasOverlap) {
    return {
      success: false,
      error: "Ce creneau chevauche un creneau existant sur le meme jour",
    }
  }

  // Creer le creneau (isActive true par defaut via le schema Prisma)
  const availability = await db.availability.create({
    data: {
      stylistId: result.stylistId,
      dayOfWeek,
      startTime,
      endTime,
    },
  })

  return { success: true, data: availability }
}

/**
 * updateAvailability — Modifier un creneau existant
 *
 * Verifie l'ownership, valide les donnees, et verifie le non-chevauchement
 * en excluant le creneau en cours de modification.
 *
 * @param id - ID du creneau a modifier
 * @param input - Nouvelles donnees (dayOfWeek, startTime, endTime)
 *
 * Exemple :
 *   await updateAvailability("avail-id", {
 *     dayOfWeek: 1, startTime: "10:00", endTime: "19:00"
 *   })
 */
export async function updateAvailability(
  id: string,
  input: AvailabilitySchema
): Promise<ActionResult<Availability>> {
  const result = await verifyStylist()
  if ("error" in result) return result.error

  // Valider avec Zod
  const parsed = availabilitySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  // Verifier l'ownership du creneau
  const existing = await db.availability.findUnique({ where: { id } })
  if (!existing || existing.stylistId !== result.stylistId) {
    return { success: false, error: "Creneau introuvable" }
  }

  const { dayOfWeek, startTime, endTime } = parsed.data

  // Verifier le chevauchement en excluant le creneau modifie (self)
  const hasOverlap = await checkOverlap(result.stylistId, dayOfWeek, startTime, endTime, id)
  if (hasOverlap) {
    return {
      success: false,
      error: "Ce creneau chevauche un creneau existant sur le meme jour",
    }
  }

  // Mettre a jour le creneau
  const availability = await db.availability.update({
    where: { id },
    data: { dayOfWeek, startTime, endTime },
  })

  return { success: true, data: availability }
}

/**
 * deleteAvailability — Supprimer un creneau de disponibilite
 *
 * Verifie l'ownership avant la suppression. Cette operation est irreversible.
 *
 * @param id - ID du creneau a supprimer
 *
 * Exemple :
 *   await deleteAvailability("avail-id")
 */
export async function deleteAvailability(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const result = await verifyStylist()
  if ("error" in result) return result.error

  // Verifier l'ownership du creneau
  const existing = await db.availability.findUnique({ where: { id } })
  if (!existing || existing.stylistId !== result.stylistId) {
    return { success: false, error: "Creneau introuvable" }
  }

  await db.availability.delete({ where: { id } })

  return { success: true, data: { id } }
}

/**
 * toggleAvailability — Activer/desactiver un creneau
 *
 * Inverse le champ isActive du creneau. Un creneau desactive n'apparait
 * plus dans les disponibilites pour les clientes, mais est conserve
 * pour la coiffeuse.
 *
 * @param id - ID du creneau a basculer
 *
 * Exemple :
 *   await toggleAvailability("avail-id")
 *   // isActive: true -> false, ou false -> true
 */
export async function toggleAvailability(
  id: string
): Promise<ActionResult<Availability>> {
  const result = await verifyStylist()
  if ("error" in result) return result.error

  // Verifier l'ownership du creneau
  const existing = await db.availability.findUnique({ where: { id } })
  if (!existing || existing.stylistId !== result.stylistId) {
    return { success: false, error: "Creneau introuvable" }
  }

  // Inverser isActive
  const availability = await db.availability.update({
    where: { id },
    data: { isActive: !existing.isActive },
  })

  return { success: true, data: availability }
}
