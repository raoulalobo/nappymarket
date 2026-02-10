/**
 * Page Dashboard Admin — /admin/dashboard
 *
 * Role : Tableau de bord administrateur. Affiche les statistiques
 *        globales et les actions d'administration.
 *
 * Interactions :
 *   - Protegee par le proxy (cookie de session requis)
 *   - Protegee par le DAL (requireRole verifie session + role ADMIN)
 *   - Redirige automatiquement si non connecte ou non admin
 *
 * Note : Page placeholder, sera completee en Phase 8 (Admin Dashboard)
 */
import { requireRole } from "@/shared/lib/auth/dal"

export default async function AdminDashboardPage() {
  // Verification session + role ADMIN (redirige automatiquement sinon)
  const session = await requireRole("ADMIN")

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
