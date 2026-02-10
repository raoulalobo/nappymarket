/**
 * useAuth — Hook pour les actions d'authentification
 *
 * Role : Encapsuler les appels Better Auth client pour l'inscription,
 *        la connexion, la deconnexion, et la gestion des mots de passe
 *        (oubli, reinitialisation, changement). Gere les erreurs et les
 *        redirections apres succes.
 *
 * Interactions :
 *   - Utilise authClient (Better Auth) pour les mutations
 *   - Redirige vers la bonne page selon le role apres connexion/inscription
 *   - Affiche des toasts via sonner en cas d'erreur/succes
 *   - Utilise dans LoginForm, RegisterForm, ForgotPasswordForm,
 *     ResetPasswordForm, ChangePasswordForm
 *
 * Exemple :
 *   const { login, register, logout, forgotPassword, resetPassword, changePassword, isLoading } = useAuth()
 *   await login({ email, password })
 *   await forgotPassword("user@email.com")
 *   await resetPassword("token123", "NouveauMdp1")
 *   await changePassword("AncienMdp1", "NouveauMdp1")
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { authClient } from "@/shared/lib/auth/auth-client"
import type { LoginFormData, RegisterFormData, UserRole } from "@/modules/auth/types"

/**
 * Determine la page de redirection selon le role de l'utilisateur
 * - CLIENT -> /client
 * - STYLIST -> /coiffeuse/dashboard
 * - ADMIN -> /admin/dashboard
 */
function getRedirectPath(role: UserRole): string {
  switch (role) {
    case "STYLIST":
      return "/coiffeuse/dashboard"
    case "ADMIN":
      return "/admin/dashboard"
    case "CLIENT":
    default:
      return "/client"
  }
}

export function useAuth() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Inscription par email/password
   * Cree un compte et redirige selon le role choisi
   */
  async function register(data: RegisterFormData) {
    setIsLoading(true)
    try {
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
        // Champs additionnels configures dans Better Auth
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      })

      if (result.error) {
        // Traduire les erreurs courantes en francais
        const message = translateAuthError(result.error.message)
        toast.error(message)
        return { success: false, error: message }
      }

      toast.success("Compte cree avec succes !")
      router.push(getRedirectPath(data.role))
      return { success: true }
    } catch {
      toast.error("Une erreur est survenue lors de l'inscription")
      return { success: false, error: "Erreur inattendue" }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Connexion par email/password
   * Recupere la session et redirige selon le role
   */
  async function login(data: LoginFormData) {
    setIsLoading(true)
    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      })

      if (result.error) {
        const message = translateAuthError(result.error.message)
        toast.error(message)
        return { success: false, error: message }
      }

      toast.success("Connexion reussie !")

      // Recuperer le role depuis la session pour rediriger
      const role = (result.data?.user as { role?: UserRole })?.role ?? "CLIENT"
      router.push(getRedirectPath(role))
      return { success: true }
    } catch {
      toast.error("Une erreur est survenue lors de la connexion")
      return { success: false, error: "Erreur inattendue" }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Deconnexion
   * Detruit la session et redirige vers l'accueil
   */
  async function logout() {
    setIsLoading(true)
    try {
      await authClient.signOut()
      toast.success("Deconnexion reussie")
      router.push("/")
      router.refresh()
    } catch {
      toast.error("Erreur lors de la deconnexion")
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Demande de reinitialisation de mot de passe (utilisateur deconnecte)
   * Envoie un email avec un lien de reinitialisation via Better Auth.
   * Le callback sendResetPassword dans auth.ts envoie l'email via Resend.
   *
   * @param email - Adresse email du compte a reinitialiser
   */
  async function forgotPassword(email: string) {
    setIsLoading(true)
    try {
      const result = await authClient.requestPasswordReset({
        email,
        // URL vers laquelle Better Auth redirige avec le token en query param
        redirectTo: "/reinitialiser-mot-de-passe",
      })

      if (result.error) {
        const message = translateAuthError(result.error.message)
        toast.error(message)
        return { success: false, error: message }
      }

      // Succes : ne pas reveler si l'email existe ou non (securite)
      return { success: true }
    } catch {
      toast.error("Une erreur est survenue")
      return { success: false, error: "Erreur inattendue" }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Reinitialisation du mot de passe (depuis le lien email)
   * Utilise le token genere par Better Auth pour definir un nouveau mot de passe.
   *
   * @param token - Token de reinitialisation (recu dans l'URL)
   * @param newPassword - Nouveau mot de passe choisi par l'utilisateur
   */
  async function resetPassword(token: string, newPassword: string) {
    setIsLoading(true)
    try {
      const result = await authClient.resetPassword({
        token,
        newPassword,
      })

      if (result.error) {
        const message = translateAuthError(result.error.message)
        toast.error(message)
        return { success: false, error: message }
      }

      toast.success("Mot de passe reinitialise avec succes !")
      router.push("/connexion")
      return { success: true }
    } catch {
      toast.error("Une erreur est survenue")
      return { success: false, error: "Erreur inattendue" }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Changement de mot de passe (utilisateur connecte)
   * Verifie l'ancien mot de passe avant de definir le nouveau.
   *
   * @param currentPassword - Mot de passe actuel de l'utilisateur
   * @param newPassword - Nouveau mot de passe souhaite
   */
  async function changePassword(currentPassword: string, newPassword: string) {
    setIsLoading(true)
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
      })

      if (result.error) {
        const message = translateAuthError(result.error.message)
        toast.error(message)
        return { success: false, error: message }
      }

      toast.success("Mot de passe modifie avec succes !")
      return { success: true }
    } catch {
      toast.error("Une erreur est survenue")
      return { success: false, error: "Erreur inattendue" }
    } finally {
      setIsLoading(false)
    }
  }

  return { login, register, logout, forgotPassword, resetPassword, changePassword, isLoading }
}

/**
 * Traduit les messages d'erreur Better Auth en francais
 * Couvre les erreurs courantes d'authentification
 */
function translateAuthError(message: string | undefined): string {
  if (!message) return "Une erreur est survenue"

  const translations: Record<string, string> = {
    "User already exists": "Un compte avec cet email existe deja",
    "Invalid email or password": "compte introuvable ou inexistant",
    "Invalid credentials": "compte introuvable ou inexistant",
    "Email is required": "L'adresse email est requise",
    "Password is required": "Le mot de passe est requis",
    "Too many requests": "Trop de tentatives, veuillez reessayer plus tard",
    "User not found": "Aucun compte trouve avec cet email",
    "Account not found": "Aucun compte trouve avec cet email",
    "Invalid token": "Le lien de reinitialisation est invalide ou a expire",
    "Token expired": "Le lien de reinitialisation a expire",
    "INVALID_TOKEN": "Le lien de reinitialisation est invalide ou a expire",
    "TOKEN_EXPIRED": "Le lien de reinitialisation a expire",
    "Invalid password": "Mot de passe actuel incorrect",
    "Password is too short": "Le mot de passe doit contenir au moins 8 caracteres",
  }

  return translations[message] ?? "Une erreur est survenue"
}
