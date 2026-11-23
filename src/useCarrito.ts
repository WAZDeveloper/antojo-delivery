import { useEffect, useState } from 'react'
import { agrupar, contar } from './reparto'
import type { Menu, Plato } from './tipos'

// Lo que el cliente eligió en cada grupo: { "Guarnición": ["Patacón"], "Extras": ["Huevo frito"] }
export type Elegidas = Record<string, string[]>

// Una línea del carrito. El mismo plato con otra guarnición o nota es otra línea.
export interface ItemCarrito {
  clave: string
  platoId: string
  elegidas: Elegidas
  nota: string
  cantidad: number
}

// v2: cambió la forma de guardar. Así no se mezcla con lo guardado por la versión anterior.
const CLAVE = 'antojo-carrito-v2'

function leerGuardado(): ItemCarrito[] {
  try {
    const texto = localStorage.getItem(CLAVE)
    const datos: unknown = texto ? JSON.parse(texto) : []
    return Array.isArray(datos) ? (datos as ItemCarrito[]) : []
  } catch {
    return []
  }
}

// Misma receta (plato + opciones + nota) = misma clave = se suman las cantidades
const crearClave = (platoId: string, elegidas: Elegidas, nota: string) =>
  JSON.stringify([platoId, elegidas, nota.trim().toLowerCase()])

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>(leerGuardado)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items))
    } catch {
      // Navegador sin almacenamiento: el pedido funciona igual, solo no se recuerda
    }
  }, [items])

  const agregar = (platoId: string, elegidas: Elegidas, nota: string, cantidad: number) =>
    setItems((antes) => {
      const clave = crearClave(platoId, elegidas, nota)
      const existe = antes.some((item) => item.clave === clave)
      if (existe) {
        return antes.map((item) => (item.clave === clave ? { ...item, cantidad: item.cantidad + cantidad } : item))
      }
      return [...antes, { clave, platoId, elegidas, nota: nota.trim(), cantidad }]
    })

  const sumar = (clave: string) =>
    setItems((antes) => antes.map((item) => (item.clave === clave ? { ...item, cantidad: item.cantidad + 1 } : item)))

  const restar = (clave: string) =>
    setItems((antes) =>
      antes
        .map((item) => (item.clave === clave ? { ...item, cantidad: item.cantidad - 1 } : item))
        .filter((item) => item.cantidad > 0),
    )

  const vaciar = () => setItems([])

  return { items, agregar, sumar, restar, vaciar }
}

// ---------- Cálculos ----------

const centavos = (valor: number) => Math.round(valor * 100) / 100

// Precio de un plato con sus extras: base + lo que sumen las opciones elegidas
// (en un combo con reparto, cada unidad suma: 2 de cangrejo = 2 × el recargo)
export function precioUnitario(plato: Plato, elegidas: Elegidas) {
  let total = plato.precio
  for (const grupo of plato.opciones ?? []) {
    for (const valor of grupo.valores) {
      total += valor.precio * contar(elegidas[grupo.nombre], valor.nombre)
    }
  }
  return centavos(total)
}

// "Patacón · Huevo frito" · en combos: "2× Queso manaba · 4× Camarón"
export const textoOpciones = (elegidas: Elegidas) => Object.values(elegidas).flatMap(agrupar).join(' · ')

export interface LineaPedido {
  clave: string
  plato: Plato
  elegidas: Elegidas
  detalle: string
  nota: string
  cantidad: number
  unitario: number
  subtotal: number
}

export function resumirPedido(menu: Menu, items: ItemCarrito[]) {
  // Buscar un plato por su id rápidamente
  const platos = new Map(menu.categorias.flatMap((c) => c.platos).map((p) => [p.id, p]))

  const lineas: LineaPedido[] = []
  const cantidadPorPlato: Record<string, number> = {}

  for (const item of items) {
    const plato = platos.get(item.platoId)
    if (!plato || !plato.disponible) continue // si lo quitaron del menú o se agotó, sale del pedido

    const unitario = precioUnitario(plato, item.elegidas)
    lineas.push({
      clave: item.clave,
      plato,
      elegidas: item.elegidas,
      detalle: textoOpciones(item.elegidas),
      nota: item.nota,
      cantidad: item.cantidad,
      unitario,
      subtotal: centavos(unitario * item.cantidad),
    })
    cantidadPorPlato[plato.id] = (cantidadPorPlato[plato.id] ?? 0) + item.cantidad
  }

  const totalPlatos = lineas.reduce((suma, linea) => suma + linea.cantidad, 0)
  const subtotal = centavos(lineas.reduce((suma, linea) => suma + linea.subtotal, 0))

  return { lineas, totalPlatos, subtotal, cantidadPorPlato }
}