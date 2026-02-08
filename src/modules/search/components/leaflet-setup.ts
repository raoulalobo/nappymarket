/**
 * leaflet-setup.ts — Fix des icones Leaflet par defaut
 *
 * Role : Corriger le probleme des icones manquantes de Leaflet quand il est
 *        utilise avec un bundler (Webpack/Turbopack). Par defaut, Leaflet
 *        essaie de charger les images marker-icon.png et marker-shadow.png
 *        depuis un chemin relatif qui ne fonctionne pas avec les bundlers.
 *
 * Interactions :
 *   - Importe par SearchMap avant de rendre la carte
 *   - Reassigne les URLs des icones Leaflet par defaut
 *   - Les images sont importees depuis le package leaflet dans node_modules
 *
 * Exemple :
 *   import "@/modules/search/components/leaflet-setup"
 *   // Apres cet import, les markers Leaflet affichent leurs icones correctement
 */
import L from "leaflet"

// Importer les images des marqueurs depuis le package leaflet
// Turbopack/Webpack les copient dans le dossier de build automatiquement
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

// Reassigner les URLs des icones par defaut de Leaflet
// Corrige : les icones ne s'affichent pas sans cette reassignation
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src ?? markerIcon,
  iconRetinaUrl: markerIcon2x.src ?? markerIcon2x,
  shadowUrl: markerShadow.src ?? markerShadow,
})
