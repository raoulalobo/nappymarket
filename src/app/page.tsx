/**
 * Page d'accueil — NappyMarket
 *
 * Role : Landing page avec hero section (barre de recherche par ville),
 *        grille de categories de coiffures et presentation de la plateforme.
 *
 * Interactions :
 *   - Accessible a tous les visiteurs (pas besoin d'auth)
 *   - HeroSearchBar redirige vers /recherche?city=X&lat=Y&lng=Z
 *   - Les categories sont chargees cote serveur via getActiveCategories()
 *   - Clic sur une categorie redirige vers /recherche?categoryId=xxx
 */
import Link from "next/link"
import { Header } from "@/shared/components/layout/Header"
import { Footer } from "@/shared/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { APP_NAME } from "@/shared/lib/constants"
import { HeroSearchBar } from "@/modules/search/components/HeroSearchBar"
import { getActiveCategories } from "@/modules/search/actions/search-actions"

export default async function HomePage() {
  // Charger les categories actives cote serveur (Server Component)
  const categoriesResult = await getActiveCategories()
  const categories = categoriesResult.success ? categoriesResult.data : []

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section avec barre de recherche */}
        <section className="flex flex-col items-center justify-center gap-6 px-4 py-24 text-center md:py-32">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Trouvez votre coiffeuse afro{" "}
            <span className="text-primary">pres de chez vous</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            {APP_NAME} met en relation des coiffeuses talentueuses et des
            clientes a la recherche de prestations de coiffure afro a domicile,
            partout en France.
          </p>

          {/* Barre de recherche hero : saisir une ville pour lancer la recherche */}
          <HeroSearchBar />

          <Button size="lg" variant="outline" asChild>
            <Link href="/inscription">Devenir coiffeuse</Link>
          </Button>
        </section>

        {/* Section categories de coiffures */}
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
