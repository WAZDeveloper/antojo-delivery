import { ETIQUETAS } from '../etiquetas'
import type { EtiquetaId } from '../tipos'
import { IconoEtiqueta } from './Etiqueta'
import './FiltrosEtiquetas.css'

interface Props {
  disponibles: EtiquetaId[] // solo las etiquetas que tiene al menos un plato
  activo: EtiquetaId | null // null = "Todos"
  onCambiar: (id: EtiquetaId | null) => void
}

export function FiltrosEtiquetas({ disponibles, activo, onCambiar }: Props) {
  if (disponibles.length === 0) return null

  return (
    <div className="filtros" role="group" aria-label="Filtrar platos">
      <button
        type="button"
        className={activo === null ? 'filtro filtro--activo' : 'filtro'}
        aria-pressed={activo === null}
        onClick={() => onCambiar(null)}
      >
        Todos
      </button>

      {disponibles.map((id) => (
        <button
          key={id}
          type="button"
          className={activo === id ? 'filtro filtro--activo' : 'filtro'}
          aria-pressed={activo === id}
          onClick={() => onCambiar(activo === id ? null : id)} // tocarlo otra vez lo quita
        >
          <span className={`filtro__icono filtro__icono--${id}`}>
            <IconoEtiqueta id={id} tamano={15} />
          </span>
          {ETIQUETAS[id].filtro}
        </button>
      ))}
    </div>
  )
}