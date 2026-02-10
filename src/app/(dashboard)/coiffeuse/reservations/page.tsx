/**
 * Page Reservations Coiffeuse — /coiffeuse/reservations
 *
 * Role : Afficher les reservations recues par la coiffeuse avec
 *        des onglets de filtre par statut et des actions de gestion.
 *
 * Interactions :
 *   - Protegee par le proxy (cookie de session requis)
 *   - Protegee par le DAL (requireRole verifie session + role STYLIST)
 *   - Delege l'affichage au composant StylistBookingList (client)
 *
 * Exemple d'URL : /coiffeuse/reservations
 */
import type { Metadata } from "next"
import { requireRole } from "@/shared/lib/auth/dal"
import { StylistBookingList } from "@/modules/booking/components/StylistBookingList"

export const metadata: Metadata = {
  title: "Mes reservations",
}

export default async function StylistReservationsPage() {
  // Verification session + role STYLIST (redirige automatiquement sinon)
  await requireRole("STYLIST")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mes reservations</h1>
        <p className="mt-1 text-muted-foreground">
          Gerez les reservations recues de vos clientes.
        </p>
      </div>

      <StylistBookingList />
    </div>
  )
}
