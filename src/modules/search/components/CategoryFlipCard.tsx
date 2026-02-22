/**
 * CategoryFlipCard — Carte de categorie avec animation flip CSS 3D
 *
 * Role : Afficher une categorie de coiffure en tant que carte image.
 *        Si la categorie a des sous-categories, un clic retourne la carte
 *        (animation CSS 3D flip) pour afficher la liste des sous-categories
 *        sur le verso. Sinon, la carte est un lien direct vers la recherche.
 *
 * Interactions :
 *   - Lit les donnees de categorie depuis ActiveCategoryWithChildren
 *     (fourni par getActiveCategories dans search-actions.ts)
 *   - Sous-categories : lien vers /recherche?categoryId=child.id
 *   - Lien "Voir tout" : /recherche?categoryId=parent.id
 *   - Aucune interaction avec les stores Zustand (composant autonome)
 *
 * Animation :
 *   - CSS 3D flip via Tailwind arbitrary values ([perspective:1000px],
 *     [transform-style:preserve-3d], [backface-visibility:hidden])
 *   - Duree : 500ms, easing : ease-in-out
 *   - Face avant : image + gradient + nom + compteur
 *   - Face arriere : liste des sous-categories + lien "Voir tout"
 *
 * Exemple :
 *   <CategoryFlipCard
 *     category={{ id: "abc", name: "Tresses", children: [...], ... }}
 *     imageSrc="/images/tresses.jpg"
 *     priority={true}
 *   />
 */
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { X, ChevronRight, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActiveCategoryWithChildren } from "../actions/search-actions"

// -------------------------------------------------------------------------- //
// Types                                                                        //
// -------------------------------------------------------------------------- //

interface CategoryFlipCardProps {
  /** Categorie racine avec ses sous-categories (peut etre un tableau vide) */
  category: ActiveCategoryWithChildren
  /** URL de l'image de fond (imageUrl BDD ou fallback cyclique) */
  imageSrc: string
  /** Priority pour Next/Image (true pour les premieres cartes du viewport) */
  priority?: boolean
}

// -------------------------------------------------------------------------- //
// Composant principal                                                          //
// -------------------------------------------------------------------------- //

export function CategoryFlipCard({
  category,
  imageSrc,
  priority = false,
}: CategoryFlipCardProps) {
  // Etat local : true = face arriere visible, false = face avant visible
  const [isFlipped, setIsFlipped] = useState(false)

  const hasChildren = category.children.length > 0

  // ------------------------------------------------------------------ //
  // Cas 1 : Categorie sans sous-categories — lien direct (comportement  //
  //          identique a l'implementation originale)                    //
  // ------------------------------------------------------------------ //
  if (!hasChildren) {
    return (
      <Link
        href={`/recherche?categoryId=${category.id}`}
        className="group"
      >
        {/* Carte image rectangulaire (paysage 3:2) */}
        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
          {/* Image de fond */}
          <Image
            src={imageSrc}
            alt={category.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Gradient overlay : noir en bas pour lisibilite du texte */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Contenu texte positionne en bas */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-base font-semibold text-white md:text-lg">
              {category.name}
            </h3>
            {category.serviceCount > 0 && (
              <p className="mt-0.5 text-xs text-white/80 md:text-sm">
                {category.serviceCount} prestation{category.serviceCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // ------------------------------------------------------------------ //
  // Cas 2 : Categorie avec sous-categories — flip card CSS 3D           //
  // ------------------------------------------------------------------ //
  return (
    // Conteneur perspective : cree l'effet de profondeur 3D
    // cursor-pointer car le clic retourne la carte (pas de <Link> ici)
    <div
      className="[perspective:1000px]"
      onClick={() => !isFlipped && setIsFlipped(true)}
      style={{ cursor: isFlipped ? "default" : "pointer" }}
      // Accessibilite : role button pour les lecteurs d'ecran
      role={isFlipped ? undefined : "button"}
      aria-label={isFlipped ? undefined : `Voir les sous-categories de ${category.name}`}
    >
      {/* Axe de rotation : transition de 500ms sur transform */}
      <div
        className={cn(
          "relative aspect-[3/2] rounded-2xl shadow-sm",
          // Transition uniquement sur le transform (evite les glitches)
          "transition-[transform] duration-500 ease-in-out",
          // preserve-3d : les enfants gardent leur position 3D
          "[transform-style:preserve-3d]",
          // Quand isFlipped : rotation de 180deg sur l'axe Y
          isFlipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* ============================================================= */}
        {/* FACE AVANT — Image + gradient + nom + badge sous-categories   */}
        {/* ============================================================= */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden]">
          {/* Image de fond */}
          <Image
            src={imageSrc}
            alt={category.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="object-cover transition-transform duration-500 hover:scale-105"
          />

          {/* Gradient overlay en bas pour le texte */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Badge "sous-categories" en haut a droite */}
          {/* Indique visuellement que la carte est interactive */}
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm">
            <Layers className="h-3 w-3 text-white" />
            <span className="text-[10px] font-medium text-white">
              {category.children.length}
            </span>
          </div>

          {/* Contenu texte positionne en bas */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-base font-semibold text-white md:text-lg">
              {category.name}
            </h3>
            {category.serviceCount > 0 && (
              <p className="mt-0.5 text-xs text-white/80 md:text-sm">
                {category.serviceCount} prestation{category.serviceCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* ============================================================= */}
        {/* FACE ARRIERE — Liste des sous-categories                      */}
        {/* rotateY(180deg) : pre-retournee pour etre visible apres flip  */}
        {/* ============================================================= */}
        <div
          className={cn(
            "absolute inset-0 overflow-hidden rounded-2xl",
            // Fond blanc avec grille fine cinnamon (#D4956A à 12% opacité)
            // Motif CSS pur : deux gradients perpendiculaires de 1px espacés de 20px
            "bg-card p-4 border border-border",
            "bg-[linear-gradient(oklch(0.72_0.1_55_/_0.12)_1px,transparent_1px),linear-gradient(to_right,oklch(0.72_0.1_55_/_0.12)_1px,transparent_1px)]",
            "[background-size:20px_20px]",
            // Cacher la face arriere quand on regarde la face avant
            "[backface-visibility:hidden]",
            // Pre-retournee : sera a l'endroit apres le flip de 180deg
            "[transform:rotateY(180deg)]"
          )}
          // Empecher le clic sur la face arriere de retourner a nouveau
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bouton fermeture (×) — retourne a la face avant */}
          <button
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/70 transition-colors"
            onClick={(e) => {
              e.stopPropagation() // Ne pas remonter au conteneur
              setIsFlipped(false)
            }}
            aria-label="Retourner la carte"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Titre : nom de la categorie parente */}
          <p className="mb-3 pr-8 text-sm font-semibold text-card-foreground">
            {category.name}
          </p>

          {/* Liste des sous-categories : chips cliquables */}
          <ul className="flex flex-col gap-1.5">
            {category.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/recherche?categoryId=${child.id}`}
                  className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-medium">{child.name}</span>
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Lien "Voir tout" — pointe vers la categorie racine */}
          <Link
            href={`/recherche?categoryId=${category.id}`}
            className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-primary/40 py-2 text-xs font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5"
            onClick={(e) => e.stopPropagation()}
          >
            Voir tout — {category.name}
          </Link>
        </div>
      </div>
    </div>
  )
}
