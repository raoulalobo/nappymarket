/**
 * Header — Barre de navigation principale
 *
 * Role : Afficher le logo, les liens de navigation et le menu utilisateur.
 *        S'adapte selon l'etat de connexion (visiteur vs connecte).
 *
 * Interactions :
 *   - Visible sur toutes les pages publiques et les espaces connectes
 *   - UserMenu gere l'affichage conditionnel (boutons auth / dropdown user)
 *   - Le logo redirige vers l'accueil
 *
 * Exemple :
 *   <Header />
 */
import Link from "next/link"
import { APP_NAME } from "@/shared/lib/constants"
import { UserMenu } from "./UserMenu"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo et nom de l'application */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
        </Link>

        {/* Navigation principale */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/recherche"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Trouver une coiffeuse
          </Link>
          <Link
            href="/inscription"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Devenir coiffeuse
          </Link>
        </nav>

        {/* Menu utilisateur (connecte: dropdown, deconnecte: boutons auth) */}
        <UserMenu />
      </div>
    </header>
  )
}
