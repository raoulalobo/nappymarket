/**
 * useAdminGallery — Hooks TanStack Query pour la gestion admin de la galerie
 *
 * Role : Fournir les donnees et mutations pour gerer les images de la galerie
 *        Inspirations depuis le panneau d'administration. Encapsule les appels
 *        aux server actions avec cache, invalidation et toasts.
 *
 * Interactions :
 *   - Appelle les server actions de gallery-actions.ts
 *   - Invalide le cache TanStack Query apres chaque mutation reussie
 *   - Affiche des toasts de feedback via sonner (succes/erreur)
 *   - Utilise dans le composant admin : GalleryManager
 *
 * Exemple :
 *   const { images, isLoading } = useAdminGalleryImages()
 *   const { createImage, isCreating } = useCreateGalleryImage()
 *   const { updateImage, isUpdating } = useUpdateGalleryImage()
 *   const { toggleActive, isToggling } = useToggleGalleryImageActive()
 *   const { deleteImage, isDeleting } = useDeleteGalleryImage()
 */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  toggleGalleryImageActive,
  deleteGalleryImage,
} from "../actions/gallery-actions"

/* ------------------------------------------------------------------ */
/* Constantes de cache                                                 */
/* ------------------------------------------------------------------ */

/** Cle de cache TanStack Query pour les images de la galerie admin */
const ADMIN_GALLERY_KEY = ["admin", "gallery"]

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

/**
 * useAdminGalleryImages — Recuperer toutes les images de la galerie (admin)
 *
 * Utilise useQuery pour fetcher et cacher les images.
 * Le cache est invalide automatiquement apres chaque mutation.
 *
 * Exemple :
 *   const { images, isLoading } = useAdminGalleryImages()
 *   if (isLoading) return <Skeleton />
 *   images.map(img => <Card key={img.id}>{img.title}</Card>)
 */
export function useAdminGalleryImages() {
  const query = useQuery({
    queryKey: ADMIN_GALLERY_KEY,
    queryFn: async () => {
      const result = await getGalleryImages()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  return {
    /** Liste des images (tableau vide pendant le chargement) */
    images: query.data ?? [],
    /** true pendant le chargement initial */
    isLoading: query.isPending,
  }
}

/**
 * useCreateGalleryImage — Mutation pour ajouter une image a la galerie
 *
 * Apres creation reussie :
 * - Invalide le cache des images (refetch automatique)
 * - Affiche un toast de succes
 *
 * Exemple :
 *   const { createImage, isCreating } = useCreateGalleryImage()
 *   await createImage({ title: "Tresses", imageUrl: "https://...", sortOrder: 0 })
 */
export function useCreateGalleryImage() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    /**
     * Appelle la server action createGalleryImage
     * @param data - { title, description?, imageUrl, sortOrder? }
     */
    mutationFn: async (data: {
      title: string
      description?: string
      imageUrl: string
      sortOrder?: number
    }) => {
      const result = await createGalleryImage(data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      // Invalider le cache pour forcer le refetch de la liste
      queryClient.invalidateQueries({ queryKey: ADMIN_GALLERY_KEY })
      toast.success("Image ajoutee a la galerie")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    /** Fonction pour creer une image (retourne une Promise) */
    createImage: mutation.mutateAsync,
    /** true pendant la creation */
    isCreating: mutation.isPending,
  }
}

/**
 * useUpdateGalleryImage — Mutation pour mettre a jour une image
 *
 * Apres mise a jour reussie :
 * - Invalide le cache des images (refetch automatique)
 * - Affiche un toast de succes
 *
 * Exemple :
 *   const { updateImage, isUpdating } = useUpdateGalleryImage()
 *   await updateImage({ id: "img-id", input: { title: "Nouveau titre" } })
 */
export function useUpdateGalleryImage() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    /**
     * Appelle la server action updateGalleryImage
     * @param params.id - Identifiant de l'image
     * @param params.input - Champs a mettre a jour
     */
    mutationFn: async (params: {
      id: string
      input: { title?: string; description?: string | null; imageUrl?: string; sortOrder?: number }
    }) => {
      const result = await updateGalleryImage(params.id, params.input)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_GALLERY_KEY })
      toast.success("Image mise a jour")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    /** Fonction pour mettre a jour une image (retourne une Promise) */
    updateImage: mutation.mutateAsync,
    /** true pendant la mise a jour */
    isUpdating: mutation.isPending,
  }
}

/**
 * useToggleGalleryImageActive — Mutation pour basculer la visibilite
 *
 * Bascule isActive entre true et false. Affiche un toast adapte.
 *
 * Exemple :
 *   const { toggleActive, isToggling } = useToggleGalleryImageActive()
 *   await toggleActive("img-id")
 */
export function useToggleGalleryImageActive() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    /**
     * Appelle la server action toggleGalleryImageActive
     * @param id - Identifiant CUID de l'image
     */
    mutationFn: async (id: string) => {
      const result = await toggleGalleryImageActive(id)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_GALLERY_KEY })
      toast.success(data.isActive ? "Image visible" : "Image masquee")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    /** Fonction pour basculer la visibilite (retourne une Promise) */
    toggleActive: mutation.mutateAsync,
    /** true pendant le toggle */
    isToggling: mutation.isPending,
  }
}

/**
 * useDeleteGalleryImage — Mutation pour supprimer une image
 *
 * Apres suppression reussie :
 * - Invalide le cache des images (refetch automatique)
 * - Affiche un toast de succes
 *
 * Exemple :
 *   const { deleteImage, isDeleting } = useDeleteGalleryImage()
 *   await deleteImage("img-id")
 */
export function useDeleteGalleryImage() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    /**
     * Appelle la server action deleteGalleryImage
     * @param id - Identifiant CUID de l'image a supprimer
     */
    mutationFn: async (id: string) => {
      const result = await deleteGalleryImage(id)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_GALLERY_KEY })
      toast.success("Image supprimee de la galerie")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    /** Fonction pour supprimer une image (retourne une Promise) */
    deleteImage: mutation.mutateAsync,
    /** true pendant la suppression */
    isDeleting: mutation.isPending,
  }
}
