/**
 * HeroSearchBar — Barre de recherche hero pour la page d'accueil
 *
 * Role : Wrapper client du SearchBar en variante "hero" (grande taille).
 *        A la selection d'une ville, redirige vers /recherche avec les coordonnees
 *        en parametres URL.
 *
 * Interactions :
 *   - Utilise SearchBar (module search) en variante "hero"
 *   - Redirige vers /recherche?city=X&lat=Y&lng=Z au clic sur une suggestion
 *   - Utilise par la page d'accueil (src/app/page.tsx)
 *
 * Exemple :
 *   <HeroSearchBar />
 */
"use client"

import { useRouter } from "next/navigation"
import { SearchBar } from "./SearchBar"

export function HeroSearchBar() {
  const router = useRouter()

  /**
   * Rediriger vers la page de recherche avec les coordonnees de la ville
   * Les params sont lus par SearchPageClient pour pre-remplir le store
   */
  function handleCitySelected(city: string, lat: number, lng: number) {
    router.push(`/recherche?city=${encodeURIComponent(city)}&lat=${lat}&lng=${lng}`)
  }

  return (
    <div className="w-full max-w-lg">
      <SearchBar variant="hero" onCitySelected={handleCitySelected} />
    </div>
  )
}
