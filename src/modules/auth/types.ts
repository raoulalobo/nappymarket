/**
 * Module Auth — Types TypeScript
 *
 * Role : Definir les types pour l'authentification et les sessions.
 *
 * Interactions :
 *   - Utilise par les composants, hooks et actions du module auth
 *   - Les types de session sont derives de Better Auth
 *   - Le type Role correspond a l'enum Prisma
 *
 * Exemple :
 *   import type { AuthUser, UserRole } from "@/modules/auth/types"
 */

/** Roles utilisateur disponibles sur la plateforme */
export type UserRole = "CLIENT" | "STYLIST" | "ADMIN"

/**
 * Utilisateur authentifie avec ses champs additionnels
 * Represente les donnees disponibles dans la session Better Auth
 */
export interface AuthUser {
  id: string
  email: string
  name: string
  image: string | null
  firstName: string | null
  lastName: string | null
  role: UserRole
  phone: string | null
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Session utilisateur retournee par Better Auth
 * Contient les infos user + les metadonnees de session
 */
export interface AuthSession {
  user: AuthUser
  session: {
    id: string
    expiresAt: Date
    token: string
    userId: string
    ipAddress: string | null
    userAgent: string | null
  }
}

/** Donnees du formulaire d'inscription */
export interface RegisterFormData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
}

/** Donnees du formulaire de connexion */
export interface LoginFormData {
  email: string
  password: string
}
