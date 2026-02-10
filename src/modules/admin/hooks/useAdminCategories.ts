/**
 * useAdminCategories — Hooks TanStack Query pour la gestion admin des categories
 *
 * Role : Fournir les donnees et mutations pour gerer les categories
 *        de services depuis le panneau d'administration. Encapsule
 *        les appels aux server actions avec cache, invalidation et toasts.
 *
 * Interactions :
 *   - Appelle les server actions de category-actions.ts
 *   - Invalide le cache TanStack Query apres chaque mutation reussie
 *   - Affiche des toasts de feedback via sonner (succes/erreur)
 *   - Utilise dans les composants admin : CategoryManager, etc.
 *
 * Exemple :
 *   // Dans un composant admin
 *   const { categories, isLoading } = useAdminCategories()
 *   const { createCategory, isCreating } = useCreateCategory()
 *   const { updateCategory, isUpdating } = useUpdateCategory()
 *   const { deleteCategory, isDeleting } = useDeleteCategory()
 *
 *   // Creer une categorie
 *   await createCategory({ name: "Tresses", description: "Box braids, cornrows" })
 *
 *   // Mettre a jour une categorie
 *   await updateCategory({ id: "cat-id", input: { isActive: false } })
 *
 *   // Supprimer une categorie
 *   await deleteCategory("cat-id")
 */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../actions/category-actions"

/* ------------------------------------------------------------------ */
/* Constantes de cache                                                 */
/* ------------------------------------------------------------------ */

/** Cle de cache TanStack Query pour les categories admin */
const ADMIN_CATEGORIES_KEY = ["admin", "categories"]

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

/**
 * useAdminCategories — Recuperer toutes les categories (actives et inactives)
 *
 * Utilise useQuery pour fetcher et cacher les categories.
 * Le cache est invalide automatiquement apres chaque mutation (create, update, delete).
 *
 * Exemple :
 *   const { categories, isLoading } = useAdminCategories()
 *   if (isLoading) return <Skeleton />
 *   categories.map(cat => <div key={cat.id}>{cat.name}</div>)
 */
export function useAdminCategories() {
  const query = useQuery({
    queryKey: ADMIN_CATEGORIES_KEY,
    queryFn: async () => {
      const result = await getCategories()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  return {
    /** Liste des categories (tableau vide pendant le chargement) */
    categories: query.data ?? [],
    /** true pendant le chargement initial */
    isLoading: query.isPending,
  }
}

/**
 * useCreateCategory — Mutation pour creer une nouvelle categorie
 *
 * Apres creation reussie :
 * - Invalide le cache des categories (refetch automatique)
 * - Affiche un toast de succes
 *
 * En cas d'erreur (nom duplique, etc.) :
 * - Affiche un toast d'erreur avec le message du serveur
 *
 * Exemple :
 *   const { createCategory, isCreating } = useCreateCategory()
 *   await createCategory({ name: "Locks", description: "Installation et retouches" })
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    /**
     * Appelle la server action createCategory
     * @param data - { name: string, description?: string }
     */
    mutationFn: async (data: { name: string; description?: string; imageUrl?: string }) => {
      const result = await createCategory(data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      // Invalider le cache pour forcer le refetch de la liste
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY })
      toast.success("Categorie creee avec succes")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    /** Fonction pour creer une categorie (retourne une Promise) */
    createCategory: mutation.mutateAsync,
    /** true pendant la creation */
    isCreating: mutation.isPending,
  }
}

/**
 * useUpdateCategory — Mutation pour mettre a jour une categorie
 *
 * Apres mise a jour reussie :
 * - Invalide le cache des categories (refetch automatique)
 * - Affiche un toast de succes
 *
 * Exemple :
 *   const { updateCategory, isUpdating } = useUpdateCategory()
 *   // Renommer une categorie
 *   await updateCategory({ id: "cat-id", input: { name: "Nouveau nom" } })
 *   // Desactiver une categorie
 *   await updateCategory({ id: "cat-id", input: { isActive: false } })
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    /**
     * Appelle la server action updateCategory
     * @param params.id - Identifiant de la categorie
     * @param params.input - Champs a mettre a jour
     */
    mutationFn: async (params: {
      id: string
      input: { name?: string; description?: string; isActive?: boolean; imageUrl?: string | null }
    }) => {
      const result = await updateCategory(params.id, params.input)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY })
      toast.success("Categorie mise a jour")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    /** Fonction pour mettre a jour une categorie (retourne une Promise) */
    updateCategory: mutation.mutateAsync,
    /** true pendant la mise a jour */
    isUpdating: mutation.isPending,
  }
}

/**
 * useDeleteCategory — Mutation pour supprimer une categorie
 *
 * La suppression echoue si des services de coiffeuses sont lies
 * a cette categorie. Le message d'erreur du serveur est affiche
 * dans un toast.
 *
 * Apres suppression reussie :
 * - Invalide le cache des categories (refetch automatique)
 * - Affiche un toast de succes
 *
 * Exemple :
 *   const { deleteCategory, isDeleting } = useDeleteCategory()
 *   try {
 *     await deleteCategory("cat-id")
 *   } catch (error) {
 *     // Le toast d'erreur est deja affiche par onError
 *   }
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    /**
     * Appelle la server action deleteCategory
     * @param id - Identifiant CUID de la categorie a supprimer
     */
    mutationFn: async (id: string) => {
      const result = await deleteCategory(id)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY })
      toast.success("Categorie supprimee")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    /** Fonction pour supprimer une categorie (retourne une Promise) */
    deleteCategory: mutation.mutateAsync,
    /** true pendant la suppression */
    isDeleting: mutation.isPending,
  }
}
