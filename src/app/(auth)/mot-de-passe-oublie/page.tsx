/**
 * Page Mot de passe oublie — /mot-de-passe-oublie
 *
 * Role : Permettre aux utilisateurs deconnectes de demander un email
 *        de reinitialisation de mot de passe.
 *
 * Interactions :
 *   - Affiche le formulaire ForgotPasswordForm
 *   - Layout auth (centrage, logo)
 *   - Apres soumission, affiche un message de confirmation
 *
 * Metadata : titre "Mot de passe oublie" affiche dans l'onglet du navigateur
 */
import type { Metadata } from "next"
import { ForgotPasswordForm } from "@/modules/auth/components/ForgotPasswordForm"

export const metadata: Metadata = {
  title: "Mot de passe oublie",
  description: "Reinitialiser votre mot de passe NappyMarket",
}

export default function MotDePasseOubliePage() {
  return <ForgotPasswordForm />
}
