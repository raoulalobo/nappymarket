/**
 * auth-schemas.ts — Schemas Zod pour l'authentification
 *
 * Role : Valider les donnees des formulaires d'inscription et de connexion.
 *        Messages d'erreur en francais pour l'UX.
 *
 * Interactions :
 *   - Utilise par RegisterForm et LoginForm via React Hook Form (resolver Zod)
 *   - Utilise cote serveur pour la double validation des inputs
 *
 * Exemple :
 *   import { registerSchema } from "@/modules/auth/schemas/auth-schemas"
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

/** Type infere du schema de connexion */
export type LoginSchema = z.infer<typeof loginSchema>

/** Type infere du schema d'inscription */
export type RegisterSchema = z.infer<typeof registerSchema>
