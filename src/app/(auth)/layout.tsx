/**
 * AuthLayout — Layout des pages d'authentification
 *
 * Role : Fournir une mise en page centree pour les formulaires
 *        de connexion et d'inscription. Minimaliste avec le logo
 *        en haut et un lien retour vers l'accueil.
 *
 * Interactions :
 *   - Enveloppe /connexion et /inscription
 *   - Pas de Header/Footer complet (experience epuree)
 *   - Lien vers l'accueil pour revenir a la navigation
 */
import Link from "next/link"
import { APP_NAME } from "@/shared/lib/constants"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Logo / Nom de l'app — lien vers l'accueil */}
      <Link href="/" className="mb-8 text-2xl font-bold tracking-tight">
        {APP_NAME}
      </Link>

      {/* Contenu de la page auth (formulaire) */}
      {children}
    </div>
  )
}
