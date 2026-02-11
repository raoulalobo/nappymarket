/**
 * review-actions.ts — Server actions pour le systeme d'avis/notes
 *
 * Role : Fournir les operations CRUD pour les avis des clientes sur les coiffeuses.
 *        Chaque action verifie l'authentification et les autorisations.
 *
 * Interactions :
 *   - createReview : cree un avis (CLIENT, booking COMPLETED, pas de doublon)
 *   - getReviewsByStylist : liste paginee des avis d'une coiffeuse (PUBLIC)
 *   - getStylistRatingSummary : note moyenne + nombre d'avis (PUBLIC)
 *   - getClientReviews : "Mes avis" de la cliente connectee (CLIENT)
 *   - deleteReview : suppression par l'auteur (CLIENT)
 *   - getReviewByBooking : verifie si un avis existe pour un booking (AUTH)
 *   - Consommees par les hooks TanStack Query dans useReviews.ts
 *
 * Exemple :
 *   const result = await createReview({ bookingId: "abc", rating: 5, comment: "Super !" })
 *   const reviews = await getReviewsByStylist("stylist-id", 1)
 */
"use server"

import { db } from "@/shared/lib/db"
import { getSession } from "@/shared/lib/auth/get-session"
import { reviewSchema } from "../schemas/review-schema"
import { REVIEWS_PER_PAGE } from "@/shared/lib/constants"
import type { ActionResult } from "@/shared/types"
import type {
  ReviewWithDetails,
  ReviewWithBookingDetails,
  StylistRatingSummary,
  ReviewsPage,
} from "../types"

/* ------------------------------------------------------------------ */
/* Include communs pour les requetes Review                            */
/* ------------------------------------------------------------------ */

/**
 * Include Prisma pour charger les infos de la cliente (auteur de l'avis).
 * Utilise par getReviewsByStylist et getStylistReviewsForDashboard.
 */
const REVIEW_CLIENT_INCLUDE = {
  client: {
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      image: true,
    },
  },
} as const

/* ------------------------------------------------------------------ */
/* createReview — Creer un avis sur une reservation terminee           */
/* ------------------------------------------------------------------ */

/**
 * createReview — Creer un nouvel avis
 *
 * Workflow :
 *   1. Verifier la session (role CLIENT)
 *   2. Valider les donnees avec Zod (rating 1-5, comment max 1000)
 *   3. Charger le booking et verifier :
 *      - Le booking existe et appartient a la cliente
 *      - Le statut est COMPLETED
 *      - Aucun avis n'existe deja pour ce booking (doublon)
 *   4. Creer l'avis en BDD
 *
 * @param input - Donnees brutes validees par Zod (bookingId, rating, comment?)
 *
 * Exemple :
 *   await createReview({ bookingId: "booking-123", rating: 5, comment: "Excellent" })
 */
export async function createReview(
  input: unknown
): Promise<ActionResult<ReviewWithDetails>> {
  // 1. Verifier la session
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }
  if (session.user.role !== "CLIENT") {
    return { success: false, error: "Seules les clientes peuvent laisser un avis" }
  }

  // 2. Valider les donnees avec Zod
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { bookingId, rating, comment } = parsed.data

  // 3. Charger le booking et verifier les conditions
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      clientId: true,
      stylistId: true,
      status: true,
      review: { select: { id: true } },
    },
  })

  if (!booking) {
    return { success: false, error: "Reservation introuvable" }
  }

  // Verifier que la cliente est bien celle du booking
  if (booking.clientId !== session.user.id) {
    return { success: false, error: "Vous ne pouvez noter que vos propres reservations" }
  }

  // Verifier que le booking est termine
  if (booking.status !== "COMPLETED") {
    return { success: false, error: "Vous ne pouvez noter qu'une prestation terminee" }
  }

  // Verifier qu'aucun avis n'existe deja
  if (booking.review) {
    return { success: false, error: "Vous avez deja laisse un avis pour cette reservation" }
  }

  // 4. Creer l'avis en BDD
  try {
    const review = await db.review.create({
      data: {
        bookingId,
        clientId: session.user.id,
        stylistId: booking.stylistId,
        rating,
        // String vide traite comme null (pas de commentaire)
        comment: comment?.trim() || null,
      },
      include: REVIEW_CLIENT_INCLUDE,
    })

    return { success: true, data: review as ReviewWithDetails }
  } catch (error) {
    console.error("[createReview] Erreur :", error)
    return { success: false, error: "Erreur lors de la creation de l'avis" }
  }
}

/* ------------------------------------------------------------------ */
/* getReviewsByStylist — Liste paginee des avis d'une coiffeuse        */
/* ------------------------------------------------------------------ */

/**
 * getReviewsByStylist — Recuperer les avis d'une coiffeuse (PUBLIC)
 *
 * Retourne les avis pagines (10 par page) tries par date decroissante.
 * Pas de verification d'authentification car les avis sont publics.
 *
 * @param stylistId - ID du StylistProfile
 * @param page - Numero de page (1-indexed, defaut 1)
 *
 * Exemple :
 *   const result = await getReviewsByStylist("stylist-id", 1)
 *   // result.data.reviews = [{ rating: 5, comment: "Super !", client: { ... } }]
 */
