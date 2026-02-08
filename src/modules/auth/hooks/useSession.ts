/**
 * useSession — Hook TanStack Query pour la session utilisateur
 *
 * Role : Fournir l'etat de la session de maniere reactive.
 *        Utilise Better Auth useSession() en interne et l'expose
 *        avec une interface coherente pour les composants.
 *
 * Interactions :
 *   - Appelle Better Auth client pour recuperer la session
 *   - La session est automatiquement rafraichie par Better Auth
 *   - Utilise dans le Header (UserMenu), les pages protegees, etc.
 *
 * Exemple :
 *   const { user, isLoading, isAuthenticated } = useSession()
 *   if (isLoading) return <Skeleton />
 *   if (!isAuthenticated) redirect("/connexion")
 *   console.log(user.role) // "CLIENT" | "STYLIST" | "ADMIN"
 */
"use client"

import { authClient } from "@/shared/lib/auth/auth-client"
import type { UserRole } from "@/modules/auth/types"

export function useSession() {
  const { data: session, isPending, error } = authClient.useSession()

  return {
    /** Session complete (user + session metadata) */
    session,
    /** Donnees utilisateur (null si non connecte) */
    user: session?.user as (typeof session extends null ? null : {
      id: string
      email: string
      name: string
      image: string | null
      role: UserRole
      firstName: string | null
      lastName: string | null
    }) | null,
    /** true pendant le chargement initial de la session */
    isPending,
    /** true si l'utilisateur est connecte */
    isAuthenticated: !!session?.user,
    /** Erreur eventuelle lors de la recuperation */
    error,
  }
}
