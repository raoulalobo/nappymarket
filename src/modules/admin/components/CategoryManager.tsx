/**
 * CategoryManager — Gestion hierarchique des categories de prestations (admin)
 *
 * Role : Permettre a l'administrateur de creer, modifier, activer/desactiver
 *        et supprimer des categories et sous-categories de services.
 *        Affiche un tableau hierarchique : les categories parentes en gras,
 *        leurs sous-categories indentees (avec le prefixe ↳) en dessous.
 *
 * Hierarchie (2 niveaux max) :
 *   - Tresses              (racine)
 *     ↳ Box Braids         (sous-categorie)
 *     ↳ Cornrows           (sous-categorie)
 *   - Locks / Dreadlocks   (racine)
 *
 * Interactions :
 *   - useAdminCategories()  : recupere les categories racines + enfants (TanStack Query)
 *   - useCreateCategory()   : cree une categorie ou sous-categorie
 *   - useUpdateCategory()   : modifie une categorie (nom, description, statut)
 *   - useDeleteCategory()   : supprime une categorie apres confirmation
 *   - React Hook Form       : gestion du formulaire du dialog (creation / edition)
 *   - ImageUpload           : upload vers Supabase Storage (categories racines uniquement)
 *   - Dialog shadcn/ui      : formulaire d'ajout/edition en modale (titre dynamique)
 *   - AlertDialog shadcn/ui : confirmation avant suppression (message adapte)
 *
 * Exemple :
 *   import { CategoryManager } from "@/modules/admin/components/CategoryManager"
 *   <CategoryManager />
 */
"use client"

import { Fragment, useState, useCallback } from "react"
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
 * Seuls le nom et la description sont des champs React Hook Form.
 * Le contexte (parentId, parentName) est stocke dans DialogState.
 */
interface CategoryFormValues {
  name: string
  description: string
}

/**
 * Etat du dialog de creation/edition :
 * - mode       : "create" = formulaire vide | "edit" = pre-rempli
 * - categoryId : ID de la categorie en edition (null en creation)
 * - parentId   : ID du parent si sous-categorie (null = racine)
 * - parentName : Nom du parent pour l'affichage dans le titre du dialog
 */
