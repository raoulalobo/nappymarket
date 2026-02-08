/**
 * ServiceSelector.tsx — Composant de gestion des prestations coiffeuse
 *
 * Role : Permettre a une coiffeuse de gerer ses prestations (services).
 *        Affiche les services actuels dans un tableau et permet d'en ajouter
 *        ou d'en supprimer via des modales.
 *
 * Interactions :
 *   - useStylistServices() : recupere la liste des services de la coiffeuse
 *   - useAvailableCategories() : recupere les categories disponibles pour le formulaire
 *   - useAddStylistService() : mutation pour ajouter un service
 *   - useRemoveStylistService() : mutation pour supprimer un service
 *   - formatPrice() : affiche les prix stockes en centimes en euros (ex: 4500 -> "45,00 EUR")
 *   - serviceSchema + zodResolver : validation du formulaire d'ajout
 *
 * Exemple d'utilisation :
 *   <ServiceSelector />
 *   // Affiche le tableau des prestations avec un bouton "Ajouter une prestation"
 *   // et un bouton de suppression par ligne (avec confirmation)
 */
"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"

// --- Hooks metier pour les services et categories ---
import {
  useStylistServices,
  useAvailableCategories,
  useAddStylistService,
  useRemoveStylistService,
} from "@/modules/stylist/hooks/useStylistServices"

// --- Schema Zod et type infere pour la validation du formulaire ---
import {
  serviceSchema,
  type ServiceSchema,
} from "@/modules/stylist/schemas/stylist-schemas"

// --- Utilitaire de formatage des prix (centimes -> euros) ---
import { formatPrice } from "@/shared/lib/utils"

// --- Composants shadcn/ui ---
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

/**
 * ServiceSelector — Composant principal de gestion des prestations
 *
 * Affiche :
 *   1. Un tableau des services actuels (categorie, prix, duree, bouton supprimer)
 *   2. Un bouton "Ajouter une prestation" qui ouvre un dialog avec formulaire
 *   3. Des skeletons pendant le chargement
 *   4. Un message vide si aucun service n'est configure
 */
export default function ServiceSelector() {
  // --- Etat local pour controler l'ouverture du dialog d'ajout ---
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // --- Donnees et mutations depuis les hooks TanStack Query ---
  const { services, isLoading: isLoadingServices } = useStylistServices()
  const { categories, isLoading: isLoadingCategories } = useAvailableCategories()
  const { addService, isAdding } = useAddStylistService()
  const { removeService, isRemoving } = useRemoveStylistService()

  // --- Configuration du formulaire avec React Hook Form + Zod ---
  const form = useForm<ServiceSchema>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      categoryId: "",
      price: 0,
      durationMinutes: 60,
      description: "",
    },
  })

  /**
   * Filtrer les categories deja ajoutees par la coiffeuse.
   * Empeche d'ajouter deux fois la meme categorie.
   *
   * Exemple :
   *   Si la coiffeuse a deja "Tresses", on ne montre pas "Tresses" dans le select.
   */
  const availableCategories = categories.filter(
    (category) => !services.some((service) => service.categoryId === category.id)
  )

  /**
   * Soumission du formulaire d'ajout de prestation.
   * Appelle la mutation addService puis ferme le dialog et reset le formulaire.
   */
  const onSubmit = useCallback(
    async (data: ServiceSchema) => {
      await addService(data)
      setIsDialogOpen(false)
      form.reset()
    },
    [addService, form]
  )

  /**
   * Suppression d'un service avec confirmation (AlertDialog).
   * Appelle la mutation removeService avec l'ID du service.
   *
   * Exemple :
   *   handleDelete("clu1abc...") -> supprime le service avec cet ID
   */
  const handleDelete = useCallback(
    async (serviceId: string) => {
      await removeService(serviceId)
    },
    [removeService]
  )

  /**
   * Formater la duree en minutes vers un affichage lisible.
   *
   * Exemples :
   *   formatDuration(45)  -> "45 min"
   *   formatDuration(90)  -> "1h30"
   *   formatDuration(120) -> "2h00"
   *   formatDuration(150) -> "2h30"
   */
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`
  }

  // --- Etat de chargement : affiche des skeletons ---
  if (isLoadingServices) {
    return (
      <div className="space-y-4">
        {/* Skeleton du bouton d'ajout */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-48" />
        </div>
        {/* Skeletons des lignes du tableau */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* --- En-tete avec bouton d'ajout --- */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {services.length === 0
            ? "Vous n'avez pas encore ajoute de prestation."
            : `${services.length} prestation${services.length > 1 ? "s" : ""} configuree${services.length > 1 ? "s" : ""}.`}
        </p>

        {/* --- Dialog d'ajout de prestation --- */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={availableCategories.length === 0}
              aria-label="Ajouter une prestation"
            >
              <Plus className="mr-2 size-4" />
              Ajouter une prestation
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une prestation</DialogTitle>
              <DialogDescription>
                Choisissez une categorie et definissez votre prix et duree.
              </DialogDescription>
            </DialogHeader>

            {/* --- Formulaire d'ajout (React Hook Form + Zod) --- */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Champ : Categorie (Select) */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categorie</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choisir une categorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingCategories ? (
                            <SelectItem value="_loading" disabled>
                              Chargement...
                            </SelectItem>
                          ) : availableCategories.length === 0 ? (
                            <SelectItem value="_empty" disabled>
                              Toutes les categories sont deja ajoutees
                            </SelectItem>
                          ) : (
                            availableCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Champ : Prix en euros (Input number) */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix (en euros)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
                          max={500}
                          step={1}
                          placeholder="45"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Champ : Duree en minutes (Input number) */}
                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duree (en minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={30}
                          max={480}
                          step={15}
                          placeholder="90"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Champ : Description optionnelle (Textarea) */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Description{" "}
                        <span className="text-muted-foreground">(optionnel)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Decrivez brievement cette prestation..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Boutons d'action du formulaire */}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      form.reset()
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isAdding}>
                    {isAdding ? "Ajout en cours..." : "Ajouter"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- Tableau des services actuels --- */}
      {services.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categorie</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Duree</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                {/* Nom de la categorie */}
                <TableCell className="font-medium">
                  {service.category.name}
                </TableCell>

                {/* Prix formate (centimes -> euros, ex: 4500 -> "45,00 EUR") */}
                <TableCell>{formatPrice(service.price)}</TableCell>

                {/* Duree formatee (ex: 150 -> "2h30") */}
                <TableCell>{formatDuration(service.durationMinutes)}</TableCell>

                {/* Bouton de suppression avec AlertDialog de confirmation */}
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isRemoving}
                        aria-label={`Supprimer la prestation ${service.category.name}`}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Supprimer cette prestation ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          La prestation &quot;{service.category.name}&quot; sera
                          definitivement supprimee. Cette action est irreversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => handleDelete(service.id)}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
