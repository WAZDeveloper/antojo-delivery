import type { Plato } from '../tipos'
import { precio } from '../utilidades'
import { IconoFoto, IconoMas } from './Iconos'
import './MasPedidos.css'

interface Props {
  platos: Plato[]
  cantidadPorPlato: Record<string, number>
  onElegir: (plato: Plato) => void
}

// Carrusel con los platos que tienen la etiqueta "mas-pedido"
export function MasPedidos({ platos, cantidadPorPlato, onElegir }: Props) {
  if (platos.length === 0) return null

  return (
    <section className="mas-pedidos" aria-labelledby="titulo-mas-pedidos">
      <h2 id="titulo-mas-pedidos">Los más pedidos</h2>
      <div className="mas-pedidos__lista">
        {platos.map((plato) => {
          const enPedido = cantidadPorPlato[plato.id] ?? 0
          return (
            <article key={plato.id} className="tarjeta">
              <div className="tarjeta__foto">
                {plato.foto ? (
                  <img src={`${import.meta.env.BASE_URL}${plato.foto}`} alt={plato.nombre} loading="lazy" />
                ) : (
                  <IconoFoto tamano={30} />
                )}
                <button
                  type="button"
                  className={enPedido > 0 ? 'tarjeta__agregar tarjeta__agregar--con-cantidad' : 'tarjeta__agregar'}
                  onClick={() => onElegir(plato)}
                  aria-label={enPedido > 0 ? `Agregar otro ${plato.nombre} (tiene ${enPedido})` : `Agregar ${plato.nombre}`}
                >
                  {enPedido > 0 ? enPedido : <IconoMas />}
                </button>
              </div>
              <h3 className="tarjeta__nombre">{plato.nombre}</h3>
              <span className="plato__precio">{precio(plato.precio)}</span>
            </article>
          )
        })}
      </div>
    </section>
  )
}