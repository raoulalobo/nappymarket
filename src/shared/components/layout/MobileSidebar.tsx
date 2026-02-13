/**
 * MobileSidebar — Drawer de navigation mobile (Sheet)
 *
 * Role : Fournir un menu de navigation lateral en mobile (<md) sous forme
 *        de drawer (Sheet shadcn) qui s'ouvre depuis la gauche. Contient
 *        le bouton hamburger (trigger) ET le drawer (contenu).
 *
 * Interactions :
 *   - Utilise Sheet (shadcn, side="left") pour le drawer
 *   - Utilise useSession() pour determiner le role et afficher les bons liens
 *   - Utilise usePathname() pour mettre en surbrillance le lien actif
 *   - Lit les liens depuis NAVIGATION_ITEMS (src/shared/lib/navigation.ts)
 *   - Le drawer se ferme automatiquement quand un lien est clique
 *   - Visible uniquement en mobile (md:hidden)
 *   - Injecte dans le Header via le prop `mobileNav` depuis DashboardLayout,
 *     ce qui integre le hamburger dans la navbar sticky (toujours accessible au scroll)
 *
 * Exemple :
 *   // Dans DashboardLayout — injecte dans le Header sticky
 *   <Header mobileNav={<MobileSidebar />} />
 */
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { useSession } from "@/modules/auth/hooks/useSession"
import { NAVIGATION_ITEMS, ROLE_CONFIG } from "@/shared/lib/navigation"
import type { NavItem } from "@/shared/lib/navigation"

/**
 * MobileSidebarLink — Lien individuel dans le drawer mobile
 *
 * Similaire a SidebarLink de DashboardSidebar, mais ferme le drawer au clic.
 */
function MobileSidebarLink({
  item,
  isActive,
  onClose,
}: {
  item: NavItem
  isActive: boolean
  onClose: () => void
}) {
  const Icon = item.icon

  /* Lien desactive : page pas encore implementee */
  if (item.disabled) {
    return (
      <span
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5",
          "text-muted-foreground/50 cursor-not-allowed"
        )}
        aria-disabled="true"
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1 text-sm">{item.label}</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          Bientot
        </Badge>
      </span>
    )
  }

  /* Lien actif ou normal — ferme le drawer au clic */
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{item.label}</span>
    </Link>
  )
}

/**
 * MobileSidebar — Bouton hamburger + drawer Sheet (mobile uniquement)
 */
export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const { user } = useSession()
  const pathname = usePathname()

  /* Pas de session ou role inconnu : ne rien afficher */
  if (!user?.role) return null

  /* Recuperer les liens pour le role de l'utilisateur */
  const role = user.role as "CLIENT" | "STYLIST" | "ADMIN"
  const items = NAVIGATION_ITEMS[role]
  if (!items) return null

  /** Fermer le drawer (appele au clic sur un lien) */
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
          {/* En-tete du drawer : icone + label du role */}
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="flex items-center gap-2 text-base">
              {(() => {
                const config = ROLE_CONFIG[role]
                const RoleIcon = config.icon
                return (
                  <>
                    <RoleIcon className="h-5 w-5 text-primary" />
                    {config.label}
                  </>
                )
              })()}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Navigation rapide
            </SheetDescription>
          </SheetHeader>

          <Separator />

          {/* Liste des liens de navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navigation mobile">
            {items.map((item) => (
              <MobileSidebarLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onClose={handleClose}
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
