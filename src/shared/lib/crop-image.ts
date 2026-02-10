/**
 * crop-image — Utilitaire de recadrage d'image via Canvas
 *
 * Role : Extraire une zone rectangulaire (pixelCrop) d'une image source
 *        et la convertir en fichier JPEG pret a etre uploade.
 *
 * Interactions :
 *   - Appele par ImageCropDialog apres validation du recadrage
 *   - Le File retourne est passe directement a uploadImage() (module storage)
 *
 * Fonctionnement :
 *   1. Charge l'image source dans un HTMLImageElement
 *   2. Cree un Canvas aux dimensions exactes du crop
 *   3. Dessine uniquement la portion croppee via drawImage()
 *   4. Exporte le Canvas en Blob JPEG (qualite 0.92)
 *   5. Convertit le Blob en File avec le nom specifie
 *
 * Exemple :
 *   const croppedFile = await getCroppedImage(
 *     "blob:http://localhost:3000/abc123",
 *     { x: 50, y: 30, width: 400, height: 225 },
 *     "ma-photo.jpg"
 *   )
 *   // croppedFile est un File JPEG pret pour l'upload
 */

/** Zone de crop en pixels (retournee par react-easy-crop) */
export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Charge une image depuis une URL (objectURL ou data URL) dans un HTMLImageElement.
 * Retourne une Promise resolue quand l'image est chargee.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (err) => reject(err))
    // Necessaire pour les images cross-origin (pas le cas ici avec objectURL, mais par securite)
    image.crossOrigin = "anonymous"
    image.src = src
  })
}

/**
 * Recadre une image et retourne un File JPEG.
 *
 * @param imageSrc  - URL de l'image source (objectURL ou data URL)
 * @param pixelCrop - Zone de recadrage en pixels {x, y, width, height}
 * @param fileName  - Nom du fichier de sortie (ex: "photo.jpg")
 * @returns File JPEG contenant uniquement la zone croppee
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: PixelCrop,
  fileName: string
): Promise<File> {
  const image = await loadImage(imageSrc)

  // Creer un Canvas aux dimensions exactes de la zone de crop
  const canvas = document.createElement("canvas")
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Impossible de creer le contexte Canvas 2D")
  }

  // Dessiner uniquement la portion croppee de l'image source
  // drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh)
  //   sx/sy = position de depart dans la source (coin haut-gauche du crop)
  //   sw/sh = taille de la zone a extraire de la source
  //   dx/dy = position de depart dans le canvas (0,0 = coin haut-gauche)
  //   dw/dh = taille de la zone de destination dans le canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Convertir le Canvas en Blob JPEG (qualite 92%)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b)
        else reject(new Error("Echec de la conversion Canvas -> Blob"))
      },
      "image/jpeg",
      0.92
    )
  })

  // Convertir le Blob en File avec le nom et le type MIME
  return new File([blob], fileName, { type: "image/jpeg" })
}
