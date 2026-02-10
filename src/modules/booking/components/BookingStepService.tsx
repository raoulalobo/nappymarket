/**
 * BookingStepService — Etape 1 : Selection de la prestation
 *
 * Role : Afficher les services de la coiffeuse sous forme de cartes
 *        cliquables. La cliente selectionne la prestation souhaitee
 *        puis passe a l'etape suivante.
 *
 * Interactions :
 *   - Recoit la liste des services depuis BookingFlow (props)
 *   - Ecrit dans booking-flow-store (serviceId via setServiceId)
 *   - Passe a l'etape "date" via goToNextStep()
 *
 * Exemple :
 *   <BookingStepService services={[{ id: "...", category: { name: "Tresses" }, ... }]} />
 */
"use client"

import { useBookingFlowStore } from "@/shared/stores/booking-flow-store"
import { formatPrice, formatDuration } from "@/shared/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Check } from "lucide-react"
import type { ServiceWithCategory } from "./BookingFlow"

/** Props du composant */
interface BookingStepServiceProps {
  /** Services disponibles chez la coiffeuse */
  services: ServiceWithCategory[]
}

export function BookingStepService({ services }: BookingStepServiceProps) {
  const { serviceId, setServiceId, goToNextStep } = useBookingFlowStore()

  /**
   * Quand la cliente clique sur un service :
   * 1. Le stocker dans le store
   * 2. Passer a l'etape date
   */
  const handleSelect = (id: string) => {
    setServiceId(id)
    goToNextStep()
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Choisissez une prestation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Selectionnez le type de coiffure que vous souhaitez
        </p>
      </div>

      {/* Grille de cartes de services cliquables */}
      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((service) => {
          const isSelected = serviceId === service.id

          return (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : ""
              }`}
              onClick={() => handleSelect(service.id)}
            >
              <CardContent className="flex items-start gap-3 p-4">
                {/* Indicateur de selection */}
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>

                {/* Details du service */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {service.category.name}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Prix */}
                    <span className="text-lg font-semibold text-primary">
                      {formatPrice(service.price)}
                    </span>

                    {/* Duree */}
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(service.durationMinutes)}
                    </span>
                  </div>

                  {/* Description optionnelle */}
                  {service.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
