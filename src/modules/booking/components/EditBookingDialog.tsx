/**
 * EditBookingDialog — Dialog de modification de date/creneau d'une reservation
 *
 * Role : Permettre a la cliente de changer le jour et/ou le creneau horaire
 *        d'une reservation PENDING (pas encore confirmee par la coiffeuse).
 *        Reutilise la meme logique calendrier + creneaux que BookingStepDate,
 *        mais dans un contexte de modification (pas de creation).
 *
 * Interactions :
 *   - Utilise useAvailableSlots() pour charger les creneaux d'un jour
 *   - Utilise useUpdateBookingSchedule() pour envoyer la modification
 *   - Pre-selectionne la date/heure actuelles du booking
 *   - Affiche un recapitulatif du changement avant confirmation
 *
 * Exemple :
 *   <EditBookingDialog
 *     booking={bookingPending}
 *     open={isEditOpen}
 *     onOpenChange={setIsEditOpen}
 *   />
 */
"use client"

import { useState, useMemo, useEffect } from "react"
import { useAvailableSlots, useUpdateBookingSchedule } from "../hooks/useBookings"
import { MAX_BOOKING_ADVANCE_DAYS } from "@/shared/lib/constants"
import { formatTime, formatDate } from "@/shared/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Loader2, ArrowRight } from "lucide-react"
import { fr } from "react-day-picker/locale"
import type { BookingWithDetails } from "../types"

/** Props du composant */
interface EditBookingDialogProps {
  /** Reservation a modifier (doit etre PENDING) */
  booking: BookingWithDetails
  /** Controle l'ouverture du dialog */
  open: boolean
  /** Callback pour ouvrir/fermer le dialog */
  onOpenChange: (open: boolean) => void
}

/**
 * Convertir une Date en string "YYYY-MM-DD" pour les comparaisons et l'API.
 * Utilise les methodes locales pour eviter les decalages de timezone.
 */
function dateToString(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function EditBookingDialog({
  booking,
  open,
  onOpenChange,
}: EditBookingDialogProps) {
  const { updateSchedule, isUpdating } = useUpdateBookingSchedule()

  // State local : date et heure selectionnees dans le dialog
  // Pre-remplies avec les valeurs actuelles du booking
  const currentDateStr = dateToString(new Date(booking.date))
  const [selectedDate, setSelectedDate] = useState<string>(currentDateStr)
  const [selectedTime, setSelectedTime] = useState<string | null>(booking.startTime)

  // Reinitialiser la selection quand le dialog s'ouvre avec un nouveau booking
  useEffect(() => {
    if (open) {
      const dateStr = dateToString(new Date(booking.date))
      setSelectedDate(dateStr)
      setSelectedTime(booking.startTime)
    }
  }, [open, booking.id, booking.date, booking.startTime])

  // Charger les creneaux disponibles pour la date selectionnee
  const { slots, isLoading: slotsLoading } = useAvailableSlots(
    booking.stylistId,
    booking.serviceId,
    selectedDate
  )

  // Filtrer les creneaux disponibles + ajouter le creneau actuel s'il est sur la meme date
  // (le creneau actuel du booking est "occupe" par lui-meme, on le rend disponible)
  const availableSlots = useMemo(() => {
    const isCurrentDate = selectedDate === currentDateStr
    return slots.filter((s) => {
      if (s.isAvailable) return true
      // Si on est sur la meme date, le creneau actuel du booking doit rester selectionnable
      if (isCurrentDate && s.startTime === booking.startTime) return true
      return false
    })
  }, [slots, selectedDate, currentDateStr, booking.startTime])

  // Convertir selectedDate en objet Date pour le Calendar
  const calendarDate = selectedDate ? new Date(selectedDate + "T00:00:00") : undefined

  // Dates min (demain) et max (+60j) pour le calendrier
  const tomorrow = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const maxDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + MAX_BOOKING_ADVANCE_DAYS)
    return d
  }, [])

  // Verifier si la selection a change par rapport a l'original
  const hasChanged =
    selectedDate !== currentDateStr || selectedTime !== booking.startTime

  /** Quand la cliente selectionne un jour dans le calendrier */
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    const newDateStr = dateToString(date)
    setSelectedDate(newDateStr)
    // Reinitialiser le creneau si la date change
    setSelectedTime(null)
  }

  /** Quand la cliente selectionne un creneau horaire */
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  /** Confirmer la modification */
  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return
    try {
      await updateSchedule({
        bookingId: booking.id,
        date: selectedDate,
        startTime: selectedTime,
      })
      onOpenChange(false)
    } catch {
      // L'erreur est geree par le toast dans le hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la reservation</DialogTitle>
          <DialogDescription>
            Choisissez une nouvelle date et un nouveau creneau horaire.
            La coiffeuse sera notifiee du changement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* ============================================================ */}
          {/* CALENDRIER                                                    */}
          {/* ============================================================ */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              locale={fr}
              selected={calendarDate}
              onSelect={handleDateSelect}
              disabled={[
                { before: tomorrow },
                { after: maxDate },
              ]}
              className="rounded-md border"
            />
          </div>

          {/* ============================================================ */}
          {/* CRENEAUX DISPONIBLES                                          */}
          {/* ============================================================ */}
          {selectedDate && (
            <div className="space-y-3">
              <h3 className="text-center text-sm font-medium text-muted-foreground">
                Creneaux disponibles
              </h3>

              {slotsLoading ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-20" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  Aucun creneau disponible pour cette date.
                  Essayez un autre jour.
                </p>
              ) : (
                <div className="flex flex-wrap justify-center gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.startTime}
                      variant={selectedTime === slot.startTime ? "default" : "outline"}
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleTimeSelect(slot.startTime)}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(slot.startTime)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* RECAPITULATIF DU CHANGEMENT                                   */}
          {/* ============================================================ */}
          {hasChanged && selectedTime && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                Recapitulatif du changement
              </p>
              <div className="flex items-center gap-2 text-sm">
                {/* Ancien creneau */}
                <span className="text-muted-foreground line-through">
                  {formatDate(new Date(booking.date))} a {formatTime(booking.startTime)}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                {/* Nouveau creneau */}
                <span className="font-medium">
                  {formatDate(new Date(selectedDate + "T00:00:00"))} a {formatTime(selectedTime)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* BOUTONS ACTION                                                 */}
        {/* ============================================================ */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hasChanged || !selectedTime || isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Modification...
              </>
            ) : (
              "Modifier"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
