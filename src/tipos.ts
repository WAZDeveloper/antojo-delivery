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

// Etiquetas que se le pueden poner a un plato en menu.json
export type EtiquetaId = 'mas-pedido' | 'picante' | 'para-compartir' | 'vegetariano' | 'nuevo'

export interface Plato {
  id: string
  nombre: string
  detalle: string
  precio: number
  foto: string
  disponible: boolean
  opciones?: GrupoOpciones[] // el ? significa que no todos los platos tienen complementos
  etiquetas?: EtiquetaId[] // por ejemplo ["mas-pedido", "picante"]
}

export interface Categoria {
  nombre: string
  descripcion?: string // frase corta debajo del nombre, por ejemplo "Frescos del mar manabita"
  platos: Plato[]
}

// Un local que hace entregas: su ubicación y hasta cuántos km llega
export interface Local {
    nombre: string
    lat: number
    lng: number
    radio_km: number
}

// Precio del envío según la distancia: "hasta 3 km → $1.50"
export interface TarifaEnvio {
    hasta_km: number
    precio: number
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
  locales: Local[]
  tarifas_envio: TarifaEnvio[]
  categorias: Categoria[]
}