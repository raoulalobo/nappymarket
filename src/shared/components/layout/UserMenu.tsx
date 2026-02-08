/**
 * UserMenu — Menu dropdown de l'utilisateur connecte
 *
 * Role : Afficher un menu contextuel dans le Header avec les infos
 *        de l'utilisateur et les actions disponibles (profil, deconnexion).
 *
 * Interactions :
 *   - Utilise useSession() pour recuperer les infos utilisateur
 *   - Utilise useAuth() pour la deconnexion
 *   - Les liens du menu dependent du role (CLIENT/STYLIST/ADMIN)
 *   - Affiche un avatar avec les initiales si pas de photo
 *   - Affiche un badge avec le role
 *
 * Exemple :
 *   <UserMenu />   // Dans le Header, remplace les boutons connexion/inscription
 */
"use client"

import Link from "next/link"
import { LogOut, User, LayoutDashboard, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "@/modules/auth/hooks/useSession"
import { useAuth } from "@/modules/auth/hooks/useAuth"

/**
 * Extraire les initiales du nom pour l'avatar fallback
 * Ex: "Marie Dupont" -> "MD", "Jean" -> "JE"
 */
function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  const parts = name.split(" ").filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

/**
 * Libelle du role en francais pour l'affichage
 */
function getRoleLabel(role: string | undefined): string {
  switch (role) {
    case "STYLIST":
      return "Coiffeuse"
    case "ADMIN":
      return "Admin"
    case "CLIENT":
    default:
      return "Cliente"
  }
}

/**
 * Liens du dashboard selon le role
 */
function getDashboardLink(role: string | undefined): { href: string; label: string } {
  switch (role) {
    case "STYLIST":
      return { href: "/coiffeuse/dashboard", label: "Mon espace coiffeuse" }
    case "ADMIN":
      return { href: "/admin/dashboard", label: "Administration" }
    case "CLIENT":
    default:
      return { href: "/client", label: "Mon espace" }
  }
}

export function UserMenu() {
  const { user, isPending, isAuthenticated } = useSession()
  const { logout, isLoading: isLoggingOut } = useAuth()

  // Pendant le chargement initial, ne rien afficher
  // (evite le flash des boutons connexion/inscription)
  if (isPending) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
    )
  }

  // Si non connecte, afficher les boutons connexion/inscription
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/connexion">Connexion</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/inscription">Inscription</Link>
        </Button>
      </div>
    )
  }

  // Utilisateur connecte : afficher le menu dropdown
  const dashboardLink = getDashboardLink(user.role)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? "Avatar"}
            />
            <AvatarFallback className="text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* En-tete : nom + email + role */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">
              {getRoleLabel(user.role)}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Lien vers le dashboard selon le role */}
        <DropdownMenuItem asChild>
          <Link href={dashboardLink.href} className="flex items-center gap-2">
            {user.role === "STYLIST" ? (
              <Scissors className="h-4 w-4" />
            ) : (
              <LayoutDashboard className="h-4 w-4" />
            )}
            {dashboardLink.label}
          </Link>
        </DropdownMenuItem>

        {/* Lien vers le profil */}
        <DropdownMenuItem asChild>
          <Link
            href={user.role === "STYLIST" ? "/coiffeuse/profil" : "/client/profil"}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Mon profil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Bouton deconnexion */}
        <DropdownMenuItem
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Deconnexion..." : "Se deconnecter"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
