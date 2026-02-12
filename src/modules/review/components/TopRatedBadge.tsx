/**
 * TopRatedBadge — Badge dore "Top notee" pour les coiffeuses bien notees
 *
 * Role : Afficher un badge distinctif a cote du nom de la coiffeuse
 *        lorsque sa note moyenne est >= TOP_RATED_THRESHOLD (4/5).
 *        Retourne null si la condition n'est pas remplie,
 *        ce qui le rend safe a rendre dans n'importe quel contexte.
 *
 * Interactions :
 *   - Utilise la constante TOP_RATED_THRESHOLD de shared/lib/constants
 *   - Affiche dans : StylistCard (recherche), profil public, dashboard coiffeuse
 *   - Style coherent avec les badges shadcn existants (variant="outline")
 *
 * Exemple :
 *   <TopRatedBadge averageRating={4.3} reviewCount={12} />
 *   // -> Badge dore "Top notee" avec icone etoile
 *
 *   <TopRatedBadge averageRating={3.5} reviewCount={8} />
 *   // -> null (pas affiche car < 4)
 *
 *   <TopRatedBadge averageRating={null} reviewCount={0} />
 *   // -> null (pas d'avis)
 */

import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TOP_RATED_THRESHOLD } from "@/shared/lib/constants"

interface TopRatedBadgeProps {
  /** Note moyenne de la coiffeuse (null si aucun avis) */
  averageRating: number | null
  /** Nombre total d'avis recus */
  reviewCount: number
}

export function TopRatedBadge({ averageRating, reviewCount }: TopRatedBadgeProps) {
  // Ne pas afficher si : pas de note, aucun avis, ou note insuffisante
  if (averageRating === null || reviewCount === 0 || averageRating < TOP_RATED_THRESHOLD) {
    return null
  }

  return (
    <Badge
      variant="outline"
      className="shrink-0 gap-1 border-amber-300 bg-amber-100 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
    >
      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
      Top notee
    </Badge>
  )
}
