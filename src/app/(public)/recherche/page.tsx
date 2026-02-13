/**
 * Page /recherche — Recherche de coiffeuses par ville
 *
 * Role : Point d'entree de la recherche geographique de coiffeuses.
 *        Affiche le Header, le composant client SearchPageClient et le Footer.
 *
 * Interactions :
 *   - Route publique (pas de verification d'authentification)
 *   - Accepte des query params optionnels pour pre-remplir la recherche :
 *     ?city=Paris&lat=48.85&lng=2.35&categoryId=xxx
 *   - SearchPageClient (client component) gere toute la logique de recherche
 *
 * Exemple d'URL :
 *   /recherche
 *   /recherche?city=Paris&lat=48.8566&lng=2.3522
 *   /recherche?categoryId=clxxx
 */
import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchPageClient } from "@/modules/search/components/SearchPageClient"

/** Metadata statique pour le SEO */
export const metadata: Metadata = {
  title: "Rechercher une coiffeuse | NappyMarket",
  description:
    "Trouvez une coiffeuse afro pres de chez vous. Recherchez par ville, filtrez par type de coiffure et consultez les profils.",
}

export default function RecherchePage() {
  return (
    /* Suspense necessaire car SearchPageClient utilise useSearchParams() */
    <Suspense fallback={null}>
      <SearchPageClient />
    </Suspense>
  )
}
