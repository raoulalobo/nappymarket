/**
 * SearchBar — Barre de recherche avec autocompletion des villes
 *
 * Role : Permettre a l'utilisateur de saisir une ville et selectionner parmi
 *        les suggestions de l'API Adresse Gouv. Au clic sur une suggestion,
 *        met a jour le store Zustand (ville + coordonnees GPS).
 *
 * Interactions :
 *   - Utilise useAddressAutocomplete (hook) pour les suggestions debouncees
 *   - Ecrit dans useSearchFiltersStore (store Zustand) via setCity()
 *   - Variante "hero" : version grande pour la page d'accueil
 *   - Variante par defaut : version compacte pour la page /recherche
 *   - Navigation clavier : fleches haut/bas, Entree, Echap
 *   - Prop onCitySelected : callback optionnel apres selection (ex: redirection)
 *
 * Exemple :
 *   <SearchBar variant="hero" onCitySelected={(city, lat, lng) => router.push(...)} />
 *   <SearchBar /> // version compacte dans /recherche
 */
"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { MapPin, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAddressAutocomplete } from "../hooks/useAddressAutocomplete"
import { useSearchFiltersStore } from "@/shared/stores/search-filters-store"
import type { AddressSuggestion } from "../types"

interface SearchBarProps {
  /** Variante d'affichage : "hero" (grande, page d'accueil) ou "default" (compacte) */
  variant?: "hero" | "default"
  /** Callback apres selection d'une ville (ex: redirection vers /recherche) */
  onCitySelected?: (city: string, lat: number, lng: number) => void
}

export function SearchBar({ variant = "default", onCitySelected }: SearchBarProps) {
  // Texte saisi dans l'input (pas encore confirme)
  const [query, setQuery] = useState("")
  // Dropdown ouvert ou ferme
  const [isOpen, setIsOpen] = useState(false)
  // Index de la suggestion survolee au clavier (-1 = aucune)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Hook d'autocompletion debouncee (300ms)
  const { suggestions, isLoading } = useAddressAutocomplete(query)

  // Store Zustand pour mettre a jour et lire les filtres
  const setCity = useSearchFiltersStore((state) => state.setCity)
  // Ville courante dans le store (peut etre remplie depuis les params URL par SearchPageClient)
  const cityFromStore = useSearchFiltersStore((state) => state.city)

  /**
   * Synchroniser le champ texte avec le store quand la ville change de l'extérieur.
   *
   * Cas typique : SearchPageClient lit ?city=Lyon dans l'URL et appelle setCity(),
   * mais le query local du SearchBar reste "" car il n'écoute pas le store en lecture.
   * Ce useEffect corrige ce décalage sans créer de boucle infinie :
   *   - handleSelect met d'abord setQuery puis setCity → après setCity, cityFromStore
   *     égale déjà query, donc la condition est fausse et setQuery n'est pas rappelé.
   *   - Depuis l'extérieur (URL params), cityFromStore devient non-vide alors que
   *     query est encore "" → la condition est vraie → setQuery affiche la ville.
   */
  useEffect(() => {
    if (cityFromStore && query !== cityFromStore) {
      setQuery(cityFromStore)
    }
    // Intentionnellement sans `query` en dep : on veut juste réagir aux changements
    // du store, pas re-déclencher l'effet à chaque frappe de l'utilisateur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityFromStore])

  // Ouvrir le dropdown quand il y a des suggestions
  useEffect(() => {
    if (suggestions.length > 0 && query.length >= 2) {
      setIsOpen(true)
    }
  }, [suggestions, query])

  /**
   * Selectionner une suggestion : mettre a jour le store et fermer le dropdown
   */
  const handleSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      setQuery(suggestion.city)
      setIsOpen(false)
      setHighlightedIndex(-1)
      // Mettre a jour le store Zustand avec ville + coordonnees
      setCity(suggestion.city, suggestion.latitude, suggestion.longitude)
      // Callback optionnel (ex: redirection depuis la page d'accueil)
      onCitySelected?.(suggestion.city, suggestion.latitude, suggestion.longitude)
    },
    [setCity, onCitySelected]
  )

  /**
   * Navigation clavier dans le dropdown
   * - Fleche bas : descendre dans la liste
   * - Fleche haut : monter dans la liste
   * - Entree : selectionner la suggestion survolee
   * - Echap : fermer le dropdown
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          )
          break
        case "Enter":
          e.preventDefault()
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            handleSelect(suggestions[highlightedIndex])
          }
          break
        case "Escape":
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    },
    [isOpen, suggestions, highlightedIndex, handleSelect]
  )

  /**
   * Fermer le dropdown quand on clique en dehors
   */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isHero = variant === "hero"

  return (
    <div className="relative w-full">
      {/* Champ de saisie avec icone */}
      <div className="relative">
        <MapPin
          className={cn(
            "absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground",
            isHero ? "h-5 w-5" : "h-4 w-4"
          )}
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Rechercher une ville..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlightedIndex(-1)
            if (e.target.value.length < 2) setIsOpen(false)
          }}
          onFocus={() => {
            if (suggestions.length > 0 && query.length >= 2) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "pl-10",
            isHero && "h-14 text-lg pl-12"
          )}
          aria-label="Rechercher une ville"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
        {/* Indicateur de chargement */}
        {isLoading && (
          <Loader2
            className={cn(
              "absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-muted-foreground",
              isHero ? "h-5 w-5" : "h-4 w-4"
            )}
          />
        )}
        {!isLoading && query.length >= 2 && (
          <Search
            className={cn(
              "absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground",
              isHero ? "h-5 w-5" : "h-4 w-4"
            )}
          />
        )}
      </div>

      {/* Dropdown de suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.latitude}-${suggestion.longitude}`}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                index === highlightedIndex && "bg-accent",
                index === 0 && "rounded-t-md",
                index === suggestions.length - 1 && "rounded-b-md"
              )}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
