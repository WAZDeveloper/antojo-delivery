// "Reparto": cuando el cliente reparte las unidades entre las opciones.
// Ej.: 3 bolones → 2 de queso y 1 mixto · combo de 6 empanadas → 2 queso, 2 camarón, 2 cangrejo.
// En la lista se guarda un nombre por unidad: ["Queso", "Queso", "Mixto"].
import type { GrupoOpciones, Plato } from './tipos'
import type { Elegidas } from './useCarrito'

// Cuántas unidades hay que repartir en el grupo (0 = no es de reparto)
//   reparto 1 → una por plato: si pide 3 bolones, reparte 3
//   reparto 6 → el combo trae 6: reparte 6 por cada combo
export const unidadesReparto = (grupo: GrupoOpciones, cantidad: number) =>
  !grupo.reparto ? 0 : grupo.reparto === 1 ? cantidad : grupo.reparto

export const contar = (lista: string[] = [], valor: string) => lista.filter((v) => v === valor).length

// ["Queso", "Queso", "Mixto"] → ["2× Queso", "Mixto"]
export function agrupar(lista: string[]) {
  const vistos = [...new Set(lista)]
  return vistos.map((valor) => {
    const veces = contar(lista, valor)
    return veces > 1 ? `${veces}× ${valor}` : valor
  })
}

// Una línea del carrito por cada opción: 3 bolones (2 queso + 1 mixto) → 2× Bolón queso y 1× Bolón mixto
export function separarLineas(plato: Plato, elegidas: Elegidas, cantidad: number) {
  const grupo = (plato.opciones ?? []).find((g) => g.reparto === 1)
  if (!grupo) return [{ elegidas, cantidad }]
  const lista = elegidas[grupo.nombre] ?? []
  return grupo.valores
    .map((valor) => ({ valor: valor.nombre, veces: contar(lista, valor.nombre) }))
    .filter(({ veces }) => veces > 0)
    .map(({ valor, veces }) => ({ elegidas: { ...elegidas, [grupo.nombre]: [valor] }, cantidad: veces }))
}

// ¿Falta elegir algo en este grupo? (una línea del carrito ya separada)
export function grupoIncompleto(grupo: GrupoOpciones, elegidas: Elegidas) {
  const elegidos = elegidas[grupo.nombre]?.length ?? 0
  if (grupo.reparto) return elegidos !== grupo.reparto
  return grupo.obligatorio && elegidos === 0
}
