/**
 * SearchMapInner — Composant interne de la carte Leaflet
 *
 * Role : Rendre la carte OpenStreetMap avec les marqueurs des coiffeuses.
 *        Ce fichier est separe de SearchMap.tsx pour permettre les imports
 *        CSS au top-level (requis par Turbopack, qui ne supporte pas
 *        require() de CSS dans le corps d'une fonction).
 *
 * IMPORTANT : Ne pas importer ce fichier directement.
 *   Utiliser SearchMapDynamic depuis SearchMap.tsx (charge via next/dynamic, ssr: false).
 *
 * Interactions :
 *   - CSS Leaflet importe au top-level (compatible Turbopack)
 *   - leaflet-setup importe pour corriger les icones manquantes
 *   - Lit les coordonnees et rayon depuis le store Zustand
 *   - Lit les resultats depuis useSearchStylists (TanStack Query)
 *   - MapContainer, TileLayer, Marker, Popup, Circle de react-leaflet
 */
"use client"

// Imports CSS Leaflet au top-level — necessaire pour Turbopack
// Le fichier est charge dynamiquement (ssr: false) donc pas de probleme SSR
import "leaflet/dist/leaflet.css"
import "./leaflet-setup"

import { useMemo, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import { useSearchFiltersStore } from "@/shared/stores/search-filters-store"
import { useSearchStylists } from "../hooks/useSearchStylists"

/** Centre de la France par defaut (quand aucune ville n'est selectionnee) */
const FRANCE_CENTER: [number, number] = [46.603354, 1.888334]
const DEFAULT_ZOOM = 6

/**
 * RecenterMap — Recentre la carte quand les coordonnees ou le zoom changent
 *
 * Utilise le hook useMap() de react-leaflet pour acceder a l'instance Leaflet.
 * Doit etre un enfant de <MapContainer>.
 */
function RecenterMap({ lat, lng, zoom }: { lat: number | null; lng: number | null; zoom: number }) {
  const map = useMap()

  useEffect(() => {
    if (lat !== null && lng !== null) {
      map.setView([lat, lng], zoom)
    }
  }, [map, lat, lng, zoom])

  return null
}

/**
 * Calculer le niveau de zoom en fonction du rayon de recherche
 * Plus le rayon est grand, plus on dezoome
 */
function getZoomFromRadius(radiusKm: number): number {
  if (radiusKm <= 5) return 13
  if (radiusKm <= 10) return 12
  if (radiusKm <= 20) return 11
  if (radiusKm <= 30) return 10
  return 9
}

export function SearchMapInner() {
  const { latitude, longitude, radiusKm } = useSearchFiltersStore()
  const { data } = useSearchStylists()

  // Centre de la carte : coordonnees du store ou centre de la France
  const center = useMemo<[number, number]>(
    () =>
      latitude !== null && longitude !== null
        ? [latitude, longitude]
        : FRANCE_CENTER,
    [latitude, longitude]
  )

  // Zoom adapte au rayon de recherche
  const zoom = useMemo(
    () => (latitude !== null ? getZoomFromRadius(radiusKm) : DEFAULT_ZOOM),
    [latitude, radiusKm]
  )

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full rounded-lg"
      scrollWheelZoom={true}
    >
      {/* Tuiles OpenStreetMap (fond de carte) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Recentrer la carte quand les filtres changent */}
      <RecenterMap lat={latitude} lng={longitude} zoom={zoom} />

      {/* Cercle representant le rayon de recherche */}
      {latitude !== null && longitude !== null && (
        <Circle
          center={[latitude, longitude]}
          radius={radiusKm * 1000} // Leaflet attend des metres
          pathOptions={{
            color: "hsl(var(--primary))",
            fillColor: "hsl(var(--primary))",
            fillOpacity: 0.1,
            weight: 2,
          }}
        />
      )}

      {/* Marqueurs des coiffeuses trouvees */}
      {data?.stylists.map((stylist) => (
        <Marker
          key={stylist.id}
          position={[stylist.latitude, stylist.longitude]}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{stylist.userName}</p>
              <p className="text-muted-foreground">
                {stylist.city} &middot; {stylist.distanceKm} km
              </p>
              {stylist.priceMin !== null && (
                <p className="mt-1">
                  A partir de {(stylist.priceMin / 100).toFixed(0)}&nbsp;&euro;
                </p>
              )}
              <a
                href={`/coiffeuse/${stylist.id}`}
                className="mt-1 inline-block text-primary underline"
              >
                Voir le profil
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
