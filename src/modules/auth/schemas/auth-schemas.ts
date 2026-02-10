/**
 * auth-schemas.ts — Schemas Zod pour l'authentification
 *
 * Role : Valider les donnees des formulaires d'inscription, connexion,
 *        mot de passe oublie, reinitialisation et changement de mot de passe.
 *        Messages d'erreur en francais pour l'UX.
 *
 * Interactions :
 *   - Utilise par RegisterForm, LoginForm, ForgotPasswordForm,
 *     ResetPasswordForm, ChangePasswordForm via React Hook Form (resolver Zod)
 *   - Utilise cote serveur pour la double validation des inputs
 *
 * Exemple :
 *   import { registerSchema, changePasswordSchema } from "@/modules/auth/schemas/auth-schemas"
 *   const result = registerSchema.safeParse(formData)
 */
import { z } from "zod"

/**
 * Schema de validation pour le formulaire de connexion
 * Champs : email + mot de passe
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise")
    .email("Adresse email invalide"),
  password: z
    .string()
    .min(1, "Le mot de passe est requis"),
})

/**
 * Schema de validation pour le formulaire d'inscription
 * Champs : email, mot de passe, prenom, nom, role
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise")
    .email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres")
    .regex(
      /[A-Z]/,
      "Le mot de passe doit contenir au moins une majuscule"
    )
    .regex(
      /[0-9]/,
      "Le mot de passe doit contenir au moins un chiffre"
    ),
  firstName: z
    .string()
    .min(2, "Le prenom doit contenir au moins 2 caracteres")
    .max(50, "Le prenom ne peut pas depasser 50 caracteres"),
  lastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caracteres")
    .max(50, "Le nom ne peut pas depasser 50 caracteres"),
  role: z.enum(["CLIENT", "STYLIST"], {
    message: "Veuillez choisir votre profil",
  }),
})

/**
 * Regles de validation du mot de passe reutilisables
 * - Minimum 8 caracteres
 * - Au moins une majuscule
 * - Au moins un chiffre
 */
const passwordRules = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caracteres")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")

/**
 * Schema de validation pour le formulaire "Mot de passe oublie"
 * Champ : email uniquement
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise")
    .email("Adresse email invalide"),
})

/**
 * Schema de validation pour le formulaire de reinitialisation de mot de passe
 * Champs : nouveau mot de passe + confirmation
 * Contrainte : les deux mots de passe doivent correspondre
 */
export const resetPasswordSchema = z
  .object({
    password: passwordRules,
    confirmPassword: z.string().min(1, "La confirmation est requise"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })

/**
 * Schema de validation pour le formulaire de changement de mot de passe (connecte)
 * Champs : mot de passe actuel + nouveau mot de passe + confirmation
 * Contrainte : nouveau et confirmation doivent correspondre
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, "La confirmation est requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })

/** Type infere du schema de connexion */
export type LoginSchema = z.infer<typeof loginSchema>

/** Type infere du schema d'inscription */
export type RegisterSchema = z.infer<typeof registerSchema>

/** Type infere du schema "mot de passe oublie" */
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>

/** Type infere du schema de reinitialisation de mot de passe */
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>

/** Type infere du schema de changement de mot de passe */
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>
