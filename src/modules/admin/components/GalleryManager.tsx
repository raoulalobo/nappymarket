/**
 * GalleryManager — Gestion de la galerie Inspirations (admin)
 *
 * Role : Permettre a l'administrateur de creer, modifier, masquer/afficher
 *        et supprimer des images de la galerie publique Inspirations.
 *        Affiche les images dans une grille de cards avec actions en ligne.
 *
 * Interactions :
 *   - useAdminGalleryImages()        : recupere la liste des images (TanStack Query)
 *   - useCreateGalleryImage()        : ajoute une nouvelle image
 *   - useUpdateGalleryImage()        : modifie une image existante
 *   - useToggleGalleryImageActive()  : bascule la visibilite (active/inactive)
 *   - useDeleteGalleryImage()        : supprime une image apres confirmation
 *   - React Hook Form                : gestion du formulaire du dialog
 *   - ImageUpload                    : upload d'image vers Supabase Storage (bucket "gallery")
 *   - Dialog shadcn/ui               : formulaire d'ajout/edition en modale
 *   - AlertDialog shadcn/ui          : confirmation avant suppression
 *
 * Exemple :
 *   import { GalleryManager } from "@/modules/admin/components/GalleryManager"
 *   <GalleryManager />
 */
"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { Loader2, Plus, Pencil, Trash2, ImageIcon, Eye, EyeOff } from "lucide-react"

// --- Composant d'upload d'image reutilisable ---
import { ImageUpload } from "@/shared/components/common/ImageUpload"

// --- Hooks admin pour les operations CRUD sur la galerie ---
import {
  useAdminGalleryImages,
  useCreateGalleryImage,
  useUpdateGalleryImage,
  useToggleGalleryImageActive,
  useDeleteGalleryImage,
} from "@/modules/admin/hooks/useAdminGallery"

// --- Composants shadcn/ui ---
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ---------------------------------------------------------------------------
// Types locaux
// ---------------------------------------------------------------------------

/**
 * Donnees du formulaire de creation/edition d'une image.
 * Le titre est obligatoire (min. 2 caracteres).
 */
interface GalleryFormValues {
  title: string
  description: string
  sortOrder: string // string pour l'Input, converti en number a la soumission
}

/**
 * Etat du dialog :
 * - mode "create" : formulaire vide pour une nouvelle image
 * - mode "edit"   : formulaire pre-rempli avec les donnees de l'image a modifier
 * - imageId       : identifiant de l'image en cours d'edition (null si creation)
 */
