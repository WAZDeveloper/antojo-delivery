import { IconoMas, IconoMenos } from './Iconos'
import './Contador.css'

interface Props {
  nombre: string
  cantidad: number
  onAgregar: () => void
  onQuitar: () => void
}

// El − 1 + que se usa en el menú y en "Su pedido"
export function Contador({ nombre, cantidad, onAgregar, onQuitar }: Props) {
  return (
    <div className="contador" role="group" aria-label={`Cantidad de ${nombre}`}>
      <button type="button" onClick={onQuitar} aria-label={`Quitar ${nombre}`}>
        <IconoMenos />
      </button>
      <span aria-live="polite">{cantidad}</span>
      <button type="button" onClick={onAgregar} aria-label={`Agregar ${nombre}`}>
        <IconoMas />
      </button>
    </div>
  )
}