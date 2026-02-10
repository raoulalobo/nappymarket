/**
 * Module Booking — Types TypeScript
 *
 * Role : Definir les types pour les reservations et disponibilites.
 *
 * Interactions :
 *   - BookingWithDetails : utilise par les listes de reservations (client + coiffeuse)
 *   - AvailabilitySlot : utilise par le calendrier de reservation (flow booking)
 *   - BookingFlowStep : utilise par le store Zustand booking-flow-store
 *   - DayAvailability : utilise par le composant BookingStepDate
 *
 * Exemple :
 *   import type { BookingWithDetails, AvailabilitySlot } from "@/modules/booking/types"
 */

import type {
  Booking,
  StylistService,
  ServiceCategory,
  StylistProfile,
  User,
} from "@prisma/client"

/**
 * BookingWithDetails — Reservation enrichie avec les relations necessaires
 *
 * Combine la reservation avec les infos client, service, categorie et coiffeuse
 * pour l'affichage complet dans les listes et les pages de detail.
 *
 * Exemple :
 *   booking.service.category.name  // "Tresses"
 *   booking.stylist.user.firstName  // "Marie"
 *   booking.client.name             // "Sophie Martin"
 */
export type BookingWithDetails = Booking & {
  /** Client ayant effectue la reservation */
  client: Pick<User, "id" | "name" | "firstName" | "lastName" | "image" | "email">
  /** Service reserve avec sa categorie */
  service: StylistService & {
    category: ServiceCategory
  }
  /** Profil coiffeuse avec user info */
  stylist: StylistProfile & {
    user: Pick<User, "id" | "name" | "firstName" | "lastName" | "image">
  }
}

/**
 * AvailabilitySlot — Creneau horaire disponible pour la reservation
 *
 * Genere par la server action getAvailableSlotsForDate() a partir
 * des disponibilites de la coiffeuse et des reservations existantes.
 *
 * Exemple :
 *   { startTime: "14:00", endTime: "14:30", isAvailable: true }
 *   { startTime: "14:30", endTime: "15:00", isAvailable: false }  // deja reserve
 */
export interface AvailabilitySlot {
  /** Heure de debut au format "HH:mm" */
  startTime: string
  /** Heure de fin au format "HH:mm" */
  endTime: string
  /** true si le creneau est libre, false s'il est occupe ou insuffisant */
  isAvailable: boolean
}

/**
 * BookingFlowStep — Etapes du flow de reservation multi-etapes
 *
 * Utilise par le store Zustand booking-flow-store pour tracker
 * la progression dans le formulaire de reservation.
 *
 * Ordre : service → date → address → summary
 */
export type BookingFlowStep = "service" | "date" | "address" | "summary"

/**
 * DayAvailability — Creneaux disponibles pour un jour specifique
 *
 * Retourne par la server action pour afficher les creneaux d'un jour
 * dans le composant BookingStepDate.
 */
export interface DayAvailability {
  /** Date au format "YYYY-MM-DD" */
  date: string
  /** Liste des creneaux avec leur statut de disponibilite */
  slots: AvailabilitySlot[]
}
