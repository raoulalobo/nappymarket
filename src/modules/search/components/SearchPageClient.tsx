/**
 * SearchPageClient — Orchestrateur client de la page de recherche
 *
 * Role : Assembler tous les composants de recherche (barre, filtres, resultats, carte)
 *        dans un layout responsive avec mode split (desktop), toggle liste/carte (mobile).
 *
 * Interactions :
 *   - Lit viewMode depuis useSearchFiltersStore (store Zustand)
 *   - Rend SearchBar, SearchFilters, SearchResults, SearchMapDynamic
 *   - Bouton flottant en mobile pour basculer entre liste et carte
 *
 * Layout responsive :
 *   - Desktop (lg+) : split 50/50 — liste a gauche, carte a droite (sticky)
 *   - Tablette (md) : split 40/60
 *   - Mobile (< md) : toggle entre liste et carte via un bouton flottant
 *
 * Exemple :
 *   <SearchPageClient /> // Utilise dans src/app/(public)/recherche/page.tsx
 */
"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Map, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSearchFiltersStore } from "@/shared/stores/search-filters-store"
import { SearchBar } from "./SearchBar"
import { SearchFilters } from "./SearchFilters"
import { SearchResults } from "./SearchResults"
import { SearchMapDynamic } from "./SearchMap"

export function SearchPageClient() {
  const { viewMode, setViewMode, setCity, setCategoryId } = useSearchFiltersStore()

  // Lire les parametres URL pour pre-remplir la recherche
  // (ex: arrivee depuis la page d'accueil avec ?city=Paris&lat=48.85&lng=2.35)
  const searchParams = useSearchParams()

  useEffect(() => {
    const city = searchParams.get("city")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const categoryId = searchParams.get("categoryId")

    // Pre-remplir la ville si les params sont presents
    if (city && lat && lng) {
      setCity(city, Number(lat), Number(lng))
    }

    // Pre-remplir la categorie si le param est present
    if (categoryId) {
      setCategoryId(categoryId)
    }
  }, [searchParams, setCity, setCategoryId])

  return (
    <div className="flex flex-1 flex-col">
      {/* Barre de recherche + filtres */}
      <div className="border-b bg-background px-4 py-3">
        <div className="container mx-auto space-y-3">
          <SearchBar />
          <SearchFilters />
        </div>
      </div>

      {/* Zone de resultats : split desktop, toggle mobile */}
      <div className="relative flex flex-1">
        {/* Liste des resultats (gauche sur desktop) */}
        <div
          className={cn(
            "flex-1 overflow-y-auto p-4",
            // Desktop : toujours visible, 50% de la largeur
            "lg:max-w-[50%]",
            // Mobile : visible seulement en mode liste
            viewMode === "map" && "hidden lg:block"
          )}
        >
          <SearchResults />
        </div>

        {/* Carte (droite sur desktop) */}
        <div
          className={cn(
            "lg:sticky lg:top-0 lg:h-[calc(100vh-140px)] lg:flex-1",
            // Mobile : visible seulement en mode carte, occupe tout l'ecran
            viewMode === "map"
              ? "absolute inset-0 z-10 h-[calc(100vh-140px)]"
              : "hidden lg:block"
          )}
        >
          <SearchMapDynamic />
        </div>

        {/* Bouton flottant toggle liste/carte (mobile uniquement) */}
        <div className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 lg:hidden">
          <Button
            onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
            className="shadow-lg"
            size="lg"
          >
            {viewMode === "list" ? (
              <>
                <Map className="mr-2 h-4 w-4" />
                Voir la carte
              </>
            ) : (
              <>
                <List className="mr-2 h-4 w-4" />
                Voir la liste
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
