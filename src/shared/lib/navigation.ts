/**
 * navigation.ts — Configuration des liens de navigation par role
 *
 * Role : Definir la liste des liens de la sidebar dashboard pour chaque role
 *        (CLIENT, STYLIST, ADMIN). Chaque lien a un label, une route, une icone
 *        Lucide et un flag optionnel `disabled` pour les pages pas encore implementees.
 *
 * Interactions :
 *   - Consomme par DashboardSidebar (desktop) et MobileSidebar (mobile)
 *   - Les icones proviennent de lucide-react
 *   - Les pages disabled sont affichees avec un style grise + badge "Bientot"
 *
 * Exemple :
 *   import { NAVIGATION_ITEMS } from "@/shared/lib/navigation"
 *   const clientLinks = NAVIGATION_ITEMS.CLIENT
 *   // [{ label: "Tableau de bord", href: "/client", icon: LayoutDashboard }, ...]
 */

import {
  LayoutDashboard,
  User,
  Calendar,
  MessageCircle,
  Image,
  Scissors,
  Clock,
  Tags,
  Users,
  Star,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

/**
 * Structure d'un item de navigation dans la sidebar.
 *
 * Exemple :
 *   { label: "Portfolio", href: "/coiffeuse/portfolio", icon: Image }
 *   { label: "Messages", href: "/client/messages", icon: MessageCircle, disabled: true }
 */
export interface NavItem {
  /** Texte affiche dans le lien */
  label: string
  /** Route Next.js vers laquelle le lien pointe */
  href: string
  /** Icone Lucide affichee a gauche du label */
  icon: LucideIcon
  /** Si true, le lien est grise avec un badge "Bientot" (page pas encore implementee) */
  disabled?: boolean
}

/**
 * Liens de navigation pour chaque role.
 *
 * CLIENT : Tableau de bord, Profil, Reservations (Phase 5), Messages (Phase 7)
 * STYLIST : Tableau de bord, Profil, Portfolio, Prestations, Disponibilites (Phase 5),
 *           Reservations (Phase 5), Messages (Phase 7)
 * ADMIN : Dashboard, Catalogue, Coiffeuses, Utilisateurs (Phase 8)
 */
export const NAVIGATION_ITEMS: Record<"CLIENT" | "STYLIST" | "ADMIN", NavItem[]> = {
  CLIENT: [
    {
      label: "Tableau de bord",
      href: "/client",
      icon: LayoutDashboard,
    },
    {
      label: "Mon profil",
      href: "/client/profil",
      icon: User,
    },
    {
      label: "Reservations",
      href: "/client/reservations",
      icon: Calendar,
    },
    {
      label: "Mes avis",
      href: "/client/avis",
      icon: Star,
    },
    {
      label: "Messages",
      href: "/client/messages",
      icon: MessageCircle,
      disabled: true, // Phase 7
    },
  ],

  STYLIST: [
    {
      label: "Tableau de bord",
      href: "/coiffeuse/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Mon profil",
      href: "/coiffeuse/profil",
      icon: User,
    },
    {
      label: "Portfolio",
      href: "/coiffeuse/portfolio",
      icon: Image,
    },
    {
      label: "Prestations",
      href: "/coiffeuse/prestations",
      icon: Scissors,
    },
    {
      label: "Disponibilites",
      href: "/coiffeuse/disponibilites",
      icon: Clock,
    },
    {
      label: "Reservations",
      href: "/coiffeuse/reservations",
      icon: Calendar,
    },
    {
      label: "Avis recus",
      href: "/coiffeuse/avis",
      icon: Star,
    },
    {
      label: "Messages",
      href: "/coiffeuse/messages",
      icon: MessageCircle,
      disabled: true, // Phase 7
    },
  ],

  ADMIN: [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Catalogue",
      href: "/admin/catalogue",
      icon: Tags,
    },
    {
      label: "Coiffeuses",
      href: "/admin/coiffeuses",
      icon: Scissors,
    },
    {
      label: "Utilisateurs",
      href: "/admin/utilisateurs",
      icon: Users,
      disabled: true, // Phase 8
    },
  ],
}
