/**
 * PublicLayout — Layout des pages publiques (accueil, recherche, profils, inspirations)
 *
 * Role : Fournir la structure commune aux pages publiques avec le Header
 *        sticky et le Footer. Centralise la navigation pour eviter la
 *        repetition dans chaque page et garantir un comportement sticky
 *        consistant du Header.
 *
 * Interactions :
 *   - Enveloppe toutes les pages sous /(public)/*
 *   - Le Header sticky (top-0 z-50) reste toujours visible au scroll
 *   - Le Footer est pousse en bas grace a flex + min-h-screen
 *   - Pas de verification d'authentification (pages publiques)
 *
 * Structure :
 *   ┌────────────────────────────────────┐
 *   │ Header (sticky top-0)             │
 *   ├────────────────────────────────────┤
 *   │                                    │
 *   │  {children} (contenu de la page)  │
 *   │                                    │
 *   ├────────────────────────────────────┤
 *   │ Footer                            │
 *   └────────────────────────────────────┘
 */
import { Header } from "@/shared/components/layout/Header"
import { Footer } from "@/shared/components/layout/Footer"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header sticky avec hamburger public par defaut */}
      <Header />

      {/* Contenu de la page — flex-1 pousse le footer en bas */}
      <main className="flex-1">{children}</main>

      {/* Footer en bas */}
      <Footer />
    </div>
  )
}
