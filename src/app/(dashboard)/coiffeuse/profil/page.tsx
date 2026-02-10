/**
 * Page Profil Coiffeuse — /coiffeuse/profil
 *
 * Role : Afficher le formulaire d'edition du profil coiffeuse.
 *        Page serveur qui verifie l'authentification et le role
 *        avant de rendre le composant client StylistProfileForm.
 *
 * Interactions :
 *   - Protegee par le layout dashboard (verifie la session)
 *   - Verifie le role STYLIST : redirige CLIENT vers /client,
 *     et ne permet pas l'acces aux ADMIN (redirection /admin/dashboard)
 *   - Rend le composant client StylistProfileForm qui gere
 *     le formulaire, les mutations et l'upload d'avatar
 *
 * Exemple d'acces :
 *   URL : /coiffeuse/profil
 *   Accessible uniquement par un utilisateur avec le role STYLIST
 */
import { redirect } from "next/navigation"
import { getSession } from "@/shared/lib/auth/get-session"
import { StylistProfileForm } from "@/modules/stylist/components/StylistProfileForm"
import { ChangePasswordForm } from "@/modules/auth/components/ChangePasswordForm"

/** Metadata de la page pour le SEO et l'onglet navigateur */
export const metadata = {
  title: "Mon profil",
}

export default async function StylistProfilePage() {
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
   * Les admins ne doivent pas gerer un profil coiffeuse.
   */
  if (session.user.role === "ADMIN") {
    redirect("/admin/dashboard")
  }

  /* ------------------------------------------------------------------ */
  /* Rendu de la page                                                   */
  /* ------------------------------------------------------------------ */

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <StylistProfileForm />

      {/* Section securite : changement de mot de passe */}
      <ChangePasswordForm />
    </div>
  )
}
