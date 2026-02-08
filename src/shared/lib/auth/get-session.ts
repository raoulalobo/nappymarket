/**
 * get-session.ts — Helper serveur pour recuperer la session
 *
 * Role : Fournir une fonction utilitaire pour recuperer la session
 *        Better Auth dans les Server Components, Server Actions et
 *        Route Handlers.
 *
 * Interactions :
 *   - Utilise auth.api.getSession() de Better Auth
 *   - Lit les headers de la requete (cookie de session)
 *   - Retourne la session avec les champs additionnels (role, etc.)
 *   - Retourne null si l'utilisateur n'est pas connecte
 *
 * Exemple (Server Component) :
 *   import { getSession } from "@/shared/lib/auth/get-session"
 *   const session = await getSession()
 *   if (!session) redirect("/connexion")
 *   console.log(session.user.role) // "CLIENT" | "STYLIST" | "ADMIN"
 *
 * Exemple (Server Action) :
 *   const session = await getSession()
 *   if (!session) return { success: false, error: "Non authentifie" }
 */
import { headers } from "next/headers"
import { auth } from "./auth"

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session
}
