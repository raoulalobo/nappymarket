/**
 * usePortfolio — Hook TanStack Query pour le portfolio coiffeuse
 *
 * Role : Fournir les images du portfolio avec cache et les mutations
 *        pour ajouter/supprimer des images.
 *
 * Interactions :
 *   - Appelle getPortfolioImages / addPortfolioImage / removePortfolioImage
 *   - Le cache est invalide apres chaque mutation
 *   - Utilise dans PortfolioManager (page /coiffeuse/portfolio)
 *
 * Exemple :
 *   const { images, isLoading } = usePortfolio()
 *   const { addImage } = useAddPortfolioImage()
 *   const { removeImage } = useRemovePortfolioImage()
 */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getPortfolioImages,
  addPortfolioImage,
  removePortfolioImage,
} from "../actions/portfolio-actions"

/** Cle de cache pour le portfolio */
const PORTFOLIO_KEY = ["stylist", "portfolio"]

/**
 * usePortfolio — Recuperer les images du portfolio
 */
export function usePortfolio() {
  const query = useQuery({
    queryKey: PORTFOLIO_KEY,
    queryFn: async () => {
      const result = await getPortfolioImages()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  return {
    images: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
  }
}

/**
 * useAddPortfolioImage — Mutation pour ajouter une image
 */
export function useAddPortfolioImage() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: { url: string; caption?: string }) => {
      const result = await addPortfolioImage(data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PORTFOLIO_KEY })
      toast.success("Photo ajoutee au portfolio")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    addImage: mutation.mutateAsync,
    isAdding: mutation.isPending,
  }
}

/**
 * useRemovePortfolioImage — Mutation pour supprimer une image
 */
export function useRemovePortfolioImage() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (imageId: string) => {
      const result = await removePortfolioImage(imageId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PORTFOLIO_KEY })
      toast.success("Photo supprimee du portfolio")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    removeImage: mutation.mutateAsync,
    isRemoving: mutation.isPending,
  }
}
