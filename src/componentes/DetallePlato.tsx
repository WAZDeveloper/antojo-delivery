import { useEffect, useRef, useState } from 'react'
import { contar, separarLineas, unidadesReparto } from '../reparto'
import type { GrupoOpciones, Plato } from '../tipos'
import { precioUnitario, type Elegidas } from '../useCarrito'
import { precio } from '../utilidades'
import { Contador } from './Contador'
import { IconoCerrar, IconoFoto } from './Iconos'
import './DetallePlato.css'

// Lo que se agrega al carrito. Con reparto puede ser más de una línea (2× queso y 1× mixto).
export interface LineaNueva {
  elegidas: Elegidas
  cantidad: number
}

interface Props {
  plato: Plato
  onCerrar: () => void
  onAgregar: (lineas: LineaNueva[], nota: string) => void
  cantidadInicial?: number // cuando el plato viene del pedido de WhatsApp
  elegidasIniciales?: Elegidas // complementos que ya venían en ese pedido
  aviso?: string // mensaje arriba del nombre del plato
}

const textoReglas = (grupo: GrupoOpciones) => {
  const cuantas = grupo.maximo === 1 ? 'elija 1' : `hasta ${grupo.maximo}`
  return `${grupo.obligatorio ? 'Obligatorio' : 'Opcional'} · ${cuantas}`
}

// Si llega "3 bolones mixtos" desde WhatsApp, el reparto empieza con los 3 en mixto
function elegidasDeInicio(plato: Plato, cantidad: number, iniciales: Elegidas = {}): Elegidas {
  const elegidas = { ...iniciales }
  for (const grupo of plato.opciones ?? []) {
    const lista = elegidas[grupo.nombre] ?? []
    if (grupo.reparto === 1 && lista.length === 1 && cantidad > 1) elegidas[grupo.nombre] = Array(cantidad).fill(lista[0])
  }
  return elegidas
}

