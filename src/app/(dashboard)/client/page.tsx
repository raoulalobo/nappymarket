/**
 * Page Espace Cliente — /client
 *
 * Role : Dashboard de la cliente connectee. Affiche un apercu
 *        de ses reservations, messages et actions rapides.
 *
 * Interactions :
 *   - Protegee par le middleware (cookie de session requis)
 *   - Le layout dashboard verifie la session cote serveur
 *   - La verification du role CLIENT se fait ici
 *   - Redirige les STYLIST et ADMIN vers leur espace respectif
 *
 * Note : Page placeholder, sera completee en Phase 5 (Reservations)
 */
import { redirect } from "next/navigation"
import { getSession } from "@/shared/lib/auth/get-session"

export default async function ClientDashboardPage() {
  const session = await getSession()

  // Verification du role : seules les clientes peuvent acceder a cette page
  if (session?.user.role === "STYLIST") {
    redirect("/coiffeuse/dashboard")
  }
  if (session?.user.role === "ADMIN") {
    redirect("/admin/dashboard")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">
        Bonjour {session?.user.name} !
      </h1>
      <p className="text-muted-foreground">
        Bienvenue dans votre espace cliente. Vous pourrez bientot consulter
        vos reservations et vos messages ici.
      </p>
    </div>
  )
}
