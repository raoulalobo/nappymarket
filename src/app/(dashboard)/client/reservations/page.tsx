/**
 * Page Reservations Cliente — /client/reservations
 *
 * Role : Afficher l'historique des reservations de la cliente connectee
 *        avec les sections "A venir" et "Passees".
 *
 * Interactions :
 *   - Protegee par le middleware (cookie de session requis)
 *   - La verification du role CLIENT se fait ici
 *   - Delege l'affichage au composant ClientBookingList (client)
 *
 * Exemple d'URL : /client/reservations
 */
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getSession } from "@/shared/lib/auth/get-session"
import { ClientBookingList } from "@/modules/booking/components/ClientBookingList"

export const metadata: Metadata = {
  title: "Mes reservations",
}

export default async function ClientReservationsPage() {
  const session = await getSession()

  // Verification du role : seules les clientes peuvent acceder
  if (session?.user.role === "STYLIST") {
    redirect("/coiffeuse/dashboard")
  }
  if (session?.user.role === "ADMIN") {
    redirect("/admin/dashboard")
  }

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
