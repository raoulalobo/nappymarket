/**
 * Page Reservations Coiffeuse — /coiffeuse/reservations
 *
 * Role : Afficher les reservations recues par la coiffeuse avec
 *        des onglets de filtre par statut et des actions de gestion.
 *
 * Interactions :
 *   - Protegee par le middleware (cookie de session requis)
 *   - La verification du role STYLIST se fait ici
 *   - Delege l'affichage au composant StylistBookingList (client)
 *
 * Exemple d'URL : /coiffeuse/reservations
 */
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getSession } from "@/shared/lib/auth/get-session"
import { StylistBookingList } from "@/modules/booking/components/StylistBookingList"

export const metadata: Metadata = {
  title: "Mes reservations",
}

export default async function StylistReservationsPage() {
  const session = await getSession()

  // Verification de l'authentification
  if (!session) {
    redirect("/connexion")
  }

  // Verification du role : seules les coiffeuses peuvent acceder
  if (session.user.role === "CLIENT") {
    redirect("/client")
  }
  if (session.user.role === "ADMIN") {
    redirect("/admin/dashboard")
  }

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
