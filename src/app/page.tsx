/**
 * Page d'accueil — NappyMarket
 *
 * Role : Landing page avec hero section "Split Hero" (texte + SearchBar
 *        a gauche, collage d'images a droite), suivie d'une grille
 *        de categories de coiffures.
 *
 * Interactions :
 *   - Accessible a tous les visiteurs (pas besoin d'auth)
 *   - HeroSearchBar redirige vers /recherche?city=X&lat=Y&lng=Z
 *   - Les categories sont chargees cote serveur via getActiveCategories()
 *   - Clic sur une categorie redirige vers /recherche?categoryId=xxx
 *
 * Layout hero (desktop) :
 *   ┌────────────────────────┬──────────────────┐
 *   │  Titre H1              │  ┌─────┐┌──────┐ │
 *   │  Sous-titre            │  │ img ││ img2 │ │
 *   │  [SearchBar]           │  │ (L) ││      │ │
 *   │                        │  │     │├──────┤ │
 *   │  ✓ Partout en France   │  │     ││ img3 │ │
 *   │  ✓ A domicile          │  └─────┘└──────┘ │
 *   └────────────────────────┴──────────────────┘
 *   Mobile : empile (texte → images)
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

/** Images du hero collage — variete de styles de coiffure afro */
const HERO_IMAGES = [
  {
    src: "/images/good-faces-3yvAe5gJ-SI-unsplash.jpg",
    alt: "Femme avec de longues box braids",
  },
  {
    src: "/images/ufoma-ojo-tzRdo5uBPvw-unsplash.jpg",
    alt: "Femme souriante avec des tresses colorees",
  },
  {
    src: "/images/dwayne-joe-iJmMxExrGEQ-unsplash.jpg",
    alt: "Profil elegant avec nattes et boucles",
  },
] as const

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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* Hero Section — Split Hero (texte gauche / images droite)   */}
        {/* ========================================================= */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

            {/* --- Colonne gauche : contenu textuel + SearchBar --- */}
            <div className="flex flex-col gap-6">
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                Trouvez votre coiffeuse afro{" "}
                <span className="text-primary">pres de chez vous</span>
              </h1>

              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                {APP_NAME} met en relation des coiffeuses talentueuses et des
                clientes a la recherche de prestations de coiffure afro a
                domicile, partout en France.
              </p>

              {/* Barre de recherche hero : saisir une ville */}
              <HeroSearchBar />

              {/* Badges de confiance */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
                {TRUST_BADGES.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Colonne droite : collage d'images asymetrique --- */}
            {/* Grid 2 colonnes : image principale (tall) + 2 images empilees */}
            {/* Hauteur fixe pour que les images fill s'affichent correctement */}
            <div className="grid h-[400px] grid-cols-5 grid-rows-2 gap-3 md:h-[480px] lg:gap-4">
              {/* Image principale — occupe 3/5 de largeur et 2 lignes */}
              <div className="relative col-span-3 row-span-2 overflow-hidden rounded-2xl">
                <Image
                  src={HERO_IMAGES[0].src}
                  alt={HERO_IMAGES[0].alt}
                  fill
                  sizes="(max-width: 1024px) 60vw, 30vw"
                  priority
                  className="object-cover"
                />
              </div>

              {/* Image secondaire haut-droite */}
              <div className="relative col-span-2 overflow-hidden rounded-2xl">
                <Image
                  src={HERO_IMAGES[1].src}
                  alt={HERO_IMAGES[1].alt}
                  fill
                  sizes="(max-width: 1024px) 40vw, 20vw"
                  priority
                  className="object-cover"
                />
              </div>

              {/* Image tertiaire bas-droite */}
              <div className="relative col-span-2 overflow-hidden rounded-2xl">
                <Image
                  src={HERO_IMAGES[2].src}
                  alt={HERO_IMAGES[2].alt}
                  fill
                  sizes="(max-width: 1024px) 40vw, 20vw"
                  className="object-cover"
                />
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
