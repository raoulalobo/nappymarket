/**
 * Page Profil Public Coiffeuse — /coiffeuse/[id]
 *
 * Role : Afficher le profil public d'une coiffeuse avec ses prestations
 *        et son portfolio. Accessible a tous (pas besoin de session).
 *        Cette page est un Server Component qui fetch directement avec Prisma.
 *
 * Interactions :
 *   - Recoit l'ID du StylistProfile via les params dynamiques Next.js 16
 *   - Charge le profil, les services et le portfolio depuis la BDD
 *   - Affiche notFound() si le profil n'existe pas ou est inactif
 *   - Utilise formatPrice() pour afficher les prix en euros
 *   - Utilise next/image pour les photos du portfolio et l'avatar
 *   - generateMetadata() genere le titre dynamique "Profil de [Nom]"
 *
 * Exemple d'URL : /coiffeuse/clxyz123abc (ou clxyz123abc est l'ID du StylistProfile)
 *
 * Sections affichees :
 *   1. Header : photo, nom, ville, badge verifie, bio
 *   2. Prestations : grille de services avec prix et duree
 *   3. Portfolio : grille responsive de photos
 */
import { notFound } from "next/navigation"
import Image from "next/image"
import type { Metadata } from "next"
import { db } from "@/shared/lib/db"
import { formatPrice } from "@/shared/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/* ------------------------------------------------------------------ */
/* Types des props (Next.js 16 : params est une Promise)              */
/* ------------------------------------------------------------------ */

/**
 * Next.js 16 App Router : les params dynamiques sont asynchrones.
 * Il faut les awaiter avant de les utiliser.
 *
 * Exemple : const { id } = await params
 */
interface StylistPageProps {
  params: Promise<{ id: string }>
}

/* ------------------------------------------------------------------ */
/* Fonction utilitaire : formatage de la duree                        */
/* ------------------------------------------------------------------ */

/**
 * formatDuration — Convertir une duree en minutes en format lisible
 *
 * Si la duree est inferieure a 60 minutes, afficher "XX min".
 * Sinon, afficher "Xh" ou "XhYY" selon les minutes restantes.
 *
 * Exemples :
 *   formatDuration(45)  // "45 min"
 *   formatDuration(60)  // "1h"
 *   formatDuration(90)  // "1h30"
 *   formatDuration(150) // "2h30"
 *   formatDuration(120) // "2h"
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  // Si les minutes restantes sont 0, afficher uniquement les heures
  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  // Sinon, afficher heures + minutes (ex: "2h30")
  return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`
}

/* ------------------------------------------------------------------ */
/* Fonction pour charger le profil coiffeuse depuis la BDD            */
/* ------------------------------------------------------------------ */

/**
 * Charger le StylistProfile par son ID (pas userId, l'ID du profil).
 * Inclut les relations necessaires a l'affichage :
 *   - user : nom, prenom, image pour le header
 *   - portfolio : photos triees par date (les plus recentes en premier)
 *   - services : prestations triees par categorie, avec le nom de la categorie
 *
 * @param profileId - L'ID cuid du StylistProfile (ex: "clxyz123abc")
 * @returns Le profil complet ou null si introuvable
 */
async function getStylistProfileById(profileId: string) {
  return db.stylistProfile.findUnique({
    where: { id: profileId },
    include: {
      // Donnees utilisateur pour le header (nom, photo)
      user: {
        select: {
          name: true,
          image: true,
          firstName: true,
          lastName: true,
        },
      },
      // Photos du portfolio triees par date decroissante
      portfolio: {
        orderBy: { createdAt: "desc" },
      },
      // Services avec leur categorie, tries par nom de categorie
      services: {
        include: {
          category: true,
        },
        orderBy: {
          category: { name: "asc" },
        },
      },
    },
  })
}

/* ------------------------------------------------------------------ */
/* generateMetadata — Titre dynamique pour le SEO                     */
/* ------------------------------------------------------------------ */

/**
 * Generer les metadata dynamiques pour cette page.
 * Le titre affiche "Profil de [Prenom Nom]" dans l'onglet du navigateur.
 *
 * Exemple :
 *   URL /coiffeuse/clxyz123 -> titre "Profil de Marie Dupont"
 *   Si profil introuvable -> titre "Profil introuvable"
 */
export async function generateMetadata({
  params,
}: StylistPageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getStylistProfileById(id)

  if (!profile) {
    return { title: "Profil introuvable" }
  }

  // Construire le nom complet a partir du prenom et nom (ou du champ name)
  const displayName =
    profile.user.firstName && profile.user.lastName
      ? `${profile.user.firstName} ${profile.user.lastName}`
      : profile.user.name

  return {
    title: `Profil de ${displayName}`,
  }
}