export function DetallePlato({ plato, onCerrar, onAgregar, cantidadInicial = 1, elegidasIniciales, aviso }: Props) {
  const ventana = useRef<HTMLDialogElement>(null)
  const [elegidas, setElegidas] = useState<Elegidas>(() => elegidasDeInicio(plato, cantidadInicial, elegidasIniciales))
  const [nota, setNota] = useState('')
  const [cantidad, setCantidad] = useState(cantidadInicial)

  // Abrir la ventana como "modal": oscurece el fondo, atrapa el teclado y se cierra con Esc
  useEffect(() => {
    ventana.current?.showModal()
  }, [])

  const grupos = plato.opciones ?? []
  const faltanEn = (grupo: GrupoOpciones) => unidadesReparto(grupo, cantidad) - (elegidas[grupo.nombre]?.length ?? 0)
  const falta = grupos.find((grupo) =>
    grupo.reparto ? faltanEn(grupo) !== 0 : grupo.obligatorio && !elegidas[grupo.nombre]?.length,
  )
  const lineas = separarLineas(plato, elegidas, cantidad)
  const total = lineas.reduce((suma, linea) => suma + precioUnitario(plato, linea.elegidas) * linea.cantidad, 0)

  const elegirUna = (grupo: string, valor: string) => setElegidas({ ...elegidas, [grupo]: [valor] })

  const alternar = (grupo: GrupoOpciones, valor: string) => {
    const actuales = elegidas[grupo.nombre] ?? []
    const nuevas = actuales.includes(valor) ? actuales.filter((v) => v !== valor) : [...actuales, valor]
    setElegidas({ ...elegidas, [grupo.nombre]: nuevas })
  }

  // Reparto: cambia cuántas unidades lleva una opción (la lista queda en el orden del menú)
  const ponerVeces = (grupo: GrupoOpciones, valor: string, veces: number) => {
    const actuales = elegidas[grupo.nombre] ?? []
    const nuevas = grupo.valores.flatMap((v) =>
      Array<string>(v.nombre === valor ? veces : contar(actuales, v.nombre)).fill(v.nombre),
    )
    setElegidas({ ...elegidas, [grupo.nombre]: nuevas })
  }

  const sumarUnidad = (grupo: GrupoOpciones, valor: string) => {
    const actuales = elegidas[grupo.nombre] ?? []
    if (faltanEn(grupo) <= 0) {
      if (grupo.reparto !== 1) return // el combo ya tiene todas sus unidades
      setCantidad(cantidad + 1) // un plato más: 2 bolones → 3 bolones
    }
    ponerVeces(grupo, valor, contar(actuales, valor) + 1)
  }

  // Al bajar la cantidad, también se quitan las unidades que sobran del reparto
  const bajarCantidad = () => {
    const nueva = Math.max(1, cantidad - 1)
    setCantidad(nueva)
    const recortadas = { ...elegidas }
    for (const grupo of grupos) {
      if (grupo.reparto === 1) recortadas[grupo.nombre] = (elegidas[grupo.nombre] ?? []).slice(0, nueva)
    }
    setElegidas(recortadas)
  }

  // Quita los grupos vacíos antes de guardar
  const confirmar = () => {
    const limpias: Elegidas = {}
    for (const grupo of grupos) {
      const valores = elegidas[grupo.nombre] ?? []
      if (valores.length) limpias[grupo.nombre] = valores
    }
    onAgregar(separarLineas(plato, limpias, cantidad), nota)
  }

  const textoBoton = () => {
    if (!falta) return `Agregar · ${precio(total)}`
    if (!falta.reparto) return `Elija ${falta.nombre.toLowerCase()}`
    const faltan = faltanEn(falta)
    return faltan > 0 ? `Faltan ${faltan} por elegir` : `Sobran ${-faltan}: quite algunas`
  }

  return (
    <dialog
      ref={ventana}
      className="detalle"
      aria-labelledby="detalle-titulo"
      onClose={onCerrar}
      onClick={(e) => {
        if (e.target === ventana.current) onCerrar() // tocó lo oscuro de afuera
      }}
    >
      <div className="detalle__hoja">
        <div className="detalle__foto">
          {plato.foto ? (
            <img src={`${import.meta.env.BASE_URL}${plato.foto}`} alt={plato.nombre} />
          ) : (
            <span className="detalle__sin-foto">
              <IconoFoto tamano={44} />
              Foto del plato
            </span>
          )}
          <button type="button" className="detalle__cerrar" onClick={onCerrar} aria-label="Cerrar">
            <IconoCerrar />
          </button>
        </div>

        <div className="detalle__cuerpo">
          {aviso && <p className="detalle__aviso">{aviso}</p>}
          <div className="detalle__encabezado">
            <h2 id="detalle-titulo">{plato.nombre}</h2>
            {plato.detalle && <p>{plato.detalle}</p>}
            <span className="plato__precio">{precio(plato.precio)}</span>
          </div>

          {grupos.map((grupo) => {
            const actuales = elegidas[grupo.nombre] ?? []

            // Reparto: cada opción con su − y + (3 bolones = 2 de queso y 1 mixto)
            if (grupo.reparto) {
              const necesarias = unidadesReparto(grupo, cantidad)
              const faltan = necesarias - actuales.length
              return (
                <fieldset key={grupo.nombre} className="grupo">
                  <legend>
                    <span className="grupo__nombre">{grupo.nombre}</span>
                    <span className={faltan === 0 ? 'grupo__regla grupo__regla--lista' : 'grupo__regla grupo__regla--obligatoria'}>
                      {faltan === 0 ? `Listo · ${necesarias} de ${necesarias}` : `Elija ${necesarias} · faltan ${Math.max(faltan, 0)}`}
                    </span>
                  </legend>
                  <p className="grupo__ayuda">
                    {grupo.reparto === 1
                      ? 'Si pide varios, puede combinarlos. Ej.: 2 de una y 1 de otra.'
                      : `Reparta las ${grupo.reparto} unidades como quiera${cantidad > 1 ? ' (igual en cada uno)' : ''}.`}
                  </p>
                  {grupo.valores.map((valor) => {
                    const veces = contar(actuales, valor.nombre)
                    return (
                      <div key={valor.nombre} className={veces > 0 ? 'opcion opcion--reparto opcion--marcada' : 'opcion opcion--reparto'}>
                        <span className="opcion__nombre">{valor.nombre}</span>
                        {valor.precio > 0 && <span className="opcion__precio">+{precio(valor.precio)}</span>}
                        <Contador
                          compacto
                          nombre={valor.nombre}
                          cantidad={veces}
                          onAgregar={() => sumarUnidad(grupo, valor.nombre)}
                          onQuitar={() => ponerVeces(grupo, valor.nombre, Math.max(0, veces - 1))}
                          sinQuitar={veces === 0}
                          sinAgregar={grupo.reparto !== 1 && faltan <= 0}
                        />
                      </div>
                    )
                  })}
                </fieldset>
              )
            }

            const lleno = grupo.maximo > 1 && actuales.length >= grupo.maximo
            return (
              <fieldset key={grupo.nombre} className="grupo">
                <legend>
                  <span className="grupo__nombre">{grupo.nombre}</span>
                  <span className={grupo.obligatorio ? 'grupo__regla grupo__regla--obligatoria' : 'grupo__regla'}>
                    {textoReglas(grupo)}
                  </span>
                </legend>

                {grupo.valores.map((valor) => {
                  const marcado = actuales.includes(valor.nombre)
                  return (
                    <label key={valor.nombre} className={marcado ? 'opcion opcion--marcada' : 'opcion'}>
                      <input
                        type={grupo.maximo === 1 ? 'radio' : 'checkbox'}
                        name={`${plato.id}-${grupo.nombre}`}
                        checked={marcado}
                        disabled={!marcado && lleno}
                        onChange={() =>
                          grupo.maximo === 1 ? elegirUna(grupo.nombre, valor.nombre) : alternar(grupo, valor.nombre)
                        }
                      />
                      <span className="opcion__nombre">{valor.nombre}</span>
                      {valor.precio > 0 && <span className="opcion__precio">+{precio(valor.precio)}</span>}
                    </label>
                  )
                })}
              </fieldset>
            )
          })}

          <div className="campo">
            <label htmlFor="nota-plato" className="campo__titulo">
              Nota para este plato
            </label>
            <textarea
              id="nota-plato"
              rows={2}
              maxLength={140}
              placeholder="Ej.: sin cebolla, salsa aparte"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </div>
        </div>

        <div className="detalle__pie">
          <Contador
            nombre={plato.nombre}
            cantidad={cantidad}
            onAgregar={() => setCantidad(cantidad + 1)}
            onQuitar={bajarCantidad}
          />
          <button type="button" className="boton-principal" disabled={Boolean(falta)} onClick={confirmar}>
            {textoBoton()}
          </button>
        </div>
      </div>
    </dialog>
  )
}
