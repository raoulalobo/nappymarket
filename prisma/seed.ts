/**
 * seed.ts — Script de seeding pour la base de donnees
 *
 * Role : Peupler la base de donnees avec les donnees initiales :
 *        - Un utilisateur admin par defaut
 *        - Les categories de prestations de coiffure afro
 *
 * Interactions :
 *   - Execute via `pnpm tsx prisma/seed.ts`
 *   - Charge .env.local via dotenv (meme pattern que prisma.config.ts)
 *   - Utilise @prisma/adapter-pg (requis par Prisma 7 client engine)
 *   - Le mot de passe admin est hashe avec scrypt (meme algo que Better Auth)
 *
 * Usage :
 *   pnpm tsx prisma/seed.ts
 */
import path from "node:path"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Charger .env.local explicitement
dotenv.config({ path: path.join(__dirname, "..", ".env.local") })

// Creer le client Prisma avec l'adaptateur PostgreSQL (Prisma 7)
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

/**
 * Categories de coiffures afro par defaut
 * Gerees par l'admin dans le back-office (module admin)
 */
const DEFAULT_CATEGORIES = [
  {
    name: "Tresses",
    description:
      "Tresses africaines, box braids, tresses collees, cornrows et variantes",
  },
  {
    name: "Locks / Dreadlocks",
    description:
      "Creation, entretien et retwist de locks, faux locks, locks au crochet",
  },
  {
    name: "Tissage / Weaving",
    description:
      "Pose de tissage ouvert, ferme, en U-part ou avec closure/frontal",
  },
  {
    name: "Crochet Braids",
    description:
      "Pose de meches au crochet sur tresses (faux locks, boucles, torsades)",
  },
  {
    name: "Nattes collees",
    description: "Nattes plaquees, vanilles collees, motifs geometriques",
  },
  {
    name: "Torsades / Twists",
    description:
      "Twists two-strand, flat twists, vanilles, passion twists, spring twists",
  },
  {
    name: "Coloration",
    description:
      "Coloration complete, meches, balayage, decoloration sur cheveux afro",
  },
  {
    name: "Coupe & Entretien",
    description:
      "Coupe, taille de pointes, soin profond, detangling, mise en forme",
  },
  {
    name: "Perruque / Wig",
    description:
      "Pose et installation de perruques (lace front, full lace, closure wig)",
  },
  {
    name: "Coiffure evenementielle",
    description:
      "Chignons, coiffures de mariage, tresses de ceremonie, coiffures festives",
  },
]

async function main() {
  console.log("Seeding de la base de donnees...")

  // --- 1. Seed des categories ---
  console.log("\n--- Categories de coiffures ---")
  for (const category of DEFAULT_CATEGORIES) {
    const existing = await prisma.serviceCategory.findUnique({
      where: { name: category.name },
    })

    if (existing) {
      console.log(`  [EXISTE] ${category.name}`)
    } else {
      await prisma.serviceCategory.create({
        data: {
          name: category.name,
          description: category.description,
          isActive: true,
        },
      })
      console.log(`  [CREE]   ${category.name}`)
    }
  }

  // --- 2. Seed de l'admin ---
  console.log("\n--- Utilisateur admin ---")
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@nappymarket.fr" },
  })

  if (existingAdmin) {
    console.log("  [EXISTE] admin@nappymarket.fr")
  } else {
    const admin = await prisma.user.create({
      data: {
        email: "admin@nappymarket.fr",
        name: "Admin NappyMarket",
        firstName: "Admin",
        lastName: "NappyMarket",
        role: "ADMIN",
        emailVerified: true,
        isActive: true,
      },
    })

    // Creer le compte credential avec mot de passe hashe (scrypt)
    await prisma.account.create({
      data: {
        accountId: admin.id,
        providerId: "credential",
        userId: admin.id,
        password: await hashPassword("Admin123!"),
      },
    })

    console.log(`  [CREE]   ${admin.email} (mot de passe: Admin123!)`)
    console.log("  IMPORTANT: Changer le mot de passe admin en production !")
  }

  console.log("\nSeed termine.")
}

/**
 * Hash un mot de passe avec scrypt (meme algorithme que Better Auth)
 * Format : salt:derivedKey (en hexadecimal)
 */
async function hashPassword(password: string): Promise<string> {
  const { scrypt, randomBytes } = await import("node:crypto")
  const { promisify } = await import("node:util")
  const scryptAsync = promisify(scrypt)

  const salt = randomBytes(16).toString("hex")
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString("hex")}`
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("Erreur lors du seed :", e)
    await prisma.$disconnect()
    process.exit(1)
  })
