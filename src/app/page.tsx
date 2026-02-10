/**
 * Page d'accueil — NappyMarket
 *
 * Role : Landing page avec hero section "Bento Grid" (grille d'images
 *        en fond avec une carte frosted glass au centre contenant le
 *        titre, la SearchBar et les badges de confiance), suivie d'une
 *        grille de categories de coiffures.
 *
 * Rotation curatee : a chaque chargement, 6 images sont selectionnees
 *        aleatoirement depuis un pool de ~20 images curatees (luminosite,
 *        sujet feminin, fond adapte). La page est deja dynamique (appel
 *        BDD pour les categories), donc pas de regression SSG.
 *
 * Interactions :
 *   - Accessible a tous les visiteurs (pas besoin d'auth)
 *   - HeroSearchBar redirige vers /recherche?city=X&lat=Y&lng=Z
 *   - Les categories sont chargees cote serveur via getActiveCategories()
 *   - Clic sur une categorie redirige vers /recherche?categoryId=xxx
 *
 * Layout hero (desktop) :
 *   ┌──────┬──────┬──────┬──────┐
 *   │ img1 │ img2 │ img3 │ img4 │
 *   │(tall)│      │      │(tall)│
 *   │      ├──────┴──────┤      │
 *   │      │  OVERLAY    │      │
 *   │      │  TITRE      │      │
 *   │      │  SEARCHBAR  │      │
 *   │      │  BADGES     │      │
 *   │      ├──────┬──────┤      │
 *   │      │ img5 │ img6 │      │
 *   └──────┴──────┴──────┴──────┘
 *   Mobile : grille 2x2 + overlay centre
 */
import Link from "next/link"
import Image from "next/image"
import { MapPin, Scissors, Home } from "lucide-react"
import { Header } from "@/shared/components/layout/Header"
import { Footer } from "@/shared/components/layout/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { APP_NAME } from "@/shared/lib/constants"
import { HeroSearchBar } from "@/modules/search/components/HeroSearchBar"
import { getActiveCategories } from "@/modules/search/actions/search-actions"

/* ------------------------------------------------------------------ */
/* Pool curate d'images pour le hero Bento Grid                        */
/*                                                                      */
/* Criteres d'inclusion :                                               */
/*   - Sujet feminin (public cible : coiffeuses / clientes)            */
/*   - Luminosite suffisante (pas de fonds noirs ou N&B)               */
/*   - Pas de marques visibles (logos, vetements branded)              */
/*   - Bonne composition en object-cover (cadrage portrait/carre)      */
/*                                                                      */
/* Chaque objet contient src + alt descriptif (accessibilite)          */
/* ------------------------------------------------------------------ */

/** Type d'une image du pool hero */
interface HeroImage {
  src: string
  alt: string
}

/** Pool de ~20 images curatees parmi lesquelles 6 sont tirees au sort */
const HERO_IMAGE_POOL: HeroImage[] = [
  { src: "/images/good-faces-3yvAe5gJ-SI-unsplash.jpg", alt: "Femme avec de longues box braids" },
  { src: "/images/ufoma-ojo-tzRdo5uBPvw-unsplash.jpg", alt: "Femme souriante avec des tresses colorees" },
  { src: "/images/dwayne-joe-iJmMxExrGEQ-unsplash.jpg", alt: "Profil elegant avec nattes et boucles" },
  { src: "/images/jabari-timothy-XD5E3HyLciE-unsplash.jpg", alt: "Femme avec des locs dans un cadre naturel" },
  { src: "/images/mohamed-b-3C6-qBvyzOY-unsplash.jpg", alt: "Mains en train de tresser des cheveux" },
  { src: "/images/michael-kyule-zjHAWfuN58w-unsplash.jpg", alt: "Femme avec un afro rouge cuivre" },
  { src: "/images/theresa-ude-pbZwlHWHaQk-unsplash.jpg", alt: "Portrait elegant avec headwrap et locs" },
  { src: "/images/derrick-payton-9eq4KD3I4uw-unsplash.jpg", alt: "Femme avec des cheveux bleu-gris" },
  { src: "/images/moa-kiraly-q7MdLR_dh9I-unsplash.jpg", alt: "Femme de profil avec headwrap africain" },
  { src: "/images/ondre-justus-FzBLZCC-Ojw-unsplash.jpg", alt: "Femme avec des tresses dorees en lumiere chaude" },
  { src: "/images/stephen-tettey-atsu-T3IXYPEE2L4-unsplash.jpg", alt: "Femme avec des locs face a l'ocean" },
  { src: "/images/batakane-pictures-yr72XCA1sHE-unsplash.jpg", alt: "Femme avec des tresses violettes et tenue wax" },
  { src: "/images/dwayne-joe-3_gYOxFzOVc-unsplash.jpg", alt: "Femme avec des cornrows ornees de coquillages" },
  { src: "/images/salem-IMmJbrwmp8M-unsplash.jpg", alt: "Femme avec des tresses bleues" },
  { src: "/images/precious-madubuike-QguoDDRIeME-unsplash.jpg", alt: "Femme avec des locs vue de dos" },
  { src: "/images/dare-artworks-9lxOydnFLcU-unsplash.jpg", alt: "Gros plan sur des tresses colorees" },
  { src: "/images/lina-bentanch-1G7JHGRYgTI-unsplash.jpg", alt: "Femme avec des boucles violettes" },
  { src: "/images/danielle-claude-belanger-64r74ffbFps-unsplash.jpg", alt: "Gros plan de tresses geometriques" },
  { src: "/images/shawn-fields-Fkc1UP9s-VU-unsplash.jpg", alt: "Femme avec un afro bleu-vert" },
  { src: "/images/jabari-timothy-xDgL1iT2kQY-unsplash.jpg", alt: "Femme avec des locs en cadre naturel" },
  { src: "/images/ufoma-ojo-cAYj4XXWD1U-unsplash.jpg", alt: "Femme avec des tresses violet et rose" },
]

