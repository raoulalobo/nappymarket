/**
 * CategoryCityModal — Modal de sélection de ville avant redirection vers la recherche
 *
 * Rôle : Demander à l'utilisateur de choisir une ville AVANT de le rediriger vers
 *        /recherche avec les paramètres city, lat, lng et categoryId pré-remplis.
 *        Sans ces coordonnées, la requête Haversine (SQL) retourne 0 résultat.
 *
 * Interactions :
 *   - Utilise SearchBar avec prop onCitySelected (callback déclenché après sélection
 *     d'une suggestion Mapbox) pour récupérer city, lat, lng.
 *   - Utilise Dialog / DialogContent de shadcn/ui (identique au pattern ContactModal).
 *   - Redirige via useRouter (next/navigation) vers /recherche avec les paramètres.
 *
 * Exemple d'utilisation :
 *   <CategoryCityModal
 *     open={modalOpen}
 *     onOpenChange={setModalOpen}
 *     categoryId="clxxx123"
 *     categoryName="Tresses"
 *   />
 *
 * URL de redirection produite :
 *   /recherche?city=Lyon&lat=45.764&lng=4.835&categoryId=clxxx123
 */
"use client"

import { useRouter } from "next/navigation"
import { MapPin } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { SearchBar } from "./SearchBar"

// -------------------------------------------------------------------------- //
// Types                                                                        //
// -------------------------------------------------------------------------- //

interface CategoryCityModalProps {
  /** Contrôle l'ouverture / fermeture du Dialog (état géré par le parent) */
  open: boolean
  /** Callback shadcn appelé quand l'état d'ouverture change (clic hors modal, Échap...) */
  onOpenChange: (open: boolean) => void
  /** ID de la catégorie (ou sous-catégorie) sélectionnée — passé en query param */
  categoryId: string
  /** Nom affiché dans le sous-titre du modal pour contextualiser la recherche */
  categoryName: string
}

// -------------------------------------------------------------------------- //
// Composant principal                                                          //
// -------------------------------------------------------------------------- //

export function CategoryCityModal({
  open,
  onOpenChange,
  categoryId,
  categoryName,
}: CategoryCityModalProps) {
  const router = useRouter()

  /**
   * handleCitySelected — Déclenché par SearchBar après sélection d'une suggestion.
   *
   * Ferme le modal immédiatement, puis redirige vers /recherche avec :
   *   - city  : nom de la ville sélectionnée (ex: "Lyon")
   *   - lat   : latitude GPS (ex: 45.7640)
   *   - lng   : longitude GPS (ex: 4.8357)
   *   - categoryId : ID de la catégorie cliquée depuis la FlipCard
   *
   * @param city  Nom de la ville retourné par Mapbox Geocoding
   * @param lat   Latitude GPS retournée par Mapbox Geocoding
   * @param lng   Longitude GPS retournée par Mapbox Geocoding
   */
  function handleCitySelected(city: string, lat: number, lng: number) {
    // Fermer le modal avant la navigation pour éviter un flash
    onOpenChange(false)
    // Construire l'URL avec encodeURIComponent pour gérer les accents / espaces
    router.push(
      `/recherche?city=${encodeURIComponent(city)}&lat=${lat}&lng=${lng}&categoryId=${categoryId}`
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Largeur max identique au ContactModal (sm:max-w-md = 448px)
        className="sm:max-w-md"
        // stopPropagation implicite : Dialog gère déjà l'isolation des événements
      >
        <DialogHeader>
          {/* Titre principal : action attendue de l'utilisateur */}
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Où cherchez-vous ?
          </DialogTitle>

          {/* Sous-titre : contextualise la prestation sélectionnée */}
          <DialogDescription>
            Indiquez votre ville pour trouver des coiffeuses proposant{" "}
            <span className="font-medium text-foreground">{categoryName}</span>{" "}
            près de chez vous.
          </DialogDescription>
        </DialogHeader>

        {/* SearchBar avec autocomplétion Mapbox — variante hero pour plus de lisibilité */}
        {/* onCitySelected déclenche la redirection dès qu'une ville est sélectionnée */}
        <div className="py-2">
          <SearchBar
            variant="hero"
            onCitySelected={handleCitySelected}
          />
        </div>

        {/* Note d'aide sous la barre de recherche */}
        <p className="text-center text-xs text-muted-foreground">
          Tapez au moins 2 caractères pour voir les suggestions
        </p>
      </DialogContent>
    </Dialog>
  )
}
