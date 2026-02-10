/**
 * Page Mot de passe oublie — /mot-de-passe-oublie
 *
 * Role : Permettre aux utilisateurs deconnectes de demander un email
 *        de reinitialisation de mot de passe.
 *
 * Interactions :
 *   - Layout Split Screen : image locs/ocean a gauche, formulaire a droite
 *   - Affiche le formulaire ForgotPasswordForm
 *   - Apres soumission, affiche un message de confirmation
 *
 * Metadata : titre "Mot de passe oublie" affiche dans l'onglet du navigateur
 */
import type { Metadata } from "next"
import { AuthPageShell } from "@/shared/components/layout/AuthPageShell"
import { ForgotPasswordForm } from "@/modules/auth/components/ForgotPasswordForm"

export const metadata: Metadata = {
  title: "Mot de passe oublie",
  description: "Reinitialiser votre mot de passe NappyMarket",
}

export default function MotDePasseOubliePage() {
  return (
    <AuthPageShell
      imageSrc="/images/stephen-tettey-atsu-T3IXYPEE2L4-unsplash.jpg"
      imageAlt="Femme avec des locs face a l'ocean"
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  )
}
