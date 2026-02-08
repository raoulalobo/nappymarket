/**
 * useAuth — Hook pour les actions d'authentification (login, register, logout)
 *
 * Role : Encapsuler les appels Better Auth client pour l'inscription,
 *        la connexion et la deconnexion. Gere les erreurs et les
 *        redirections apres succes.
 *
 * Interactions :
 *   - Utilise authClient (Better Auth) pour les mutations
 *   - Redirige vers la bonne page selon le role apres connexion/inscription
 *   - Affiche des toasts via sonner en cas d'erreur
 *   - Utilise dans LoginForm et RegisterForm
 *
 * Exemple :
 *   const { login, register, logout, isLoading } = useAuth()
 *   await login({ email, password })
 *   await register({ email, password, firstName, lastName, role: "CLIENT" })
 *   await logout()
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

  return { login, register, logout, isLoading }
}

/**
 * Traduit les messages d'erreur Better Auth en francais
 * Couvre les erreurs courantes d'authentification
 */
function translateAuthError(message: string | undefined): string {
  if (!message) return "Une erreur est survenue"

  const translations: Record<string, string> = {
    "User already exists": "Un compte avec cet email existe deja",
    "Invalid email or password": "Email ou mot de passe incorrect",
    "Invalid credentials": "Email ou mot de passe incorrect",
    "Email is required": "L'adresse email est requise",
    "Password is required": "Le mot de passe est requis",
    "Too many requests": "Trop de tentatives, veuillez reessayer plus tard",
    "User not found": "Aucun compte trouve avec cet email",
    "Account not found": "Aucun compte trouve avec cet email",
  }

  return translations[message] ?? "Une erreur est survenue"
}
