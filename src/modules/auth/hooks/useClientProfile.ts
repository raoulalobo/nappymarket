/**
 * useClientProfile — Hooks TanStack Query pour le profil cliente
 *
 * Role : Fournir les donnees du profil cliente avec cache TanStack Query,
 *        ainsi que la mutation pour mettre a jour le profil.
 *        Le cache est automatiquement invalide apres une mutation reussie.
 *
 * Interactions :
 *   - Appelle les server actions getClientProfile / updateClientProfile
 *   - Le cache est gere par TanStack Query (staleTime, gcTime dans QueryProvider)
 *   - Les toasts de succes/erreur sont affiches via sonner
 *   - Utilise dans ClientProfileForm pour charger et sauvegarder le profil
 *
 * Exemple :
 *   // Charger le profil cliente
 *   const { profile, isLoading, error } = useClientProfile()
 *   if (isLoading) return <Skeleton />
 *   console.log(profile?.city) // "Paris"
 *
 *   // Mettre a jour le profil
 *   const { updateProfile, isUpdating } = useUpdateClientProfile()
 *   await updateProfile({ city: "Lyon", address: "5 rue X" })
 */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getClientProfile,
  updateClientProfile,
} from "../actions/client-profile-actions"

/**
 * Cle de cache TanStack Query pour le profil cliente.
 * Utilisee pour identifier et invalider le cache lors des mutations.
 * Convention : ["module", "resource"] -> ["client", "profile"]
 */
const CLIENT_PROFILE_KEY = ["client", "profile"]

/**
 * useClientProfile — Recuperer le profil de la cliente connectee
 *
 * Effectue un fetch via la server action getClientProfile().
 * Les donnees sont mises en cache avec la cle ["client", "profile"].
 * En cas d'erreur de la server action, une Error est levee pour TanStack Query.
 *
 * Exemple :
 *   function MonComposant() {
 *     const { profile, isLoading, error } = useClientProfile()
 *
 *     if (isLoading) return <p>Chargement...</p>
 *     if (error) return <p>Erreur : {error.message}</p>
 *     if (!profile) return <p>Aucun profil</p>
 *
 *     return <p>Ville : {profile.city}</p>
 *   }
 */
export function useClientProfile() {
  const query = useQuery({
    queryKey: CLIENT_PROFILE_KEY,
    queryFn: async () => {
      // Appeler la server action pour recuperer le profil
      const result = await getClientProfile()

      // Si la server action retourne une erreur, lever une exception
      // pour que TanStack Query puisse la capturer et l'afficher
      if (!result.success) throw new Error(result.error)

      return result.data
    },
  })

  return {
    /** Profil cliente (ou null si pas encore cree) */
    profile: query.data,
    /** true pendant le chargement initial */
    isLoading: query.isPending,
    /** Erreur eventuelle (authentification, reseau, etc.) */
    error: query.error,
  }
}

/**
 * useUpdateClientProfile — Mutation pour mettre a jour le profil cliente
 *
 * Appelle la server action updateClientProfile() puis invalide le cache
 * pour forcer un rechargement des donnees fraiches.
 * Affiche un toast de succes ou d'erreur selon le resultat.
 *
 * Exemple :
 *   function MonFormulaire() {
 *     const { updateProfile, isUpdating } = useUpdateClientProfile()
 *
 *     async function onSubmit(data: { city?: string; address?: string }) {
 *       await updateProfile(data)
 *       // Le toast "Profil mis a jour" s'affiche automatiquement
 *     }
 *
 *     return (
 *       <Button disabled={isUpdating} onClick={() => updateProfile({ city: "Paris" })}>
 *         {isUpdating ? "Enregistrement..." : "Enregistrer"}
 *       </Button>
 *     )
 *   }
 */
export function useUpdateClientProfile() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    /**
     * Appeler la server action pour creer/mettre a jour le profil.
     * Si la server action echoue, lever une Error pour declencher onError.
     */
    mutationFn: async (data: { city?: string; address?: string; phone?: string }) => {
      const result = await updateClientProfile(data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },

    /**
     * Apres une mutation reussie :
     * 1. Invalider le cache du profil pour forcer un refetch
     * 2. Afficher un toast de confirmation
     */
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_PROFILE_KEY })
      toast.success("Profil mis a jour")
    },

    /**
     * En cas d'erreur (non authentifie, erreur serveur, etc.),
     * afficher le message d'erreur dans un toast.
     */
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    /** Fonction pour declencher la mutation (appeler avec les donnees du formulaire) */
    updateProfile: mutation.mutateAsync,
    /** true pendant l'envoi de la mutation au serveur */
    isUpdating: mutation.isPending,
  }
}
