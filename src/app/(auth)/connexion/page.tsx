/**
 * Page Connexion — /connexion
 *
 * Role : Permettre aux utilisateurs existants de se connecter
 *        a leur compte NappyMarket.
 *
 * Interactions :
 *   - Layout Split Screen : image box braids a gauche, formulaire a droite
 *   - Affiche le formulaire LoginForm
 *   - Apres connexion reussie, redirige selon le role (via useAuth)
 *
 * Metadata : titre "Connexion" affiche dans l'onglet du navigateur
 */
import type { Metadata } from "next"
import { AuthPageShell } from "@/shared/components/layout/AuthPageShell"
import { LoginForm } from "@/modules/auth/components/LoginForm"

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous a votre compte NappyMarket",
}

export default function ConnexionPage() {
  return (
    <AuthPageShell
      imageSrc="/images/good-faces-3yvAe5gJ-SI-unsplash.jpg"
      imageAlt="Femme avec de longues box braids"
      quote="Retrouvez vos coiffeuses preferees"
    >
      <LoginForm />
    </AuthPageShell>
  )
}
