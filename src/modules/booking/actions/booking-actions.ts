/**
 * booking-actions.ts — Server actions pour la gestion des reservations
 *
 * Role : Fournir les operations de creation, lecture et mise a jour des
 *        reservations. Gere le calcul des creneaux disponibles, la creation
 *        atomique (transaction), et la mise a jour des statuts.
 *
 * Interactions :
 *   - Utilise getSession() pour verifier l'authentification et le role
 *   - Utilise Prisma (db) avec $transaction pour eviter les race conditions
 *   - Calcule les creneaux disponibles en croisant disponibilites et reservations
 *   - Envoie des emails via Resend (si configure) apres creation/annulation
 *   - Consomme par les hooks TanStack Query dans useBookings.ts
 *
 * Algorithme creneaux disponibles :
 *   1. Charger les Availability actives pour le jour de la semaine
 *   2. Charger la duree du StylistService
 *   3. Charger les Booking non annules pour cette date+coiffeuse
 *   4. Generer les slots de 30min dans chaque plage
 *   5. Exclure les slots chevauchant un booking ou trop courts pour le service
 *   6. Exclure les slots dans le passe ou avant le delai minimum
 *
 * Exemple :
 *   const slots = await getAvailableSlotsForDate("stylist-id", "service-id", "2026-03-15")
 *   const result = await createBooking({ stylistId: "...", serviceId: "...", ... })
 */
"use server"

import { db } from "@/shared/lib/db"
import { getSession } from "@/shared/lib/auth/get-session"
import { bookingSchema, type BookingSchema } from "../schemas/booking-schema"
import {
  BOOKING_SLOT_INTERVAL_MINUTES,
  MIN_BOOKING_LEAD_TIME_HOURS,
  MAX_BOOKING_ADVANCE_DAYS,
} from "@/shared/lib/constants"
import {
  parseTimeToMinutes,
  formatMinutesToTime,
} from "@/shared/lib/utils"
import type { ActionResult } from "@/shared/types"
import type { AvailabilitySlot, BookingWithDetails } from "../types"
import type { BookingStatus } from "@prisma/client"

/* ------------------------------------------------------------------ */
/* Include commun pour les requetes Booking avec details               */
/* ------------------------------------------------------------------ */

/**
 * Include Prisma reutilise pour charger les relations d'une reservation.
 * Utilise par getClientBookings, getStylistBookings et getBookingById.
 */
const BOOKING_INCLUDE = {
  client: {
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      image: true,
      email: true,
    },
  },
  service: {
    include: {
      category: true,
    },
  },
  stylist: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          image: true,
        },
      },
    },
  },
} as const

/* ------------------------------------------------------------------ */
/* Actions — Creneaux disponibles                                      */
/* ------------------------------------------------------------------ */

/**
 * getAvailableSlotsForDate — Calculer les creneaux disponibles pour une date
 *
 * Algorithme :
 *   1. Determiner le jour de la semaine (0-6) pour la date demandee
 *   2. Charger les Availability actives de la coiffeuse pour ce jour
 *   3. Charger la duree du service selectionne
 *   4. Charger les reservations non annulees pour cette date
 *   5. Pour chaque plage de disponibilite, generer des slots de 30min
 *   6. Marquer chaque slot comme disponible ou non selon :
 *      - Le slot + duree du service ne depasse pas la fin de la plage
 *      - Le slot ne chevauche aucune reservation existante
 *      - Le slot n'est pas dans le passe (avec delai minimum 24h)
 *
 * @param stylistId - ID du StylistProfile
 * @param serviceId - ID du StylistService (pour connaitre la duree)
 * @param dateStr - Date au format "YYYY-MM-DD"
 *
 * Exemple :
 *   const result = await getAvailableSlotsForDate("sty-123", "srv-456", "2026-03-15")
 *   // result.data = [
 *   //   { startTime: "09:00", endTime: "09:30", isAvailable: true },
 *   //   { startTime: "09:30", endTime: "10:00", isAvailable: true },
 *   //   { startTime: "10:00", endTime: "10:30", isAvailable: false }, // occupe
 *   // ]
 */
