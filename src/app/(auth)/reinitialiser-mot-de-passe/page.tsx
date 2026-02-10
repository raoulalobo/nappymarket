/**
 * Page Reinitialiser mot de passe — /reinitialiser-mot-de-passe
 *
 * Role : Permettre a un utilisateur de definir un nouveau mot de passe
 *        apres avoir clique sur le lien recu par email. Le token de
 *        reinitialisation est extrait des searchParams (?token=xxx).
 *
 * Interactions :
 *   - Lit le token depuis les searchParams de l'URL
 *   - Affiche le formulaire ResetPasswordForm avec le token
 *   - Layout auth (centrage, logo)
 *   - Apres succes, redirige vers /connexion (via useAuth dans le form)
 *
 * Metadata : titre "Reinitialiser le mot de passe" dans l'onglet navigateur
 */
import type { Metadata } from "next"
import { Suspense } from "react"
import { ResetPasswordContent } from "./ResetPasswordContent"

export const metadata: Metadata = {
  title: "Reinitialiser le mot de passe",
  description: "Choisissez un nouveau mot de passe pour votre compte NappyMarket",
}

/**
 * Page serveur qui enveloppe le contenu client dans un Suspense.
 * useSearchParams() dans un Client Component necessite <Suspense>.
 */
export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  )
}
