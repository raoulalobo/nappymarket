/**
 * useReviews — Hooks TanStack Query pour le systeme d'avis
 *
 * Role : Fournir les queries et mutations pour les avis/notes
 *        avec cache, invalidation et notifications toast.
 *
 * Interactions :
 *   - useStylistReviews : liste paginee sur profil public + dashboard coiffeuse
 *   - useStylistRating : note moyenne compacte (StylistCard, profil public)
 *   - useClientReviews : "Mes avis" (dashboard cliente)
 *   - useCreateReview : formulaire de creation d'avis (ReviewForm)
 *   - useDeleteReview : suppression (ClientReviewList, StylistReviewList)
 *   - useBookingReview : verifier si un avis existe pour un booking
 *   - Cle de base : ["reviews"]
 *
 * Exemple :
 *   const { reviews, isLoading } = useStylistReviews("stylist-id", 1)
 *   const { createReview, isPending } = useCreateReview()
 */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getReviewsByStylist,
  getStylistRatingSummary,
  getClientReviews,
  createReview,
  deleteReview,
  getReviewByBooking,
} from "../actions/review-actions"
import type { ReviewSchema } from "../schemas/review-schema"

/* ------------------------------------------------------------------ */
/* Cles de cache                                                       */
/* ------------------------------------------------------------------ */

/** Cle de base pour invalider toutes les queries review */
const REVIEWS_KEY = ["reviews"]

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/**
 * useStylistReviews — Liste paginee des avis d'une coiffeuse
 *
 * Cache de 5 minutes. Active uniquement si stylistId est fourni.
 *
 * @param stylistId - ID du StylistProfile
 * @param page - Numero de page (1-indexed)
 *
 * Exemple :
 *   const { data, isLoading } = useStylistReviews("stylist-id", 1)
 *   // data.reviews, data.totalCount, data.totalPages
 */
export function useStylistReviews(stylistId: string, page: number = 1) {
  const query = useQuery({
    queryKey: [...REVIEWS_KEY, "stylist", stylistId, page],
    queryFn: async () => {
      const result = await getReviewsByStylist(stylistId, page)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!stylistId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    data: query.data,
    reviews: query.data?.reviews ?? [],
    totalCount: query.data?.totalCount ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading,
    error: query.error,
  }
}

/**
 * useStylistRating — Note moyenne d'une coiffeuse
 *
 * Cache de 5 minutes. Active uniquement si stylistId est fourni.
 * Retourne { averageRating, reviewCount }.
 *
 * @param stylistId - ID du StylistProfile
 *
 * Exemple :
 *   const { averageRating, reviewCount } = useStylistRating("stylist-id")
 */
export function useStylistRating(stylistId: string) {
  const query = useQuery({
    queryKey: [...REVIEWS_KEY, "rating", stylistId],
    queryFn: async () => {
      const result = await getStylistRatingSummary(stylistId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!stylistId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    averageRating: query.data?.averageRating ?? null,
    reviewCount: query.data?.reviewCount ?? 0,
    isLoading: query.isLoading,
  }
}

/**
 * useClientReviews — "Mes avis" de la cliente connectee
 *
 * Charge tous les avis avec le detail du booking (service, coiffeuse).
 * Pas de pagination (nombre d'avis par cliente generalement faible).
 *
 * Exemple :
 *   const { reviews, isLoading } = useClientReviews()
 */
export function useClientReviews() {
  const query = useQuery({
    queryKey: [...REVIEWS_KEY, "client"],
    queryFn: async () => {
      const result = await getClientReviews()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 5 * 60 * 1000,
  })

  return {
    reviews: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  }
}

/**
 * useBookingReview — Verifier si un avis existe pour un booking
 *
 * Utilise par ClientBookingList pour afficher "Laisser un avis" ou "Avis publie".
 *
 * @param bookingId - ID de la reservation
 *
 * Exemple :
 *   const { review } = useBookingReview("booking-123")
 *   if (review) { // avis existe }
 */
export function useBookingReview(bookingId: string | null) {
  const query = useQuery({
    queryKey: [...REVIEWS_KEY, "booking", bookingId],
    queryFn: async () => {
      const result = await getReviewByBooking(bookingId!)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!bookingId,
    staleTime: 5 * 60 * 1000,
  })

  return {
    review: query.data ?? null,
    isLoading: query.isLoading,
  }
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

/**
 * useCreateReview — Mutation pour creer un avis
 *
 * Apres succes : invalide toutes les queries review + affiche un toast.
 *
 * Exemple :
 *   const { createReview, isPending } = useCreateReview()
 *   createReview({ bookingId: "abc", rating: 5, comment: "Top !" })
 */
export function useCreateReview() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: ReviewSchema) => {
      const result = await createReview(data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      // Invalider toutes les queries review (listes, rating, booking)
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEY })
      // Invalider aussi les bookings (pour mettre a jour le flag review)
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      toast.success("Avis publie avec succes !")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    createReview: mutation.mutate,
    isPending: mutation.isPending,
  }
}

/**
 * useDeleteReview — Mutation pour supprimer un avis
 *
 * Apres succes : invalide toutes les queries review + affiche un toast.
 *
 * Exemple :
 *   const { deleteReview, isPending } = useDeleteReview()
 *   deleteReview("review-123")
 */
export function useDeleteReview() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const result = await deleteReview(reviewId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEY })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      toast.success("Avis supprime")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    deleteReview: mutation.mutate,
    isPending: mutation.isPending,
  }
}
