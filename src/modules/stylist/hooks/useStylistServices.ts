/**
 * useStylistServices — Hook TanStack Query pour les services coiffeuse
 *
 * Role : Fournir les services proposes par la coiffeuse avec cache
 *        et les mutations pour ajouter/supprimer des services.
 *
 * Interactions :
 *   - Appelle getStylistServices / addStylistService / removeStylistService
 *   - Appelle getAvailableCategories pour le formulaire d'ajout
 *   - Le cache est invalide apres chaque mutation
 *   - Utilise dans ServiceSelector (page /coiffeuse/prestations)
 *
 * Exemple :
 *   const { services, isLoading } = useStylistServices()
 *   const { categories } = useAvailableCategories()
 *   const { addService } = useAddStylistService()
 */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getStylistServices,
  addStylistService,
  removeStylistService,
  getAvailableCategories,
} from "../actions/service-actions"
import type { ServiceSchema } from "../schemas/stylist-schemas"

/** Cle de cache pour les services de la coiffeuse */
const SERVICES_KEY = ["stylist", "services"]

/** Cle de cache pour les categories disponibles */
const CATEGORIES_KEY = ["categories"]

/**
 * useStylistServices — Recuperer les services de la coiffeuse
 */
export function useStylistServices() {
  const query = useQuery({
    queryKey: SERVICES_KEY,
    queryFn: async () => {
      const result = await getStylistServices()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  return {
    services: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
  }
}

/**
 * useAvailableCategories — Recuperer les categories disponibles
 */
export function useAvailableCategories() {
  const query = useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: async () => {
      const result = await getAvailableCategories()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    // Les categories changent rarement, garder le cache longtemps
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    categories: query.data ?? [],
    isLoading: query.isPending,
  }
}

/**
 * useAddStylistService — Mutation pour ajouter un service
 */
export function useAddStylistService() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: ServiceSchema) => {
      const result = await addStylistService(data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY })
      toast.success("Prestation ajoutee")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    addService: mutation.mutateAsync,
    isAdding: mutation.isPending,
  }
}

/**
 * useRemoveStylistService — Mutation pour supprimer un service
 */
export function useRemoveStylistService() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const result = await removeStylistService(serviceId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY })
      toast.success("Prestation supprimee")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    removeService: mutation.mutateAsync,
    isRemoving: mutation.isPending,
  }
}
