import type { Plato } from '../tipos'
import { precio } from '../utilidades'
import { IconoFoto, IconoMas } from './Iconos'
import './PlatoFila.css'

interface Props {
  plato: Plato
  enPedido: number // cuántos de este plato hay ya en el pedido (sumando todas sus variantes)
  onElegir: () => void // abre el detalle del plato
}

export function PlatoFila({ plato, enPedido, onElegir }: Props) {
  const agotado = !plato.disponible

  return (
    <article className={agotado ? 'plato plato--agotado' : 'plato'}>
      <div className="plato__info">
        <h3 className="plato__nombre">{plato.nombre}</h3>
        {plato.detalle && <p className="plato__detalle">{plato.detalle}</p>}
        {enPedido > 0 && <span className="plato__en-pedido">{enPedido} en su pedido</span>}

        <div className="plato__pie">
          <span className="plato__precio">{precio(plato.precio)}</span>

          {agotado ? (
            <span className="plato__agotado">Agotado hoy</span>
          ) : (
            <button type="button" className="boton-agregar" onClick={onElegir} aria-label={`Agregar ${plato.nombre}`}>
              <IconoMas /> Agregar
            </button>
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