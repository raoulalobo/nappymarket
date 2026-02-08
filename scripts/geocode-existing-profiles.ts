/**
 * Script de migration : geocoder les profils coiffeuses existants
 *
 * Les profils crees avant l'ajout du geocodage dans updateStylistProfile()
 * ont latitude=null et longitude=null. Ce script appelle l'API Adresse Gouv
 * pour chaque profil sans coordonnees et met a jour la BDD.
 *
 * Usage : npx tsx scripts/geocode-existing-profiles.ts
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

async function main() {
  // Trouver les profils sans coordonnees GPS
  const profiles = await db.stylistProfile.findMany({
    where: {
      latitude: null,
      city: { not: "" },
    },
    select: { id: true, city: true },
  })

  console.log(`${profiles.length} profil(s) sans coordonnees a geocoder.`)

  for (const profile of profiles) {
    try {
      const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(profile.city)}&type=municipality&limit=1`
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) })

      if (!response.ok) {
        console.log(`[SKIP] ${profile.city} — erreur HTTP ${response.status}`)
        continue
      }

      const data = await response.json()
      if (!data.features || data.features.length === 0) {
        console.log(`[SKIP] ${profile.city} — aucun resultat`)
        continue
      }

      // GeoJSON : [longitude, latitude]
      const [lng, lat] = data.features[0].geometry.coordinates

      await db.stylistProfile.update({
        where: { id: profile.id },
        data: { latitude: lat, longitude: lng },
      })

      console.log(`[OK] ${profile.city} -> lat: ${lat}, lng: ${lng}`)
    } catch (error) {
      console.log(`[ERREUR] ${profile.city} — ${error}`)
    }
  }

  console.log("Geocodage termine.")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
