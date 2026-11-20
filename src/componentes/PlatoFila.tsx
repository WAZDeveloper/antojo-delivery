import type { Plato } from '../tipos'
import { precio } from '../utilidades'
import { IconoFoto, IconoMas, IconoMenos } from './Iconos'
import './PlatoFila.css'

interface Props {
  plato: Plato
  cantidad: number
  onAgregar: () => void
  onQuitar: () => void
}

export function PlatoFila({ plato, cantidad, onAgregar, onQuitar }: Props) {
  const agotado = !plato.disponible

  return (
    <article className={agotado ? 'plato plato--agotado' : 'plato'}>
      <div className="plato__info">
        <h3 className="plato__nombre">{plato.nombre}</h3>
        {plato.detalle && <p className="plato__detalle">{plato.detalle}</p>}

        <div className="plato__pie">
          <span className="plato__precio">{precio(plato.precio)}</span>

          {agotado ? (
            <span className="plato__agotado">Agotado hoy</span>
          ) : cantidad === 0 ? (
            <button type="button" className="boton-agregar" onClick={onAgregar}>
              <IconoMas /> Agregar
            </button>
          ) : (
            <div className="contador" role="group" aria-label={`Cantidad de ${plato.nombre}`}>
              <button type="button" onClick={onQuitar} aria-label={`Quitar ${plato.nombre}`}>
                <IconoMenos />
              </button>
              <span aria-live="polite">{cantidad}</span>
              <button type="button" onClick={onAgregar} aria-label={`Agregar ${plato.nombre}`}>
                <IconoMas />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="plato__foto">
        {plato.foto ? (
          <img src={`${import.meta.env.BASE_URL}${plato.foto}`} alt={plato.nombre} loading="lazy" />
        ) : (
          <span className="plato__sin-foto">
            <IconoFoto />
            Foto
          </span>
        )}
      </div>
    </article>
  )
}