/**
 * prisma.config.ts — Configuration Prisma 7
 *
 * Role : Definir les URLs de connexion a la base de donnees Supabase.
 *   - datasource.url : Connection directe pour les operations CLI et l'ORM
 *
 * Interactions :
 *   - Charge les variables depuis .env.local via dotenv
 *   - Utilise par `pnpm prisma generate`, `pnpm prisma db push`, etc.
 *
 * @see https://www.prisma.io/docs/orm/reference/prisma-config-reference
 */
import path from "node:path"
import dotenv from "dotenv"
import { defineConfig } from "prisma/config"

// Charger explicitement .env.local (dotenv/config ne charge que .env)
dotenv.config({ path: path.join(__dirname, ".env.local") })

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),

  // Connection directe a Supabase PostgreSQL
  // Utilisee par db push, migrate, studio et le client Prisma
  datasource: {
    url: process.env.DIRECT_URL!,
  },
})
