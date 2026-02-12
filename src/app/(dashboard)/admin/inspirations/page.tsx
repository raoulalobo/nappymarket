/**
 * Page Inspirations Admin — /admin/inspirations
 *
 * Role : Page serveur qui rend le composant GalleryManager pour la gestion
 *        des images de la galerie publique Inspirations.
 *
 * Interactions :
 *   - Protegee par le proxy (cookie de session requis)
 *   - Protegee par le DAL (requireRole verifie session + role ADMIN)
 *   - GalleryManager : composant client qui gere le CRUD des images
 *
 * Exemple d'acces :
 *   URL : /admin/inspirations
 *   Prerequis : etre connecte avec le role ADMIN
 */
import { requireRole } from "@/shared/lib/auth/dal"
import { GalleryManager } from "@/modules/admin/components/GalleryManager"

/**
 * Metadata de la page pour le SEO et l'onglet navigateur
 */
export const metadata = {
  title: "Inspirations - Admin",
}

export default async function AdminInspirationsPage() {
  // Verification session + role ADMIN (redirige automatiquement sinon)
  await requireRole("ADMIN")

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Composant client pour la gestion de la galerie Inspirations */}
      <GalleryManager />
    </div>
  )
}
