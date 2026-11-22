import { useState } from 'react'
import { textoHora, type DiaEntrega } from '../horario'
import type { DatosEntrega } from '../pedido'
import './CuandoEntrega.css'

// Se muestra solo cuando el local que le toca está cerrado: el cliente elige día y hora
interface Props {
  dias: DiaEntrega[]
  fechaActiva: string
  hora: number | null
  intervaloMin: number
  error?: string
  onCambiar: (cambios: Partial<Pick<DatosEntrega, 'fechaEntrega' | 'horaEntrega'>>) => void
}

const HORAS_VISIBLES = 12 // las demás aparecen con "Ver más horas"

export function CuandoEntrega({ dias, fechaActiva, hora, intervaloMin, error, onCambiar }: Props) {
  const [verTodas, setVerTodas] = useState(false)
  const diaActivo = dias.find((d) => d.fecha === fechaActiva)
  const franjas = diaActivo?.franjas ?? []
  const visibles = verTodas ? franjas : franjas.slice(0, HORAS_VISIBLES)

  return (
    <section className="cuando" aria-labelledby="titulo-cuando">
      <h2 id="titulo-cuando">Programe su pedido</h2>

      <p className="cuando__cerrado">
        <strong>Ahora estamos cerrados.</strong> Elija el día y la hora, y se lo llevamos a esa hora.
      </p>

      <fieldset className="cuando__grupo">
        <legend>Día</legend>
        <div className="cuando__dias">
          {dias.map((dia) => (
            <label key={dia.fecha} className={dia.fecha === fechaActiva ? 'dia dia--activo' : 'dia'}>
              <input
                type="radio"
                name="dia-entrega"
                className="visualmente-oculto"
                checked={dia.fecha === fechaActiva}
                onChange={() => onCambiar({ fechaEntrega: dia.fecha, horaEntrega: null })}
              />
              <span className="dia__titulo">{dia.titulo}</span>
              <span className="dia__fecha">{dia.corto}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="cuando__grupo" aria-describedby={error ? 'error-horaEntrega' : undefined}>
        <legend>Hora de entrega</legend>
        <div className="cuando__horas">
          {visibles.map((minutos, indice) => (
            <label key={minutos} className={minutos === hora ? 'hora hora--activa' : 'hora'}>
              <input
                id={indice === 0 ? 'campo-horaEntrega' : undefined}
                type="radio"
                name="hora-entrega"
                className="visualmente-oculto"
                checked={minutos === hora}
                onChange={() => onCambiar({ fechaEntrega: fechaActiva, horaEntrega: minutos })}
              />
              {textoHora(minutos)}
            </label>
          ))}
        </div>
        {!verTodas && franjas.length > HORAS_VISIBLES && (
          <button type="button" className="enlace-mas" onClick={() => setVerTodas(true)}>
            Ver más horas (hasta {textoHora(franjas[franjas.length - 1])})
          </button>
        )}
        {error && (
          <p className="campo__error" id="error-horaEntrega">
            {error}
          </p>
        )}
      </fieldset>

      {diaActivo && hora !== null && franjas.includes(hora) && (
        <p className="cuando__resumen">
          Lo recibirá el <strong>{diaActivo.largo} entre {textoHora(hora)} y {textoHora(hora + intervaloMin)}</strong>.
        </p>
      )}
    </section>
  )
}