export async function getAvailableSlotsForDate(
  stylistId: string,
  serviceId: string,
  dateStr: string
): Promise<ActionResult<AvailabilitySlot[]>> {
  // Parser la date et determiner le jour de la semaine
  const date = new Date(dateStr + "T00:00:00")
  if (isNaN(date.getTime())) {
    return { success: false, error: "Date invalide" }
  }

  const dayOfWeek = date.getDay() // 0=Dimanche, 6=Samedi

  // 1. Charger les disponibilites actives pour ce jour
  const availabilities = await db.availability.findMany({
    where: {
      stylistId,
      dayOfWeek,
      isActive: true,
    },
    orderBy: { startTime: "asc" },
  })

  if (availabilities.length === 0) {
    return { success: true, data: [] }
  }

  // 2. Charger la duree du service
  const service = await db.stylistService.findUnique({
    where: { id: serviceId },
    select: { durationMinutes: true },
  })

  if (!service) {
    return { success: false, error: "Service introuvable" }
  }

  // 3. Charger les reservations non annulees pour cette date + coiffeuse
  const existingBookings = await db.booking.findMany({
    where: {
      stylistId,
      date,
      status: { not: "CANCELLED" },
    },
    select: { startTime: true, endTime: true },
  })

  // Convertir les reservations existantes en plages de minutes
  const bookedRanges = existingBookings.map((b) => ({
    start: parseTimeToMinutes(b.startTime),
    end: parseTimeToMinutes(b.endTime),
  }))

  // 4. Calculer le moment minimum autorise pour reserver
  // (maintenant + MIN_BOOKING_LEAD_TIME_HOURS)
  const now = new Date()
  const minBookingTime = new Date(
    now.getTime() + MIN_BOOKING_LEAD_TIME_HOURS * 60 * 60 * 1000
  )

  // Verifier la date max (MAX_BOOKING_ADVANCE_DAYS jours a l'avance)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + MAX_BOOKING_ADVANCE_DAYS)
  maxDate.setHours(23, 59, 59, 999)

  if (date > maxDate) {
    return { success: true, data: [] }
  }

  // 5. Generer les slots pour chaque plage de disponibilite
  const slots: AvailabilitySlot[] = []

  for (const avail of availabilities) {
    const availStart = parseTimeToMinutes(avail.startTime)
    const availEnd = parseTimeToMinutes(avail.endTime)

    // Generer des slots de BOOKING_SLOT_INTERVAL_MINUTES dans cette plage
    for (
      let slotStart = availStart;
      slotStart < availEnd;
      slotStart += BOOKING_SLOT_INTERVAL_MINUTES
    ) {
      const slotEnd = slotStart + BOOKING_SLOT_INTERVAL_MINUTES
      // Le service complet commencerait ici : slotStart -> slotStart + durationMinutes
      const serviceEnd = slotStart + service.durationMinutes

      // Verifier si le service entre dans la plage de disponibilite
      const fitsInAvailability = serviceEnd <= availEnd

      // Verifier si le slot chevauche une reservation existante
      // Un booking existant [bStart, bEnd] bloque ce slot si :
      // slotStart < bEnd ET serviceEnd > bStart
      const overlapsBooking = bookedRanges.some(
        (booking) => slotStart < booking.end && serviceEnd > booking.start
      )

      // Verifier si le slot est dans le futur (apres le delai minimum)
      const slotDateTime = new Date(dateStr + "T00:00:00")
      slotDateTime.setMinutes(slotStart)
      const isInFuture = slotDateTime > minBookingTime

      slots.push({
        startTime: formatMinutesToTime(slotStart),
        endTime: formatMinutesToTime(slotEnd),
        isAvailable: fitsInAvailability && !overlapsBooking && isInFuture,
      })
    }
  }

  return { success: true, data: slots }
}

/* ------------------------------------------------------------------ */
/* Actions — CRUD Reservations                                         */
/* ------------------------------------------------------------------ */

/**
 * createBooking — Creer une nouvelle reservation
 *
 * Workflow atomique dans une transaction Prisma :
 *   1. Valider la session (role CLIENT)
 *   2. Valider les donnees (Zod)
 *   3. Verifier que la coiffeuse est active et que le service lui appartient
 *   4. Calculer l'heure de fin (startTime + service.durationMinutes)
 *   5. Verifier les delais min/max
 *   6. Re-verifier la disponibilite dans la transaction (anti race condition)
 *   7. Creer la reservation avec statut PENDING
 *
 * @param input - Donnees de la reservation (BookingSchema)
 *
 * Exemple :
 *   const result = await createBooking({
 *     stylistId: "sty-123",
 *     serviceId: "srv-456",
 *     date: "2026-03-15",
 *     startTime: "14:00",
 *     address: "12 rue de la Paix, 75002 Paris",
 *     city: "Paris",
 *     notes: "Interphone 1234A",
 *   })
 */
