/**
 * useAdminCategories — Hooks TanStack Query pour la gestion admin des categories
 *
 * Role : Fournir les donnees et mutations pour gerer les categories
 *        de services depuis le panneau d'administration. Encapsule
 *        les appels aux server actions avec cache, invalidation et toasts.
 *        Supporte le systeme hierarchique (categories + sous-categories).
 *
 * Interactions :
 *   - Appelle les server actions de category-actions.ts
 *   - Invalide le cache TanStack Query apres chaque mutation reussie
 *   - Affiche des toasts de feedback via sonner (succes/erreur)
 *   - Le toast de creation distingue "Categorie creee" et "Sous-categorie creee"
 *   - Utilise dans les composants admin : CategoryManager, etc.
 *
 * Exemple :
 *   const { categories, isLoading } = useAdminCategories()
 *   // categories = CategoryWithChildren[] (racines + leurs enfants)
 *
 *   const { createCategory } = useCreateCategory()
 *   // Creer une racine :
 *   await createCategory({ name: "Tresses" })
 *   // Creer une sous-categorie :
 *   await createCategory({ name: "Box Braids", parentId: "cat-tresses-id" })
 */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryWithChildren,
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
 * useAdminCategories — Recuperer toutes les categories racines avec leurs enfants
 *
 * Utilise useQuery pour fetcher et cacher les categories (structure hierarchique).
 * Le cache est invalide automatiquement apres chaque mutation (create, update, delete).
 *
 * Exemple :
 *   const { categories, isLoading } = useAdminCategories()
 *   if (isLoading) return <Skeleton />
 *   // Iterer sur les racines et leurs enfants :
 *   categories.map(cat => (
 *     <>
 *       <div>{cat.name}</div>
 *       {cat.children.map(child => <div key={child.id}>↳ {child.name}</div>)}
 *     </>
 *   ))
 */
export function useAdminCategories() {
  const query = useQuery({
    queryKey: ADMIN_CATEGORIES_KEY,
    queryFn: async () => {
      const result = await getCategories()
      if (!result.success) throw new Error(result.error)
      // result.data est typee CategoryWithChildren[] (racines + enfants inclus)
      return result.data
    },
  })

  return {
    /** Liste des categories racines avec leurs sous-categories imbriquees */
    categories: (query.data ?? []) as CategoryWithChildren[],
    /** true pendant le chargement initial */
    isLoading: query.isPending,
  }
}

/**
 * useCreateCategory — Mutation pour creer une nouvelle categorie ou sous-categorie
 *
 * Apres creation reussie :
 * - Invalide le cache des categories (refetch automatique)
 * - Toast "Categorie creee" ou "Sous-categorie creee" selon le contexte
 *
 * En cas d'erreur (nom duplique, parent inexistant, etc.) :
 * - Affiche un toast d'erreur avec le message du serveur
 *
 * Exemple (racine) :
 *   const { createCategory } = useCreateCategory()
 *   await createCategory({ name: "Locks", description: "Installation et retouches" })
 *
 * Exemple (sous-categorie) :
 *   await createCategory({ name: "Box Braids", parentId: "cat-tresses-id" })
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    /**
     * Appelle la server action createCategory
     * @param data.name        - Nom de la categorie ou sous-categorie
     * @param data.description - Description optionnelle
     * @param data.imageUrl    - URL image optionnelle
     * @param data.parentId    - ID du parent si sous-categorie (absent = racine)
     */
    mutationFn: async (data: {
      name: string
      description?: string
      imageUrl?: string
      parentId?: string
    }) => {
      const result = await createCategory(data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: (data) => {
      // Invalider le cache pour forcer le refetch de la liste
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY })
      // Le message distingue categorie racine et sous-categorie
      toast.success(data.parentId ? "Sous-categorie creee avec succes" : "Categorie creee avec succes")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    /** Fonction pour creer une categorie ou sous-categorie (retourne une Promise) */
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
 *   // Renommer :
 *   await updateCategory({ id: "cat-id", input: { name: "Nouveau nom" } })
 *   // Desactiver :
 *   await updateCategory({ id: "cat-id", input: { isActive: false } })
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    /**
     * Appelle la server action updateCategory
     * @param params.id    - Identifiant de la categorie
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
 * La suppression echoue cote serveur si :
 *   - La categorie a des sous-categories (les supprimer d'abord)
 *   - Des services de coiffeuses l'utilisent
 *
 * Apres suppression reussie :
 * - Invalide le cache des categories (refetch automatique)
 * - Affiche un toast de succes
 *
 * Exemple :
 *   const { deleteCategory, isDeleting } = useDeleteCategory()
 *   await deleteCategory("cat-id")
 *   // En cas d'erreur, le toast est affiche automatiquement par onError
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
