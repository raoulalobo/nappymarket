/**
 * Page Reservation — /coiffeuse/[id]/reserver
 *
 * Role : Afficher le flow de reservation multi-etapes pour reserver
 *        chez une coiffeuse. Page sous le layout public (Header + Footer)
 *        mais protegee par middleware (session requise).
 *
 * Interactions :
 *   - Recoit l'ID du StylistProfile via les params dynamiques Next.js 16
 *   - Charge le profil, les services et le profil client depuis la BDD
 *   - Delege l'affichage au composant BookingFlow (client)
 *   - Redirige vers /connexion si pas de session (via middleware)
 *   - Redirige vers la page profil si pas de services configures
 *
 * Exemple d'URL : /coiffeuse/clxyz123abc/reserver
 */
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { db } from "@/shared/lib/db"
import { getSession } from "@/shared/lib/auth/get-session"
import { Header } from "@/shared/components/layout/Header"
import { Footer } from "@/shared/components/layout/Footer"
import { BookingFlow } from "@/modules/booking/components/BookingFlow"

/* ------------------------------------------------------------------ */
/* Types des props (Next.js 16 : params est une Promise)              */
/* ------------------------------------------------------------------ */

interface ReserverPageProps {
  params: Promise<{ id: string }>
}

/* ------------------------------------------------------------------ */
/* Fonctions de chargement BDD                                         */
/* ------------------------------------------------------------------ */

/**
 * Charger le profil coiffeuse avec ses services pour le flow de reservation.
 * Retourne null si le profil n'existe pas ou est inactif.
 */
async function getStylistForBooking(profileId: string) {
  return db.stylistProfile.findUnique({
    where: { id: profileId, isActive: true },
    include: {
      user: {
        select: {
          name: true,
          firstName: true,
          lastName: true,
        },
      },
      services: {
        include: { category: true },
        orderBy: { category: { name: "asc" } },
      },
    },
  })
}

/**
 * Charger le profil client pour pre-remplir l'adresse.
 * Retourne null si le profil n'existe pas.
 */
async function getClientProfile(userId: string) {
  return db.clientProfile.findUnique({
    where: { userId },
    select: { address: true, city: true },
  })
}

/* ------------------------------------------------------------------ */
/* Metadata                                                            */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: ReserverPageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getStylistForBooking(id)

  if (!profile) return { title: "Coiffeuse introuvable" }

  const name =
    profile.user.firstName && profile.user.lastName
      ? `${profile.user.firstName} ${profile.user.lastName}`
      : profile.user.name

  return { title: `Reserver chez ${name}` }
}

/* ------------------------------------------------------------------ */
/* Composant Page (Server Component)                                   */
/* ------------------------------------------------------------------ */

export default async function ReserverPage({ params }: ReserverPageProps) {
  const { id } = await params

  // Verifier la session (normalement deja fait par le middleware)
  const session = await getSession()
  if (!session) {
    redirect(`/connexion?callbackUrl=/coiffeuse/${id}/reserver`)
  }

  // Seules les clientes peuvent reserver
  if (session.user.role !== "CLIENT") {
    redirect(`/coiffeuse/${id}`)
  }

  // Charger le profil coiffeuse
  const profile = await getStylistForBooking(id)
  if (!profile) notFound()

  // Si aucun service configure, rediriger vers le profil
  if (profile.services.length === 0) {
    redirect(`/coiffeuse/${id}`)
  }

  // Charger le profil client pour pre-remplir l'adresse
  const clientProfile = await getClientProfile(session.user.id)

  // Nom affiche de la coiffeuse
  const stylistName =
    profile.user.firstName && profile.user.lastName
      ? `${profile.user.firstName} ${profile.user.lastName}`
      : profile.user.name

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
          {/* Lien retour vers le profil */}
          <Link
            href={`/coiffeuse/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au profil de {stylistName}
          </Link>

          {/* Titre */}
          <h1 className="text-2xl font-bold text-center">
            Reserver chez {stylistName}
          </h1>

          {/* Flow de reservation multi-etapes */}
          <BookingFlow
            stylistId={id}
            stylistName={stylistName}
            services={profile.services}
            defaultAddress={clientProfile?.address ?? undefined}
            defaultCity={clientProfile?.city ?? undefined}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
