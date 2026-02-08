/**
 * DashboardLayout — Layout des espaces proteges (client, coiffeuse, admin)
 *
 * Role : Fournir le layout commun aux pages qui necessitent une
 *        authentification. Verifie la session cote serveur et redirige
 *        vers /connexion si l'utilisateur n'est pas connecte.
 *
 * Interactions :
 *   - Enveloppe toutes les pages sous /(dashboard)/*
 *   - Utilise getSession() pour verifier l'authentification cote serveur
 *   - Le Header est affiche avec le UserMenu (bouton deconnexion)
 *   - Le middleware a deja verifie la presence du cookie de session,
 *     ce layout fait la verification complete (validite de la session)
 */
import { redirect } from "next/navigation"
import { Header } from "@/shared/components/layout/Header"
import { Footer } from "@/shared/components/layout/Footer"
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
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
