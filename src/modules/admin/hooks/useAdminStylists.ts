/**
 * useAdminStylists — Hooks TanStack Query pour la gestion admin des coiffeuses
 *
 * Role : Fournir les donnees et mutations pour gerer les coiffeuses
 *        depuis le panneau d'administration. Encapsule les appels aux
 *        server actions avec cache, invalidation et toasts.
 *
 * Interactions :
 *   - Appelle les server actions de stylist-management-actions.ts
 *   - Invalide le cache TanStack Query apres chaque mutation reussie
 *   - Affiche des toasts de feedback via sonner (succes/erreur)
 *   - Utilise dans les composants admin : StylistTable, AdminDashboard, etc.
 *
 * Exemple :
 *   // Dans un composant admin
 *   const { stylists, isLoading } = useAdminStylists()
 *   const { verifyStylist, isVerifying } = useVerifyStylist()
 *   const { toggleActive, isToggling } = useToggleStylistActive()
 *   const { stats, isLoading: statsLoading } = useStylistStats()
 *
 *   // Verifier une coiffeuse
 *   await verifyStylist("profile-id")
 *
 *   // Basculer le statut actif/inactif
 *   await toggleActive("user-id")
 */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getStylists,
  verifyStylist,
  toggleStylistActive,
  getStylistStats,
} from "../actions/stylist-management-actions"

/* ------------------------------------------------------------------ */
/* Constantes de cache                                                 */
/* ------------------------------------------------------------------ */

/** Cle de cache pour la liste des coiffeuses */
const ADMIN_STYLISTS_KEY = ["admin", "stylists"]

/** Cle de cache pour les statistiques des coiffeuses */
const ADMIN_STYLIST_STATS_KEY = ["admin", "stylist-stats"]

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

/**
 * useAdminStylists — Recuperer la liste de toutes les coiffeuses
 *
 * Retourne les coiffeuses avec leur profil et le nombre de services.
 * Le cache est invalide apres chaque mutation (verification, toggle actif).
 *
 * Exemple :
 *   const { stylists, isLoading } = useAdminStylists()
 *   if (isLoading) return <Skeleton />
 *   stylists.map(s => (
 *     <div key={s.id}>
 *       {s.name} — {s.stylistProfile?.city ?? "Ville non renseignee"}
 *       — {s.stylistProfile?._count.services ?? 0} services
 *     </div>
 *   ))
 */
export function useAdminStylists() {
  const query = useQuery({
    queryKey: ADMIN_STYLISTS_KEY,
    queryFn: async () => {
      const result = await getStylists()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  return {
    /** Liste des coiffeuses (tableau vide pendant le chargement) */
    stylists: query.data ?? [],
    /** true pendant le chargement initial */
    isLoading: query.isPending,
  }
}

/**
 * useVerifyStylist — Mutation pour verifier une coiffeuse
 *
 * Marque le profil coiffeuse comme verifie (isVerified: true).
 * Apres verification reussie :
 * - Invalide le cache de la liste des coiffeuses
 * - Invalide le cache des statistiques (le compteur "verified" change)
 * - Affiche un toast "Coiffeuse verifiee"
 *
 * Exemple :
 *   const { verifyStylist, isVerifying } = useVerifyStylist()
 *   <Button
 *     onClick={() => verifyStylist("profile-id")}
 *     disabled={isVerifying}
 *   >
 *     Verifier
 *   </Button>
 */
export function useVerifyStylist() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    /**
     * Appelle la server action verifyStylist
     * @param stylistProfileId - Identifiant du StylistProfile a verifier
     */
    mutationFn: async (stylistProfileId: string) => {
      const result = await verifyStylist(stylistProfileId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      // Invalider la liste des coiffeuses et les stats
      queryClient.invalidateQueries({ queryKey: ADMIN_STYLISTS_KEY })
      queryClient.invalidateQueries({ queryKey: ADMIN_STYLIST_STATS_KEY })
      toast.success("Coiffeuse verifiee")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    /** Fonction pour verifier une coiffeuse (retourne une Promise) */
    verifyStylist: mutation.mutateAsync,
    /** true pendant la verification */
    isVerifying: mutation.isPending,
  }
}

/**
 * useToggleStylistActive — Mutation pour basculer le statut actif/inactif
 *
 * Inverse le champ isActive sur le User de la coiffeuse.
 * Apres bascule reussie :
 * - Invalide le cache de la liste des coiffeuses
 * - Invalide le cache des statistiques (le compteur "active" change)
 * - Affiche un toast "Statut mis a jour"
 *
 * Exemple :
 *   const { toggleActive, isToggling } = useToggleStylistActive()
 *   <Switch
 *     checked={stylist.isActive}
 *     onCheckedChange={() => toggleActive(stylist.id)}
 *     disabled={isToggling}
 *   />
 */
export function useToggleStylistActive() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    /**
     * Appelle la server action toggleStylistActive
     * @param userId - Identifiant du User a modifier
     */
    mutationFn: async (userId: string) => {
      const result = await toggleStylistActive(userId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      // Invalider la liste des coiffeuses et les stats
      queryClient.invalidateQueries({ queryKey: ADMIN_STYLISTS_KEY })
      queryClient.invalidateQueries({ queryKey: ADMIN_STYLIST_STATS_KEY })
      toast.success("Statut mis a jour")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    /** Fonction pour basculer le statut actif/inactif (retourne une Promise) */
    toggleActive: mutation.mutateAsync,
    /** true pendant la bascule */
    isToggling: mutation.isPending,
  }
}

/**
 * useStylistStats — Recuperer les statistiques globales des coiffeuses
 *
 * Retourne les compteurs du dashboard admin (total, verifiees, actives).
 * Le staleTime est fixe a 5 minutes car ces stats ne changent pas
 * frequemment et n'ont pas besoin d'etre refetchees a chaque focus.
 *
 * Exemple :
 *   const { stats, isLoading } = useStylistStats()
 *   if (isLoading) return <Skeleton />
 *   <div>Total : {stats.total}</div>
 *   <div>Verifiees : {stats.verified}</div>
 *   <div>Actives : {stats.active}</div>
 */
export function useStylistStats() {
  const query = useQuery({
    queryKey: ADMIN_STYLIST_STATS_KEY,
    queryFn: async () => {
      const result = await getStylistStats()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    // Les stats ne changent pas frequemment, on garde le cache 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes en millisecondes
  })

  return {
    /** Objet { total, verified, active } ou null pendant le chargement */
    stats: query.data ?? null,
    /** true pendant le chargement initial */
    isLoading: query.isPending,
  }
}
