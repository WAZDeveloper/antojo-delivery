import type { EtiquetaId, Plato } from './tipos'

// Cómo se llama cada etiqueta en la pastilla del plato y en el botón de filtro
export const ETIQUETAS: Record<EtiquetaId, { nombre: string; filtro: string }> = {
  'mas-pedido': { nombre: 'Más pedido', filtro: 'Más pedidos' },
  picante: { nombre: 'Picante', filtro: 'Picantes' },
  'para-compartir': { nombre: 'Para compartir', filtro: 'Para compartir' },
  vegetariano: { nombre: 'Vegetariano', filtro: 'Vegetarianos' },
  nuevo: { nombre: 'Nuevo', filtro: 'Nuevos' },
}

export const ORDEN_ETIQUETAS = Object.keys(ETIQUETAS) as EtiquetaId[]

// Las etiquetas válidas de un plato (si en menu.json hay una mal escrita, se ignora)
export const etiquetasDe = (plato: Plato): EtiquetaId[] =>
  (plato.etiquetas ?? []).filter((id) => id in ETIQUETAS)

export const tieneEtiqueta = (plato: Plato, id: EtiquetaId) => etiquetasDe(plato).includes(id)