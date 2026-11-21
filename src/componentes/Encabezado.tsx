import type { ReactNode } from 'react'
import type { EstadoGeneral } from '../horario'
import type { Menu } from '../tipos'
import { Logo } from './Logo'
import './Encabezado.css'

interface Props {
  menu: Menu | null // null mientras el menú carga
  estado: EstadoGeneral | null
  children?: ReactNode // lo que va al final de la franja (el buscador)
}

export function Encabezado({ menu, estado, children }: Props) {
  const nombre = menu?.negocio ?? 'Antojo Manabita'
  const marca = menu?.marca

  return (
    <header className="encabezado">
      <div className="encabezado__contenido">
        <div className="encabezado__barra">
          <div className="encabezado__marca">
            <Logo src={marca?.logo} tamano={46} />
            <span className="encabezado__nombres">
              <span className="encabezado__nombre">{nombre}</span>
              {marca?.lema && <span className="encabezado__lema">{marca.lema}</span>}
            </span>
          </div>
          {/* En el paso 5 aquí va el botón de modo oscuro */}
        </div>

        {estado && (
          <p className={`estado estado--${estado.tipo}`} role="status">
            <span className="estado__punto" aria-hidden="true" />
            {estado.texto}
          </p>
        )}

        <h1>{menu?.titulo ?? '¿Qué se le antoja hoy?'}</h1>
        {marca?.historia && <p className="encabezado__historia">{marca.historia}</p>}

        {children}
      </div>

      <svg className="encabezado__onda" viewBox="0 0 1280 28" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 28V14C107 2 213 2 320 14S533 26 640 14 853 2 960 14 1173 26 1280 14V28Z" fill="#ffffff" />
      </svg>
    </header>
  )
}