/**
 * pickRandom — Selectionne `count` elements aleatoires sans doublons
 *
 * Utilise le melange de Fisher-Yates pour une distribution uniforme.
 * Appele cote serveur a chaque requete (Server Component).
 */
function pickRandom<T>(pool: T[], count: number): T[] {
  const copy = [...pool]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

/** Badges de confiance affiches sous la SearchBar */
const TRUST_BADGES = [
  { icon: Scissors, label: "Coiffeuses verifiees" },
  { icon: MapPin, label: "Partout en France" },
  { icon: Home, label: "Prestations a domicile" },
] as const

export default async function HomePage() {
  /* Charger les categories actives cote serveur (Server Component) */
  const categoriesResult = await getActiveCategories()
  const categories = categoriesResult.success ? categoriesResult.data : []

  /* Selectionner 6 images aleatoires depuis le pool curate */
  const heroImages = pickRandom(HERO_IMAGE_POOL, 6)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* Hero Section — Bento Grid + overlay frosted glass          */}
        {/* Images selectionnees aleatoirement a chaque requete        */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden">

          {/* --- Grille Bento d'images de coiffures --- */}
          {/* Mobile : 2 colonnes, 2 lignes (4 images visibles)      */}
          {/* Desktop : 4 colonnes, 2 lignes (6 images, 2 en tall)   */}
          <div className="grid h-[480px] grid-cols-2 grid-rows-2 gap-1.5 p-1.5 md:h-[580px] md:grid-cols-4 md:grid-rows-2 md:gap-2 md:p-2">

            {/* Image 1 — tall gauche (portrait, 2 lignes sur desktop) */}
            <div className="relative overflow-hidden rounded-xl md:col-start-1 md:row-start-1 md:row-span-2 md:rounded-2xl">
              <Image
                src={heroImages[0].src}
                alt={heroImages[0].alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                priority
                className="object-cover"
              />
            </div>

            {/* Image 2 — haut centre-gauche */}
            <div className="relative overflow-hidden rounded-xl md:col-start-2 md:row-start-1 md:rounded-2xl">
              <Image
                src={heroImages[1].src}
                alt={heroImages[1].alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                priority
                className="object-cover"
              />
            </div>

            {/* Image 3 — haut centre-droite */}
            <div className="relative overflow-hidden rounded-xl md:col-start-3 md:row-start-1 md:rounded-2xl">
              <Image
                src={heroImages[2].src}
                alt={heroImages[2].alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                priority
                className="object-cover"
              />
            </div>

            {/* Image 4 — tall droite (masquee sur mobile, 2 lignes desktop) */}
            <div className="relative hidden overflow-hidden md:block md:col-start-4 md:row-start-1 md:row-span-2 md:rounded-2xl">
              <Image
                src={heroImages[3].src}
                alt={heroImages[3].alt}
                fill
                sizes="25vw"
                className="object-cover"
              />
            </div>

            {/* Image 5 — bas centre-gauche (masquee sur mobile) */}
            <div className="relative hidden overflow-hidden md:block md:col-start-2 md:row-start-2 md:rounded-2xl">
              <Image
                src={heroImages[4].src}
                alt={heroImages[4].alt}
                fill
                sizes="25vw"
                className="object-cover"
              />
            </div>

            {/* Image 6 — bas centre-droite (4e image visible sur mobile) */}
            <div className="relative overflow-hidden rounded-xl md:col-start-3 md:row-start-2 md:rounded-2xl">
              <Image
                src={heroImages[5].src}
                alt={heroImages[5].alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* --- Overlay : carte frosted glass centree --- */}
          {/* Positionnee par-dessus la grille d'images     */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-3xl border border-border/50 bg-background/80 p-6 shadow-2xl backdrop-blur-xl md:max-w-2xl md:p-10">
              <div className="flex flex-col items-center gap-5 text-center">
                <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                  Trouvez votre coiffeuse afro{" "}
                  <span className="text-primary">pres de chez vous</span>
                </h1>

                <p className="max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                  {APP_NAME} met en relation des coiffeuses talentueuses et des
                  clientes a la recherche de prestations de coiffure afro a
                  domicile, partout en France.
                </p>

                {/* Barre de recherche hero : saisir une ville */}
                <HeroSearchBar />

                {/* Badges de confiance */}
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-1">
                  {TRUST_BADGES.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground md:text-sm"
                    >
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* Section categories de coiffures                            */}
        {/* ========================================================= */}
        <section className="bg-muted/50 px-4 py-16">
          <div className="container mx-auto">
            <h2 className="mb-8 text-center text-2xl font-bold">
              Nos types de coiffures
            </h2>

            {categories.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/recherche?categoryId=${category.id}`}
                  >
                    <Card className="transition-shadow hover:shadow-md">
                      <CardContent className="flex items-center justify-center p-6 text-center">
                        <span className="font-medium">{category.name}</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Tresses, locks, tissages, crochet braids, nattes collees et
                bien plus encore...
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
