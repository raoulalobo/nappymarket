/**
 * Script de migration : geocoder les profils coiffeuses existants
 *
 * Les profils crees avant l'ajout du geocodage dans updateStylistProfile()
 * ont latitude=null et longitude=null. Ce script appelle Mapbox Geocoding API
 * pour chaque profil sans coordonnees et met a jour la BDD.
 *
 * Prerequis : NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN defini dans .env.local
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
  // Verifier que le token Mapbox est present
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  if (!mapboxToken) {
    console.error("[ERREUR] NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN non defini dans .env.local")
    process.exit(1)
  }

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
      // Mapbox Geocoding v5 :
      // - types=place : villes uniquement
      // - language=fr : labels en francais
      // - country=fr : France uniquement
      // - limit=1 : un seul resultat
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(profile.city)}.json?access_token=${mapboxToken}&types=place&limit=1&language=fr&country=fr`
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

      // Mapbox : center = [longitude, latitude]
      const [lng, lat] = data.features[0].center

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