export async function getReviewsByStylist(
  stylistId: string,
  page: number = 1
): Promise<ActionResult<ReviewsPage>> {
  if (!stylistId) {
    return { success: false, error: "L'identifiant de la coiffeuse est requis" }
  }

  const safePage = Math.max(1, Math.floor(page))
  const offset = (safePage - 1) * REVIEWS_PER_PAGE

  try {
    // Compter le total + charger la page en parallele
    const [totalCount, reviews] = await Promise.all([
      db.review.count({ where: { stylistId } }),
      db.review.findMany({
        where: { stylistId },
        include: REVIEW_CLIENT_INCLUDE,
        orderBy: { createdAt: "desc" },
        take: REVIEWS_PER_PAGE,
        skip: offset,
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(totalCount / REVIEWS_PER_PAGE))

    return {
      success: true,
      data: {
        reviews: reviews as ReviewWithDetails[],
        totalCount,
        page: safePage,
        totalPages,
      },
    }
  } catch (error) {
    console.error("[getReviewsByStylist] Erreur :", error)
    return { success: false, error: "Erreur lors du chargement des avis" }
  }
}

/* ------------------------------------------------------------------ */
/* getStylistRatingSummary — Note moyenne + nombre d'avis              */
/* ------------------------------------------------------------------ */

/**
 * getStylistRatingSummary — Calculer la note moyenne d'une coiffeuse (PUBLIC)
 *
 * Utilise db.review.aggregate() pour calculer AVG(rating) et COUNT(*).
 * Retourne null pour averageRating si aucun avis.
 *
 * @param stylistId - ID du StylistProfile
 *
 * Exemple :
 *   const result = await getStylistRatingSummary("stylist-id")
 *   // result.data = { averageRating: 4.7, reviewCount: 23 }
 */
export async function getStylistRatingSummary(
  stylistId: string
): Promise<ActionResult<StylistRatingSummary>> {
  if (!stylistId) {
    return { success: false, error: "L'identifiant de la coiffeuse est requis" }
  }

  try {
    const result = await db.review.aggregate({
      where: { stylistId },
      _avg: { rating: true },
      _count: { _all: true },
    })

    return {
      success: true,
      data: {
        // Arrondir a 1 decimale (ex: 4.666... -> 4.7)
        averageRating: result._avg.rating
          ? Math.round(result._avg.rating * 10) / 10
          : null,
        reviewCount: result._count._all,
      },
    }
  } catch (error) {
    console.error("[getStylistRatingSummary] Erreur :", error)
    return { success: false, error: "Erreur lors du calcul de la note moyenne" }
  }
}

/* ------------------------------------------------------------------ */
/* getClientReviews — "Mes avis" de la cliente connectee               */
/* ------------------------------------------------------------------ */

/**
 * getClientReviews — Recuperer tous les avis de la cliente connectee (CLIENT)
 *
 * Inclut les details du booking (date, service, categorie, coiffeuse)
 * pour contextualiser chaque avis dans la liste "Mes avis".
 *
 * Exemple :
 *   const result = await getClientReviews()
 *   // result.data[0].booking.service.category.name  // "Tresses"
 */
export async function getClientReviews(): Promise<
  ActionResult<ReviewWithBookingDetails[]>
> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }

  try {
    const reviews = await db.review.findMany({
      where: { clientId: session.user.id },
      include: {
        booking: {
          select: {
            id: true,
            date: true,
            service: {
              select: {
                id: true,
                category: { select: { name: true } },
              },
            },
            stylist: {
              select: {
                id: true,
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: reviews as ReviewWithBookingDetails[] }
  } catch (error) {
    console.error("[getClientReviews] Erreur :", error)
    return { success: false, error: "Erreur lors du chargement de vos avis" }
  }
}

/* ------------------------------------------------------------------ */
/* deleteReview — Supprimer un avis (par l'auteur uniquement)          */
/* ------------------------------------------------------------------ */

/**
 * deleteReview — Supprimer un avis
 *
 * Verifie que l'utilisateur connecte est bien l'auteur de l'avis
 * avant de le supprimer. Seule la cliente peut supprimer ses propres avis.
 *
 * @param reviewId - ID de l'avis a supprimer
 *
 * Exemple :
 *   await deleteReview("review-123")
 */
export async function deleteReview(
  reviewId: string
): Promise<ActionResult<{ deleted: true }>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }

  // Charger l'avis pour verifier l'ownership
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { clientId: true },
  })

  if (!review) {
    return { success: false, error: "Avis introuvable" }
  }

  if (review.clientId !== session.user.id) {
    return { success: false, error: "Vous ne pouvez supprimer que vos propres avis" }
  }

  try {
    await db.review.delete({ where: { id: reviewId } })
    return { success: true, data: { deleted: true } }
  } catch (error) {
    console.error("[deleteReview] Erreur :", error)
    return { success: false, error: "Erreur lors de la suppression de l'avis" }
  }
}

/* ------------------------------------------------------------------ */
/* getReviewByBooking — Recuperer l'avis d'un booking (si existant)    */
/* ------------------------------------------------------------------ */

/**
 * getReviewByBooking — Verifier si un avis existe pour un booking (AUTH)
 *
 * Retourne la review ou null. Utilisee par le bouton "Laisser un avis"
 * dans la liste des reservations pour savoir si un avis existe deja.
 *
 * @param bookingId - ID de la reservation
 *
 * Exemple :
 *   const result = await getReviewByBooking("booking-123")
 *   if (result.data) { // avis existe }
 */
export async function getReviewByBooking(
  bookingId: string
): Promise<ActionResult<ReviewWithDetails | null>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }

  try {
    const review = await db.review.findUnique({
      where: { bookingId },
      include: REVIEW_CLIENT_INCLUDE,
    })

    return { success: true, data: (review as ReviewWithDetails) ?? null }
  } catch (error) {
    console.error("[getReviewByBooking] Erreur :", error)
    return { success: false, error: "Erreur lors du chargement de l'avis" }
  }
}
