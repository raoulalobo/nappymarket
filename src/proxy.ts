/**
 * proxy.ts — Proxy Next.js 16 pour la protection des routes (couche optimiste)
 *
 * Role : Premiere barriere de securite. Intercepte les requetes vers les
 *        routes protegees et verifie la PRESENCE du cookie de session.
 *        Redirige vers /connexion si le cookie est absent.
 *
 * Interactions :
 *   - S'execute avant chaque requete correspondant au matcher
 *   - Verifie uniquement la presence du cookie (pas d'appel BDD)
 *   - La verification complete (session valide + role) se fait dans
 *     les pages via le DAL (dal.ts → requireRole / verifySession)
 *   - Les routes publiques (/, /recherche, /coiffeuse/[id]) ne sont pas concernees
 *
 * Architecture de protection (2 couches) :
 *   Couche 1 → proxy.ts   : check cookie (rapide, pas de BDD)
 *   Couche 2 → dal.ts     : check session + role (BDD, dans chaque page)
 *
 * Routes protegees :
 *   - /client/*     : espace cliente (role CLIENT)
 *   - /coiffeuse/*  : espace coiffeuse (role STYLIST) — sauf profil public
 *   - /admin/*      : espace admin (role ADMIN)
 *
 * Migration Next.js 16 :
 *   middleware.ts → proxy.ts (renommage officiel)
 *   https://nextjs.org/docs/messages/middleware-to-proxy
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

export function proxy(request: NextRequest) {
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
  // se fait dans les pages via le DAL — requireRole())
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
    // Flow de reservation (route publique mais protegee — session requise)
    "/coiffeuse/:id/reserver",
    // Espace admin
    "/admin/:path*",
  ],
}
