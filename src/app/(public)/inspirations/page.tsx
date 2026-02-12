/**
 * Page /inspirations — Galerie publique d'inspirations coiffure
 *
 * Role : Afficher une galerie d'images de coiffures afro pour inspirer
 *        les clientes et les visiteurs. Les images sont gerees par
 *        l'admin depuis le back-office (/admin/inspirations).
 *
 * Interactions :
 *   - Route publique (pas de verification d'authentification)
 *   - Appelle getPublicGalleryImages() cote serveur (Server Component)
 *   - Affiche une grille responsive d'images avec titre et description
 *   - Lien dans le Header principal ("Inspirations")
 *
 * Exemple d'URL : /inspirations
 */
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/shared/components/layout/Header"
import { Footer } from "@/shared/components/layout/Footer"
import { getPublicGalleryImages } from "@/modules/admin/actions/gallery-actions"
import { Button } from "@/components/ui/button"

/** Metadata statique pour le SEO */
export const metadata: Metadata = {
  title: "Inspirations coiffure | NappyMarket",
  description:
    "Decouvrez des styles de coiffures afro pour vous inspirer. Tresses, locks, tissages, crochet braids et bien plus. Trouvez votre prochaine coiffure sur NappyMarket.",
}

export default async function InspirationsPage() {
  // Recuperer les images actives de la galerie (pas besoin d'auth)
  const result = await getPublicGalleryImages()
  const images = result.success ? result.data : []

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Section d'introduction */}
        <div className="container mx-auto px-4 pt-12 pb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Inspirations
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Decouvrez des styles de coiffures afro pour trouver votre prochaine
            coiffure. Laissez-vous inspirer par nos coiffeuses talentueuses.
          </p>
        </div>

        {/* Contenu de la galerie */}
        <div className="container mx-auto px-4 pb-16">
          {images.length === 0 ? (
            /* --- Etat vide : aucune image publiee --- */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">
                La galerie est en cours de preparation. Revenez bientot pour
                decouvrir des styles inspirants !
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/recherche">Trouver une coiffeuse</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* --- Grille responsive d'images --- */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {images.map((image) => (
                  <article
                    key={image.id}
                    className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* Image avec ratio 4:3 et Next Image pour l'optimisation */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={image.imageUrl}
                        alt={image.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Titre et description */}
                    <div className="p-4">
                      <h2 className="text-base font-semibold">{image.title}</h2>
                      {image.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {image.description}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {/* --- CTA en bas de page --- */}
              <div className="mt-12 text-center">
                <p className="text-muted-foreground">
                  Envie de tenter un de ces styles ?
                </p>
                <Button asChild className="mt-4">
                  <Link href="/recherche">Trouver une coiffeuse</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
