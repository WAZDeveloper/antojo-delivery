// Tipos: describen la forma exacta de los datos de menu.json

// Una opción dentro de un grupo: "Patacón" (+$0) o "Huevo frito" (+$0.75)
export interface ValorOpcion {
  nombre: string
  precio: number
}

// Un grupo de complementos: "Guarnición" (elegir 1, obligatorio) o "Extras" (hasta 2, opcional)
export interface GrupoOpciones {
  nombre: string
  obligatorio: boolean
  maximo: number // 1 = elegir una sola; 2 o más = casillas
  valores: ValorOpcion[]
}

export interface Plato {
  id: string
  nombre: string
  detalle: string
  precio: number
  foto: string
  disponible: boolean
  opciones?: GrupoOpciones[] // el ? significa que no todos los platos tienen complementos
}

export interface Categoria {
  nombre: string
  platos: Plato[]
}

export interface Zona {
  nombre: string
  local: string
  envio: number | null // null = el local confirma el recargo según la ruta
}

export interface Menu {
  ejemplo: boolean
  negocio: string
  titulo: string
  subtitulo: string
  whatsapp: string
  webhook: string
  aviso_envio: string
  limite_consumidor_final: number // sobre este total, la factura debe llevar datos (SRI)
  pagos: string[]
  zonas: Zona[]
  categorias: Categoria[]
}