/**
 * Page Coiffeuses Admin — /admin/coiffeuses
 *
 * Role : Page serveur qui rend le composant StylistList pour la gestion
 *        des coiffeuses inscrites. Protegee par verification de session
 *        et de role ADMIN.
 *
 * Interactions :
 *   - getSession() : recupere la session Better Auth cote serveur via les cookies
 *   - redirect()   : redirige les utilisateurs non autorises :
 *       - Non connecte       -> /connexion
 *       - Role STYLIST        -> /coiffeuse/dashboard
 *       - Autre role (CLIENT) -> /client
 *   - StylistList : composant client qui affiche et gere les coiffeuses
 *
 * Exemple d'acces :
 *   URL : /admin/coiffeuses
 *   Prerequis : etre connecte avec le role ADMIN
 */
import { redirect } from "next/navigation"
import { getSession } from "@/shared/lib/auth/get-session"
import { StylistList } from "@/modules/admin/components/StylistList"

/**
 * Metadata de la page pour le SEO et l'onglet navigateur
 */
export const metadata = {
  title: "Coiffeuses - Admin",
}

export default async function AdminCoiffeusesPage() {
  // Recuperation de la session utilisateur cote serveur
  const session = await getSession()

  // Redirection si non connecte
  if (!session) {
    redirect("/connexion")
  }

  // Verification du role : seuls les admins peuvent acceder a cette page
  if (session.user.role !== "ADMIN") {
    // Redirection adaptee selon le role de l'utilisateur
    if (session.user.role === "STYLIST") {
      redirect("/coiffeuse/dashboard")
    }
    redirect("/client")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Composant client pour la gestion des coiffeuses */}
      <StylistList />
    </div>
  )
}
