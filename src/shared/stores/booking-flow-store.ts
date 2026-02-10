/**
 * booking-flow-store.ts — Store Zustand pour le flow de reservation UI
 *
 * Role : Gerer l'etat UI du formulaire de reservation multi-etapes.
 *        Ce store ne contient PAS les donnees serveur (qui sont gerees
 *        par TanStack Query dans useBookings.ts).
 *
 * Interactions :
 *   - Ecrit par BookingFlow et ses sous-composants (Step 1 a 4)
 *   - Lu par BookingFlow pour afficher l'etape courante
 *   - Lu par BookingStepSummary pour le recap avant confirmation
 *   - Reset par BookingFlow au montage et au demontage
 *
 * Etapes du flow :
 *   1. "service"  : selection de la prestation
 *   2. "date"     : choix de la date et du creneau horaire
 *   3. "address"  : saisie de l'adresse du domicile
 *   4. "summary"  : recapitulatif et confirmation
 *
 * Exemple :
 *   import { useBookingFlowStore } from "@/shared/stores/booking-flow-store"
 *   const { step, serviceId, goToNextStep, reset } = useBookingFlowStore()
 */
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { BookingFlowStep } from "@/modules/booking/types"

/** Ordre des etapes pour la navigation */
const STEPS: BookingFlowStep[] = ["service", "date", "address", "summary"]

interface BookingFlowState {
  /** Etape courante du flow */
  step: BookingFlowStep
  /** ID du service selectionne (etape 1) */
  serviceId: string | null
  /** Date selectionnee au format "YYYY-MM-DD" (etape 2) */
  selectedDate: string | null
  /** Heure de debut selectionnee au format "HH:mm" (etape 2) */
  selectedTime: string | null
  /** Adresse du domicile de la cliente (etape 3) */
  address: string
  /** Ville du domicile (etape 3) */
  city: string
  /** Notes optionnelles pour la coiffeuse (etape 3) */
  notes: string

  // --- Actions ---
  /** Definir le service selectionne */
  setServiceId: (id: string) => void
  /** Definir la date selectionnee */
  setSelectedDate: (date: string | null) => void
  /** Definir l'heure selectionnee */
  setSelectedTime: (time: string | null) => void
  /** Definir l'adresse */
  setAddress: (address: string) => void
  /** Definir la ville */
  setCity: (city: string) => void
  /** Definir les notes */
  setNotes: (notes: string) => void
  /** Aller a l'etape suivante */
  goToNextStep: () => void
  /** Revenir a l'etape precedente */
  goToPrevStep: () => void
  /** Aller a une etape specifique */
  goToStep: (step: BookingFlowStep) => void
  /** Reinitialiser tout le store */
  reset: () => void
}

export const useBookingFlowStore = create<BookingFlowState>()(
  immer((set) => ({
    step: "service",
    serviceId: null,
    selectedDate: null,
    selectedTime: null,
    address: "",
    city: "",
    notes: "",

    setServiceId: (id) =>
      set((state) => {
        state.serviceId = id
      }),

    setSelectedDate: (date) =>
      set((state) => {
        state.selectedDate = date
        // Reset le creneau quand la date change
        state.selectedTime = null
      }),

    setSelectedTime: (time) =>
      set((state) => {
        state.selectedTime = time
      }),

    setAddress: (address) =>
      set((state) => {
        state.address = address
      }),

    setCity: (city) =>
      set((state) => {
        state.city = city
      }),

    setNotes: (notes) =>
      set((state) => {
        state.notes = notes
      }),

    goToNextStep: () =>
      set((state) => {
        const currentIndex = STEPS.indexOf(state.step)
        if (currentIndex < STEPS.length - 1) {
          state.step = STEPS[currentIndex + 1]
        }
      }),

    goToPrevStep: () =>
      set((state) => {
        const currentIndex = STEPS.indexOf(state.step)
        if (currentIndex > 0) {
          state.step = STEPS[currentIndex - 1]
        }
      }),

    goToStep: (step) =>
      set((state) => {
        state.step = step
      }),

    reset: () =>
      set((state) => {
        state.step = "service"
        state.serviceId = null
        state.selectedDate = null
        state.selectedTime = null
        state.address = ""
        state.city = ""
        state.notes = ""
      }),
  }))
)