export async function createBooking(
  input: BookingSchema
): Promise<ActionResult<BookingWithDetails>> {
  // 1. Verifier la session et le role CLIENT
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }
  if (session.user.role !== "CLIENT") {
    return { success: false, error: "Seules les clientes peuvent reserver" }
  }

  // 2. Valider les donnees avec Zod
  const parsed = bookingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { stylistId, serviceId, date: dateStr, startTime, address, city, notes } = parsed.data

  // 3. Verifier la coiffeuse et le service
  const stylist = await db.stylistProfile.findUnique({
    where: { id: stylistId },
    select: { id: true, isActive: true },
  })
  if (!stylist || !stylist.isActive) {
    return { success: false, error: "Cette coiffeuse n'est plus disponible" }
  }

  const service = await db.stylistService.findUnique({
    where: { id: serviceId },
    select: { id: true, stylistId: true, durationMinutes: true, price: true },
  })
  if (!service || service.stylistId !== stylistId) {
    return { success: false, error: "Ce service n'appartient pas a cette coiffeuse" }
  }

  // 4. Calculer l'heure de fin
  const startMinutes = parseTimeToMinutes(startTime)
  const endMinutes = startMinutes + service.durationMinutes
  const endTime = formatMinutesToTime(endMinutes)

  // 5. Verifier les delais
  const bookingDate = new Date(dateStr + "T00:00:00")
  const bookingDateTime = new Date(dateStr + "T00:00:00")
  bookingDateTime.setMinutes(startMinutes)

  const now = new Date()
  const minDateTime = new Date(
    now.getTime() + MIN_BOOKING_LEAD_TIME_HOURS * 60 * 60 * 1000
  )
  if (bookingDateTime <= minDateTime) {
    return {
      success: false,
      error: `La reservation doit etre au moins ${MIN_BOOKING_LEAD_TIME_HOURS}h a l'avance`,
    }
  }

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + MAX_BOOKING_ADVANCE_DAYS)
  maxDate.setHours(23, 59, 59, 999)
  if (bookingDate > maxDate) {
    return {
      success: false,
      error: `La reservation ne peut pas depasser ${MAX_BOOKING_ADVANCE_DAYS} jours a l'avance`,
    }
  }

  // 6 & 7. Transaction atomique : re-verifier dispo + creer
  try {
    const booking = await db.$transaction(async (tx) => {
      // Re-verifier qu'aucune reservation ne chevauche ce creneau
      const conflicting = await tx.booking.findFirst({
        where: {
          stylistId,
          date: bookingDate,
          status: { not: "CANCELLED" },
          // Chevauchement : existStart < newEnd ET existEnd > newStart
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      })

      if (conflicting) {
        throw new Error("Ce creneau vient d'etre reserve par quelqu'un d'autre")
      }

      // Creer la reservation
      return tx.booking.create({
        data: {
          clientId: session.user.id,
          stylistId,
          serviceId,
          date: bookingDate,
          startTime,
          endTime,
          status: "PENDING",
          totalPrice: service.price,
          address,
          city,
          notes: notes ?? null,
        },
        include: BOOKING_INCLUDE,
      })
    })

    // Envoyer l'email de confirmation (async, ne bloque pas la reponse)
    sendBookingConfirmationEmail(booking as BookingWithDetails).catch((err) =>
      console.warn("[Email] Erreur envoi email confirmation:", err)
    )

    return { success: true, data: booking as BookingWithDetails }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la creation"
    return { success: false, error: message }
  }
}

/**
 * getClientBookings — Recuperer les reservations de la cliente connectee
 *
 * Retourne toutes les reservations avec details completes (service, coiffeuse),
 * triees par date decroissante (les plus recentes en premier).
 *
 * Exemple :
 *   const result = await getClientBookings()
 *   // result.data = [{ id: "...", date: ..., service: { ... }, stylist: { ... } }]
 */
export async function getClientBookings(): Promise<ActionResult<BookingWithDetails[]>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }

  const bookings = await db.booking.findMany({
    where: { clientId: session.user.id },
    include: BOOKING_INCLUDE,
    orderBy: { date: "desc" },
  })

  return { success: true, data: bookings as BookingWithDetails[] }
}

/**
 * getStylistBookings — Recuperer les reservations de la coiffeuse
 *
 * Filtre optionnel par statut. Retourne les reservations avec details
 * completes, triees par date decroissante.
 *
 * @param statusFilter - Statut optionnel pour filtrer (ex: "PENDING")
 *
 * Exemple :
 *   const result = await getStylistBookings("PENDING")
 *   // Retourne uniquement les reservations en attente
 */
export async function getStylistBookings(
  statusFilter?: BookingStatus
): Promise<ActionResult<BookingWithDetails[]>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }
  if (session.user.role !== "STYLIST") {
    return { success: false, error: "Acces reserve aux coiffeuses" }
  }

  // Recuperer l'ID du profil coiffeuse
  const profile = await db.stylistProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!profile) return { success: false, error: "Profil coiffeuse introuvable" }

  const bookings = await db.booking.findMany({
    where: {
      stylistId: profile.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: BOOKING_INCLUDE,
    orderBy: { date: "desc" },
  })

  return { success: true, data: bookings as BookingWithDetails[] }
}

