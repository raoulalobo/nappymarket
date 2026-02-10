/**
 * BookingStepDate — Etape 2 : Selection de la date et du creneau
 *
 * Role : Afficher un calendrier (shadcn Calendar avec locale fr) pour
 *        choisir un jour, puis les creneaux disponibles pour ce jour.
 *        Les jours sans disponibilite sont desactives dans le calendrier.
 *
 * Interactions :
 *   - Lit serviceId depuis booking-flow-store
 *   - Appelle useAvailableSlots() pour charger les creneaux d'un jour
 *   - Ecrit selectedDate et selectedTime dans le store
 *   - Navigation : bouton "Precedent" (service) et passage auto a "address"
 *
 * Contraintes :
 *   - Max 60 jours a l'avance (MAX_BOOKING_ADVANCE_DAYS)
 *   - Min 24h avant (MIN_BOOKING_LEAD_TIME_HOURS)
 *   - Jours passes desactives
 *
 * Exemple :
 *   <BookingStepDate stylistId="sty-123" />
 */
"use client"

import { useMemo } from "react"
import { useBookingFlowStore } from "@/shared/stores/booking-flow-store"
import { useAvailableSlots } from "../hooks/useBookings"
import { MAX_BOOKING_ADVANCE_DAYS } from "@/shared/lib/constants"
import { formatTime } from "@/shared/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Clock } from "lucide-react"
import { fr } from "react-day-picker/locale"

/** Props du composant */
interface BookingStepDateProps {
  /** ID du StylistProfile pour charger les creneaux */
  stylistId: string
}

export function BookingStepDate({ stylistId }: BookingStepDateProps) {
  const {
    serviceId,
    selectedDate,
    selectedTime,
    setSelectedDate,
    setSelectedTime,
    goToNextStep,
    goToPrevStep,
  } = useBookingFlowStore()

  // Charger les creneaux quand une date est selectionnee
  const { slots, isLoading: slotsLoading } = useAvailableSlots(
    stylistId,
    serviceId,
    selectedDate
  )

  // Convertir selectedDate string en objet Date pour le Calendar
  const calendarDate = selectedDate ? new Date(selectedDate + "T00:00:00") : undefined

  // Dates min et max pour le calendrier
  const today = useMemo(() => new Date(), [])
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

  /**
   * Quand la cliente selectionne un jour dans le calendrier
   * Convertir en string "YYYY-MM-DD" et stocker dans le store
   */
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    setSelectedDate(`${year}-${month}-${day}`)
  }

  /**
   * Quand la cliente selectionne un creneau horaire
   * Stocker dans le store et passer a l'etape suivante
   */
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    goToNextStep()
  }

  // Filtrer les creneaux disponibles uniquement
  const availableSlots = slots.filter((s) => s.isAvailable)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Choisissez une date</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Selectionnez le jour et le creneau horaire souhaites
        </p>
      </div>

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
      {/* NAVIGATION                                                    */}
      {/* ============================================================ */}
      <div className="flex justify-start">
        <Button variant="ghost" onClick={goToPrevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    </div>
  )
}
