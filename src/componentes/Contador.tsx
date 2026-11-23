import { IconoMas, IconoMenos } from './Iconos'
import './Contador.css'

interface Props {
  nombre: string
  cantidad: number
  onAgregar: () => void
  onQuitar: () => void
  compacto?: boolean // más pequeño, para las opciones de un plato
  sinQuitar?: boolean // desactiva el − (por ejemplo, cuando ya está en 0)
  sinAgregar?: boolean // desactiva el + (por ejemplo, cuando ya se repartieron todas)
}

// El − 1 + que se usa en el menú, en "Su pedido" y en las opciones con reparto
export function Contador({ nombre, cantidad, onAgregar, onQuitar, compacto, sinQuitar, sinAgregar }: Props) {
  return (
    <div className={compacto ? 'contador contador--compacto' : 'contador'} role="group" aria-label={`Cantidad de ${nombre}`}>
      <button type="button" onClick={onQuitar} disabled={sinQuitar} aria-label={`Quitar ${nombre}`}>
        <IconoMenos />
      </button>
      <span aria-live="polite">{cantidad}</span>
      <button type="button" onClick={onAgregar} disabled={sinAgregar} aria-label={`Agregar ${nombre}`}>
        <IconoMas />
      </button>
    </div>
  )
}
