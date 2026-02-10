/**
 * Page Catalogue Admin — /admin/catalogue
 *
 * Role : Page serveur qui rend le composant CategoryManager pour la gestion
 *        des categories de prestations.
 *
 * Interactions :
 *   - Protegee par le proxy (cookie de session requis)
 *   - Protegee par le DAL (requireRole verifie session + role ADMIN)
 *   - CategoryManager : composant client qui gere le CRUD des categories
 *
 * Exemple d'acces :
 *   URL : /admin/catalogue
 *   Prerequis : etre connecte avec le role ADMIN
 */
import { requireRole } from "@/shared/lib/auth/dal"
import { CategoryManager } from "@/modules/admin/components/CategoryManager"

/**
 * Metadata de la page pour le SEO et l'onglet navigateur
 */
export const metadata = {
  title: "Catalogue - Admin",
}

export default async function AdminCataloguePage() {
  // Verification session + role ADMIN (redirige automatiquement sinon)
  await requireRole("ADMIN")

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Composant client pour la gestion des categories de prestations */}
      <CategoryManager />
    </div>
  )
}
