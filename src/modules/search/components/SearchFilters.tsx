/**
 * SearchFilters — Panneau de filtres de recherche
 *
 * Role : Permettre a l'utilisateur de filtrer les resultats de recherche
 *        par rayon (km), categorie de service et tri (distance, prix).
 *
 * Interactions :
 *   - Lit et ecrit dans useSearchFiltersStore (store Zustand)
 *   - Charge les categories via getActiveCategories() (server action)
 *   - Utilise TanStack Query pour cacher la liste des categories
 *   - Composants shadcn : Select, Button
 *
 * Exemple :
 *   <SearchFilters />
 */
"use client"

import { useQuery } from "@tanstack/react-query"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSearchFiltersStore } from "@/shared/stores/search-filters-store"
import { getActiveCategories } from "../actions/search-actions"

/** Options de rayon de recherche disponibles (en km) */
const RADIUS_OPTIONS = [5, 10, 15, 20, 30, 50]

/** Options de tri des resultats */
const SORT_OPTIONS = [
  { value: "distance", label: "Distance" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix decroissant" },
] as const

export function SearchFilters() {
  // Lire les filtres actuels depuis le store
  const { radiusKm, categoryId, sortBy, setRadiusKm, setCategoryId, setSortBy, reset } =
    useSearchFiltersStore()

  // Charger les categories actives (cache 10 min)
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "active"],
    queryFn: async () => {
      const result = await getActiveCategories()
      if (!result.success) return []
      return result.data
    },
    staleTime: 10 * 60 * 1000,
  })

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filtre rayon */}
      <Select
        value={String(radiusKm)}
        onValueChange={(value) => setRadiusKm(Number(value))}
      >
        <SelectTrigger className="w-[130px]" aria-label="Rayon de recherche">
          <SelectValue placeholder="Rayon" />
        </SelectTrigger>
        <SelectContent>
          {RADIUS_OPTIONS.map((km) => (
            <SelectItem key={km} value={String(km)}>
              {km} km
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtre categorie */}
      <Select
        value={categoryId ?? "all"}
        onValueChange={(value) => setCategoryId(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px]" aria-label="Categorie de coiffure">
          <SelectValue placeholder="Categorie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtre tri */}
      <Select
        value={sortBy}
        onValueChange={(value) =>
          setSortBy(value as "distance" | "price_asc" | "price_desc")
        }
      >
        <SelectTrigger className="w-[160px]" aria-label="Trier par">
          <SelectValue placeholder="Trier par" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Bouton reinitialiser */}
      <Button
        variant="ghost"
        size="sm"
        onClick={reset}
        className="text-muted-foreground"
        aria-label="Reinitialiser les filtres"
      >
        <RotateCcw className="mr-1 h-4 w-4" />
        Reinitialiser
      </Button>
    </div>
  )
}
