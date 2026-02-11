/**
 * AverageRating — Affichage de la note moyenne d'une coiffeuse
 *
 * Role : Afficher la note moyenne et le nombre d'avis en deux modes :
 *   - Compact : "4.8 ★ (12 avis)" sur une ligne (StylistCard, resultats)
 *   - Detaille : etoiles visuelles + chiffre + compteur (profil public)
 *
 * Interactions :
 *   - Utilise par StylistCard (compact) dans les resultats de recherche
 *   - Utilise par la page profil public coiffeuse (detaille)
 *   - Utilise par StylistReviewList en en-tete (detaille)
 *   - Composant StarRating pour les etoiles visuelles (mode detaille)
 *
 * Exemple :
 *   <AverageRating averageRating={4.7} reviewCount={23} compact />
 *   <AverageRating averageRating={4.7} reviewCount={23} />
 */
"use client"

import { Star } from "lucide-react"
import { StarRating } from "./StarRating"
import { cn } from "@/lib/utils"

interface AverageRatingProps {
  /** Note moyenne (1.0 a 5.0), null si aucun avis */
  averageRating: number | null
  /** Nombre total d'avis */
  reviewCount: number
  /** Mode compact : tout sur une ligne (defaut : false = detaille) */
  compact?: boolean
  /** Classes CSS additionnelles */
  className?: string
}

export function AverageRating({
  averageRating,
  reviewCount,
  compact = false,
  className,
}: AverageRatingProps) {
  // Ne rien afficher si aucun avis
  if (reviewCount === 0 || averageRating === null) {
    return null
  }

  // Mode compact : "4.8 ★ (12 avis)" inline
  if (compact) {
    return (
      <div className={cn("flex items-center gap-1 text-sm", className)}>
        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{averageRating}</span>
        <span className="text-muted-foreground">
          ({reviewCount} avis)
        </span>
      </div>
    )
  }

  // Mode detaille : etoiles visuelles + chiffre + compteur
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Etoiles visuelles (lecture seule, arrondies a l'entier) */}
      <StarRating value={Math.round(averageRating)} size={18} />
      {/* Chiffre precis */}
      <span className="text-lg font-semibold">{averageRating}</span>
      {/* Compteur */}
      <span className="text-sm text-muted-foreground">
        ({reviewCount} avis)
      </span>
    </div>
  )
}
