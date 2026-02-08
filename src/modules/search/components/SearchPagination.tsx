/**
 * SearchPagination — Navigation entre les pages de resultats
 *
 * Role : Afficher les boutons de pagination (precedent, numeros de page, suivant)
 *        pour naviguer dans les resultats de recherche.
 *
 * Interactions :
 *   - Recoit currentPage et totalPages depuis SearchResults (parent)
 *   - Appelle useSearchFiltersStore.setPage() pour changer de page
 *   - Le changement de page declenche un refetch dans useSearchStylists
 *
 * Exemple :
 *   <SearchPagination currentPage={1} totalPages={5} />
 */
"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSearchFiltersStore } from "@/shared/stores/search-filters-store"

interface SearchPaginationProps {
  /** Page courante (1-indexed) */
  currentPage: number
  /** Nombre total de pages */
  totalPages: number
}

/**
 * Generer la liste des numeros de page a afficher
 * Affiche au maximum 5 numeros avec des ellipsis (...) si necessaire
 *
 * Exemples :
 *   getPageNumbers(1, 7)  -> [1, 2, 3, 4, 5]
 *   getPageNumbers(4, 7)  -> [2, 3, 4, 5, 6]
 *   getPageNumbers(7, 7)  -> [3, 4, 5, 6, 7]
 */
function getPageNumbers(current: number, total: number): number[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  // Centrer la page courante dans la fenetre de 5
  let start = Math.max(1, current - 2)
  const end = Math.min(total, start + 4)

  // Ajuster si on est proche de la fin
  if (end - start < 4) {
    start = end - 4
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export function SearchPagination({ currentPage, totalPages }: SearchPaginationProps) {
  const setPage = useSearchFiltersStore((state) => state.setPage)

  // Ne pas afficher si une seule page
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Pagination des resultats"
    >
      {/* Bouton precedent */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setPage(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Page precedente"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Numeros de page */}
      {pages.map((pageNum) => (
        <Button
          key={pageNum}
          variant={pageNum === currentPage ? "default" : "outline"}
          size="icon"
          onClick={() => setPage(pageNum)}
          aria-label={`Page ${pageNum}`}
          aria-current={pageNum === currentPage ? "page" : undefined}
        >
          {pageNum}
        </Button>
      ))}

      {/* Bouton suivant */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Page suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}
