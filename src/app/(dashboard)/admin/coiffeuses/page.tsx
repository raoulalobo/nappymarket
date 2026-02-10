/**
 * Page Coiffeuses Admin — /admin/coiffeuses
 *
 * Role : Page serveur qui rend le composant StylistList pour la gestion
 *        des coiffeuses inscrites.
 *
 * Interactions :
 *   - Protegee par le proxy (cookie de session requis)
 *   - Protegee par le DAL (requireRole verifie session + role ADMIN)
 *   - StylistList : composant client qui affiche et gere les coiffeuses
 *
 * Exemple d'acces :
 *   URL : /admin/coiffeuses
 *   Prerequis : etre connecte avec le role ADMIN
 */
import { requireRole } from "@/shared/lib/auth/dal"
import { StylistList } from "@/modules/admin/components/StylistList"

/**
 * Metadata de la page pour le SEO et l'onglet navigateur
 */
export const metadata = {
  title: "Coiffeuses - Admin",
}

export default async function AdminCoiffeusesPage() {
  // Verification session + role ADMIN (redirige automatiquement sinon)
  await requireRole("ADMIN")

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Composant client pour la gestion des coiffeuses */}
      <StylistList />
    </div>
  )
}
