import { IconoBuscar, IconoCerrar } from './Iconos'
import './Buscador.css'

interface Props {
  valor: string
  onCambiar: (texto: string) => void
}

export function Buscador({ valor, onCambiar }: Props) {
  return (
    <div className="buscador" role="search">
      <IconoBuscar />
      <label htmlFor="buscar-plato" className="visualmente-oculto">
        Buscar un plato
      </label>
      <input
        id="buscar-plato"
        type="search"
        placeholder="Buscar un plato, por ejemplo ceviche"
        autoComplete="off"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
      />
      {valor && (
        <button type="button" onClick={() => onCambiar('')} aria-label="Borrar búsqueda">
          <IconoCerrar tamano={18} />
        </button>
      )}
    </div>
  )
}