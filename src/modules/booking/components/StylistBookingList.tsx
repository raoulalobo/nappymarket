/**
 * StylistBookingList — Liste des reservations recues par la coiffeuse
 *
 * Role : Afficher les reservations de la coiffeuse avec des onglets
 *        pour filtrer par statut. Chaque reservation affiche les details
 *        (cliente, prestation, date/heure, adresse) et des actions contextuelles.
 *
 * Interactions :
 *   - Utilise useStylistBookings() pour charger les reservations
 *   - Utilise useUpdateBookingStatus() pour changer le statut
 *   - Actions : Confirmer (PENDING), Demarrer (CONFIRMED), Terminer (IN_PROGRESS), Annuler
 *   - AlertDialog de confirmation pour les annulations
 *
 * Exemple :
 *   <StylistBookingList />
 */
"use client"

import { useState } from "react"
import { useStylistBookings, useUpdateBookingStatus } from "../hooks/useBookings"
import { BookingStatusBadge } from "./BookingStatusBadge"
import { formatPrice, formatDate, formatTime, formatDuration } from "@/shared/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Calendar,
  Clock,
  MapPin,
  User,
  Scissors,
  CheckCircle,
  Play,
  XCircle,
  Loader2,
} from "lucide-react"
import type { BookingStatus } from "@prisma/client"
import type { BookingWithDetails } from "../types"

/** Onglets disponibles dans la page */
const TABS = [
  { value: "all", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmees" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "COMPLETED", label: "Terminees" },
  { value: "CANCELLED", label: "Annulees" },
] as const

export function StylistBookingList() {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)

  // Charger les reservations selon l'onglet actif
  const statusFilter = activeTab === "all" ? undefined : (activeTab as BookingStatus)
  const { bookings, isLoading } = useStylistBookings(statusFilter)
  const { updateStatus, isUpdating } = useUpdateBookingStatus()

  /** Confirmer une reservation (PENDING -> CONFIRMED) */
  const handleConfirm = (id: string) => updateStatus({ bookingId: id, status: "CONFIRMED" })

  /** Demarrer une prestation (CONFIRMED -> IN_PROGRESS) */
  const handleStart = (id: string) => updateStatus({ bookingId: id, status: "IN_PROGRESS" })

  /** Terminer une prestation (IN_PROGRESS -> COMPLETED) */
  const handleComplete = (id: string) => updateStatus({ bookingId: id, status: "COMPLETED" })

  /** Annuler une reservation (n'importe quel statut -> CANCELLED) */
  const handleCancel = () => {
    if (!cancelBookingId) return
    updateStatus({ bookingId: cancelBookingId, status: "CANCELLED" })
    setCancelBookingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Onglets de filtre par statut */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                Aucune reservation {tab.value !== "all" ? tab.label.toLowerCase() : ""}.
              </p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onConfirm={handleConfirm}
                    onStart={handleStart}
                    onComplete={handleComplete}
                    onCancel={() => setCancelBookingId(booking.id)}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* AlertDialog annulation */}
      <AlertDialog
        open={!!cancelBookingId}
        onOpenChange={(open) => !open && setCancelBookingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette reservation ?</AlertDialogTitle>
            <AlertDialogDescription>
              La cliente sera notifiee de l'annulation. Cette action est irreversible.
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
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sous-composant : Carte de reservation                               */
/* ------------------------------------------------------------------ */

interface BookingCardProps {
  booking: BookingWithDetails
  onConfirm: (id: string) => void
  onStart: (id: string) => void
  onComplete: (id: string) => void
  onCancel: () => void
  isUpdating: boolean
}

function BookingCard({
  booking,
  onConfirm,
  onStart,
  onComplete,
  onCancel,
  isUpdating,
}: BookingCardProps) {
  // Nom de la cliente
  const clientName =
    booking.client.firstName && booking.client.lastName
      ? `${booking.client.firstName} ${booking.client.lastName}`
      : booking.client.name

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Infos principales */}
          <div className="space-y-2 flex-1">
            {/* Statut + Cliente */}
            <div className="flex items-center gap-2 flex-wrap">
              <BookingStatusBadge status={booking.status} />
              <span className="flex items-center gap-1 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {clientName}
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

            {/* Notes */}
            {booking.notes && (
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{booking.notes}&rdquo;
              </p>
            )}
          </div>

          {/* Prix + Actions */}
          <div className="flex flex-col items-end gap-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(booking.totalPrice)}
            </span>

            {/* Actions contextuelles selon le statut */}
            <div className="flex gap-2">
              {booking.status === "PENDING" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onConfirm(booking.id)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-1 h-3.5 w-3.5" />
                    )}
                    Confirmer
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={onCancel}
                    disabled={isUpdating}
                  >
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                    Refuser
                  </Button>
                </>
              )}
              {booking.status === "CONFIRMED" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onStart(booking.id)}
                    disabled={isUpdating}
                  >
                    <Play className="mr-1 h-3.5 w-3.5" />
                    Demarrer
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={onCancel}
                    disabled={isUpdating}
                  >
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                    Annuler
                  </Button>
                </>
              )}
              {booking.status === "IN_PROGRESS" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onComplete(booking.id)}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="mr-1 h-3.5 w-3.5" />
                    Terminer
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={onCancel}
                    disabled={isUpdating}
                  >
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                    Annuler
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
