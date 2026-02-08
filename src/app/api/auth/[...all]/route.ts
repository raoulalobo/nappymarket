/**
 * /api/auth/[...all] — Route handler catch-all Better Auth
 *
 * Role : Gerer toutes les requetes d'authentification Better Auth.
 *        Ce route handler intercepte les chemins /api/auth/* et les
 *        transmet a Better Auth pour traitement.
 *
 * Interactions :
 *   - POST /api/auth/sign-up/email : inscription par email
 *   - POST /api/auth/sign-in/email : connexion par email
 *   - POST /api/auth/sign-out : deconnexion
 *   - GET  /api/auth/get-session : recuperer la session
 *   - Tous les autres endpoints Better Auth (verify, reset, etc.)
 *
 * Exemple :
 *   Le client Better Auth (auth-client.ts) appelle ces endpoints
 *   automatiquement via signUp.email(), signIn.email(), signOut()
 */
import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/shared/lib/auth/auth"

export const { GET, POST } = toNextJsHandler(auth)
