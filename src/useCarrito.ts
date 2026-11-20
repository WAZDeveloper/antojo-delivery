import { useEffect, useState } from 'react'
import type { Menu, Plato } from './tipos'

// Cuántos hay de cada plato: { "ent-01": 1, "mar-01": 2 }
export type Cantidades = Record<string, number>

const CLAVE = 'antojo-carrito'

// Recupera el pedido si el cliente recargó la página
function leerGuardado(): Cantidades {
  try {
    const texto = localStorage.getItem(CLAVE)
    return texto ? (JSON.parse(texto) as Cantidades) : {}
  } catch {
    return {}
  }
}

export function useCarrito() {
  const [cantidades, setCantidades] = useState<Cantidades>(leerGuardado)

  // Cada vez que cambia el pedido, se guarda en el navegador
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(cantidades))
    } catch {
      // Navegador sin almacenamiento (modo privado): el pedido funciona igual, solo no se recuerda
    }
  }, [cantidades])

  const agregar = (id: string) =>
    setCantidades((antes) => ({ ...antes, [id]: (antes[id] ?? 0) + 1 }))

  const quitar = (id: string) =>
    setCantidades((antes) => {
      const copia = { ...antes }
      const nueva = (copia[id] ?? 0) - 1
      if (nueva <= 0) {
        delete copia[id]
      } else {
        copia[id] = nueva
      }
      return copia
    })

  const vaciar = () => setCantidades({})

  return { cantidades, agregar, quitar, vaciar }
}

export interface LineaPedido {
  plato: Plato
  cantidad: number
  subtotal: number
}

// Redondea a centavos para evitar cosas como 24.299999
const centavos = (valor: number) => Math.round(valor * 100) / 100

// Convierte las cantidades en líneas del pedido con sus totales
export function resumirPedido(menu: Menu, cantidades: Cantidades) {
  const lineas: LineaPedido[] = []

  for (const categoria of menu.categorias) {
    for (const plato of categoria.platos) {
      const cantidad = cantidades[plato.id] ?? 0
      if (cantidad > 0 && plato.disponible) {
        lineas.push({ plato, cantidad, subtotal: centavos(plato.precio * cantidad) })
      }
    }
  }

  const totalPlatos = lineas.reduce((suma, linea) => suma + linea.cantidad, 0)
  const subtotal = centavos(lineas.reduce((suma, linea) => suma + linea.subtotal, 0))

  return { lineas, totalPlatos, subtotal }
}