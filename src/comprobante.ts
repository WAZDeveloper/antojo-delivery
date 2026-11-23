// Prepara la captura de la transferencia antes de enviarla:
// la achica (máximo 1600 px de lado) y la pasa a JPEG, para que pese poco y suba rápido.

const LADO_MAXIMO = 1600
const CALIDAD = 0.82
const PESO_MAXIMO = 15 * 1024 * 1024 // 15 MB: más que eso no es una captura

// Devuelve la imagen como texto "data:image/jpeg;base64,..." o lanza un Error con el mensaje para el cliente
export async function prepararComprobante(archivo: File): Promise<string> {
  if (!archivo.type.startsWith('image/')) {
    throw new Error('Suba una imagen (captura de pantalla o foto del comprobante).')
  }
  if (archivo.size > PESO_MAXIMO) throw new Error('La imagen es muy pesada. Suba una captura de pantalla.')

  let imagen: ImageBitmap
  try {
    imagen = await createImageBitmap(archivo)
  } catch {
    throw new Error('No pudimos abrir esa imagen. Pruebe con una captura en JPG o PNG.')
  }

  // Misma proporción, pero sin pasar de LADO_MAXIMO
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height))
  const ancho = Math.round(imagen.width * escala)
  const alto = Math.round(imagen.height * escala)

  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const pincel = lienzo.getContext('2d')
  if (!pincel) throw new Error('No pudimos preparar la imagen. Intente de nuevo.')
  pincel.fillStyle = '#ffffff' // fondo blanco por si la captura es PNG transparente
  pincel.fillRect(0, 0, ancho, alto)
  pincel.drawImage(imagen, 0, 0, ancho, alto)
  imagen.close()

  return lienzo.toDataURL('image/jpeg', CALIDAD)
}
