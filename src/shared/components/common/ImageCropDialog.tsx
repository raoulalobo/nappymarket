/**
 * ImageCropDialog — Dialog de recadrage d'image avec zoom et deplacement
 *
 * Role : Encapsule react-easy-crop dans un Dialog shadcn/ui pour permettre
 *        a l'utilisateur de recadrer une image avant upload.
 *        L'utilisateur peut zoomer (slider) et deplacer (drag) la zone de crop.
 *
 * Interactions :
 *   - Recoit l'image source (objectURL) depuis ImageUpload
 *   - Utilise react-easy-crop pour la zone de recadrage interactive
 *   - Appelle getCroppedImage() (crop-image.ts) pour extraire la zone croppee
 *   - Retourne le File JPEG croppe via onCropComplete au composant parent
 *
 * Exemple :
 *   <ImageCropDialog
 *     imageSrc="blob:http://localhost:3000/abc123"
 *     open={true}
 *     onOpenChange={setOpen}
 *     onCropComplete={(croppedFile) => uploadImage(croppedFile)}
 *     aspectRatio={16 / 9}
 *     fileName="categorie-tresses.jpg"
 *   />
 */
"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"
import { Loader2, ZoomIn, ZoomOut } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { getCroppedImage } from "@/shared/lib/crop-image"

interface ImageCropDialogProps {
  /** URL de l'image a recadrer (objectURL ou data URL) */
  imageSrc: string | null
  /** Controle l'ouverture/fermeture du dialog */
  open: boolean
  /** Callback de changement d'etat du dialog */
  onOpenChange: (open: boolean) => void
  /** Callback appele avec le File JPEG croppe apres validation */
  onCropComplete: (croppedFile: File) => void
  /** Ratio d'aspect de la zone de crop (ex: 16/9, 1 pour carre). Defaut: libre */
  aspectRatio?: number
  /** Nom du fichier de sortie. Defaut: "cropped-image.jpg" */
  fileName?: string
}

export function ImageCropDialog({
  imageSrc,
  open,
  onOpenChange,
  onCropComplete,
  aspectRatio,
  fileName = "cropped-image.jpg",
}: ImageCropDialogProps) {
  // --- Etat du cropper (position et zoom) ---
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  // Zone de crop en pixels (mise a jour par react-easy-crop a chaque changement)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  // Indicateur de traitement en cours (extraction Canvas)
  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * Callback appele par react-easy-crop a chaque modification de la zone de crop.
   * Stocke la zone en pixels pour l'extraction finale.
   */
  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels)
    },
    []
  )

  /**
   * Valider le recadrage : extraire la zone croppee via Canvas,
   * puis transmettre le File au composant parent.
   */
  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return

    setIsProcessing(true)
    try {
      const croppedFile = await getCroppedImage(
        imageSrc,
        croppedAreaPixels,
        fileName
      )
      onCropComplete(croppedFile)
    } catch {
      toast.error("Erreur lors du recadrage de l'image")
    } finally {
      setIsProcessing(false)
    }
  }, [imageSrc, croppedAreaPixels, fileName, onCropComplete])

  /**
   * Reinitialiser l'etat interne quand le dialog se ferme.
   */
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        // Reset du zoom et de la position au prochain ouverture
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setCroppedAreaPixels(null)
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recadrer l&apos;image</DialogTitle>
          <DialogDescription>
            Deplacez et zoomez pour ajuster le cadrage, puis validez.
          </DialogDescription>
        </DialogHeader>

        {/* --- Zone de recadrage interactive --- */}
        {imageSrc && (
          <div className="relative h-[300px] w-full overflow-hidden rounded-md bg-muted sm:h-[400px]">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>
        )}

        {/* --- Slider de zoom avec icones ZoomOut / ZoomIn --- */}
        <div className="flex items-center gap-3 px-1">
          <ZoomOut className="size-4 shrink-0 text-muted-foreground" />
          <Slider
            value={[zoom]}
            onValueChange={(values) => setZoom(values[0])}
            min={1}
            max={3}
            step={0.1}
            aria-label="Niveau de zoom"
          />
          <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
        </div>

        {/* --- Boutons Annuler / Valider --- */}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || !croppedAreaPixels}
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Recadrage...
              </>
            ) : (
              "Valider"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
