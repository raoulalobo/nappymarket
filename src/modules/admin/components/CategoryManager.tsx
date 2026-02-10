/**
 * CategoryManager — Gestion des categories de prestations (admin)
 *
 * Role : Permettre a l'administrateur de creer, modifier, activer/desactiver
 *        et supprimer des categories de services sur la marketplace.
 *        Affiche la liste des categories dans un tableau avec actions en ligne.
 *
 * Interactions :
 *   - useAdminCategories()  : recupere la liste des categories (TanStack Query)
 *   - useCreateCategory()   : cree une nouvelle categorie
 *   - useUpdateCategory()   : modifie une categorie existante (nom, description, statut)
 *   - useDeleteCategory()   : supprime une categorie apres confirmation
 *   - React Hook Form       : gestion du formulaire du dialog (creation / edition)
 *   - ImageUpload            : upload d'image vers Supabase Storage (bucket "categories")
 *   - Dialog shadcn/ui      : formulaire d'ajout/edition en modale
 *   - AlertDialog shadcn/ui : confirmation avant suppression
 *
 * Exemple :
 *   // Dans une page admin
 *   import { CategoryManager } from "@/modules/admin/components/CategoryManager"
 *   <CategoryManager />
 */
"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { Loader2, Plus, Pencil, Trash2, ImageIcon } from "lucide-react"

// --- Composant d'upload d'image reutilisable ---
import { ImageUpload } from "@/shared/components/common/ImageUpload"

// --- Hooks admin pour les operations CRUD sur les categories ---
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/modules/admin/hooks/useAdminCategories"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Switch } from "@/components/ui/switch"
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
 * Donnees du formulaire de creation/edition d'une categorie.
 * Le nom est obligatoire (min. 2 caracteres), la description est facultative.
 */
interface CategoryFormValues {
  name: string
  description: string
}

/**
 * Etat du dialog :
 * - mode "create" : formulaire vide pour une nouvelle categorie
 * - mode "edit"   : formulaire pre-rempli avec les donnees de la categorie a modifier
 * - categoryId    : identifiant de la categorie en cours d'edition (null si creation)
 */
