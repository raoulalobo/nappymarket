/**
 * Page Profil Cliente — /client/profil
 *
 * Role : Afficher le formulaire d'edition du profil cliente.
 *        Permet de renseigner la ville et l'adresse par defaut
 *        pour les prestations a domicile.
 *
 * Interactions :
 *   - Protegee par le proxy (cookie de session requis)
 *   - Protegee par le DAL (requireRole verifie session + role CLIENT)
 *   - Rend le composant ClientProfileForm (composant client avec TanStack Query)
 *
 * Exemple d'URL : /client/profil
 */
import { requireRole } from "@/shared/lib/auth/dal"
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

export default async function ClientProfilPage() {
  // Verification session + role CLIENT (redirige automatiquement sinon)
  await requireRole("CLIENT")

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Formulaire de profil cliente (composant client) */}
      <ClientProfileForm />

      {/* Section securite : changement de mot de passe */}
      <ChangePasswordForm />
    </div>
  )
}