interface DialogState {
  open: boolean
  mode: "create" | "edit"
  imageId: string | null
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function GalleryManager() {
  // --- Donnees et mutations ---
  const { images, isLoading } = useAdminGalleryImages()
  const { createImage, isCreating } = useCreateGalleryImage()
  const { updateImage, isUpdating } = useUpdateGalleryImage()
  const { toggleActive, isToggling } = useToggleGalleryImageActive()
  const { deleteImage, isDeleting } = useDeleteGalleryImage()

  // --- Etat du dialog de creation/edition ---
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    mode: "create",
    imageId: null,
  })

  // --- URL de l'image (stockee apres upload via ImageUpload) ---
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // --- Etat du dialog de confirmation de suppression ---
  const [deleteTarget, setDeleteTarget] = useState<{
    open: boolean
    id: string
    title: string
  }>({ open: false, id: "", title: "" })

  // --- Configuration React Hook Form ---
  const form = useForm<GalleryFormValues>({
    defaultValues: { title: "", description: "", sortOrder: "0" },
  })

  // --- Ouvrir le dialog en mode "creation" ---
  const openCreateDialog = useCallback(() => {
    form.reset({ title: "", description: "", sortOrder: "0" })
    setImageUrl(null)
    setDialogState({ open: true, mode: "create", imageId: null })
  }, [form])

  // --- Ouvrir le dialog en mode "edition" avec les valeurs pre-remplies ---
  const openEditDialog = useCallback(
    (image: {
      id: string
      title: string
      description?: string | null
      imageUrl: string
      sortOrder: number
    }) => {
      form.reset({
        title: image.title,
        description: image.description ?? "",
        sortOrder: String(image.sortOrder),
      })
      setImageUrl(image.imageUrl)
      setDialogState({ open: true, mode: "edit", imageId: image.id })
    },
    [form]
  )

  // --- Fermer le dialog et reinitialiser le formulaire ---
  const closeDialog = useCallback(() => {
    setDialogState({ open: false, mode: "create", imageId: null })
    form.reset({ title: "", description: "", sortOrder: "0" })
    setImageUrl(null)
  }, [form])

  // --- Soumission du formulaire (creation ou edition) ---
  const onSubmit = useCallback(
    async (data: GalleryFormValues) => {
      const sortOrder = parseInt(data.sortOrder, 10) || 0

      if (dialogState.mode === "create") {
        // L'image est obligatoire pour la creation
        if (!imageUrl) {
          form.setError("title", { message: "Veuillez uploader une image" })
          return
        }
        await createImage({
          title: data.title,
          description: data.description || undefined,
          imageUrl,
          sortOrder,
        })
      } else if (dialogState.imageId) {
        // En edition, l'image est deja presente (mais peut etre changee)
        await updateImage({
          id: dialogState.imageId,
          input: {
            title: data.title,
            description: data.description || null,
            ...(imageUrl && { imageUrl }),
            sortOrder,
          },
        })
      }
      closeDialog()
    },
    [dialogState, createImage, updateImage, closeDialog, imageUrl, form]
  )

  // --- Confirmer la suppression d'une image ---
  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget.id) {
      await deleteImage(deleteTarget.id)
      setDeleteTarget({ open: false, id: "", title: "" })
    }
  }, [deleteTarget.id, deleteImage])

  // Indique si le formulaire est en cours de soumission
  const isSubmitting = isCreating || isUpdating

  // -------------------------------------------------------------------------
  // Rendu : Skeleton de chargement
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          {/* Skeleton de la grille (6 cards simulees) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // -------------------------------------------------------------------------
  // Rendu principal
  // -------------------------------------------------------------------------
  return (
    <TooltipProvider>
      <Card>
        {/* --- En-tete de la carte --- */}
        <CardHeader>
          <CardTitle className="text-xl">Galerie Inspirations</CardTitle>
          <CardDescription>
            Gerez les images de la galerie publique visible sur la page
            Inspirations.
          </CardDescription>
          {/* Bouton d'ajout positionne en haut a droite grace a CardAction */}
          <CardAction>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Ajouter une image
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          {/* --- Etat vide : aucune image --- */}
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="mb-4 size-12 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">
                Aucune image dans la galerie pour le moment.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={openCreateDialog}
              >
                <Plus className="size-4" />
                Ajouter la premiere image
              </Button>
            </div>
          ) : (
            /* --- Grille d'images --- */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative overflow-hidden rounded-lg border bg-card"
                >
                  {/* Image avec ratio 4:3 */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                    {/* Overlay des badges (statut + ordre) */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <Badge
                        variant={image.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {image.isActive ? "Visible" : "Masquee"}
                      </Badge>
                      <Badge variant="outline" className="bg-background/80 text-xs">
                        #{image.sortOrder}
                      </Badge>
                    </div>
                  </div>

                  {/* Informations et actions */}
                  <div className="p-3">
                    {/* Titre */}
                    <h3 className="truncate text-sm font-medium">{image.title}</h3>
                    {/* Description tronquee */}
                    {image.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {image.description}
                      </p>
                    )}

                    {/* Actions : Masquer/Afficher, Modifier, Supprimer */}
                    <div className="mt-2 flex items-center gap-1">
                      {/* Bouton : Masquer/Afficher */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => toggleActive(image.id)}
                            disabled={isToggling}
                            aria-label={`${image.isActive ? "Masquer" : "Afficher"} l'image ${image.title}`}
                          >
                            {image.isActive ? (
                              <EyeOff className="size-3.5" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {image.isActive ? "Masquer" : "Afficher"}
                        </TooltipContent>
                      </Tooltip>

                      {/* Bouton : Modifier */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => openEditDialog(image)}
                            aria-label={`Modifier l'image ${image.title}`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Modifier</TooltipContent>
                      </Tooltip>

                      {/* Bouton : Supprimer */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              setDeleteTarget({
                                open: true,
                                id: image.id,
                                title: image.title,
                              })
                            }
                            aria-label={`Supprimer l'image ${image.title}`}
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Supprimer</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* Dialog : Formulaire de creation / edition d'une image              */}
      {/* ================================================================= */}
      <Dialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogState.mode === "create"
                ? "Ajouter une image"
                : "Modifier l'image"}
            </DialogTitle>
            <DialogDescription>
              {dialogState.mode === "create"
                ? "Ajoutez une nouvelle image a la galerie Inspirations."
                : "Modifiez les informations de cette image."}
            </DialogDescription>
          </DialogHeader>

          {/* Formulaire React Hook Form */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Champ : Image (upload obligatoire pour la creation) */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Image{" "}
                  {dialogState.mode === "create" && (
                    <span className="text-destructive">*</span>
                  )}
                </label>
                <ImageUpload
                  bucket="gallery"
                  pathPrefix="gallery"
                  currentImageUrl={imageUrl}
                  onUploadComplete={(url) => setImageUrl(url)}
                  label="Choisir une image"
                  variant="rectangle"
                  enableCrop
                  cropAspectRatio={4 / 3}
                />
              </div>

              {/* Champ : Titre de l'image (obligatoire, min 2 caracteres) */}
              <FormField
                control={form.control}
                name="title"
                rules={{
                  required: "Le titre est obligatoire",
                  minLength: {
                    value: 2,
                    message: "Le titre doit contenir au moins 2 caracteres",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex : Tresses elegantes, Locks naturels..."
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Champ : Description (facultatif) */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description{" "}
                      <span className="text-muted-foreground font-normal">
                        (facultatif)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Decrivez brievement cette coiffure pour inspirer les clientes..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Champ : Ordre d'affichage (nombre) */}
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Ordre d&apos;affichage{" "}
                      <span className="text-muted-foreground font-normal">
                        (0 = en premier)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Boutons : Annuler et Enregistrer */}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : dialogState.mode === "create" ? (
                    "Ajouter"
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* AlertDialog : Confirmation de suppression                          */}
      {/* ================================================================= */}
      <AlertDialog
        open={deleteTarget.open}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget({ open: false, id: "", title: "" })
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;image</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer l&apos;image{" "}
              <span className="font-semibold">&laquo;{deleteTarget.title}&raquo;</span>{" "}
              ? Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
