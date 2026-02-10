/**
 * Page Reinitialiser mot de passe — /reinitialiser-mot-de-passe
 *
 * Role : Permettre a un utilisateur de definir un nouveau mot de passe
 *        apres avoir clique sur le lien recu par email. Le token de
 *        reinitialisation est extrait des searchParams (?token=xxx).
 *
 * Interactions :
 *   - Layout Split Screen : portrait elegant a gauche, formulaire a droite
 *   - Lit le token depuis les searchParams de l'URL (via ResetPasswordContent)
 *   - Affiche le formulaire ResetPasswordForm avec le token
 *   - Apres succes, redirige vers /connexion (via useAuth dans le form)
 *
 * Metadata : titre "Reinitialiser le mot de passe" dans l'onglet navigateur
 */
import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthPageShell } from "@/shared/components/layout/AuthPageShell"
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
    <AuthPageShell
      imageSrc="/images/theresa-ude-pbZwlHWHaQk-unsplash.jpg"
      imageAlt="Portrait elegant avec headwrap et locs"
    >
      <Suspense fallback={null}>
        <ResetPasswordContent />
      </Suspense>
    </AuthPageShell>
  )
}
