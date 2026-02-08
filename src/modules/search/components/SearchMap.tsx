/**
 * SearchMap — Carte Leaflet interactive des coiffeuses
 *
 * Role : Afficher les coiffeuses trouvees sur une carte OpenStreetMap avec
 *        des marqueurs cliquables et un cercle representant le rayon de recherche.
 *        Charge dynamiquement via next/dynamic avec ssr: false (Leaflet ne
 *        fonctionne pas cote serveur).
 *
 * Interactions :
 *   - Recoit les resultats de useSearchStylists (via SearchPageClient)
 *   - Centre la carte sur les coordonnees du store Zustand (search-filters-store)
 *   - Chaque marqueur ouvre un popup avec nom, distance et lien vers le profil
 *   - Le cercle bleu indique le rayon de recherche
 *   - Importe leaflet-setup pour corriger les icones manquantes
 *
 * Architecture :
 *   - SearchMapInner est dans un fichier separe (SearchMapInner.tsx) pour
 *     permettre les imports CSS top-level compatibles Turbopack
 *   - SearchMapDynamic est l'export principal, charge dynamiquement sans SSR
 *
 * Exemple :
 *   import { SearchMapDynamic } from "./SearchMap"
 *   <SearchMapDynamic />
 */
"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * SearchMapDynamic — Export dynamique de la carte (SSR desactive)
 *
 * Charge SearchMapInner dynamiquement pour eviter les erreurs SSR de Leaflet
 * (utilise window/document). Le CSS Leaflet est importe dans SearchMapInner.tsx
 * au top-level, ce qui est compatible avec Turbopack.
 */
export const SearchMapDynamic = dynamic(
  () => import("./SearchMapInner").then((mod) => mod.SearchMapInner),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-full w-full rounded-lg" />
    ),
  }
)