interface DialogState {
  open: boolean
  mode: "create" | "edit"
  categoryId: string | null
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function CategoryManager() {
  // --- Donnees et mutations ---
  const { categories, isLoading } = useAdminCategories()
  const { createCategory, isCreating } = useCreateCategory()
  const { updateCategory, isUpdating } = useUpdateCategory()
  const { deleteCategory, isDeleting } = useDeleteCategory()

  // --- Etat du dialog de creation/edition ---
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    mode: "create",
    categoryId: null,
  })

  // --- URL de l'image de la categorie (stockee apres upload via ImageUpload) ---
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // --- Etat du dialog de confirmation de suppression ---
  const [deleteTarget, setDeleteTarget] = useState<{
    open: boolean
    id: string
    name: string
  }>({ open: false, id: "", name: "" })

  // --- Configuration React Hook Form ---
  // Pas de resolver Zod ici pour rester simple : validation inline via `register` rules.
  const form = useForm<CategoryFormValues>({
    defaultValues: { name: "", description: "" },
  })

  // --- Ouvrir le dialog en mode "creation" ---
  const openCreateDialog = useCallback(() => {
    form.reset({ name: "", description: "" })
    setImageUrl(null)
    setDialogState({ open: true, mode: "create", categoryId: null })
  }, [form])

  // --- Ouvrir le dialog en mode "edition" avec les valeurs pre-remplies ---
  const openEditDialog = useCallback(
    (category: { id: string; name: string; description?: string | null; imageUrl?: string | null }) => {
      form.reset({
        name: category.name,
        description: category.description ?? "",
      })
      setImageUrl(category.imageUrl ?? null)
      setDialogState({ open: true, mode: "edit", categoryId: category.id })
    },
    [form]
  )

  // --- Fermer le dialog et reinitialiser le formulaire ---
  const closeDialog = useCallback(() => {
    setDialogState({ open: false, mode: "create", categoryId: null })
    form.reset({ name: "", description: "" })
    setImageUrl(null)
  }, [form])

  // --- Soumission du formulaire (creation ou edition) ---
  const onSubmit = useCallback(
    async (data: CategoryFormValues) => {
      if (dialogState.mode === "create") {
        // Creation d'une nouvelle categorie (avec image optionnelle)
        await createCategory({
          name: data.name,
          description: data.description || undefined,
          imageUrl: imageUrl || undefined,
        })
      } else if (dialogState.categoryId) {
        // Mise a jour d'une categorie existante (imageUrl peut etre null pour supprimer)
        await updateCategory({
          id: dialogState.categoryId,
          input: {
            name: data.name,
            description: data.description || undefined,
            imageUrl: imageUrl,
          },
        })
      }
      closeDialog()
    },
    [dialogState, createCategory, updateCategory, closeDialog, imageUrl]
  )

  // --- Basculer le statut actif/inactif d'une categorie ---
  const handleToggleActive = useCallback(
    async (id: string, currentActive: boolean) => {
      await updateCategory({ id, input: { isActive: !currentActive } })
    },
    [updateCategory]
  )

  // --- Confirmer la suppression d'une categorie ---
  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget.id) {
      await deleteCategory(deleteTarget.id)
      setDeleteTarget({ open: false, id: "", name: "" })
    }
  }, [deleteTarget.id, deleteCategory])

  // Indique si le formulaire est en cours de soumission (creation ou edition)
  const isSubmitting = isCreating || isUpdating

  // -------------------------------------------------------------------------
  // Rendu : Skeleton de chargement
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          {/* Skeleton du titre et description */}
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          {/* Skeleton du tableau (5 lignes simulees) */}
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
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
          <CardTitle className="text-xl">Catalogue de prestations</CardTitle>
          <CardDescription>
            Gerez les categories de services proposees par les coiffeuses sur la
            marketplace.
          </CardDescription>
          {/* Bouton d'ajout positionne en haut a droite grace a CardAction */}
          <CardAction>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Ajouter une categorie
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          {/* --- Etat vide : aucune categorie --- */}
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Aucune categorie de prestation pour le moment.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={openCreateDialog}
              >
                <Plus className="size-4" />
                Creer la premiere categorie
              </Button>
            </div>
          ) : (
            /* --- Tableau des categories --- */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    {/* Colonne : Miniature de l'image de la categorie */}
                    <TableCell>
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="size-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                          <ImageIcon className="size-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>

                    {/* Colonne : Nom de la categorie */}
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>

                    {/* Colonne : Description (tronquee si trop longue) */}
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                      {category.description || "—"}
                    </TableCell>

                    {/* Colonne : Badge de statut actif/inactif */}
                    <TableCell>
                      <Badge
                        variant={category.isActive ? "default" : "secondary"}
                      >
                        {category.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>

                    {/* Colonne : Actions (Switch, Modifier, Supprimer) */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Switch pour activer/desactiver la categorie */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Switch
                                checked={category.isActive}
                                onCheckedChange={() =>
                                  handleToggleActive(
                                    category.id,
                                    category.isActive
                                  )
                                }
                                disabled={isUpdating}
                                aria-label={`${category.isActive ? "Desactiver" : "Activer"} la categorie ${category.name}`}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {category.isActive ? "Desactiver" : "Activer"}
                          </TooltipContent>
                        </Tooltip>

                        {/* Bouton : Modifier la categorie (ouvre le dialog pre-rempli) */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => openEditDialog(category)}
                              aria-label={`Modifier la categorie ${category.name}`}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Modifier</TooltipContent>
                        </Tooltip>

                        {/* Bouton : Supprimer la categorie (ouvre la confirmation) */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() =>
                                setDeleteTarget({
                                  open: true,
                                  id: category.id,
                                  name: category.name,
                                })
                              }
                              aria-label={`Supprimer la categorie ${category.name}`}
                            >
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Supprimer</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* Dialog : Formulaire de creation / edition d'une categorie          */}
      {/* ================================================================= */}
      <Dialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState.mode === "create"
                ? "Nouvelle categorie"
                : "Modifier la categorie"}
            </DialogTitle>
            <DialogDescription>
              {dialogState.mode === "create"
                ? "Ajoutez une nouvelle categorie de prestation au catalogue."
                : "Modifiez les informations de cette categorie."}
            </DialogDescription>
          </DialogHeader>

          {/* Formulaire React Hook Form integre avec les composants Form de shadcn */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Champ : Nom de la categorie (obligatoire, min 2 caracteres) */}
              <FormField
                control={form.control}
                name="name"
                rules={{
                  required: "Le nom est obligatoire",
                  minLength: {
                    value: 2,
                    message: "Le nom doit contenir au moins 2 caracteres",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex : Tresses, Locks, Coloration..."
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Champ : Description de la categorie (facultatif) */}
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
                        placeholder="Decrivez brievement cette categorie de prestation..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Champ : Image de la categorie (optionnel, upload vers Supabase) */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Image{" "}
                  <span className="text-muted-foreground font-normal">
                    (facultatif)
                  </span>
                </label>
                <ImageUpload
                  bucket="categories"
                  pathPrefix="categories"
                  currentImageUrl={imageUrl}
                  onUploadComplete={(url) => setImageUrl(url)}
                  label="Choisir une image"
                  variant="rectangle"
                  enableCrop
                  cropAspectRatio={16 / 9}
                />
              </div>

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
                    "Creer"
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
          if (!open) setDeleteTarget({ open: false, id: "", name: "" })
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la categorie</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer la categorie{" "}
              <span className="font-semibold">&laquo;{deleteTarget.name}&raquo;</span>{" "}
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
