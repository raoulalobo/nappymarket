/**
 * Header — Barre de navigation principale
 *
 * Role : Afficher le logo, les liens de navigation et le menu utilisateur.
 *        S'adapte selon l'etat de connexion (visiteur vs connecte).
 *
 * Interactions :
 *   - Visible sur toutes les pages publiques et les espaces connectes
 *   - UserMenu gere l'affichage conditionnel (boutons auth / dropdown user)
 *   - MobilePublicNav : hamburger + drawer Sheet en mobile (<md)
 *   - Le logo redirige vers l'accueil
 *
 * Structure mobile :
 *   [Hamburger] [Logo .............. ] [UserMenu]
 *
 * Structure desktop :
 *   [Logo] [Inspirations .............. ] [UserMenu]
 *
 * Exemple :
 *   <Header />
 */
import Link from "next/link"
import { APP_NAME } from "@/shared/lib/constants"
import { UserMenu } from "./UserMenu"
import { MobilePublicNav } from "./MobilePublicNav"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Partie gauche : hamburger mobile + logo */}
        <div className="flex items-center gap-2">
          {/* Hamburger — visible uniquement en mobile (<md) */}
          <MobilePublicNav />

          {/* Logo et nom de l'application */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
          </Link>
        </div>

        {/* Navigation principale desktop — masquee en mobile (<md) */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/inspirations"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Inspirations
          </Link>
        </nav>

        {/* Menu utilisateur (connecte: dropdown, deconnecte: boutons auth) */}
        <UserMenu />
      </div>
    </header>
  )
}
