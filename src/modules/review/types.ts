/**
 * Module Review — Types TypeScript
 *
 * Role : Definir les types pour le systeme d'avis/notes des coiffeuses.
 *
 * Interactions :
 *   - ReviewWithDetails : utilise par les listes d'avis (profil public, dashboard)
 *   - ReviewWithBookingDetails : utilise par "Mes avis" (dashboard cliente)
 *   - StylistRatingSummary : utilise par AverageRating, StylistCard, profil public
 *   - ReviewsPage : reponse paginee pour les listes d'avis
 *
 * Exemple :
 *   import type { ReviewWithDetails, StylistRatingSummary } from "@/modules/review/types"
 */

import type { Review, User, Booking, StylistService, ServiceCategory, StylistProfile } from "@prisma/client"

/**
 * ReviewWithDetails — Avis enrichi avec les infos de l'auteur (cliente)
 *
 * Utilise pour afficher un avis dans les listes : avatar, nom, date, etoiles, commentaire.
 *
 * Exemple :
 *   review.client.firstName  // "Sophie"
 *   review.rating            // 5
 *   review.comment           // "Excellent travail, merci !"
 */
export type ReviewWithDetails = Review & {
  /** Cliente auteur de l'avis */
  client: Pick<User, "id" | "name" | "firstName" | "lastName" | "image">
}

/**
 * ReviewWithBookingDetails — Avis enrichi avec les details de la reservation
 *
 * Utilise dans "Mes avis" (dashboard cliente) pour afficher le contexte :
 * quel service, quelle coiffeuse, quelle date.
 *
 * Exemple :
 *   review.booking.service.category.name  // "Tresses"
 *   review.booking.stylist.user.firstName // "Marie"
 */
export type ReviewWithBookingDetails = Review & {
  /** Reservation liee avec service, categorie et coiffeuse */
  booking: Pick<Booking, "id" | "date"> & {
    service: Pick<StylistService, "id"> & {
      category: Pick<ServiceCategory, "name">
    }
    stylist: Pick<StylistProfile, "id"> & {
      user: Pick<User, "id" | "name" | "firstName" | "lastName" | "image">
    }
  }
}

/**
 * StylistRatingSummary — Resume de la note moyenne d'une coiffeuse
 *
 * Utilise par AverageRating (compact ou detaille) et dans les resultats de recherche.
 *
 * Exemple :
 *   { averageRating: 4.7, reviewCount: 23 }
 */
export interface StylistRatingSummary {
  /** Note moyenne (1.0 a 5.0), null si aucun avis */
  averageRating: number | null
  /** Nombre total d'avis */
  reviewCount: number
}

/**
 * ReviewsPage — Reponse paginee pour les listes d'avis
 *
 * Retournee par getReviewsByStylist() pour l'affichage pagine.
 */
export interface ReviewsPage {
  /** Avis de la page courante */
  reviews: ReviewWithDetails[]
  /** Nombre total d'avis */
  totalCount: number
  /** Page courante (1-indexed) */
  page: number
  /** Nombre total de pages */
  totalPages: number
}
