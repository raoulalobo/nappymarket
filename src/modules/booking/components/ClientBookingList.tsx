/**
 * ClientBookingList — Historique des reservations de la cliente
 *
 * Role : Afficher les reservations de la cliente connectee, separees
 *        en deux sections : "A venir" (PENDING/CONFIRMED/IN_PROGRESS)
 *        et "Passees" (COMPLETED/CANCELLED).
 *
 * Interactions :
 *   - Utilise useClientBookings() pour charger les reservations
 *   - Utilise useUpdateBookingStatus() pour annuler (PENDING uniquement)
 *   - Empty state avec lien vers /recherche
 *   - AlertDialog de confirmation pour les annulations
 *
 * Exemple :
 *   <ClientBookingList />
 */
"use client"

import { useState } from "react"
import Link from "next/link"
import { useClientBookings, useUpdateBookingStatus } from "../hooks/useBookings"
import { BookingStatusBadge } from "./BookingStatusBadge"
import { formatPrice, formatDate, formatTime, formatDuration } from "@/shared/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Scissors,
  XCircle,
  Search,
  Loader2,
  Pencil,
  Star,
} from "lucide-react"
import { EditBookingDialog } from "./EditBookingDialog"
import { ReviewForm } from "@/modules/review/components/ReviewForm"
import type { BookingWithDetails } from "../types"

export function ClientBookingList() {
  const { bookings, isLoading } = useClientBookings()
  const { updateStatus, isUpdating } = useUpdateBookingStatus()
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  // Booking actuellement en cours de modification (ouvre EditBookingDialog)
  const [editBooking, setEditBooking] = useState<BookingWithDetails | null>(null)
  // Booking pour lequel on ouvre le formulaire d'avis (Dialog ReviewForm)
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null)

  // Separer les reservations "a venir" et "passees"
  const upcomingStatuses = ["PENDING", "CONFIRMED", "IN_PROGRESS"]
  const upcoming = bookings.filter((b) => upcomingStatuses.includes(b.status))
  const past = bookings.filter((b) => !upcomingStatuses.includes(b.status))

  /** Annuler une reservation (PENDING uniquement) */
  const handleCancel = () => {
    if (!cancelBookingId) return
    updateStatus({ bookingId: cancelBookingId, status: "CANCELLED" })
    setCancelBookingId(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    )
  }

  // Si aucune reservation, afficher un empty state
  if (bookings.length === 0) {
    return (
      <div className="py-16 text-center">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Aucune reservation</h3>
        <p className="mt-1 text-muted-foreground">
          Vous n'avez pas encore reserve de prestation.
        </p>
        <Button asChild className="mt-4">
          <Link href="/recherche">
            <Search className="mr-2 h-4 w-4" />
            Trouver une coiffeuse
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Section "A venir" */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">A venir</h2>
          <div className="space-y-3">
            {upcoming.map((booking) => (
              <ClientBookingCard
                key={booking.id}
                booking={booking}
                onCancel={() => setCancelBookingId(booking.id)}
                onEdit={() => setEditBooking(booking)}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        </section>
      )}

      {/* Separateur si les deux sections sont presentes */}
      {upcoming.length > 0 && past.length > 0 && <Separator />}

      {/* Section "Passees" */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Passees</h2>
          <div className="space-y-3">
            {past.map((booking) => (
              <ClientBookingCard
                key={booking.id}
                booking={booking}
                isUpdating={isUpdating}
                onReview={
                  booking.status === "COMPLETED" && !booking.review
                    ? () => setReviewBookingId(booking.id)
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* AlertDialog annulation */}
      <AlertDialog
        open={!!cancelBookingId}
        onOpenChange={(open) => !open && setCancelBookingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette reservation ?</AlertDialogTitle>
            <AlertDialogDescription>
              La coiffeuse sera notifiee de l'annulation. Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, garder</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Oui, annuler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog modification de date/creneau (PENDING uniquement) */}
      {editBooking && (
        <EditBookingDialog
          booking={editBooking}
          open={!!editBooking}
          onOpenChange={(open) => !open && setEditBooking(null)}
        />
      )}

      {/* Dialog formulaire d'avis (COMPLETED sans review) */}
      <Dialog
        open={!!reviewBookingId}
        onOpenChange={(open) => !open && setReviewBookingId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Laisser un avis</DialogTitle>
          </DialogHeader>
          {reviewBookingId && (
            <ReviewForm
              bookingId={reviewBookingId}
              onSuccess={() => setReviewBookingId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sous-composant : Carte de reservation cliente                       */
/* ------------------------------------------------------------------ */

interface ClientBookingCardProps {
  booking: BookingWithDetails
  onCancel?: () => void
  /** Callback pour ouvrir le dialog de modification (PENDING uniquement) */
  onEdit?: () => void
  /** Callback pour ouvrir le formulaire d'avis (COMPLETED sans review) */
  onReview?: () => void
  isUpdating: boolean
}

function ClientBookingCard({
  booking,
  onCancel,
  onEdit,
  onReview,
  isUpdating,
}: ClientBookingCardProps) {
  // Nom de la coiffeuse
  const stylistName =
    booking.stylist.user.firstName && booking.stylist.user.lastName
      ? `${booking.stylist.user.firstName} ${booking.stylist.user.lastName}`
      : booking.stylist.user.name

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Infos principales */}
          <div className="space-y-2 flex-1">
            {/* Statut + Coiffeuse */}
            <div className="flex items-center gap-2 flex-wrap">
              <BookingStatusBadge status={booking.status} />
              <span className="flex items-center gap-1 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {stylistName}
              </span>
            </div>

            {/* Prestation */}
            <div className="flex items-center gap-1.5 text-sm">
              <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{booking.service.category.name}</span>
              <span className="text-muted-foreground">
                ({formatDuration(booking.service.durationMinutes)})
              </span>
            </div>

            {/* Date et heure */}
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{formatDate(new Date(booking.date))}</span>
              <Clock className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </span>
            </div>

            {/* Adresse */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{booking.address}{booking.city && `, ${booking.city}`}</span>
            </div>
          </div>

          {/* Prix + Action annuler */}
          <div className="flex flex-col items-end gap-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(booking.totalPrice)}
            </span>

            {/* Boutons Modifier + Annuler visibles uniquement pour PENDING */}
            {booking.status === "PENDING" && (
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onEdit}
                    disabled={isUpdating}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Modifier
                  </Button>
                )}
                {onCancel && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={onCancel}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="mr-1 h-3.5 w-3.5" />
                    )}
                    Annuler
                  </Button>
                )}
              </div>
            )}

            {/* Bouton "Laisser un avis" ou badge "Avis publie" pour COMPLETED */}
            {booking.status === "COMPLETED" && (
              <>
                {booking.review ? (
                  // Avis deja publie : afficher la note en badge
                  <span className="inline-flex items-center gap-1 rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    Avis publie ({booking.review.rating}/5)
                  </span>
                ) : onReview ? (
                  // Pas encore d'avis : bouton pour en laisser un
                  <Button size="sm" variant="outline" onClick={onReview}>
                    <Star className="mr-1 h-3.5 w-3.5" />
                    Laisser un avis
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
