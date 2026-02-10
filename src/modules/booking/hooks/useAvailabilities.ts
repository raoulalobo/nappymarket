/**
 * useAvailabilities — Hooks TanStack Query pour les disponibilites
 *
 * Role : Fournir les disponibilites de la coiffeuse avec cache
 *        et les mutations pour ajouter/modifier/supprimer des creneaux.
 *
 * Interactions :
 *   - Appelle les server actions de availability-actions.ts
 *   - Le cache est invalide apres chaque mutation (toast de confirmation)
 *   - Utilise dans AvailabilityManager (page /coiffeuse/disponibilites)
 *
 * Exemple :
 *   const { availabilities, isLoading } = useStylistAvailabilities()
 *   const { addAvailability } = useAddAvailability()
 *   const { toggleAvailability } = useToggleAvailability()
 */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getStylistAvailabilities,
  addAvailability,
  updateAvailability,
  deleteAvailability,
  toggleAvailability,
} from "../actions/availability-actions"
import type { AvailabilitySchema } from "../schemas/availability-schema"

/** Cle de cache pour les disponibilites de la coiffeuse */
const AVAILABILITIES_KEY = ["stylist", "availabilities"]

/**
 * useStylistAvailabilities — Recuperer les disponibilites de la coiffeuse
 *
 * Charge tous les creneaux (actifs et inactifs) pour la page de gestion.
 * Le cache est invalide par les mutations ci-dessous.
 */
export function useStylistAvailabilities() {
  const query = useQuery({
    queryKey: AVAILABILITIES_KEY,
    queryFn: async () => {
      const result = await getStylistAvailabilities()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  return {
    availabilities: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
  }
}

/**
 * useAddAvailability — Mutation pour ajouter un creneau
 *
 * Apres succes : invalide le cache + toast de confirmation.
 * En cas d'erreur (chevauchement, etc.) : toast d'erreur.
 */
export function useAddAvailability() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: AvailabilitySchema) => {
      const result = await addAvailability(data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AVAILABILITIES_KEY })
      toast.success("Creneau ajoute")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    addAvailability: mutation.mutateAsync,
    isAdding: mutation.isPending,
  }
}

/**
 * useUpdateAvailability — Mutation pour modifier un creneau
 */
export function useUpdateAvailability() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AvailabilitySchema }) => {
      const result = await updateAvailability(id, data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AVAILABILITIES_KEY })
      toast.success("Creneau modifie")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    updateAvailability: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  }
}

/**
 * useDeleteAvailability — Mutation pour supprimer un creneau
 */
export function useDeleteAvailability() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteAvailability(id)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AVAILABILITIES_KEY })
      toast.success("Creneau supprime")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    deleteAvailability: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  }
}

/**
 * useToggleAvailability — Mutation pour activer/desactiver un creneau
 */
export function useToggleAvailability() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await toggleAvailability(id)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: AVAILABILITIES_KEY })
      toast.success(data.isActive ? "Creneau active" : "Creneau desactive")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    toggleAvailability: mutation.mutateAsync,
    isToggling: mutation.isPending,
  }
}
