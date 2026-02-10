/**
 * Page Portfolio Coiffeuse — /coiffeuse/portfolio
 *
 * Role : Afficher le gestionnaire de portfolio photos de la coiffeuse.
 *
 * Interactions :
 *   - Protegee par le proxy (cookie de session requis)
 *   - Protegee par le DAL (requireRole verifie session + role STYLIST)
 *   - Rend le composant client PortfolioManager qui gere
 *     l'affichage, l'ajout et la suppression de photos
 *
 * Exemple d'acces :
 *   URL : /coiffeuse/portfolio
 *   Accessible uniquement par un utilisateur avec le role STYLIST
 */
import { requireRole } from "@/shared/lib/auth/dal"
import { PortfolioManager } from "@/modules/stylist/components/PortfolioManager"

/** Metadata de la page pour le SEO et l'onglet navigateur */
export const metadata = {
  title: "Mon portfolio",
}

export default async function StylistPortfolioPage() {
  // Verification session + role STYLIST (redirige automatiquement sinon)
  await requireRole("STYLIST")

  return (
    <div className="container mx-auto px-4 py-8">
      <PortfolioManager />
    </div>
  )
}
