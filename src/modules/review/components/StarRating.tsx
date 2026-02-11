/**
 * StarRating — Composant d'etoiles pour noter ou afficher une note
 *
 * Role : Afficher 1 a 5 etoiles. Deux modes :
 *   - Lecture seule (sans onChange) : affiche la note avec etoiles remplies/vides
 *   - Interactif (avec onChange) : hover preview + clic pour selectionner
 *
 * Interactions :
 *   - Utilise par ReviewForm (mode interactif) pour saisir la note
 *   - Utilise par ReviewCard et AverageRating (mode lecture) pour afficher
 *   - Icone Star de lucide-react, jaune si rempli, grise sinon
 *
 * Exemple :
 *   <StarRating value={4} />                         // lecture seule
 *   <StarRating value={rating} onChange={setRating} /> // interactif
 */
"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  /** Note actuelle (1-5) ou 0 si aucune */
  value: number
  /** Callback de selection (rend le composant interactif si fourni) */
  onChange?: (rating: number) => void
  /** Taille des etoiles en px (defaut : 20) */
  size?: number
  /** Classes CSS additionnelles sur le conteneur */
  className?: string
}

export function StarRating({
  value,
  onChange,
  size = 20,
  className,
}: StarRatingProps) {
  // Etat de hover pour le preview interactif (0 = pas de hover)
  const [hoverValue, setHoverValue] = useState(0)

  // Mode interactif si onChange est fourni
  const isInteractive = !!onChange

  // Valeur affichee : hover preview si actif, sinon valeur reelle
  const displayValue = hoverValue || value

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      // Reset le hover quand la souris quitte le conteneur
      onMouseLeave={() => isInteractive && setHoverValue(0)}
    >
      {/* 5 etoiles (index 1 a 5) */}
      {[1, 2, 3, 4, 5].map((star) => {
        // L'etoile est remplie si sa valeur <= la valeur affichee
        const isFilled = star <= displayValue

        return (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            className={cn(
              "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm",
              isInteractive && "cursor-pointer hover:scale-110 transition-transform"
            )}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => isInteractive && setHoverValue(star)}
            aria-label={`${star} etoile${star > 1 ? "s" : ""}`}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors",
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-muted-foreground/30"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
