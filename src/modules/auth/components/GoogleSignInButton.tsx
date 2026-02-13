/**
 * GoogleSignInButton — Bouton de connexion via Google OAuth
 *
 * Role : Permettre a l'utilisateur de se connecter ou s'inscrire
 *        avec son compte Google en un clic.
 *
 * Interactions :
 *   - Appelle authClient.signIn.social({ provider: "google" })
 *   - Apres la 1ere connexion, redirige vers /choix-role pour choisir CLIENT ou STYLIST
 *   - Si l'utilisateur a deja un compte, redirige directement vers le dashboard
 *   - Utilise dans LoginForm et RegisterForm
 *
 * Exemple :
 *   <GoogleSignInButton />
 *   <GoogleSignInButton callbackURL="/choix-role" />
 */
"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { authClient } from "@/shared/lib/auth/auth-client"

/** Props optionnelles du bouton Google */
interface GoogleSignInButtonProps {
  /** URL de redirection apres authentification Google (defaut: /choix-role) */
  callbackURL?: string
}

/**
 * Icone Google officielle en SVG
 * Source : Google Brand Guidelines
 */
function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function GoogleSignInButton({
  callbackURL = "/choix-role",
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleGoogleSignIn() {
    setIsLoading(true)
    try {
      await authClient.signIn.social({
        provider: "google",
        // Redirige vers /choix-role apres la 1ere connexion Google
        // Le middleware ou la page /choix-role verifiera si le role est deja defini
        callbackURL,
        // Force Google a afficher l'ecran de selection de compte a chaque connexion
        // Sans ce parametre, Google reconnecte automatiquement au dernier compte utilise
        prompt: "select_account",
      })
    } catch {
      toast.error("Erreur lors de la connexion avec Google")
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      Continuer avec Google
    </Button>
  )
}
