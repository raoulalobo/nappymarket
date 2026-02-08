/**
 * useStylistProfile — Hook TanStack Query pour le profil coiffeuse
 *
 * Role : Fournir les donnees du profil coiffeuse avec cache,
 *        ainsi que les mutations pour mettre a jour le profil.
 *
 * Interactions :
 *   - Appelle getStylistProfile / updateStylistProfile (server actions)
 *   - Le cache est invalide apres une mutation reussie
 *   - Utilise dans StylistProfileForm et le dashboard coiffeuse
 *
 * Exemple :
 *   const { profile, isLoading } = useStylistProfile()
 *   const { updateProfile, isUpdating } = useUpdateStylistProfile()
 */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getStylistProfile, updateStylistProfile, updateStylistAvatar } from "../actions/profile-actions"
import type { StylistProfileSchema } from "../schemas/stylist-schemas"

/** Cle de cache pour le profil coiffeuse */
const PROFILE_KEY = ["stylist", "profile"]

/**
 * useStylistProfile — Recuperer le profil de la coiffeuse connectee
 */
export function useStylistProfile() {
  const query = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async () => {
      const result = await getStylistProfile()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  return {
    profile: query.data,
    isLoading: query.isPending,
    error: query.error,
  }
}

/**
 * useUpdateStylistProfile — Mutation pour mettre a jour le profil
 */
export function useUpdateStylistProfile() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: StylistProfileSchema) => {
      const result = await updateStylistProfile(data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      // Invalider le cache pour forcer un refetch
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY })
      toast.success("Profil mis a jour avec succes")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  }
}

/**
 * useUpdateAvatar — Mutation pour mettre a jour l'avatar
 */
export function useUpdateAvatar() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const result = await updateStylistAvatar(imageUrl)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY })
      toast.success("Photo de profil mise a jour")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    updateAvatar: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  }
}
