/**
 * auth-client.ts — Client Better Auth pour le navigateur
 *
 * Role : Fournir les fonctions d'authentification cote client
 *        (signUp, signIn, signOut, useSession).
 *
 * Interactions :
 *   - Communique avec le route handler /api/auth/[...all]
 *   - useSession() retourne la session active (reactive)
 *   - signUp.email() / signIn.email() / signOut() pour les mutations
 *   - inferAdditionalFields() permet au client de connaitre les champs
 *     additionnels (role, firstName, lastName) pour le typage TypeScript
 *   - Utilise dans les composants "use client" (LoginForm, RegisterForm, UserMenu)
 *
 * Exemple :
 *   import { authClient } from "@/shared/lib/auth/auth-client"
 *   const { data: session } = authClient.useSession()
 *   await authClient.signIn.email({ email, password })
 */
import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "./auth"

export const authClient = createAuthClient({
  // URL de base pour les requetes API auth
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  // Plugin pour inferer les champs additionnels du serveur (role, firstName, etc.)
  // Permet au client de connaitre les types des champs custom sur User
  plugins: [inferAdditionalFields<typeof auth>()],
})
