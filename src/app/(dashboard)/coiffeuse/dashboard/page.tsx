/**
 * Page Dashboard Coiffeuse — /coiffeuse/dashboard
 *
 * Role : Tableau de bord de la coiffeuse connectee. Affiche un apercu
 *        de ses reservations, revenus et actions rapides.
 *
 * Interactions :
 *   - Protegee par le middleware (cookie de session requis)
 *   - Le layout dashboard verifie la session cote serveur
 *   - La verification du role STYLIST se fait ici
 *   - Redirige les CLIENT et ADMIN vers leur espace respectif
 *
 * Note : Page placeholder, sera completee en Phase 3 (Profils)
 */
import { redirect } from "next/navigation"
import { getSession } from "@/shared/lib/auth/get-session"

export default async function StylistDashboardPage() {
  const session = await getSession()

  // Verification du role : seules les coiffeuses peuvent acceder
  if (session?.user.role === "CLIENT") {
    redirect("/client")
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
        Bienvenue dans votre espace coiffeuse. Vous pourrez bientot gerer
        votre profil, vos disponibilites et vos reservations ici.
      </p>
    </div>
  )
}
