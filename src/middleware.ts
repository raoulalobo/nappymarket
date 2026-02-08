/**
 * middleware.ts — Middleware Next.js pour la protection des routes
 *
 * Role : Intercepter les requetes vers les routes protegees et verifier
 *        que l'utilisateur est authentifie. Redirige vers /connexion si
 *        la session est absente.
 *
 * Interactions :
 *   - S'execute avant chaque requete correspondant au matcher
 *   - Verifie la presence du cookie de session Better Auth
 *   - NE verifie PAS le role ici (fait dans les layouts de chaque espace)
 *     pour eviter les appels BDD dans le middleware Edge
 *   - Les routes publiques (/, /recherche, /coiffeuse/[id]) ne sont pas protegees
 *
 * Routes protegees :
 *   - /client/*     : espace cliente (role CLIENT)
 *   - /coiffeuse/*  : espace coiffeuse (role STYLIST) — sauf profil public
 *   - /admin/*      : espace admin (role ADMIN)
 *
 * Note : La verification du role se fait dans les layouts des espaces
 *        respectifs via getSession() (Server Component), car le middleware
 *        Edge ne peut pas faire d'appels BDD fiables.
 */
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Noms possibles du cookie de session Better Auth
 * - En HTTP (dev local) : "better-auth.session_token"
 * - En HTTPS (production Vercel) : "__Secure-better-auth.session_token"
 * Better Auth ajoute le prefixe __Secure- automatiquement sur HTTPS
 */
const SESSION_COOKIE_NAME = "better-auth.session_token"
const SECURE_SESSION_COOKIE_NAME = "__Secure-better-auth.session_token"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verifier la presence du cookie de session (HTTP ou HTTPS)
  const sessionToken =
    request.cookies.get(SECURE_SESSION_COOKIE_NAME) ??
    request.cookies.get(SESSION_COOKIE_NAME)

  // Si pas de session, rediriger vers /connexion avec l'URL de retour
  if (!sessionToken) {
    const connectUrl = new URL("/connexion", request.url)
    // Sauvegarder l'URL demandee pour rediriger apres connexion
    connectUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(connectUrl)
  }

  // Session presente : laisser passer (la verification du role
  // se fait dans les layouts de chaque espace)
  return NextResponse.next()
}

// Matcher : uniquement les routes protegees
// Exclut les routes publiques, les assets et les API
export const config = {
  matcher: [
    // Espace cliente
    "/client/:path*",
    // Espace coiffeuse (dashboard, disponibilites, etc.)
    // Note : /coiffeuse/[id] (profil public) est gere par le group (public)
    "/coiffeuse/dashboard/:path*",
    "/coiffeuse/disponibilites/:path*",
    "/coiffeuse/prestations/:path*",
    "/coiffeuse/portfolio/:path*",
    "/coiffeuse/reservations/:path*",
    "/coiffeuse/messages/:path*",
    "/coiffeuse/profil/:path*",
    // Espace admin
    "/admin/:path*",
  ],
}
