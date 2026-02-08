/**
 * auth-store.ts — Store Zustand pour l'etat UI de l'authentification
 *
 * Role : Gerer l'etat UI lie a l'authentification cote client.
 *        NE stocke PAS les donnees de session (c'est le role de Better Auth
 *        via useSession). Stocke uniquement l'etat UI comme la modale
 *        de connexion, le role affiche, etc.
 *
 * Interactions :
 *   - Utilise par le Header (affichage conditionnel du role)
 *   - Utilise par les composants qui ont besoin de savoir si la modale
 *     de connexion doit etre ouverte
 *   - Les donnees utilisateur viennent de useSession() (Better Auth),
 *     PAS de ce store
 *
 * Separation des responsabilites :
 *   - Better Auth useSession() = donnees serveur (session, user, role)
 *   - Ce store = etat UI pur (modale ouverte, loading global)
 *
 * Exemple :
 *   import { useAuthStore } from "@/shared/stores/auth-store"
 *   const { isLoginModalOpen, openLoginModal } = useAuthStore()
 */
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

interface AuthUIState {
  /** Indique si la modale de connexion est ouverte (futur) */
  isLoginModalOpen: boolean
  /** Ouvrir la modale de connexion */
  openLoginModal: () => void
  /** Fermer la modale de connexion */
  closeLoginModal: () => void
}

export const useAuthStore = create<AuthUIState>()(
  immer((set) => ({
    isLoginModalOpen: false,

    openLoginModal: () =>
      set((state) => {
        state.isLoginModalOpen = true
      }),

    closeLoginModal: () =>
      set((state) => {
        state.isLoginModalOpen = false
      }),
  }))
)
