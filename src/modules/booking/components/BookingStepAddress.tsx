/**
 * BookingStepAddress — Etape 3 : Saisie de l'adresse du domicile
 *
 * Role : Permettre a la cliente de saisir l'adresse ou la prestation
 *        aura lieu (son domicile). Propose l'autocompletion via l'API
 *        Adresse Gouv et un champ de notes optionnel.
 *
 * Interactions :
 *   - Utilise useAddressAutocomplete (importe depuis search/hooks)
 *   - Ecrit address, city et notes dans booking-flow-store
 *   - Pre-remplit l'adresse si la cliente a un profil avec adresse
 *   - Navigation : bouton "Precedent" (date) et "Suivant" (summary)
 *
 * Exemple :
 *   <BookingStepAddress />
 */
"use client"

import { useState } from "react"
import { useBookingFlowStore } from "@/shared/stores/booking-flow-store"
import { useAddressAutocomplete } from "@/modules/search/hooks/useAddressAutocomplete"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react"

export function BookingStepAddress() {
  const {
    address,
    city,
    notes,
    setAddress,
    setCity,
    setNotes,
    goToNextStep,
    goToPrevStep,
  } = useBookingFlowStore()

  // Etat local pour la recherche d'adresse (autocompletion)
  const [addressQuery, setAddressQuery] = useState(city || "")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { suggestions } = useAddressAutocomplete(addressQuery)

  /**
   * Quand la cliente selectionne une suggestion d'adresse
   * Remplir la ville et masquer les suggestions
   */
  const handleSelectSuggestion = (suggestion: {
    label: string
    city: string
  }) => {
    setCity(suggestion.city)
    setAddressQuery(suggestion.label)
    setShowSuggestions(false)
  }

  /**
   * Valider et passer a l'etape suivante
   * Verifier que l'adresse et la ville sont renseignees
   */
  const handleNext = () => {
    if (!address.trim() || !city.trim()) return
    goToNextStep()
  }

  // Le bouton "Suivant" est desactive si l'adresse est incomplete
  const canProceed = address.trim().length >= 5 && city.trim().length >= 2

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Adresse de la prestation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Indiquez l'adresse de votre domicile ou la coiffeuse se deplacera
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          {/* Champ ville avec autocompletion */}
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="city"
                placeholder="Rechercher une ville..."
                value={addressQuery}
                onChange={(e) => {
                  setAddressQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10"
              />

              {/* Dropdown de suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Champ adresse complete */}
          <div className="space-y-2">
            <Label htmlFor="address">Adresse complete</Label>
            <Input
              id="address"
              placeholder="Ex: 12 rue de la Paix, Batiment B, 3e etage"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Numero, rue, batiment, etage, code d'acces...
            </p>
          </div>

          {/* Champ notes optionnel */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes pour la coiffeuse{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Ex: Code interphone 1234A, sonnez 2 fois"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={goToPrevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button onClick={handleNext} disabled={!canProceed}>
          Suivant
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
