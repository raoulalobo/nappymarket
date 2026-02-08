/**
 * Page d'accueil — NappyMarket
 *
 * Role : Landing page avec hero section, barre de recherche
 *        et presentation de la plateforme.
 *
 * Interactions :
 *   - Accessible a tous les visiteurs (pas besoin d'auth)
 *   - La barre de recherche redirigera vers /recherche (Phase 4)
 *   - Affichera les coiffeuses mises en avant (Phase 4)
 */
import Link from "next/link"
import { Header } from "@/shared/components/layout/Header"
import { Footer } from "@/shared/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/shared/lib/constants"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
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
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <Link href="/recherche">Trouver une coiffeuse</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/inscription">Devenir coiffeuse</Link>
            </Button>
          </div>
        </section>

        {/* Section categories (placeholder — sera remplie en Phase 4) */}
        <section className="bg-muted/50 px-4 py-16">
          <div className="container mx-auto text-center">
            <h2 className="mb-8 text-2xl font-bold">
              Nos types de coiffures
            </h2>
            <p className="text-muted-foreground">
              Tresses, locks, tissages, crochet braids, nattes collees et
              bien plus encore...
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
