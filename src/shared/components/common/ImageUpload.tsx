/**
 * ImageUpload — Composant d'upload d'image reutilisable
 *
 * Role : Permettre l'upload d'images vers Supabase Storage avec
 *        preview, validation (taille, type) et feedback visuel.
 *        Supporte un recadrage optionnel (crop) via react-easy-crop
 *        avant l'upload (active par la prop `enableCrop`).
 *
 * Interactions :
 *   - Utilise uploadImage() de @/shared/lib/supabase/storage
 *   - Valide le type et la taille du fichier avant upload
 *   - Affiche un apercu de l'image selectionnee
 *   - Appelle onUploadComplete avec l'URL apres upload reussi
 *   - Si enableCrop=true, ouvre ImageCropDialog entre la selection et l'upload
 *
 * Exemple (sans crop — avatar/portfolio) :
 *   <ImageUpload
 *     bucket="portfolio"
 *     userId="user-123"
 *     onUploadComplete={(url) => console.log("Image uploadee:", url)}
 *     maxSizeMB={5}
 *   />
 *
 * Exemple (avec crop — categories admin, ratio 16:9) :
 *   <ImageUpload
 *     bucket="categories"
 *     pathPrefix="categories"
 *     onUploadComplete={(url) => setImageUrl(url)}
 *     enableCrop
 *     cropAspectRatio={16 / 9}
 *   />
 */
"use client"

import { useRef, useState, useCallback } from "react"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  uploadImage,
  generateStoragePath,
  type StorageBucket,
} from "@/shared/lib/supabase/storage"
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/shared/lib/constants"
import { ImageCropDialog } from "@/shared/components/common/ImageCropDialog"

interface ImageUploadProps {
  /** Bucket Supabase Storage cible */
  bucket: StorageBucket
  /** ID de l'utilisateur (pour le chemin de stockage). Requis sauf si pathPrefix est fourni. */
  userId?: string
  /** Prefixe de chemin alternatif (ex: "categories"). Remplace userId dans le chemin. */
  pathPrefix?: string
  /** Callback appele apres upload reussi avec l'URL publique */
  onUploadComplete: (url: string) => void
  /** URL de l'image actuelle (pour afficher un apercu existant) */
  currentImageUrl?: string | null
  /** Taille max en Mo (defaut: 5) */
  maxSizeMB?: number
  /** Texte du bouton */
  label?: string
  /** Forme ronde (pour avatar) ou rectangulaire (pour portfolio) */
  variant?: "avatar" | "rectangle"
  /** Classes CSS additionnelles */
  className?: string
  /** Activer le recadrage avant upload (defaut: false) */
  enableCrop?: boolean
  /** Ratio d'aspect du crop (ex: 16/9, 1 pour carre). Defaut: libre */
  cropAspectRatio?: number
}

