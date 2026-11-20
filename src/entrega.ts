import type { Local, Menu } from './tipos'

export interface Punto {
  lat: number
  lng: number
}

// Distancia en línea recta entre dos puntos del mapa, en km (fórmula de Haversine)
export function distanciaKm(a: Punto, b: Punto): number {
  const R = 6371 // radio de la Tierra en km
  const rad = (grados: number) => (grados * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export type ResultadoEntrega =
  | { enRango: true; local: Local; distancia: number; envio: number }
  | { enRango: false; local: Local; distancia: number }

// Elige el local más cercano al pin y calcula el envío según la distancia
export function calcularEntrega(menu: Menu, punto: Punto): ResultadoEntrega | null {
  const cercanos = menu.locales
    .map((local) => ({ local, distancia: distanciaKm(punto, local) }))
    .sort((a, b) => a.distancia - b.distancia)

  if (cercanos.length === 0) return null
  const { local, distancia } = cercanos[0]

  const tarifa = menu.tarifas_envio.find((t) => distancia <= t.hasta_km)
  if (distancia > local.radio_km || !tarifa) return { enRango: false, local, distancia }

  return { enRango: true, local, distancia, envio: tarifa.precio }
}

// 2.437 → "2.4 km"
export const textoKm = (km: number) => `${km.toFixed(1)} km`