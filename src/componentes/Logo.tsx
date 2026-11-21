
import './Logo.css'

interface Props {
  src?: string // ruta en public/ (por ejemplo "logo.png"); vacío = logo de muestra
  tamano?: number
}

export function Logo({ src, tamano = 46 }: Props) {
  if (src) {
    // alt vacío: el nombre de la marca ya está escrito al lado del logo
    return <img className="logo" src={`${import.meta.env.BASE_URL}${src}`} alt="" width={tamano} height={tamano} />
  }

  // Logo de muestra: un sol sobre las olas de la costa manabita
  return (
    <span className="logo logo--muestra" style={{ width: tamano, height: tamano }} aria-hidden="true">
      <svg width={tamano * 0.6} height={tamano * 0.6} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="12.5" r="5.5" fill="currentColor" />
        <path
          d="M4 20.5c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2M4 25.5c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}