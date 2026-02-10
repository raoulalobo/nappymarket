/**
 * Page Reservations Cliente — /client/reservations
 *
 * Role : Afficher l'historique des reservations de la cliente connectee
 *        avec les sections "A venir" et "Passees".
 *
 * Interactions :
 *   - Protegee par le proxy (cookie de session requis)
 *   - Protegee par le DAL (requireRole verifie session + role CLIENT)
 *   - Delege l'affichage au composant ClientBookingList (client)
 *
 * Exemple d'URL : /client/reservations
 */
import type { Metadata } from "next"
import { requireRole } from "@/shared/lib/auth/dal"
import { ClientBookingList } from "@/modules/booking/components/ClientBookingList"

export const metadata: Metadata = {
  title: "Mes reservations",
}

export default async function ClientReservationsPage() {
  // Verification session + role CLIENT (redirige automatiquement sinon)
  await requireRole("CLIENT")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mes reservations</h1>
        <p className="mt-1 text-muted-foreground">
          Consultez l'historique de vos reservations.
        </p>
      </div>

      <ClientBookingList />
    </div>
  )
}
