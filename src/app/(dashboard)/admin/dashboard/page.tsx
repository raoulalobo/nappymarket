/**
 * Page Dashboard Admin — /admin/dashboard
 *
 * Role : Tableau de bord administrateur. Affiche les statistiques
 *        globales et les actions d'administration.
 *
 * Interactions :
 *   - Protegee par le middleware (cookie de session requis)
 *   - Le layout dashboard verifie la session cote serveur
 *   - La verification du role ADMIN se fait ici
 *   - Retourne une erreur 403 pour les non-admins
 *
 * Note : Page placeholder, sera completee en Phase 8 (Admin Dashboard)
 */
import { redirect } from "next/navigation"
import { getSession } from "@/shared/lib/auth/get-session"

export default async function AdminDashboardPage() {
  const session = await getSession()

  // Verification de l'authentification
  if (!session) {
    redirect("/connexion")
  }

  // Verification du role : seuls les admins peuvent acceder
  if (session.user.role !== "ADMIN") {
    // Rediriger vers l'espace correspondant au role
    if (session.user.role === "STYLIST") {
      redirect("/coiffeuse/dashboard")
    }
    redirect("/client")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Administration</h1>
      <p className="text-muted-foreground">
        Bienvenue dans le tableau de bord administrateur. Vous pourrez
        bientot gerer le catalogue, les utilisateurs et les statistiques ici.
      </p>
    </div>
  )
}
