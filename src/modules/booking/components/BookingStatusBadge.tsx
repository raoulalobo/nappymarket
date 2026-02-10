/**
 * BookingStatusBadge — Badge colore pour le statut d'une reservation
 *
 * Role : Afficher le statut d'une reservation avec un badge de couleur
 *        appropriee. Utilise dans les listes de reservations (client et coiffeuse).
 *
 * Interactions :
 *   - Utilise par StylistBookingList et ClientBookingList
 *   - Recoit un BookingStatus Prisma en prop
 *   - Mappe chaque statut vers une couleur et un label en francais
 *
 * Couleurs :
 *   - PENDING    : jaune (attente)
 *   - CONFIRMED  : vert (confirmee)
 *   - IN_PROGRESS: bleu (en cours)
 *   - COMPLETED  : gris (terminee)
 *   - CANCELLED  : rouge (annulee)
 *
 * Exemple :
 *   <BookingStatusBadge status="CONFIRMED" />
 *   // Affiche un badge vert "Confirmee"
 */
import { Badge } from "@/components/ui/badge"
import type { BookingStatus } from "@prisma/client"

/** Props du composant BookingStatusBadge */
interface BookingStatusBadgeProps {
  /** Statut de la reservation (enum Prisma) */
  status: BookingStatus
}

/** Configuration du badge par statut : label francais + classes Tailwind */
const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "En attente",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  CONFIRMED: {
    label: "Confirmee",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  IN_PROGRESS: {
    label: "En cours",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  COMPLETED: {
    label: "Terminee",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
  CANCELLED: {
    label: "Annulee",
    className: "bg-red-100 text-red-800 border-red-200",
  },
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
