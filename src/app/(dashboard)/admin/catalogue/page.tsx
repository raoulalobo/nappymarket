/**
 * Page Catalogue Admin — /admin/catalogue
 *
 * Role : Page serveur qui rend le composant CategoryManager pour la gestion
 *        des categories de prestations. Protegee par verification de session
 *        et de role ADMIN.
 *
 * Interactions :
 *   - getSession() : recupere la session Better Auth cote serveur via les cookies
 *   - redirect()   : redirige les utilisateurs non autorises :
 *       - Non connecte       -> /connexion
 *       - Role STYLIST        -> /coiffeuse/dashboard
 *       - Autre role (CLIENT) -> /client
 *   - CategoryManager : composant client qui gere le CRUD des categories
 *
 * Exemple d'acces :
 *   URL : /admin/catalogue
 *   Prerequis : etre connecte avec le role ADMIN
 */
import { redirect } from "next/navigation"
import { getSession } from "@/shared/lib/auth/get-session"
import { CategoryManager } from "@/modules/admin/components/CategoryManager"

/**
 * Metadata de la page pour le SEO et l'onglet navigateur
 */
export const metadata = {
  title: "Catalogue - Admin",
}

export default async function AdminCataloguePage() {
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
      {/* Composant client pour la gestion des categories de prestations */}
      <CategoryManager />
    </div>
  )
}
