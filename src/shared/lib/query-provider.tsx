/**
 * QueryProvider — Provider TanStack Query
 *
 * Role : Fournir le QueryClient a toute l'application pour activer
 *        le cache, les queries et les mutations TanStack Query.
 *
 * Interactions :
 *   - Enveloppe l'application dans le layout racine (layout.tsx)
 *   - Les DevTools sont affiches uniquement en developpement
 *   - Le QueryClient est cree une seule fois et persiste entre les navigations
 *
 * Exemple :
 *   <QueryProvider>{children}</QueryProvider>
 */
"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Creer le QueryClient une seule fois par instance du composant
  // (evite de recreer le cache a chaque render)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Les donnees sont considerees "fraiches" pendant 1 minute
            staleTime: 60 * 1000,
            // Garder les donnees en cache 5 minutes apres le dernier usage
            gcTime: 5 * 60 * 1000,
            // Ne pas refetcher quand la fenetre reprend le focus (evite les fetches inutiles)
            refetchOnWindowFocus: false,
            // Reessayer 1 fois en cas d'erreur reseau
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools TanStack Query — visible uniquement en dev (bouton flottant) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
