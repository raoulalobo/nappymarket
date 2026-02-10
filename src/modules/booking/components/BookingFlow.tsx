/**
 * BookingFlow — Orchestrateur du flow de reservation multi-etapes
 *
 * Role : Afficher le stepper visuel et le composant d'etape courant
 *        pour le flow de reservation d'une cliente chez une coiffeuse.
 *
 * Interactions :
 *   - Lit l'etape courante depuis booking-flow-store (Zustand)
 *   - Affiche BookingStepService, BookingStepDate, BookingStepAddress, BookingStepSummary
 *   - Reset le store au montage et au demontage (cleanup)
 *   - Recoit les props coiffeuse et services depuis la page serveur
 *
 * Etapes :
 *   1. "service"  : choix de la prestation
 *   2. "date"     : choix de la date et du creneau
 *   3. "address"  : saisie de l'adresse du domicile
 *   4. "summary"  : recapitulatif + confirmation
 *
 * Exemple :
 *   <BookingFlow
 *     stylistId="sty-123"
 *     stylistName="Marie Dupont"
 *     services={[...]}
 *   />
 */
"use client"

import { useEffect } from "react"
import { useBookingFlowStore } from "@/shared/stores/booking-flow-store"
import { BookingStepService } from "./BookingStepService"
import { BookingStepDate } from "./BookingStepDate"
import { BookingStepAddress } from "./BookingStepAddress"
import { BookingStepSummary } from "./BookingStepSummary"
import { Check } from "lucide-react"
import type { StylistService, ServiceCategory } from "@prisma/client"
import type { BookingFlowStep } from "../types"

/** Service enrichi avec sa categorie (passe depuis la page serveur) */
export type ServiceWithCategory = StylistService & {
  category: ServiceCategory
}

/** Props du composant BookingFlow */
interface BookingFlowProps {
  /** ID du StylistProfile */
  stylistId: string
  /** Nom complet de la coiffeuse (pour l'affichage) */
  stylistName: string
  /** Liste des services proposes par la coiffeuse */
  services: ServiceWithCategory[]
  /** Adresse par defaut de la cliente (pre-remplissage) */
  defaultAddress?: string
  /** Ville par defaut de la cliente (pre-remplissage) */
  defaultCity?: string
}

/** Configuration du stepper : label francais pour chaque etape */
const STEP_LABELS: Record<BookingFlowStep, string> = {
  service: "Prestation",
  date: "Date & Heure",
  address: "Adresse",
  summary: "Confirmation",
}

/** Ordre des etapes pour le stepper */
const STEPS: BookingFlowStep[] = ["service", "date", "address", "summary"]

export function BookingFlow({
  stylistId,
  stylistName,
  services,
  defaultAddress,
  defaultCity,
}: BookingFlowProps) {
  const { step, reset, setAddress, setCity } = useBookingFlowStore()

  // Reset le store au montage et pre-remplir l'adresse si disponible
  useEffect(() => {
    reset()
    if (defaultAddress) setAddress(defaultAddress)
    if (defaultCity) setCity(defaultCity)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Index de l'etape courante pour le stepper
  const currentIndex = STEPS.indexOf(step)

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* STEPPER VISUEL                                                */}
      {/* ============================================================ */}
      <nav aria-label="Etapes de reservation" className="mx-auto max-w-lg">
        <ol className="flex items-center justify-between">
          {STEPS.map((s, index) => {
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex

            return (
              <li key={s} className="flex flex-1 items-center">
                {/* Cercle numerote ou coche */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {/* Label de l'etape (cache sur mobile si pas courant) */}
                  <span
                    className={`text-xs ${
                      isCurrent
                        ? "font-medium text-foreground"
                        : "text-muted-foreground hidden sm:block"
                    }`}
                  >
                    {STEP_LABELS[s]}
                  </span>
                </div>

                {/* Ligne de connexion entre les etapes */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 transition-colors ${
                      index < currentIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* ============================================================ */}
      {/* CONTENU DE L'ETAPE COURANTE                                   */}
      {/* ============================================================ */}
      <div className="mx-auto max-w-2xl">
        {step === "service" && (
          <BookingStepService services={services} />
        )}
        {step === "date" && (
          <BookingStepDate stylistId={stylistId} />
        )}
        {step === "address" && (
          <BookingStepAddress />
        )}
        {step === "summary" && (
          <BookingStepSummary
            stylistId={stylistId}
            stylistName={stylistName}
            services={services}
          />
        )}
      </div>
    </div>
  )
}
