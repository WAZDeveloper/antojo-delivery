import { ETIQUETAS } from '../etiquetas'
import type { EtiquetaId } from '../tipos'
import { IconoEstrella, IconoGrupo, IconoHoja, IconoNuevo, IconoPicante } from './Iconos'
import './Etiqueta.css'

// El ícono que corresponde a cada etiqueta
export function IconoEtiqueta({ id, tamano = 12 }: { id: EtiquetaId; tamano?: number }) {
  switch (id) {
    case 'mas-pedido':
      return <IconoEstrella tamano={tamano} />
    case 'picante':
      return <IconoPicante tamano={tamano} />
    case 'para-compartir':
      return <IconoGrupo tamano={tamano} />
    case 'vegetariano':
      return <IconoHoja tamano={tamano} />
    case 'nuevo':
      return <IconoNuevo tamano={tamano} />
  }
}

// La pastilla de color que va debajo del nombre del plato
export function Etiqueta({ id }: { id: EtiquetaId }) {
  return (
    <span className={`etiqueta etiqueta--${id}`}>
      <IconoEtiqueta id={id} />
      {ETIQUETAS[id].nombre}
    </span>
  )
}