/* ------------------------------------------------------------------ */
/* Composant Page (Server Component)                                  */
/* ------------------------------------------------------------------ */

/**
 * StylistPublicPage — Page publique du profil d'une coiffeuse
 *
 * Affiche le header avec les informations principales, la liste
 * des prestations proposees et le portfolio de photos.
 * Si le profil n'existe pas ou est inactif, renvoie vers la page 404.
 */
export default async function StylistPublicPage({ params }: StylistPageProps) {
  // Awaiter les params (Next.js 16 async params)
  const { id } = await params

  // Charger le profil complet depuis la BDD
  const profile = await getStylistProfileById(id)

  // Si le profil n'existe pas ou est desactive -> page 404
  if (!profile || !profile.isActive) {
    notFound()
  }

  // Construire le nom affiche (prenom + nom si disponibles, sinon name)
  const displayName =
    profile.user.firstName && profile.user.lastName
      ? `${profile.user.firstName} ${profile.user.lastName}`
      : profile.user.name

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* ============================================================ */}
      {/* SECTION HEADER : photo, nom, ville, badge verifie, bio       */}
      {/* ============================================================ */}
      <section className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Photo de profil (ou avatar par defaut) */}
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-muted">
          {profile.user.image ? (
            <Image
              src={profile.user.image}
              alt={`Photo de profil de ${displayName}`}
              fill
              className="object-cover"
              sizes="128px"
              priority
            />
          ) : (
            /**
             * Avatar par defaut : affiche les initiales du nom.
             * Exemple : "Marie Dupont" -> "MD"
             */
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-3xl font-semibold text-primary">
              {displayName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          )}
        </div>

        {/* Informations textuelles */}
        <div className="text-center sm:text-left">
          {/* Nom + badge verifie */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {profile.isVerified && (
              <Badge variant="secondary">Verifie</Badge>
            )}
          </div>

          {/* Ville */}
          <p className="mt-1 text-muted-foreground">{profile.city}</p>

          {/* Bio (si renseignee) */}
          {profile.bio && (
            <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION PRESTATIONS : liste des services proposes            */}
      {/* ============================================================ */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Prestations</h2>

        {profile.services.length === 0 ? (
          /**
           * Message si aucune prestation n'est configuree.
           * La coiffeuse doit ajouter des services depuis son dashboard.
           */
          <p className="text-muted-foreground">Aucune prestation disponible.</p>
        ) : (
          /**
           * Grille responsive de cartes de services.
           * Chaque carte affiche : nom de la categorie, prix, duree, description.
           * Layout : 1 colonne mobile, 2 tablette, 3 desktop
           */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.services.map((service) => (
              <Card key={service.id}>
                <CardHeader className="pb-2">
                  {/* Nom de la categorie (ex: "Tresses", "Locks") */}
                  <CardTitle className="text-base">
                    {service.category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Prix et duree sur la meme ligne */}
                  <div className="flex items-center justify-between">
                    {/* Prix formate depuis les centimes (ex: 4500 -> "45,00 EUR") */}
                    <span className="text-lg font-semibold text-primary">
                      {formatPrice(service.price)}
                    </span>
                    {/* Duree formatee (ex: 150 -> "2h30", 45 -> "45 min") */}
                    <span className="text-sm text-muted-foreground">
                      {formatDuration(service.durationMinutes)}
                    </span>
                  </div>

                  {/* Description du service (si renseignee) */}
                  {service.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* SECTION PORTFOLIO : grille de photos                         */}
      {/* ============================================================ */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Portfolio</h2>

        {profile.portfolio.length === 0 ? (
          /**
           * Message si aucune photo n'a ete ajoutee au portfolio.
           * La coiffeuse peut ajouter des photos depuis son dashboard.
           */
          <p className="text-muted-foreground">Aucune photo dans le portfolio.</p>
        ) : (
          /**
           * Grille responsive de photos du portfolio.
           * Layout adaptatif :
           *   - Mobile : 2 colonnes
           *   - Tablette : 3 colonnes
           *   - Desktop : 4 colonnes
           * Chaque image a un ratio carre (aspect-square) pour un rendu uniforme.
           */
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {profile.portfolio.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                {/* Image optimisee via next/image */}
                <Image
                  src={image.url}
                  alt={image.caption ?? `Photo du portfolio de ${displayName}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* Legende de la photo (si renseignee), affichee en overlay au survol */}
                {image.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="text-xs text-white line-clamp-2">
                      {image.caption}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
