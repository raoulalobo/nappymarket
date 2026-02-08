/**
 * DashboardSidebar — Barre laterale de navigation desktop
 *
 * Role : Afficher les liens de navigation specifiques au role de l'utilisateur
 *        dans une sidebar fixe a gauche du contenu. Visible uniquement sur
 *        desktop (md et plus). Le lien actif est mis en surbrillance.
 *
 * Interactions :
 *   - Utilise useSession() pour determiner le role de l'utilisateur connecte
 *   - Utilise usePathname() pour detecter la page active et surligner le lien
 *   - Lit les liens depuis NAVIGATION_ITEMS (src/shared/lib/navigation.ts)
 *   - Les liens disabled (pages pas encore implementees) sont grises + badge "Bientot"
 *   - Integre dans DashboardLayout a gauche du {children}
 *
 * Exemple :
 *   // Dans DashboardLayout
 *   <div className="flex">
 *     <DashboardSidebar />
 *     <main className="flex-1">{children}</main>
 *   </div>
 */
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useSession } from "@/modules/auth/hooks/useSession"
import { NAVIGATION_ITEMS } from "@/shared/lib/navigation"
import type { NavItem } from "@/shared/lib/navigation"
import { APP_NAME } from "@/shared/lib/constants"

/**
 * SidebarLink — Lien individuel dans la sidebar
 *
 * Affiche un lien avec icone, label et etat actif/disabled.
 * Le lien actif a un fond colore et un texte en gras.
 * Les liens disabled sont grises et non cliquables.
 */
function SidebarLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon

  /* Lien desactive : page pas encore implementee */
  if (item.disabled) {
    return (
      <span
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2",
          "text-muted-foreground/50 cursor-not-allowed"
        )}
        aria-disabled="true"
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-sm">{item.label}</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          Bientot
        </Badge>
      </span>
    )
  }

  /* Lien actif ou normal */
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  )
}

/**
 * DashboardSidebar — Sidebar desktop (hidden en mobile, visible a partir de md)
 */
export function DashboardSidebar() {
  const { user } = useSession()
  const pathname = usePathname()

  /* Pas de session ou role inconnu : ne rien afficher */
  if (!user?.role) return null

  /* Recuperer les liens pour le role de l'utilisateur */
  const role = user.role as "CLIENT" | "STYLIST" | "ADMIN"
  const items = NAVIGATION_ITEMS[role]
  if (!items) return null

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-muted/30">
      {/* En-tete de la sidebar : nom de la section */}
      <div className="flex h-14 items-center px-4">
        <span className="text-sm font-semibold text-foreground">
          {role === "ADMIN" ? "Administration" : "Mon espace"}
        </span>
      </div>

      <Separator />

      {/* Liste des liens de navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navigation dashboard">
        {items.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </nav>
    </aside>
  )
}
