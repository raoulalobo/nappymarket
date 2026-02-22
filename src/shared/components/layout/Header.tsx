/**
 * Header — Barre de navigation principale (fixed top)
 *
 * Role : Afficher le logo, le hamburger mobile, les liens de navigation
 *        desktop et le menu utilisateur. S'adapte selon le contexte :
 *        - Pages publiques : MobilePublicNav (hamburger par defaut)
 *        - Pages dashboard : MobileSidebar injecte via le prop `mobileNav`
 *
 * Interactions :
 *   - Visible sur toutes les pages (publiques et connectees)
 *   - UserMenu gere l'affichage conditionnel (boutons auth / dropdown user)
 *   - Le prop `mobileNav` permet d'injecter un hamburger specifique au contexte
 *     (par defaut : MobilePublicNav pour les pages publiques)
 *   - Le logo redirige vers l'accueil
 *
 * Structure mobile :
 *   [Hamburger] [Logo .............. ] [UserMenu]
 *
 * Structure desktop :
 *   [Logo] [Inspirations .............. ] [UserMenu]
 *
 * Exemple :
 *   // Pages publiques (hamburger par defaut)
 *   <Header />
 *
 *   // Pages dashboard (hamburger dashboard injecte)
 *   <Header mobileNav={<MobileSidebar />} />
 */
import Link from "next/link"
import { APP_NAME } from "@/shared/lib/constants"
import { UserMenu } from "./UserMenu"
import { MobilePublicNav } from "./MobilePublicNav"
import { ContactModal } from "./ContactModal"

interface HeaderProps {
  /** Composant hamburger mobile a afficher (defaut : MobilePublicNav) */
  mobileNav?: React.ReactNode
}

export function Header({ mobileNav }: HeaderProps) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Partie gauche : hamburger mobile + logo */}
        <div className="flex items-center gap-2">
          {/* Hamburger — visible uniquement en mobile (<md).
              Par defaut : MobilePublicNav (pages publiques).
              Sur le dashboard : MobileSidebar injecte via le prop. */}
          {mobileNav ?? <MobilePublicNav />}

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
          {/* Bouton Contact : ouvre le modal formulaire de contact */}
          <ContactModal />
        </nav>

        {/* Menu utilisateur (connecte: dropdown, deconnecte: boutons auth) */}
        <UserMenu />
      </div>
    </header>
  )
}
