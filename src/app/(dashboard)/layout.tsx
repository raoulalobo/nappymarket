/**
 * DashboardLayout — Layout des espaces proteges (client, coiffeuse, admin)
 *
 * Role : Fournir le layout commun aux pages qui necessitent une
 *        authentification. Verifie la session cote serveur et redirige
 *        vers /connexion si l'utilisateur n'est pas connecte.
 *        Affiche une sidebar de navigation a gauche (desktop) et le
 *        hamburger dashboard dans le Header sticky (mobile).
 *
 * Interactions :
 *   - Enveloppe toutes les pages sous /(dashboard)/*
 *   - Utilise getSession() pour verifier l'authentification cote serveur
 *   - Le Header recoit le MobileSidebar via le prop `mobileNav`
 *     pour integrer le hamburger dashboard dans la navbar sticky
 *   - DashboardSidebar : sidebar fixe a gauche (visible md+)
 *   - Le middleware a deja verifie la presence du cookie de session,
 *     ce layout fait la verification complete (validite de la session)
 *
 * Structure :
 *   ┌────────────────────────────────────┐
 *   │ Header [☰ dashboard] (sticky)     │
 *   ├──────────┬─────────────────────────┤
 *   │ Sidebar  │                         │
 *   │ (desktop)│  {children}             │
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
      {/* Header fixed toujours visible au scroll */}
      <Header mobileNav={<MobileSidebar />} />
      {/* Spacer : compense la hauteur du header fixed (h-16 = 64px) */}
      <div className="h-16" />

      {/* Zone centrale : sidebar desktop + contenu */}
      <div className="flex flex-1">
        {/* Sidebar fixe a gauche — visible uniquement sur desktop (md+) */}
        <DashboardSidebar />

        {/* Contenu principal */}
        <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
      </div>

      {/* Footer en bas, full width */}
      <Footer />
    </div>
  )
}
