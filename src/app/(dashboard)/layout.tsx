/**
 * DashboardLayout — Layout des espaces proteges (client, coiffeuse, admin)
 *
 * Role : Fournir le layout commun aux pages qui necessitent une
 *        authentification. Verifie la session cote serveur et redirige
 *        vers /connexion si l'utilisateur n'est pas connecte.
 *        Affiche une sidebar de navigation a gauche (desktop) et un
 *        drawer mobile (bouton hamburger).
 *
 * Interactions :
 *   - Enveloppe toutes les pages sous /(dashboard)/*
 *   - Utilise getSession() pour verifier l'authentification cote serveur
 *   - Le Header est affiche en haut (full width)
 *   - DashboardSidebar : sidebar fixe a gauche (visible md+)
 *   - MobileSidebar : bouton hamburger + drawer Sheet (visible <md)
 *   - Le middleware a deja verifie la presence du cookie de session,
 *     ce layout fait la verification complete (validite de la session)
 *
 * Structure :
 *   ┌────────────────────────────────────┐
 *   │ Header (full width)               │
 *   ├──────────┬─────────────────────────┤
 *   │ Sidebar  │ MobileSidebar (hamburger│
 *   │ (desktop)│  + drawer en mobile)    │
 *   │          │                         │
 *   │          │  {children}             │
 *   │          │                         │
 *   ├──────────┴─────────────────────────┤
 *   │ Footer (full width)               │
 *   └────────────────────────────────────┘
 */
import { redirect } from "next/navigation"
import { Header } from "@/shared/components/layout/Header"
import { Footer } from "@/shared/components/layout/Footer"
import { DashboardSidebar } from "@/shared/components/layout/DashboardSidebar"
import { MobileSidebar } from "@/shared/components/layout/MobileSidebar"
import { getSession } from "@/shared/lib/auth/get-session"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verification complete de la session cote serveur
  const session = await getSession()

  // Si la session n'est pas valide (cookie expire, token invalide),
  // rediriger vers la page de connexion
  if (!session) {
    redirect("/connexion")
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header en haut, full width */}
      <Header />

      {/* Zone centrale : sidebar desktop + contenu + hamburger mobile */}
      <div className="flex flex-1">
        {/* Sidebar fixe a gauche — visible uniquement sur desktop (md+) */}
        <DashboardSidebar />

        {/* Contenu principal + bouton hamburger mobile en haut */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Barre mobile avec bouton hamburger — visible uniquement en mobile (<md) */}
          <div className="flex items-center border-b px-4 py-2 md:hidden">
            <MobileSidebar />
            <span className="ml-2 text-sm font-medium text-muted-foreground">
              Menu
            </span>
          </div>

          {/* Contenu de la page */}
          <main className="flex-1">{children}</main>
        </div>
      </div>

      {/* Footer en bas, full width */}
      <Footer />
    </div>
  )
}
