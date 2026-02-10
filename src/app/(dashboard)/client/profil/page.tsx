/**
 * Page Profil Cliente — /client/profil
 *
 * Role : Afficher le formulaire d'edition du profil cliente.
 *        Permet de renseigner la ville et l'adresse par defaut
 *        pour les prestations a domicile.
 *
 * Interactions :
 *   - Protegee par la verification de session et du role CLIENT
 *   - Redirige vers /connexion si l'utilisateur n'est pas connecte
 *   - Redirige vers le bon dashboard si l'utilisateur n'est pas CLIENT
 *   - Rend le composant ClientProfileForm (composant client avec TanStack Query)
 *
 * Exemple d'URL : /client/profil
 */
import { redirect } from "next/navigation"
import { getSession } from "@/shared/lib/auth/get-session"
import { ClientProfileForm } from "@/modules/auth/components/ClientProfileForm"
import { ChangePasswordForm } from "@/modules/auth/components/ChangePasswordForm"
import type { Metadata } from "next"

/**
 * Metadata statique pour le SEO et l'onglet du navigateur.
 * Affiche "Mon profil" comme titre de la page.
 */
export const metadata: Metadata = {
  title: "Mon profil",
}

/**
 * ClientProfilPage — Server Component
 *
 * Verifie la session et le role avant d'afficher le formulaire.
 * Les donnees du profil sont chargees cote client par ClientProfileForm
 * via TanStack Query (pour beneficier du cache et des mutations).
 */
export default async function ClientProfilPage() {
  // Recuperer la session de l'utilisateur connecte
  const session = await getSession()

  // Si l'utilisateur n'est pas connecte, rediriger vers la page de connexion
  if (!session) {
    redirect("/connexion")
  }

  // Si l'utilisateur est une coiffeuse, rediriger vers son dashboard
  if (session.user.role === "STYLIST") {
    redirect("/coiffeuse/dashboard")
  }

  // Si l'utilisateur est un admin, rediriger vers le dashboard admin
  if (session.user.role === "ADMIN") {
    redirect("/admin/dashboard")
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Formulaire de profil cliente (composant client) */}
      <ClientProfileForm />

      {/* Section securite : changement de mot de passe */}
      <ChangePasswordForm />
    </div>
  )
}
