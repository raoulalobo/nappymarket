/**
 * Page d'accueil — NappyMarket
 *
 * Role : Landing page avec hero section split (texte + image), section
 *        "Comment ca marche" en 3 etapes, grille de categories de coiffures
 *        avec images, et bandeau CTA coiffeuse.
 *
 * Interactions :
 *   - Accessible a tous les visiteurs (pas besoin d'auth)
 *   - HeroSearchBar redirige vers /recherche?city=X&lat=Y&lng=Z
 *   - Les categories sont chargees cote serveur via getActiveCategories()
 *   - Clic sur une categorie redirige vers /recherche?categoryId=xxx
 *
 * Design : Style "Chaleureux & Elegant" — palette rose/or, Poppins + Open Sans
 *          Pattern "Marketplace / Directory" (ui-ux-pro-max skill)
 *          Accessibilite WCAG AA, responsive mobile-first
 */
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/shared/components/layout/Header"
import { Footer } from "@/shared/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { APP_NAME } from "@/shared/lib/constants"
import { HeroSearchBar } from "@/modules/search/components/HeroSearchBar"
import { getActiveCategories } from "@/modules/search/actions/search-actions"
import { Search, CalendarCheck, Sparkles, MapPin, ArrowRight, Scissors } from "lucide-react"

