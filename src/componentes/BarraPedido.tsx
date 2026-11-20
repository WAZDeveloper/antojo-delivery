import { precio } from '../utilidades'
import { IconoBolsa } from './Iconos'
import './BarraPedido.css'

interface Props {
  totalPlatos: number
  subtotal: number
  onAbrir: () => void
}

export function BarraPedido({ totalPlatos, subtotal, onAbrir }: Props) {
  // Sin platos, no se muestra nada
  if (totalPlatos === 0) return null

  return (
    <div className="barra-pedido">
      <button type="button" className="barra-pedido__boton" onClick={onAbrir}>
        <span className="barra-pedido__izq">
          <IconoBolsa />
          Ver pedido
        </span>
        <span className="barra-pedido__der">
          <span className="barra-pedido__cuenta">
            {totalPlatos} {totalPlatos === 1 ? 'plato' : 'platos'}
          </span>
          {/* key={subtotal}: cuando cambia el total, React lo vuelve a crear y la animación se repite */}
          <span key={subtotal} className="barra-pedido__total">
            {precio(subtotal)}
          </span>
        </span>
      </button>
    </div>
  )
}