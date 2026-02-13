/**
 * MobilePublicNav — Menu hamburger pour la navigation publique mobile
 *
 * Role : Fournir un menu de navigation en mobile (<md) pour les pages publiques.
 *        Affiche un bouton hamburger qui ouvre un drawer Sheet depuis la gauche
 *        avec les liens de navigation publics (Inspirations) et les boutons
 *        d'authentification si l'utilisateur n'est pas connecte.
 *
 * Interactions :
 *   - Utilise Sheet (shadcn, side="left") pour le drawer
 *   - Utilise useSession() pour adapter les liens (auth vs connecte)
 *   - Utilise usePathname() pour surligner le lien actif
 *   - Le drawer se ferme automatiquement au clic sur un lien
 *   - Visible uniquement en mobile (md:hidden), le Header desktop prend le relais
 *   - Sur les pages dashboard, le Header recoit MobileSidebar a la place
 *     de ce composant via le prop `mobileNav` (injection de dependance)
 *   - Les boutons Connexion/Inscription sont affiches dans le drawer uniquement
 *     pour les visiteurs non connectes (en complement du UserMenu)
 *
 * Exemple :
 *   // Dans le Header
 *   <MobilePublicNav />
 */
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Sparkles, LogIn, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { useSession } from "@/modules/auth/hooks/useSession"
import { APP_NAME } from "@/shared/lib/constants"

/**
 * Liens de navigation publics affiches dans le drawer mobile.
 * Chaque lien a un label, une route, et une icone Lucide.
 */
const PUBLIC_NAV_LINKS = [
  {
    label: "Inspirations",
    href: "/inspirations",
    icon: Sparkles,
  },
]

export function MobilePublicNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, isPending } = useSession()

  /** Fermer le drawer au clic sur un lien */
  function handleClose() {
    setOpen(false)
  }

  return (
    <>
      {/* Bouton hamburger — visible uniquement en mobile (md:hidden) */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu de navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Drawer Sheet — s'ouvre depuis la gauche */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          {/* En-tete du drawer avec le nom de l'app */}
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-base">{APP_NAME}</SheetTitle>
            <SheetDescription className="text-xs">
              Navigation
            </SheetDescription>
          </SheetHeader>

          <Separator />

          {/* Liens de navigation publics */}
          <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navigation mobile">
            {PUBLIC_NAV_LINKS.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Boutons Connexion / Inscription — affiches uniquement pour les visiteurs */}
          {!isPending && !isAuthenticated && (
            <>
              <Separator />
              <div className="flex flex-col gap-2 px-4 py-4">
                <Button variant="outline" asChild className="w-full justify-start gap-2">
                  <Link href="/connexion" onClick={handleClose}>
                    <LogIn className="h-4 w-4" />
                    Connexion
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start gap-2">
                  <Link href="/inscription" onClick={handleClose}>
                    <UserPlus className="h-4 w-4" />
                    Inscription
                  </Link>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