/**
 * updateBookingStatus — Mettre a jour le statut d'une reservation
 *
 * Regles de transition de statut :
 *   - STYLIST peut : PENDING->CONFIRMED, CONFIRMED->IN_PROGRESS,
 *     IN_PROGRESS->COMPLETED, n'importe quel statut->CANCELLED
 *   - CLIENT peut : PENDING->CANCELLED uniquement
 *
 * @param bookingId - ID de la reservation
 * @param newStatus - Nouveau statut souhaite
 *
 * Exemple :
 *   await updateBookingStatus("booking-id", "CONFIRMED")
 *   // La coiffeuse confirme la reservation
 */
export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus
): Promise<ActionResult<BookingWithDetails>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }

  // Charger la reservation avec ses relations
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: BOOKING_INCLUDE,
  })

  if (!booking) return { success: false, error: "Reservation introuvable" }

  const role = session.user.role
  const currentStatus = booking.status

  // Verifier les droits + transitions valides
  if (role === "CLIENT") {
    // La cliente ne peut qu'annuler une reservation en attente
    if (booking.clientId !== session.user.id) {
      return { success: false, error: "Acces non autorise" }
    }
    if (currentStatus !== "PENDING" || newStatus !== "CANCELLED") {
      return {
        success: false,
        error: "Vous ne pouvez annuler que les reservations en attente",
      }
    }
  } else if (role === "STYLIST") {
    // Verifier que la coiffeuse est bien celle de cette reservation
    const profile = await db.stylistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!profile || booking.stylistId !== profile.id) {
      return { success: false, error: "Acces non autorise" }
    }

    // Transitions valides pour la coiffeuse
    const validTransitions: Record<string, BookingStatus[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
    }

    const allowed = validTransitions[currentStatus]
    if (!allowed || !allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Transition de ${currentStatus} vers ${newStatus} non autorisee`,
      }
    }
  } else {
    return { success: false, error: "Role non autorise" }
  }

  // Mettre a jour le statut
  const updated = await db.booking.update({
    where: { id: bookingId },
    data: { status: newStatus },
    include: BOOKING_INCLUDE,
  })

  // Envoyer l'email d'annulation si applicable
  if (newStatus === "CANCELLED") {
    sendBookingCancellationEmail(updated as BookingWithDetails).catch((err) =>
      console.warn("[Email] Erreur envoi email annulation:", err)
    )
  }

  return { success: true, data: updated as BookingWithDetails }
}

/**
 * getBookingById — Recuperer le detail complet d'une reservation
 *
 * Verifie que l'utilisateur est bien le client ou la coiffeuse de cette
 * reservation avant de retourner les donnees.
 *
 * @param bookingId - ID de la reservation
 *
 * Exemple :
 *   const result = await getBookingById("booking-id")
 */
export async function getBookingById(
  bookingId: string
): Promise<ActionResult<BookingWithDetails>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: BOOKING_INCLUDE,
  })

  if (!booking) return { success: false, error: "Reservation introuvable" }

  // Verifier l'acces : le client ou la coiffeuse de cette reservation
  const isClient = booking.clientId === session.user.id
  const isStylist = booking.stylist.userId === session.user.id

  if (!isClient && !isStylist) {
    return { success: false, error: "Acces non autorise" }
  }

  return { success: true, data: booking as BookingWithDetails }
}

/* ------------------------------------------------------------------ */
/* Helpers email (stub — integre en Tache 11)                          */
/* ------------------------------------------------------------------ */

/**
 * sendBookingConfirmationEmail — Envoyer un email de confirmation
 *
 * Stub qui sera connecte a Resend en Tache 11.
 * En attendant, log un message en console.
 */
async function sendBookingConfirmationEmail(booking: BookingWithDetails) {
  try {
    const { sendBookingConfirmation } = await import("@/shared/lib/email/send-email")
    await sendBookingConfirmation(booking)
  } catch {
    console.warn("[Email] Module email non disponible, envoi ignore")
  }
}

/**
 * sendBookingCancellationEmail — Envoyer un email d'annulation
 *
 * Stub qui sera connecte a Resend en Tache 11.
 */
async function sendBookingCancellationEmail(booking: BookingWithDetails) {
  try {
    const { sendBookingCancellation } = await import("@/shared/lib/email/send-email")
    await sendBookingCancellation(booking)
  } catch {
    console.warn("[Email] Module email non disponible, envoi ignore")
  }
}
