/**
 * Page Connexion — /connexion
 *
 * Role : Permettre aux utilisateurs existants de se connecter
 *        a leur compte NappyMarket.
 *
 * Interactions :
 *   - Affiche le formulaire LoginForm
 *   - Apres connexion reussie, redirige selon le role (via useAuth)
 *   - Layout auth (centrage, logo)
 *
 * Metadata : titre "Connexion" affiche dans l'onglet du navigateur
 */
import type { Metadata } from "next"
import { LoginForm } from "@/modules/auth/components/LoginForm"

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous a votre compte NappyMarket",
}

export default function ConnexionPage() {
  return <LoginForm />
}
