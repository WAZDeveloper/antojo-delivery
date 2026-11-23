import type { Menu, Plato } from './tipos'
import { grupoIncompleto } from './reparto'
import type { Elegidas } from './useCarrito'

// Un pedido que llega armado en el enlace, por ejemplo desde el bot de WhatsApp:
//   ?pedido=2-encebollado_1-bolon-mixto_1-ceviche-jipijapa-camaron   (nombres, los escribe la IA)
//   ?pedido=des-04*2,des-08*1                                       (códigos, también sirve)
// Cada plato va separado por "_" o ",". La cantidad va adelante (2-encebollado) o atrás (des-04*2).
export interface ItemEnlace {
  plato: Plato
  cantidad: number
  elegidas: Elegidas // complementos que venían en el texto (p. ej. "mixto" → Proteína: Mixto)
}

export interface PedidoEnlace {
  items: ItemEnlace[]
  noEncontrados: number // partes del enlace que no coinciden con ningún plato disponible
}

const MAXIMO_POR_PLATO = 20
const PALABRAS_VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'con', 'a', 'lo', 'en', 'y', 'al', 'un', 'una'])

// "Camarones a lo Macho" → ["camaron", "macho"]: sin tildes, sin palabras vacías y en singular
function palabras(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((p) => p && !PALABRAS_VACIAS.has(p))
    .map((p) => (p.length > 4 && p.endsWith('es') ? p.slice(0, -2) : p.length > 3 && p.endsWith('s') ? p.slice(0, -1) : p))
}

// Complementos cuyo nombre aparece completo en el texto (respetando el máximo de cada grupo)
function complementosEnTexto(plato: Plato, buscadas: Set<string>): Elegidas {
  const elegidas: Elegidas = {}
  for (const grupo of plato.opciones ?? []) {
    const encontrados = grupo.valores
      .filter((v) => {
        const pv = palabras(v.nombre.replace(/\(.*?\)/g, '')) // "Con todo (recomendado)" → con todo
        return pv.length > 0 && pv.every((p) => buscadas.has(p))
      })
      .slice(0, grupo.maximo)
      .map((v) => v.nombre)
    if (encontrados.length) elegidas[grupo.nombre] = encontrados
  }
  return elegidas
}

// Busca el plato que mejor coincide con el texto. Puntaje = (cuánto del nombre del plato está en el texto)
// × (cuánto del texto se explica con el plato o sus complementos). En empate gana el que aparece primero.
function buscarPorNombre(platos: Plato[], texto: string): { plato: Plato; elegidas: Elegidas } | null {
  const buscadas = new Set(palabras(texto))
  if (buscadas.size === 0) return null

  let mejor: { plato: Plato; puntaje: number } | null = null
  for (const plato of platos) {
    const delPlato = new Set(palabras(plato.nombre))
    if (delPlato.size === 0) continue
    const comunes = [...delPlato].filter((p) => buscadas.has(p)).length
    if (comunes === 0) continue
    const deOpciones = new Set((plato.opciones ?? []).flatMap((g) => g.valores.flatMap((v) => palabras(v.nombre))))
    const explicadas = [...buscadas].filter((p) => delPlato.has(p) || deOpciones.has(p)).length
    const cubrePlato = comunes / delPlato.size
    const cubreTexto = explicadas / buscadas.size
    if (cubrePlato < 0.5 || cubreTexto < 0.5) continue
    const puntaje = cubrePlato * cubreTexto
    if (!mejor || puntaje > mejor.puntaje) mejor = { plato, puntaje }
  }
  return mejor ? { plato: mejor.plato, elegidas: complementosEnTexto(mejor.plato, buscadas) } : null
}

export function leerPedidoEnlace(menu: Menu, busqueda = window.location.search): PedidoEnlace | null {
  const texto = new URLSearchParams(busqueda).get('pedido')
  if (!texto) return null

  const disponibles = menu.categorias.flatMap((c) => c.platos).filter((p) => p.disponible)
  const porId = new Map(disponibles.map((p) => [p.id.toLowerCase(), p]))
  const juntos = new Map<string, ItemEnlace>()
  let noEncontrados = 0

  for (const parte of texto.split(/[_,]/)) {
    const limpio = parte.trim().toLowerCase()
    if (!limpio) continue

    // 1) Código con la cantidad atrás: "des-04*2", "des-04x2", "des-04:2" o solo "des-04"
    // 2) Cantidad adelante: "2-encebollado", "2 encebollado", "2-des-04"; sin número cuenta como 1
    const conCodigo = /^([a-z]{3}-\d{2})\s*(?:[*x:]\s*(\d+))?$/.exec(limpio)
    const conCantidad = conCodigo ? null : /^(\d+)[\s-]*(.+)$/.exec(limpio)
    const cantidadTexto = conCodigo?.[2] ?? conCantidad?.[1] ?? '1'
    const resto = conCodigo ? conCodigo[1] : (conCantidad?.[2] ?? limpio)
    const cantidad = Math.min(MAXIMO_POR_PLATO, Math.max(1, parseInt(cantidadTexto, 10) || 1))

    const porCodigo = porId.get(resto)
    const encontrado = porCodigo ? { plato: porCodigo, elegidas: {} } : buscarPorNombre(disponibles, resto)
    if (!encontrado) {
      noEncontrados++
      continue
    }

    // El mismo plato con los mismos complementos se suma en una sola línea
    const clave = JSON.stringify([encontrado.plato.id, encontrado.elegidas])
    const anterior = juntos.get(clave)
    juntos.set(clave, {
      ...encontrado,
      cantidad: Math.min(MAXIMO_POR_PLATO, (anterior?.cantidad ?? 0) + cantidad),
    })
  }

  return { items: [...juntos.values()], noEncontrados }
}

// ¿Falta elegir algo obligatorio antes de agregarlo? (p. ej. la proteína del bolón)
export const necesitaElegir = (plato: Plato, elegidas: Elegidas = {}) =>
  (plato.opciones ?? []).some((grupo) => grupoIncompleto(grupo, elegidas))

// Quita ?pedido= de la dirección para que al recargar no se agregue otra vez (deja ?c=)
export function quitarPedidoDelEnlace() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('pedido')) return
  url.searchParams.delete('pedido')
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
}