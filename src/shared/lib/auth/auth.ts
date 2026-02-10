/**
 * auth.ts — Configuration serveur Better Auth
 *
 * Role : Definir l'instance d'authentification cote serveur.
 *        Configure le provider email/password, l'adaptateur Prisma,
 *        et les champs additionnels (role, firstName, lastName).
 *
 * Interactions :
 *   - Utilise par le route handler /api/auth/[...all]/route.ts
 *   - Utilise par getSession() pour verifier l'authentification cote serveur
 *   - L'adaptateur Prisma connecte Better Auth a notre base Supabase
 *   - Les champs additionnels sont inclus dans la session utilisateur
 *
 * Exemple :
 *   import { auth } from "@/shared/lib/auth/auth"
 *   const session = await auth.api.getSession({ headers: await headers() })
 */
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { db } from "@/shared/lib/db"
import { sendPasswordResetEmail } from "@/shared/lib/email/send-email"

export const auth = betterAuth({
  // Adaptateur Prisma pour stocker users, sessions, accounts dans Supabase
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  // Provider email/password (seul mode d'authentification pour le MVP)
  emailAndPassword: {
    enabled: true,
    // Longueur minimale du mot de passe (8 caracteres)
    minPasswordLength: 8,
    // Callback appele par Better Auth quand un utilisateur demande un reset password.
    // Better Auth genere le token + l'URL automatiquement, on envoie l'email via Resend.
    sendResetPassword: async ({ user, url }) => {
      console.info("[Auth] sendResetPassword callback declenche pour:", user.email)
      console.info("[Auth] URL de reinitialisation generee:", url)
      await sendPasswordResetEmail(user.email, url)
    },
  },

  // Champs additionnels sur le modele User
  // Ces champs sont stockes en BDD et inclus dans la session
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
        input: true, // Autorise l'envoi lors de l'inscription
      },
      lastName: {
        type: "string",
        required: false,
        input: true,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "CLIENT",
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: false, // Pas envoyable lors de l'inscription
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },

  // Configuration de la session
  session: {
    // Duree de vie de la session : 7 jours
    expiresIn: 60 * 60 * 24 * 7,
    // Renouvellement automatique quand la session expire dans moins de 1 jour
    updateAge: 60 * 60 * 24,
  },

  // URL de base de l'application (utilisee pour les redirections)
  baseURL: process.env.BETTER_AUTH_URL,

  // Secret pour signer les tokens (doit etre different en production)
  secret: process.env.BETTER_AUTH_SECRET,

  // Origines autorisees a appeler l'API auth
  // Necessaire en production car Better Auth bloque les origines non declarees
  // Inclut le domaine custom, l'URL Vercel et localhost pour le dev
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "https://www.nappymarket.store",
    "https://nappymarket.store",
  ],
})
