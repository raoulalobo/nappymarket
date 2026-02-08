/**
 * PortfolioManager — Gestionnaire du portfolio photos de la coiffeuse
 *
 * Role : Permettre a une coiffeuse de gerer son portfolio de photos.
 *        Elle peut ajouter des photos (jusqu'a MAX_PORTFOLIO_IMAGES),
 *        visualiser sa grille de photos et supprimer des photos existantes.
 *
 * Interactions :
 *   - Utilise usePortfolio() pour charger les images existantes
 *   - Utilise useAddPortfolioImage() pour ajouter une image apres upload
 *   - Utilise useRemovePortfolioImage() pour supprimer une image (avec confirmation)
 *   - Utilise useSession() pour le userId (necessaire pour ImageUpload)
 *   - Le composant ImageUpload gere l'upload vers Supabase Storage (bucket "portfolio")
 *   - Limite a MAX_PORTFOLIO_IMAGES photos (constante globale = 20)
 *   - AlertDialog de shadcn pour confirmer avant suppression
 *
 * Exemple :
 *   // Dans la page /coiffeuse/portfolio
 *   import { PortfolioManager } from "@/modules/stylist/components/PortfolioManager"
 *   <PortfolioManager />
 */
"use client"

import { useState } from "react"
import Image from "next/image"
import { Trash2, ImagePlus } from "lucide-react"

/* Composants shadcn/ui */
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

/* Composant commun d'upload d'image */
import { ImageUpload } from "@/shared/components/common/ImageUpload"

/* Hooks de gestion du portfolio (TanStack Query) */
import {
  usePortfolio,
  useAddPortfolioImage,
  useRemovePortfolioImage,
} from "@/modules/stylist/hooks/usePortfolio"

/* Hook de session pour obtenir le userId */
import { useSession } from "@/modules/auth/hooks/useSession"

/* Constante globale : nombre max de photos dans le portfolio */
import { MAX_PORTFOLIO_IMAGES } from "@/shared/lib/constants"

/**
 * PortfolioManager
 *
 * Composant client affichant une grille responsive de photos
 * avec ajout (ImageUpload) et suppression (AlertDialog de confirmation).
 */
export function PortfolioManager() {
  /* ------------------------------------------------------------------ */
  /* Hooks : session, portfolio, mutations                              */
  /* ------------------------------------------------------------------ */

  /** Recuperer l'utilisateur connecte (pour le userId de l'upload) */
  const { user } = useSession()

  /** Charger les images du portfolio depuis le serveur */
  const { images, isLoading: isLoadingPortfolio } = usePortfolio()

  /** Mutation pour ajouter une image au portfolio en base */
  const { addImage, isAdding } = useAddPortfolioImage()

  /** Mutation pour supprimer une image du portfolio */
  const { removeImage, isRemoving } = useRemovePortfolioImage()

  /* ------------------------------------------------------------------ */
  /* Etat local : gerer l'affichage du composant d'upload               */
  /* ------------------------------------------------------------------ */

  /**
   * showUpload controle la visibilite du composant ImageUpload.
   * On l'affiche quand l'utilisateur clique sur "Ajouter une photo",
   * et on le masque apres un upload reussi.
   */
  const [showUpload, setShowUpload] = useState(false)

  /* ------------------------------------------------------------------ */
  /* Verifier si le portfolio a atteint la limite                       */
  /* ------------------------------------------------------------------ */

  /** true si le nombre de photos a atteint le maximum autorise */
  const isPortfolioFull = images.length >= MAX_PORTFOLIO_IMAGES

  /* ------------------------------------------------------------------ */
  /* Callback d'upload termine                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Appele par ImageUpload quand l'upload vers Supabase est termine.
   * Enregistre l'URL de l'image en base via la server action.
   * Exemple : url = "https://supabase.../portfolio/user-123/photo.jpg"
   */
  async function handleUploadComplete(url: string) {
    await addImage({ url })
    setShowUpload(false)
  }

  /* ------------------------------------------------------------------ */
  /* Callback de suppression d'une image                                */
  /* ------------------------------------------------------------------ */

  /**
   * Supprime une image du portfolio apres confirmation.
   * Le toast de succes/erreur est gere dans le hook useRemovePortfolioImage.
   * Exemple : handleRemoveImage("image-uuid-123")
   */
  async function handleRemoveImage(imageId: string) {
    await removeImage(imageId)
  }

  /* ------------------------------------------------------------------ */
  /* Etat de chargement : afficher des Skeleton                         */
  /* ------------------------------------------------------------------ */

  if (isLoadingPortfolio) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          {/* Grille de Skeleton simulant les photos */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                className="aspect-square w-full rounded-lg"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  /* ------------------------------------------------------------------ */
  /* Rendu principal                                                    */
  /* ------------------------------------------------------------------ */

  return (
    <Card className="w-full max-w-4xl mx-auto">
      {/* En-tete avec titre, description et compteur */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Mon portfolio</CardTitle>
            <CardDescription>
              Ajoutez vos plus belles realisations pour attirer des clientes.
            </CardDescription>
          </div>

          {/* Compteur de photos : X / 20 */}
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {images.length} / {MAX_PORTFOLIO_IMAGES}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ----- Bouton "Ajouter une photo" + zone d'upload ----- */}
        {!isPortfolioFull && user && (
          <div>
            {showUpload ? (
              <div className="max-w-sm">
                <ImageUpload
                  bucket="portfolio"
                  userId={user.id}
                  onUploadComplete={handleUploadComplete}
                  label="Selectionner une photo"
                  variant="rectangle"
                />
                {/* Bouton pour annuler et masquer l'upload */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowUpload(false)}
                >
                  Annuler
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUpload(true)}
                disabled={isAdding}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                Ajouter une photo
              </Button>
            )}
          </div>
        )}

        {/* Message si le portfolio est plein */}
        {isPortfolioFull && (
          <p className="text-sm text-muted-foreground">
            Vous avez atteint le nombre maximum de photos ({MAX_PORTFOLIO_IMAGES}).
            Supprimez une photo pour en ajouter une nouvelle.
          </p>
        )}

        {/* ----- Grille de photos du portfolio ----- */}
        {images.length === 0 ? (
          /* Etat vide : aucune photo */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImagePlus className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Aucune photo dans votre portfolio.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez vos premieres realisations pour montrer votre talent !
            </p>
          </div>
        ) : (
          /* Grille responsive : 2 colonnes mobile, 3 tablette, 4 desktop */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-lg border"
              >
                {/* Image du portfolio */}
                <Image
                  src={image.url}
                  alt={image.caption ?? "Photo du portfolio"}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* Overlay avec bouton de suppression (visible au hover) */}
                <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  {/* AlertDialog de confirmation avant suppression */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="m-2 h-8 w-8"
                        disabled={isRemoving}
                        aria-label="Supprimer cette photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Supprimer cette photo ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irreversible. La photo sera
                          definitivement supprimee de votre portfolio.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        {/* Bouton annuler : ferme le dialog sans action */}
                        <AlertDialogCancel>Annuler</AlertDialogCancel>

                        {/* Bouton confirmer : supprime la photo */}
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => handleRemoveImage(image.id)}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