interface DialogState {
  open: boolean
  mode: "create" | "edit"
  categoryId: string | null
  parentId: string | null
  parentName: string | null
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
    parentId: null,
    parentName: null,
  })

  // --- URL de l'image de la categorie (categories racines uniquement) ---
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // --- Etat du dialog de confirmation de suppression ---
  const [deleteTarget, setDeleteTarget] = useState<{
    open: boolean
    id: string
    name: string
    /** true si la categorie est une racine avec au moins une sous-categorie */
    hasChildren: boolean
  }>({ open: false, id: "", name: "", hasChildren: false })

  // --- Configuration React Hook Form ---
  const form = useForm<CategoryFormValues>({
    defaultValues: { name: "", description: "" },
  })

  // ---------------------------------------------------------------------------
  // Fonctions d'ouverture du dialog
  // ---------------------------------------------------------------------------

  /**
   * openCreateDialog — Ouvrir le dialog pour une nouvelle categorie racine
   */
  const openCreateDialog = useCallback(() => {
    form.reset({ name: "", description: "" })
    setImageUrl(null)
    setDialogState({
      open: true,
      mode: "create",
      categoryId: null,
      parentId: null,
      parentName: null,
    })
  }, [form])

  /**
   * openCreateSubDialog — Ouvrir le dialog pour une nouvelle sous-categorie
   *
   * Pre-remplit le contexte avec l'ID et le nom du parent.
   * Le titre du dialog affichera "Nouvelle sous-categorie — {parentName}".
   *
   * @param parent - La categorie racine parente ({ id, name })
   */
  const openCreateSubDialog = useCallback(
    (parent: { id: string; name: string }) => {
      form.reset({ name: "", description: "" })
      setImageUrl(null)
      setDialogState({
        open: true,
        mode: "create",
        categoryId: null,
        parentId: parent.id,
        parentName: parent.name,
      })
    },
    [form]
  )

  /**
   * openEditDialog — Ouvrir le dialog pre-rempli pour modifier une categorie
   *
   * Fonctionne pour les racines et les sous-categories.
   * Si c'est une sous-categorie, retrouve le nom du parent dans la liste
   * pour l'afficher dans le titre du dialog.
   *
   * @param category - La categorie a modifier (racine ou sous-categorie)
   */
  const openEditDialog = useCallback(
    (category: {
      id: string
      name: string
      description: string | null
      imageUrl: string | null
      parentId: string | null
    }) => {
      form.reset({
        name: category.name,
        description: category.description ?? "",
      })
      setImageUrl(category.imageUrl ?? null)

      // Retrouver le nom du parent si c'est une sous-categorie
      // (les racines sont dans `categories`, les enfants n'ont pas de `children`)
      let parentName: string | null = null
      if (category.parentId) {
        const parent = categories.find((c) => c.id === category.parentId)
        parentName = parent?.name ?? null
      }

      setDialogState({
        open: true,
        mode: "edit",
        categoryId: category.id,
        parentId: category.parentId,
        parentName,
      })
    },
    [form, categories]
  )

  /**
   * closeDialog — Fermer le dialog et reinitialiser le formulaire
   */
  const closeDialog = useCallback(() => {
    setDialogState({
      open: false,
      mode: "create",
      categoryId: null,
      parentId: null,
      parentName: null,
    })
    form.reset({ name: "", description: "" })
    setImageUrl(null)
  }, [form])

  // ---------------------------------------------------------------------------
  // Soumission du formulaire
  // ---------------------------------------------------------------------------

  /**
   * onSubmit — Creer ou mettre a jour une categorie
   *
   * En creation, inclut parentId si c'est une sous-categorie.
   * En edition, ne modifie pas la relation parent/enfant.
   * L'image n'est envoyee que pour les categories racines.
   */
  const onSubmit = useCallback(
    async (data: CategoryFormValues) => {
      if (dialogState.mode === "create") {
        await createCategory({
          name: data.name,
          description: data.description || undefined,
          // Image uniquement pour les categories racines
          imageUrl: dialogState.parentId ? undefined : (imageUrl || undefined),
          parentId: dialogState.parentId ?? undefined,
        })
      } else if (dialogState.categoryId) {
        await updateCategory({
          id: dialogState.categoryId,
          input: {
            name: data.name,
            description: data.description || undefined,
            // Permettre de supprimer l'image (imageUrl null)
            imageUrl: dialogState.parentId ? undefined : imageUrl,
          },
        })
      }
      closeDialog()
    },
    [dialogState, createCategory, updateCategory, closeDialog, imageUrl]
  )

  // ---------------------------------------------------------------------------
  // Actions rapides (switch actif/inactif, suppression)
  // ---------------------------------------------------------------------------

  /**
   * handleToggleActive — Basculer le statut actif/inactif d'une categorie
   */
  const handleToggleActive = useCallback(
    async (id: string, currentActive: boolean) => {
      await updateCategory({ id, input: { isActive: !currentActive } })
    },
    [updateCategory]
  )

  /**
   * handleConfirmDelete — Confirmer la suppression de la categorie ciblee
   */
  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget.id) {
      await deleteCategory(deleteTarget.id)
      setDeleteTarget({ open: false, id: "", name: "", hasChildren: false })
    }
  }, [deleteTarget.id, deleteCategory])

  // Indique si le formulaire est en cours de soumission
  const isSubmitting = isCreating || isUpdating

  // ---------------------------------------------------------------------------
  // Calcul du titre/description du dialog (dynamique selon le contexte)
  // ---------------------------------------------------------------------------

  /** Titre du dialog selon mode et type de categorie */
  const dialogTitle =
    dialogState.mode === "create"
      ? dialogState.parentId
        ? `Nouvelle sous-categorie — ${dialogState.parentName}`
        : "Nouvelle categorie"
      : dialogState.parentId
        ? "Modifier la sous-categorie"
        : "Modifier la categorie"

  /** Description du dialog selon mode et type de categorie */
  const dialogDescription =
    dialogState.mode === "create"
      ? dialogState.parentId
        ? `Ajoutez une sous-categorie a "${dialogState.parentName}".`
        : "Ajoutez une nouvelle categorie de prestation au catalogue."
      : dialogState.parentId
        ? `Modifiez les informations de cette sous-categorie${dialogState.parentName ? ` (${dialogState.parentName})` : ""}.`
        : "Modifiez les informations de cette categorie."

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
            Gerez les categories et sous-categories de services proposees par les
            coiffeuses sur la marketplace.
          </CardDescription>
          {/* Bouton d'ajout positionne en haut a droite */}
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
            /* --- Tableau hierarchique des categories --- */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell w-16">Image</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  /*
                   * Fragment avec key pour grouper la ligne parente
                   * et ses lignes enfants sans element DOM supplementaire.
                   */
                  <Fragment key={category.id}>
                    {/* ---- Ligne : Categorie parente (racine) ---- */}
                    <TableRow>
                      {/* Miniature image (masquee sur mobile) */}
                      <TableCell className="hidden md:table-cell">
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

                      {/* Nom en gras pour les racines */}
                      <TableCell className="font-semibold">
                        {category.name}
                      </TableCell>

                      {/* Description (tronquee, masquee sur mobile) */}
                      <TableCell className="hidden md:table-cell max-w-[300px] truncate text-muted-foreground">
                        {category.description || "—"}
                      </TableCell>

                      {/* Badge statut actif/inactif */}
                      <TableCell>
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>

                      {/* Actions : + Sous-cat, Switch, Modifier, Supprimer */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Bouton : Ajouter une sous-categorie */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => openCreateSubDialog(category)}
                                aria-label={`Ajouter une sous-categorie a ${category.name}`}
                              >
                                <Plus className="size-3.5" />
                                Sous-categorie
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Ajouter une sous-categorie a {category.name}
                            </TooltipContent>
                          </Tooltip>

                          {/* Switch actif/inactif */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Switch
                                  checked={category.isActive}
                                  onCheckedChange={() =>
                                    handleToggleActive(category.id, category.isActive)
                                  }
                                  disabled={isUpdating}
                                  aria-label={`${category.isActive ? "Desactiver" : "Activer"} ${category.name}`}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {category.isActive ? "Desactiver" : "Activer"}
                            </TooltipContent>
                          </Tooltip>

                          {/* Bouton Modifier */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => openEditDialog(category)}
                                aria-label={`Modifier ${category.name}`}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Modifier</TooltipContent>
                          </Tooltip>

                          {/* Bouton Supprimer */}
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
                                    // Avertir si la racine a des enfants
                                    hasChildren: category.children.length > 0,
                                  })
                                }
                                aria-label={`Supprimer ${category.name}`}
                              >
                                <Trash2 className="size-3.5 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Supprimer</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* ---- Lignes : Sous-categories (indentees) ---- */}
                    {category.children.map((child) => (
                      <TableRow key={child.id} className="bg-muted/30">
                        {/* Cellule image vide (alignement avec les racines) */}
                        <TableCell className="hidden md:table-cell" />

                        {/* Nom avec prefixe ↳ pour indiquer l'appartenance */}
                        <TableCell>
                          <span className="text-muted-foreground mr-1 select-none">↳</span>
                          <span className="font-medium">{child.name}</span>
                        </TableCell>

                        {/* Description de la sous-categorie */}
                        <TableCell className="hidden md:table-cell max-w-[300px] truncate text-muted-foreground">
                          {child.description || "—"}
                        </TableCell>

                        {/* Badge statut */}
                        <TableCell>
                          <Badge variant={child.isActive ? "default" : "secondary"}>
                            {child.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>

                        {/* Actions : Switch, Modifier, Supprimer (sans bouton +Sous-cat) */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Switch actif/inactif */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Switch
                                    checked={child.isActive}
                                    onCheckedChange={() =>
                                      handleToggleActive(child.id, child.isActive)
                                    }
                                    disabled={isUpdating}
                                    aria-label={`${child.isActive ? "Desactiver" : "Activer"} ${child.name}`}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {child.isActive ? "Desactiver" : "Activer"}
                              </TooltipContent>
                            </Tooltip>

                            {/* Bouton Modifier */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => openEditDialog(child)}
                                  aria-label={`Modifier ${child.name}`}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Modifier</TooltipContent>
                            </Tooltip>

                            {/* Bouton Supprimer */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() =>
                                    setDeleteTarget({
                                      open: true,
                                      id: child.id,
                                      name: child.name,
                                      hasChildren: false, // les sous-categories n'ont pas d'enfants
                                    })
                                  }
                                  aria-label={`Supprimer ${child.name}`}
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
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* Dialog : Formulaire de creation / edition                          */}
      {/* Le titre et la description changent selon le contexte              */}
      {/* ================================================================= */}
      <Dialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            {/* Titre dynamique : "Nouvelle categorie", "Nouvelle sous-categorie — Tresses",
                "Modifier la categorie", "Modifier la sous-categorie" */}
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Champ : Nom (obligatoire, min 2 caracteres) */}
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
                        placeholder={
                          dialogState.parentId
                            ? "Ex : Box Braids, Cornrows, Faux Locs..."
                            : "Ex : Tresses, Locks, Coloration..."
                        }
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
                        placeholder="Decrivez brievement cette categorie de prestation..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Champ : Image — uniquement pour les categories racines
                  Les sous-categories n'ont pas d'image propre */}
              {!dialogState.parentId && (
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
              )}

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
      {/* Le message varie selon que la categorie a des enfants ou non       */}
      {/* ================================================================= */}
      <AlertDialog
        open={deleteTarget.open}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget({ open: false, id: "", name: "", hasChildren: false })
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la categorie</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {deleteTarget.hasChildren ? (
                  /* Avertissement : la categorie parente a des sous-categories */
                  <p>
                    La categorie{" "}
                    <span className="font-semibold">&laquo;{deleteTarget.name}&raquo;</span>{" "}
                    contient des sous-categories. Vous devez d&apos;abord supprimer toutes ses
                    sous-categories avant de pouvoir la supprimer.
                  </p>
                ) : (
                  /* Confirmation standard */
                  <p>
                    Etes-vous sur de vouloir supprimer{" "}
                    <span className="font-semibold">&laquo;{deleteTarget.name}&raquo;</span>{" "}
                    ? Cette action est irreversible.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting || deleteTarget.hasChildren}
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
