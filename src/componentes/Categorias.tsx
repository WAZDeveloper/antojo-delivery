import type { Categoria } from '../tipos'
import { idCategoria } from '../utilidades'
import './Categorias.css'

interface Props {
  categorias: Categoria[]
  activa: string
  onElegir: (nombre: string) => void
}

export function Categorias({ categorias, activa, onElegir }: Props) {
  return (
    <nav className="categorias" aria-label="Categorías del menú">
      {categorias.map((categoria) => {
        const esActiva = categoria.nombre === activa
        return (
          <a
            key={categoria.nombre}
            href={`#${idCategoria(categoria.nombre)}`}
            className={esActiva ? 'chip chip--activa' : 'chip'}
            aria-current={esActiva ? 'true' : undefined}
            onClick={() => onElegir(categoria.nombre)}
          >
            {categoria.nombre}
          </a>
        )
      })}
    </nav>
  )
}