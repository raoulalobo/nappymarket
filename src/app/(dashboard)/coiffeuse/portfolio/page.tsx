/**
 * Page Portfolio Coiffeuse — /coiffeuse/portfolio
 *
 * Role : Afficher le gestionnaire de portfolio photos de la coiffeuse.
 *        Page serveur qui verifie l'authentification et le role
 *        avant de rendre le composant client PortfolioManager.
 *
 * Interactions :
 *   - Protegee par le layout dashboard (verifie la session)
 *   - Verifie le role STYLIST : redirige CLIENT vers /client,
 *     et ne permet pas l'acces aux ADMIN (redirection /admin/dashboard)
 *   - Rend le composant client PortfolioManager qui gere
 *     l'affichage, l'ajout et la suppression de photos
 *
 * Exemple d'acces :
 *   URL : /coiffeuse/portfolio
 *   Accessible uniquement par un utilisateur avec le role STYLIST
 */
import { redirect } from "next/navigation"
import { getSession } from "@/shared/lib/auth/get-session"
import { PortfolioManager } from "@/modules/stylist/components/PortfolioManager"

/** Metadata de la page pour le SEO et l'onglet navigateur */
export const metadata = {
  title: "Mon portfolio",
}

export default async function StylistPortfolioPage() {
  /* ------------------------------------------------------------------ */
  /* Verification de la session et du role                              */
  /* ------------------------------------------------------------------ */

  const session = await getSession()

  /**
   * Si pas de session (cookie expire ou absent), rediriger vers connexion.
   * Note : le layout dashboard fait deja cette verification, mais on la
   * double ici par securite (defense en profondeur).
   */
  if (!session) {
    redirect("/connexion")
  }

  /**
   * Si l'utilisateur est un CLIENT, il n'a pas acces a l'espace coiffeuse.
   * On le redirige vers son propre dashboard.
   */
  if (session.user.role === "CLIENT") {
    redirect("/client")
  }

  /**
   * Si l'utilisateur est un ADMIN, le rediriger vers son dashboard.
   * Les admins ne doivent pas gerer un portfolio coiffeuse.
   */
  if (session.user.role === "ADMIN") {
    redirect("/admin/dashboard")
  }

  /* ------------------------------------------------------------------ */
  /* Rendu de la page                                                   */
  /* ------------------------------------------------------------------ */

  return (
    <div className="container mx-auto px-4 py-8">
      <PortfolioManager />
    </div>
  )
}