export default async function HomePage() {
  // Charger les categories actives cote serveur (Server Component)
  const categoriesResult = await getActiveCategories()
  const categories = categoriesResult.success ? categoriesResult.data : []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* ============================================================= */}
        {/* HERO SECTION — Layout split texte / image                     */}
        {/* ============================================================= */}
        <section className="relative overflow-hidden">
          {/* Fond gradient decoratif */}
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-br from-pink-50 via-background to-rose-50"
            aria-hidden="true"
          />
          {/* Cercle decoratif subtil en arriere-plan */}
          <div
            className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl"
            aria-hidden="true"
          />

          <div className="container mx-auto flex flex-col items-center gap-8 px-4 py-16 md:flex-row md:gap-12 md:py-24 lg:py-32">
            {/* Colonne gauche : texte + recherche */}
            <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
              {/* Badge indicateur */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Partout en France
              </div>

              <h1 className="font-heading max-w-2xl text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Trouvez votre coiffeuse afro{" "}
                <span className="text-primary">pres de chez vous</span>
              </h1>

              <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground md:mt-6 md:text-xl">
                {APP_NAME} met en relation des coiffeuses talentueuses et des
                clientes a la recherche de prestations de coiffure afro a
                domicile.
              </p>

              {/* Barre de recherche hero */}
              <div className="mt-8 w-full max-w-lg">
                <HeroSearchBar />
              </div>

              {/* Chiffres cles — social proof */}
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground md:gap-8">
                <div className="flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span><strong className="text-foreground">100+</strong> coiffeuses</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span><strong className="text-foreground">50+</strong> villes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span><strong className="text-foreground">4.8/5</strong> satisfaction</span>
                </div>
              </div>
            </div>

            {/* Colonne droite : image hero */}
            <div className="relative flex-1">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl shadow-2xl shadow-primary/10">
                <Image
                  src="https://images.unsplash.com/photo-1595959183082-7b570b7e1e6b?w=600&h=750&fit=crop&crop=top"
                  alt="Coiffure afro elegante — tresses stylisees"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {/* Overlay gradient en bas de l'image */}
                <div
                  className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent"
                  aria-hidden="true"
                />
              </div>
              {/* Card flottante decorative */}
              <div className="absolute -bottom-4 -left-4 rounded-xl border bg-card p-3 shadow-lg md:-left-8">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Reservation facile</p>
                    <p className="text-xs text-muted-foreground">En quelques clics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* COMMENT CA MARCHE — 3 etapes                                  */}
        {/* ============================================================= */}
        <section className="bg-card px-4 py-16 md:py-24">
          <div className="container mx-auto">
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                Comment ca marche ?
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Reservez votre coiffeuse en 3 etapes simples
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3 md:gap-12">
              {/* Etape 1 — Recherchez */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-200">
                  <Search className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>
                <div className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="font-heading mt-4 text-lg font-semibold text-foreground">
                  Recherchez
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Entrez votre ville et decouvrez les coiffeuses disponibles
                  pres de chez vous.
                </p>
              </div>

              {/* Etape 2 — Reservez */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 transition-colors duration-200">
                  <CalendarCheck className="h-7 w-7 text-accent" aria-hidden="true" />
                </div>
                <div className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                  2
                </div>
                <h3 className="font-heading mt-4 text-lg font-semibold text-foreground">
                  Reservez
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Choisissez votre prestation, selectionnez un creneau et
                  confirmez votre reservation.
                </p>
              </div>

              {/* Etape 3 — Profitez */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-200">
                  <Sparkles className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>
                <div className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="font-heading mt-4 text-lg font-semibold text-foreground">
                  Profitez
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Votre coiffeuse se deplace chez vous. Detendez-vous et
                  profitez de votre nouvelle coiffure.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* CATEGORIES DE COIFFURES — Cards avec images                   */}
        {/* ============================================================= */}
        <section className="px-4 py-16 md:py-24">
          <div className="container mx-auto">
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                Nos types de coiffures
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Tresses, locks, tissages et bien plus encore
              </p>
            </div>

            {categories.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                {categories.map((category, index) => (
                  <Link
                    key={category.id}
                    href={`/recherche?categoryId=${category.id}`}
                    className="group cursor-pointer"
                  >
                    <Card className="overflow-hidden border-0 shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
                      {/* Image de la categorie avec overlay */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={category.imageUrl || getCategoryPlaceholder(index)}
                          alt={`Categorie ${category.name} — coiffure afro`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
                          aria-hidden="true"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <span className="font-heading text-sm font-semibold text-white md:text-base">
                            {category.name}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {DEFAULT_CATEGORIES.map((cat, index) => (
                  <Card
                    key={cat}
                    className="overflow-hidden border-0 shadow-md"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={getCategoryPlaceholder(index)}
                        alt={`Categorie ${cat} — coiffure afro`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
                        aria-hidden="true"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <span className="font-heading text-sm font-semibold text-white md:text-base">
                          {cat}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================= */}
        {/* CTA COIFFEUSE — Bandeau d'inscription                         */}
        {/* ============================================================= */}
        <section className="bg-primary px-4 py-12 md:py-16">
          <div className="container mx-auto flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="font-heading text-2xl font-bold text-primary-foreground md:text-3xl">
                Vous etes coiffeuse ?
              </h2>
              <p className="mt-2 max-w-lg text-primary-foreground/80">
                Rejoignez {APP_NAME} et developpez votre activite. Gerez vos
                creneaux, recevez des reservations et touchez de nouvelles
                clientes.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="cursor-pointer whitespace-nowrap font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <Link href="/inscription">
                Devenir coiffeuse
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Donnees statiques pour les placeholders                             */
/* ------------------------------------------------------------------ */

/**
 * Categories par defaut affichees si aucune categorie n'est en BDD.
 * Sert de fallback pendant le developpement.
 */
const DEFAULT_CATEGORIES = [
  "Tresses",
  "Locks",
  "Tissage",
  "Crochet Braids",
  "Nattes collees",
  "Vanilles",
  "Coupe & Styling",
  "Soins capillaires",
]

/**
 * getCategoryPlaceholder — Retourne une image Unsplash placeholder pour une categorie
 *
 * Utilise des photos de coiffures afro libres de droits.
 * A remplacer par les vraies images des categories (Supabase Storage).
 *
 * @param index - Index de la categorie (pour varier les images)
 * @returns URL Unsplash optimisee (400x300)
 */
function getCategoryPlaceholder(index: number): string {
  const placeholders = [
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1605980776566-0427bb024a06?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1619451683160-b3d2ece7aab6?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1595959183082-7b570b7e1e6b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400&h=300&fit=crop",
  ]
  return placeholders[index % placeholders.length]
}
