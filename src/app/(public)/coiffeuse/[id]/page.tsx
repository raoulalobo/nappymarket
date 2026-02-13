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
 *   - Entoure le contenu avec Header + Footer pour la navigation
 *
 * Exemple d'URL : /coiffeuse/clxyz123abc (ou clxyz123abc est l'ID du StylistProfile)
 *
 * Sections affichees :
 *   1. Lien retour vers /recherche
 *   2. Hero : photo agrandie, nom, ville, badge verifie, bio, bouton Reserver
 *   3. Prestations : grille de services avec badge categorie, prix et duree
 *   4. Portfolio : grille responsive de photos avec hover zoom
 */
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { MapPin, ArrowLeft, Clock, Scissors } from "lucide-react"
import { db } from "@/shared/lib/db"
import { formatPrice } from "@/shared/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { AverageRating } from "@/modules/review/components/AverageRating"
import { TopRatedBadge } from "@/modules/review/components/TopRatedBadge"
import { ReviewList } from "@/modules/review/components/ReviewList"

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
 * Affiche le Header, un lien de retour, la section hero avec les
 * informations principales, la liste des prestations, le portfolio
 * de photos, puis le Footer. Responsive mobile-first.
 *
 * Si le profil n'existe pas ou est inactif, renvoie vers la page 404.
 */
export default async function StylistPublicPage({ params }: StylistPageProps) {
  // Awaiter les params (Next.js 16 async params)
  const { id } = await params

  // Charger le profil complet et la note moyenne en parallele
  const [profile, ratingAgg] = await Promise.all([
    getStylistProfileById(id),
    db.review.aggregate({
      where: { stylistId: id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ])

  // Si le profil n'existe pas ou est desactive -> page 404
  if (!profile || !profile.isActive) {
    notFound()
  }

  // Note moyenne arrondie a 1 decimale + nombre d'avis
  const averageRating = ratingAgg._avg.rating
    ? Math.round(ratingAgg._avg.rating * 10) / 10
    : null
  const reviewCount = ratingAgg._count._all

  // Construire le nom affiche (prenom + nom si disponibles, sinon name)
  const displayName =
    profile.user.firstName && profile.user.lastName
      ? `${profile.user.firstName} ${profile.user.lastName}`
      : profile.user.name

  // Initiales pour l'avatar par defaut (ex: "Marie Dupont" -> "MD")
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">
          {/* ============================================================ */}
          {/* LIEN RETOUR vers la page de recherche                        */}
          {/* ============================================================ */}
          <Link
            href="/recherche"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour a la recherche
          </Link>

          {/* ============================================================ */}
          {/* SECTION HERO : avatar, nom, ville, badge, bio, CTA           */}
          {/* ============================================================ */}
          <section className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar agrandi (160px) avec ring decoratif */}
            <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-full bg-muted ring-4 ring-primary/20">
              {profile.user.image ? (
                <Image
                  src={profile.user.image}
                  alt={`Photo de profil de ${displayName}`}
                  fill
                  className="object-cover"
                  sizes="160px"
                  priority
                />
              ) : (
                /**
                 * Avatar par defaut : affiche les initiales du nom
                 * dans un cercle colore. Fond primary/10, texte primary.
                 */
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-semibold text-primary">
                  {initials}
                </div>
              )}
            </div>

            {/* Informations textuelles + CTA */}
            <div className="flex-1 text-center sm:text-left">
              {/* Nom + badge verifie */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-3xl font-bold">{displayName}</h1>
                {profile.isVerified && (
                  <Badge variant="secondary">Verifiee</Badge>
                )}
                <TopRatedBadge averageRating={averageRating} reviewCount={reviewCount} />
              </div>

              {/* Ville avec icone MapPin */}
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-muted-foreground sm:justify-start">
                <MapPin className="h-4 w-4" />
                {profile.city}
              </p>

              {/* Note moyenne detaillee (visible si au moins 1 avis) */}
              <AverageRating
                averageRating={averageRating}
                reviewCount={reviewCount}
                className="mt-2 justify-center sm:justify-start"
              />

              {/* Bio (si renseignee) dans un bloc avec bordure gauche */}
              {profile.bio && (
                <p className="mt-4 max-w-2xl whitespace-pre-line border-l-2 border-primary/30 pl-4 text-sm leading-relaxed text-muted-foreground">
                  {profile.bio}
                </p>
              )}

              {/* Bouton CTA Reserver — redirige vers le flow de reservation */}
              <div className="mt-6">
                <Button asChild size="lg">
                  <Link href={`/coiffeuse/${id}/reserver`}>
                    <Scissors className="mr-2 h-4 w-4" />
                    Reserver une prestation
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION PRESTATIONS : liste des services proposes            */}
          {/* ============================================================ */}
          <section>
            {/* Titre avec separateur visuel */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Prestations</h2>
              <Separator className="flex-1" />
            </div>

            {profile.services.length === 0 ? (
              /**
               * Message si aucune prestation n'est configuree.
               * La coiffeuse doit ajouter des services depuis son dashboard.
               */
              <p className="mt-4 text-muted-foreground">
                Aucune prestation disponible.
              </p>
            ) : (
              /**
               * Grille responsive de cartes de services.
               * Chaque carte affiche : badge categorie, prix en primary,
               * duree en badge outline, description en muted.
               * Layout : 1 colonne mobile, 2 tablette, 3 desktop
               */
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profile.services.map((service) => (
                  <Card key={service.id} className="flex flex-col">
                    <CardHeader className="pb-2">
                      {/* Badge categorie en haut de la carte */}
                      <Badge variant="secondary" className="w-fit">
                        {service.category.name}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col">
                      {/* Prix et duree */}
                      <div className="flex items-center justify-between">
                        {/* Prix formate depuis les centimes (ex: 4500 -> "45,00 EUR") */}
                        <span className="text-lg font-semibold text-primary">
                          {formatPrice(service.price)}
                        </span>
                        {/* Duree formatee en badge outline (ex: "2h30") */}
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(service.durationMinutes)}
                        </Badge>
                      </div>

                      {/* Description du service (si renseignee) */}
                      {service.description && (
                        <p className="mt-3 flex-1 text-sm text-muted-foreground">
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
            {/* Titre avec compteur de photos + separateur */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">
                Portfolio
                {profile.portfolio.length > 0 && (
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    ({profile.portfolio.length} photo{profile.portfolio.length > 1 ? "s" : ""})
                  </span>
                )}
              </h2>
              <Separator className="flex-1" />
            </div>

            {profile.portfolio.length === 0 ? (
              /**
               * Message si aucune photo n'a ete ajoutee au portfolio.
               * La coiffeuse peut ajouter des photos depuis son dashboard.
               */
              <p className="mt-4 text-muted-foreground">
                Aucune photo dans le portfolio.
              </p>
            ) : (
              /**
               * Grille responsive de photos du portfolio.
               * Layout adaptatif :
               *   - Mobile : 2 colonnes
               *   - Tablette : 3 colonnes
               *   - Desktop : 4 colonnes
               * Chaque image a un ratio carre (aspect-square) pour un rendu uniforme.
               * Hover : zoom leger + affichage de la legende en overlay.
               */
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

          {/* ============================================================ */}
          {/* SECTION AVIS : note moyenne + liste paginee                  */}
          {/* ============================================================ */}
          <section>
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">
                Avis
                {reviewCount > 0 && (
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    ({reviewCount})
                  </span>
                )}
              </h2>
              <Separator className="flex-1" />
            </div>

            <div className="mt-6">
              <ReviewList stylistId={id} />
            </div>
          </section>
    </div>
  )
}
