import { useEffect, useRef, useState } from 'react'
import type { GrupoOpciones, Plato } from '../tipos'
import { precioUnitario, type Elegidas } from '../useCarrito'
import { precio } from '../utilidades'
import { Contador } from './Contador'
import { IconoCerrar, IconoFoto } from './Iconos'
import './DetallePlato.css'

interface Props {
  plato: Plato
  onCerrar: () => void
  onAgregar: (elegidas: Elegidas, nota: string, cantidad: number) => void
}

const textoReglas = (grupo: GrupoOpciones) => {
  const cuantas = grupo.maximo === 1 ? 'elija 1' : `hasta ${grupo.maximo}`
  return `${grupo.obligatorio ? 'Obligatorio' : 'Opcional'} · ${cuantas}`
}

export function DetallePlato({ plato, onCerrar, onAgregar }: Props) {
  const ventana = useRef<HTMLDialogElement>(null)
  const [elegidas, setElegidas] = useState<Elegidas>({})
  const [nota, setNota] = useState('')
  const [cantidad, setCantidad] = useState(1)

  // Abrir la ventana como "modal": oscurece el fondo, atrapa el teclado y se cierra con Esc
  useEffect(() => {
    ventana.current?.showModal()
  }, [])

  const grupos = plato.opciones ?? []
  const falta = grupos.find((grupo) => grupo.obligatorio && !(elegidas[grupo.nombre]?.length))
  const total = precioUnitario(plato, elegidas) * cantidad

  const elegirUna = (grupo: string, valor: string) => setElegidas({ ...elegidas, [grupo]: [valor] })

  const alternar = (grupo: GrupoOpciones, valor: string) => {
    const actuales = elegidas[grupo.nombre] ?? []
    const nuevas = actuales.includes(valor) ? actuales.filter((v) => v !== valor) : [...actuales, valor]
    setElegidas({ ...elegidas, [grupo.nombre]: nuevas })
  }

  // Quita los grupos vacíos antes de guardar
  const confirmar = () => {
    const limpias: Elegidas = {}
    for (const grupo of grupos) {
      const valores = elegidas[grupo.nombre] ?? []
      if (valores.length) limpias[grupo.nombre] = valores
    }
    onAgregar(limpias, nota, cantidad)
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
          <div className="detalle__encabezado">
            <h2 id="detalle-titulo">{plato.nombre}</h2>
            {plato.detalle && <p>{plato.detalle}</p>}
            <span className="plato__precio">{precio(plato.precio)}</span>
          </div>

          {grupos.map((grupo) => {
            const actuales = elegidas[grupo.nombre] ?? []
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
            onQuitar={() => setCantidad(Math.max(1, cantidad - 1))}
          />
          <button type="button" className="boton-principal" disabled={Boolean(falta)} onClick={confirmar}>
            {falta ? `Elija ${falta.nombre.toLowerCase()}` : `Agregar · ${precio(total)}`}
          </button>
        </div>
      </div>
    </dialog>
  )
}