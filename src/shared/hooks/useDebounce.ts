/**
 * useDebounce — Hook generique de debounce
 *
 * Role : Retarder la mise a jour d'une valeur pour eviter des appels
 *        excessifs (autocompletion, recherche, filtres en temps reel).
 *
 * Interactions :
 *   - Utilise par useAddressAutocomplete (module search) pour debouncer
 *     les requetes vers l'API Adresse Gouv
 *   - Peut etre utilise par tout composant qui a besoin d'un debounce
 *
 * Exemple :
 *   const [query, setQuery] = useState("")
 *   const debouncedQuery = useDebounce(query, 300)
 *   // debouncedQuery se met a jour 300ms apres le dernier changement de query
 */
"use client"

import { useState, useEffect } from "react"

/**
 * useDebounce — Retarde la mise a jour d'une valeur
 *
 * @param value - La valeur a debouncer
 * @param delayMs - Le delai en millisecondes (defaut: 300ms)
 * @returns La valeur debouncee
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Programmer la mise a jour apres le delai
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    // Annuler le timer si la valeur change avant la fin du delai
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
}
