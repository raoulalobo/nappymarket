/**
 * useBookings — Hooks TanStack Query pour les reservations
 *
 * Role : Fournir les queries et mutations pour les reservations
 *        avec cache, invalidation et notifications toast.
 *
 * Interactions :
 *   - Appelle les server actions de booking-actions.ts
 *   - useAvailableSlots : utilise par BookingStepDate pour afficher les creneaux
 *   - useCreateBooking : utilise par BookingStepSummary pour confirmer
 *   - useClientBookings : utilise par ClientBookingList
 *   - useStylistBookings : utilise par StylistBookingList
 *   - useUpdateBookingStatus : utilise par les boutons d'action (confirmer, annuler, etc.)
 *
 * Exemple :
 *   const { slots, isLoading } = useAvailableSlots("sty-123", "srv-456", "2026-03-15")
 *   const { createBooking } = useCreateBooking()
 */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getAvailableSlotsForDate,
  createBooking,
  getClientBookings,
  getStylistBookings,
  updateBookingStatus,
  getBookingById,
} from "../actions/booking-actions"
import type { BookingSchema } from "../schemas/booking-schema"
import type { BookingStatus } from "@prisma/client"

/* ------------------------------------------------------------------ */
/* Cles de cache                                                       */
/* ------------------------------------------------------------------ */

const BOOKINGS_KEY = ["bookings"]
const SLOTS_KEY = ["slots"]

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/**
 * useAvailableSlots — Recuperer les creneaux disponibles pour une date
 *
 * Active uniquement quand date est non-null (l'utilisateur a selectionne un jour).
 * Le cache dure 2 minutes (les creneaux peuvent changer rapidement).
 *
 * @param stylistId - ID du StylistProfile
 * @param serviceId - ID du StylistService
 * @param date - Date au format "YYYY-MM-DD" ou null
 */
export function useAvailableSlots(
  stylistId: string,
  serviceId: string | null,
  date: string | null
) {
  const query = useQuery({
    queryKey: [...SLOTS_KEY, stylistId, serviceId, date],
    queryFn: async () => {
      const result = await getAvailableSlotsForDate(stylistId, serviceId!, date!)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    // Ne pas fetcher si pas de date ou pas de service selectionne
    enabled: !!date && !!serviceId,
    // Cache court (2 min) car les creneaux peuvent changer
    staleTime: 2 * 60 * 1000,
  })

  return {
    slots: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
  }
}

/**
 * useClientBookings — Recuperer les reservations de la cliente
 */
export function useClientBookings() {
  const query = useQuery({
    queryKey: [...BOOKINGS_KEY, "client"],
    queryFn: async () => {
      const result = await getClientBookings()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  return {
    bookings: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
  }
}

/**
 * useStylistBookings — Recuperer les reservations de la coiffeuse
 *
 * @param statusFilter - Filtre optionnel par statut
 */
export function useStylistBookings(statusFilter?: BookingStatus) {
  const query = useQuery({
    queryKey: [...BOOKINGS_KEY, "stylist", statusFilter ?? "all"],
    queryFn: async () => {
      const result = await getStylistBookings(statusFilter)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  return {
    bookings: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
  }
}

/**
 * useBookingDetail — Recuperer le detail d'une reservation
 *
 * @param bookingId - ID de la reservation (null = desactive)
 */
export function useBookingDetail(bookingId: string | null) {
  const query = useQuery({
    queryKey: [...BOOKINGS_KEY, bookingId],
    queryFn: async () => {
      const result = await getBookingById(bookingId!)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!bookingId,
  })

  return {
    booking: query.data ?? null,
    isLoading: query.isPending,
    error: query.error,
  }
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

/**
 * useCreateBooking — Mutation pour creer une reservation
 *
 * Apres succes : invalide le cache des reservations + slots + toast.
 */
export function useCreateBooking() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: BookingSchema) => {
      const result = await createBooking(data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY })
      queryClient.invalidateQueries({ queryKey: SLOTS_KEY })
      toast.success("Reservation creee avec succes !")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    createBooking: mutation.mutateAsync,
    isCreating: mutation.isPending,
  }
}

/**
 * useUpdateBookingStatus — Mutation pour changer le statut d'une reservation
 */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string
      status: BookingStatus
    }) => {
      const result = await updateBookingStatus(bookingId, status)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY })
      queryClient.invalidateQueries({ queryKey: SLOTS_KEY })

      // Message de succes adapte au nouveau statut
      const messages: Record<string, string> = {
        CONFIRMED: "Reservation confirmee",
        IN_PROGRESS: "Prestation demarree",
        COMPLETED: "Prestation terminee",
        CANCELLED: "Reservation annulee",
      }
      toast.success(messages[data.status] ?? "Statut mis a jour")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    updateStatus: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  }
}
