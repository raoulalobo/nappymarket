/**
 * BookingStepSummary — Etape 4 : Recapitulatif et confirmation
 *
 * Role : Afficher un recapitulatif complet de la reservation avant
 *        confirmation. La cliente peut revenir en arriere ou confirmer.
 *        La confirmation appelle useCreateBooking() et redirige vers
 *        l'historique des reservations.
 *
 * Interactions :
 *   - Lit toutes les selections depuis booking-flow-store
 *   - Utilise useCreateBooking() pour envoyer la reservation
 *   - Redirige vers /client/reservations apres succes
 *   - Affiche le recap : coiffeuse, prestation, date/heure, adresse, prix
 *
 * Exemple :
 *   <BookingStepSummary
 *     stylistId="sty-123"
 *     stylistName="Marie Dupont"
 *     services={[...]}
 *   />
 */
"use client"

import { useRouter } from "next/navigation"
import { useBookingFlowStore } from "@/shared/stores/booking-flow-store"
import { useCreateBooking } from "../hooks/useBookings"
import { formatPrice, formatDuration, formatTime } from "@/shared/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, MapPin, User, Scissors, Loader2 } from "lucide-react"
import type { ServiceWithCategory } from "./BookingFlow"

/** Props du composant */
interface BookingStepSummaryProps {
  /** ID du StylistProfile */
  stylistId: string
  /** Nom complet de la coiffeuse */
  stylistName: string
  /** Services de la coiffeuse (pour retrouver le service selectionne) */
  services: ServiceWithCategory[]
}

export function BookingStepSummary({
  stylistId,
  stylistName,
  services,
}: BookingStepSummaryProps) {
  const router = useRouter()
  const {
    serviceId,
    selectedDate,
    selectedTime,
    address,
    city,
    notes,
    goToPrevStep,
  } = useBookingFlowStore()

  const { createBooking, isCreating } = useCreateBooking()

  // Retrouver le service selectionne dans la liste
  const selectedService = services.find((s) => s.id === serviceId)

  // Formater la date en texte lisible
  const dateDisplay = selectedDate
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(selectedDate + "T00:00:00"))
    : ""

  /**
   * Confirmer la reservation
   * Appelle la server action createBooking puis redirige
   */
  const handleConfirm = async () => {
    if (!serviceId || !selectedDate || !selectedTime) return

    try {
      await createBooking({
        stylistId,
        serviceId,
        date: selectedDate,
        startTime: selectedTime,
        address,
        city,
        notes: notes || undefined,
      })
      // Succes : rediriger vers l'historique des reservations
      router.push("/client/reservations")
    } catch {
      // L'erreur est geree par le hook (toast)
    }
  }

  // Verifier que toutes les donnees sont presentes
  const isComplete = serviceId && selectedDate && selectedTime && address && city

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Recapitulatif</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Verifiez les details de votre reservation
        </p>
      </div>

      {/* ============================================================ */}
      {/* CARTE RECAPITULATIVE                                          */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details de la reservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Coiffeuse */}
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Coiffeuse</p>
              <p className="font-medium">{stylistName}</p>
            </div>
          </div>

          <Separator />

          {/* Prestation */}
          <div className="flex items-center gap-3">
            <Scissors className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Prestation</p>
              <p className="font-medium">
                {selectedService?.category.name ?? "—"}
              </p>
              {selectedService && (
                <p className="text-sm text-muted-foreground">
                  {formatDuration(selectedService.durationMinutes)}
                  {selectedService.description && ` — ${selectedService.description}`}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Date et heure */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Date et heure</p>
              <p className="font-medium capitalize">{dateDisplay}</p>
              {selectedTime && (
                <p className="text-sm text-muted-foreground">
                  <Clock className="mr-1 inline h-3.5 w-3.5" />
                  {formatTime(selectedTime)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Adresse */}
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Adresse</p>
              <p className="font-medium">{address}</p>
              <p className="text-sm text-muted-foreground">{city}</p>
            </div>
          </div>

          {/* Notes (si presentes) */}
          {notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Prix total */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold text-primary">
              {selectedService ? formatPrice(selectedService.price) : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* BOUTONS D'ACTION                                              */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={goToPrevStep} disabled={isCreating}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button
          size="lg"
          onClick={handleConfirm}
          disabled={!isComplete || isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reservation en cours...
            </>
          ) : (
            "Confirmer la reservation"
          )}
        </Button>
      </div>
    </div>
  )
}
