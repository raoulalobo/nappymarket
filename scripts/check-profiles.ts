/**
 * Script temporaire pour verifier les coordonnees des profils coiffeuses
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

async function main() {
  const profiles = await db.stylistProfile.findMany({
    select: {
      id: true,
      city: true,
      latitude: true,
      longitude: true,
      isActive: true,
      user: { select: { name: true, isActive: true } },
    },
  })

  console.log("=== Profils coiffeuses ===")
  for (const p of profiles) {
    console.log(
      `${p.user.name} | ville: ${p.city} | lat: ${p.latitude} | lng: ${p.longitude} | active: ${p.isActive} | user_active: ${p.user.isActive}`
    )
  }

  if (profiles.length === 0) {
    console.log("Aucun profil coiffeuse trouve.")
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