export function ImageUpload({
  bucket,
  userId,
  pathPrefix,
  onUploadComplete,
  currentImageUrl,
  maxSizeMB = 5,
  label = "Choisir une image",
  variant = "rectangle",
  className = "",
  enableCrop = false,
  cropAspectRatio,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Etat specifique au crop ---
  // ObjectURL de l'image source pour le dialog de crop
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [imageSrcToCrop, setImageSrcToCrop] = useState<string | null>(null)
  // Nom original du fichier selectionne (utilise pour nommer le fichier croppe)
  const [originalFileName, setOriginalFileName] = useState<string>("")

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  /**
   * Logique d'upload extraite pour eviter la duplication.
   * Appele soit directement apres selection (sans crop),
   * soit apres validation du crop dialog.
   */
  const performUpload = useCallback(
    async (file: File) => {
      setIsUploading(true)
      try {
        // Utiliser pathPrefix si fourni (ex: "categories"), sinon userId
        const prefix = pathPrefix ?? userId ?? ""
        const path = generateStoragePath(prefix, file.name)
        const result = await uploadImage(bucket, file, path)

        if ("error" in result) {
          toast.error("Erreur lors de l'upload : " + result.error)
          setPreview(currentImageUrl ?? null)
          return
        }

        // Appeler le callback parent avec l'URL publique
        onUploadComplete(result.url)
        toast.success("Image uploadee avec succes")
      } catch {
        toast.error("Erreur inattendue lors de l'upload")
        setPreview(currentImageUrl ?? null)
      } finally {
        setIsUploading(false)
        // Reset l'input pour permettre de re-selectionner le meme fichier
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    },
    [bucket, userId, pathPrefix, currentImageUrl, onUploadComplete]
  )

  /**
   * Gerer la selection d'un fichier.
   * Valide le type et la taille, puis :
   * - Si enableCrop=true  : ouvre le dialog de crop (pas d'upload immédiat)
   * - Si enableCrop=false : lance l'upload directement (comportement historique)
   */
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Valider le type MIME
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Format non supporte. Utilisez JPG, PNG ou WebP.")
      return
    }

    // Valider la taille
    if (file.size > maxSizeBytes) {
      toast.error(`L'image ne doit pas depasser ${maxSizeMB} Mo`)
      return
    }

    if (enableCrop) {
      // --- Mode crop : ouvrir le dialog sans uploader ---
      const objectUrl = URL.createObjectURL(file)
      setImageSrcToCrop(objectUrl)
      setOriginalFileName(file.name)
      setCropDialogOpen(true)
      // Reset l'input pour permettre de re-selectionner le meme fichier
      if (fileInputRef.current) fileInputRef.current.value = ""
    } else {
      // --- Mode direct : afficher le preview et uploader immediatement ---
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      await performUpload(file)
    }
  }

  /**
   * Callback appele par ImageCropDialog apres validation du recadrage.
   * Recoit le File JPEG croppe, affiche le preview, lance l'upload.
   */
  const handleCropComplete = useCallback(
    async (croppedFile: File) => {
      // Fermer le dialog de crop
      setCropDialogOpen(false)

      // Liberer l'objectURL source (nettoyage memoire)
      if (imageSrcToCrop) {
        URL.revokeObjectURL(imageSrcToCrop)
        setImageSrcToCrop(null)
      }

      // Afficher le preview du fichier croppe
      const croppedPreview = URL.createObjectURL(croppedFile)
      setPreview(croppedPreview)

      // Lancer l'upload
      await performUpload(croppedFile)
    },
    [imageSrcToCrop, performUpload]
  )

  /**
   * Callback d'annulation / fermeture du dialog de crop.
   * Libere l'objectURL source pour eviter les fuites memoire.
   */
  const handleCropDialogChange = useCallback(
    (open: boolean) => {
      setCropDialogOpen(open)
      if (!open && imageSrcToCrop) {
        URL.revokeObjectURL(imageSrcToCrop)
        setImageSrcToCrop(null)
      }
    },
    [imageSrcToCrop]
  )

  /** Supprimer l'apercu (ne supprime pas de Supabase) */
  function clearPreview() {
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Classes conditionnelles selon le variant
  const containerClasses =
    variant === "avatar"
      ? "relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed"
      : "relative flex h-48 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed"

  return (
    <div className={`${className}`}>
      <div
        className={`${containerClasses} ${
          isUploading ? "border-primary/50" : "border-muted-foreground/25"
        } transition-colors hover:border-primary/50`}
      >
        {/* Apercu de l'image */}
        {preview ? (
          <>
            <img
              src={preview}
              alt="Apercu"
              className="h-full w-full object-cover"
            />
            {/* Bouton supprimer l'apercu */}
            {!isUploading && (
              <button
                onClick={clearPreview}
                className="absolute top-1 right-1 rounded-full bg-background/80 p-1 backdrop-blur-sm hover:bg-background"
                type="button"
                aria-label="Supprimer l'image"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          // Placeholder : cliquer pour selectionner
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-4 text-muted-foreground"
            type="button"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <ImageIcon className="h-8 w-8" />
            )}
            <span className="text-xs text-center">
              {isUploading ? "Upload en cours..." : "JPG, PNG ou WebP"}
            </span>
          </button>
        )}

        {/* Overlay de chargement */}
        {isUploading && preview && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Input file cache */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Selectionner une image"
      />

      {/* Bouton visible pour changer/ajouter une image */}
      {!isUploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {preview ? "Changer l'image" : label}
        </Button>
      )}

      {/* Dialog de recadrage (affiche uniquement si enableCrop=true) */}
      {enableCrop && (
        <ImageCropDialog
          imageSrc={imageSrcToCrop}
          open={cropDialogOpen}
          onOpenChange={handleCropDialogChange}
          onCropComplete={handleCropComplete}
          aspectRatio={cropAspectRatio}
          fileName={originalFileName || "cropped-image.jpg"}
        />
      )}
    </div>
  )
}
