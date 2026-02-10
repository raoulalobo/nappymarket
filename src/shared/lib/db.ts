/**
 * db.ts — Instance Prisma Client singleton avec adaptateur PostgreSQL
 *
 * Role : Fournir une instance unique du client Prisma pour tout le projet.
 *        Utilise l'adaptateur @prisma/adapter-pg avec un Pool pg explicite
 *        pour gerer les reconnexions apres coupure PgBouncer/Supabase.
 *        Evite de creer plusieurs connexions en developpement (hot reload).
 *
 * Interactions :
 *   - Importe par tous les modules qui ont besoin d'acceder a la BDD
 *   - Sera enhanced par ZenStack pour les access policies
 *   - Se connecte a Supabase PostgreSQL via le pool de connexions PgBouncer
 *
 * Exemple d'utilisation :
 *   import { db } from "@/shared/lib/db"
 *   const users = await db.user.findMany()
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

// Declarer le type global pour eviter les recreations en dev (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Creer l'instance PrismaClient avec l'adaptateur PostgreSQL
 *
 * Utilise un Pool pg explicite avec des timeouts courts pour eviter
 * l'erreur "connection failure during authentication" quand PgBouncer
 * ferme les connexions idle. Le pool renouvelle automatiquement les
 * connexions expirees grace a idleTimeoutMillis.
 *
 * Exemple d'erreur evitee :
 *   DriverAdapterError: connection failure during authentication
 *   (connexion idle fermee par PgBouncer apres inactivite)
 */
function createPrismaClient(): PrismaClient {
  // Pool pg explicite avec gestion des connexions idle
  // idleTimeoutMillis = 30s : ferme les connexions inactives avant que
  //   PgBouncer ne les coupe (son timeout est generalement 60s)
  // connectionTimeoutMillis = 10s : timeout de connexion raisonnable
  // max = 5 : limite le nombre de connexions au pooler Supabase
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    max: 5,
  })

  // L'adaptateur PrismaPg accepte un pg.Pool directement en premier argument
  const adapter = new PrismaPg(pool)

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
