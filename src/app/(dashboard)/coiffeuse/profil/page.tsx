/**
 * Page Profil Coiffeuse — /coiffeuse/profil
 *
 * Role : Afficher le formulaire d'edition du profil coiffeuse.
 *
 * Interactions :
 *   - Protegee par le proxy (cookie de session requis)
 *   - Protegee par le DAL (requireRole verifie session + role STYLIST)
 *   - Rend le composant client StylistProfileForm qui gere
 *     le formulaire, les mutations et l'upload d'avatar
 *
 * Exemple d'acces :
 *   URL : /coiffeuse/profil
 *   Accessible uniquement par un utilisateur avec le role STYLIST
 */
import { requireRole } from "@/shared/lib/auth/dal"
import { StylistProfileForm } from "@/modules/stylist/components/StylistProfileForm"
import { ChangePasswordForm } from "@/modules/auth/components/ChangePasswordForm"

/** Metadata de la page pour le SEO et l'onglet navigateur */
export const metadata = {
  title: "Mon profil",
}

export default async function StylistProfilePage() {
  // Verification session + role STYLIST (redirige automatiquement sinon)
  await requireRole("STYLIST")

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <StylistProfileForm />

      {/* Section securite : changement de mot de passe */}
      <ChangePasswordForm />
    </div>
  )
}
