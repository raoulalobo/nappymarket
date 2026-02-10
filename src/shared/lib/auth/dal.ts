/**
 * dal.ts — Data Access Layer pour l'authentification et l'autorisation
 *
 * Role : Point central de verification de session et de role.
 *        Fournit des fonctions cachees (React.cache) pour eviter les
 *        appels BDD redondants dans un meme render pass.
 *
 * Interactions :
 *   - Utilise getSession() de Better Auth (via get-session.ts)
 *   - Appele dans chaque page protegee (Server Component)
 *   - Redirige automatiquement si non authentifie ou role insuffisant
 *   - Deduplication automatique : si plusieurs composants appellent
 *     verifySession() dans le meme render, un seul appel BDD est fait
 *
 * Pattern officiel Next.js :
 *   Proxy (cookie check) → Page (DAL check) → Donnees
 *   https://nextjs.org/docs/app/guides/authentication
 *
 * Exemple (page admin) :
 *   import { requireRole } from "@/shared/lib/auth/dal"
 *   export default async function AdminPage() {
 *     const session = await requireRole("ADMIN")
 *     // session.user.id, session.user.role, etc.
 *   }
 *
 * Exemple (page client) :
 *   const session = await requireRole("CLIENT")
 *
 * Exemple (verification simple sans role) :
 *   const session = await verifySession()
 */
import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"
import { getSession } from "./get-session"

// Type du role utilisateur (doit correspondre a l'enum Prisma)
type UserRole = "CLIENT" | "STYLIST" | "ADMIN"

/**
 * Mapping role → route de redirection par defaut.
 * Utilise quand un utilisateur connecte accede a un espace
 * qui ne correspond pas a son role.
 *
 * Exemple : un CLIENT accede a /admin/catalogue
 *           → redirige vers /client
 */
const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  CLIENT: "/client",
  STYLIST: "/coiffeuse/dashboard",
  ADMIN: "/admin/dashboard",
}

/**
 * verifySession — Verifie que l'utilisateur est authentifie
 *
 * Role : Recupere la session Better Auth via les cookies HTTP.
 *        Si aucune session valide n'existe, redirige vers /connexion.
 *        Wrappee dans React.cache() pour deduplicquer les appels BDD
 *        au sein d'un meme render pass (Server Component tree).
 *
 * @returns La session complete (user avec id, role, firstName, etc.)
 * @throws Redirect vers /connexion si non authentifie (jamais de retour null)
 */
export const verifySession = cache(async () => {
  const session = await getSession()

  if (!session) {
    redirect("/connexion")
  }

  return session
})

/**
 * requireRole — Verifie l'authentification ET le role de l'utilisateur
 *
 * Role : Appelle verifySession() (beneficie du cache) puis verifie
 *        que le role correspond. Si le role ne correspond pas, redirige
 *        l'utilisateur vers la page d'accueil de son propre espace.
 *
 * @param role - Role requis pour acceder a la page ("CLIENT" | "STYLIST" | "ADMIN")
 * @returns La session complete si le role correspond
 * @throws Redirect vers /connexion si non authentifie
 * @throws Redirect vers l'espace du role reel si role incorrect
 *
 * Exemple :
 *   // Dans une page admin — redirige si non-admin
 *   const session = await requireRole("ADMIN")
 *
 *   // Dans une page coiffeuse — redirige si non-stylist
 *   const session = await requireRole("STYLIST")
 */
export const requireRole = cache(async (role: UserRole) => {
  // verifySession() redirige deja vers /connexion si pas de session
  const session = await verifySession()

  // Verifier que le role correspond
  if (session.user.role !== role) {
    // Rediriger vers l'espace correspondant au role reel de l'utilisateur
    const userRole = session.user.role as UserRole
    redirect(ROLE_HOME_ROUTES[userRole] ?? "/connexion")
  }

  return session
})
