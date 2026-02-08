/**
 * db.ts — Instance Prisma Client singleton avec adaptateur PostgreSQL
 *
 * Role : Fournir une instance unique du client Prisma pour tout le projet.
 *        Utilise l'adaptateur @prisma/adapter-pg pour le client engine de Prisma 7.
 *        Evite de creer plusieurs connexions en developpement (hot reload).
 *
 * Interactions :
 *   - Importe par tous les modules qui ont besoin d'acceder a la BDD
 *   - Sera enhanced par ZenStack pour les access policies
 *   - Se connecte a Supabase PostgreSQL via le pool de connexions
 *
 * Exemple d'utilisation :
 *   import { db } from "@/shared/lib/db"
 *   const users = await db.user.findMany()
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Declarer le type global pour eviter les recreations en dev (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Creer l'instance PrismaClient avec l'adaptateur PostgreSQL
 * Prisma 7 utilise le "client engine" par defaut qui necessite un adaptateur
 */
function createPrismaClient(): PrismaClient {
  // L'adaptateur PrismaPg utilise le driver pg natif pour se connecter
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  })

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })
}

// Reutiliser l'instance existante en dev, en creer une nouvelle en prod
export const db = globalForPrisma.prisma ?? createPrismaClient()

// Stocker l'instance dans le global en dev pour persister entre les hot reloads
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
