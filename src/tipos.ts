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

// Días de la semana (sin tildes, para usarlos como claves en menu.json)
export type DiaSemana = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom'

// Horario de cada día: ["08:30", "17:30"], o null si ese día no abre
export type Horario = Partial<Record<DiaSemana, [string, string] | null>>

// Un local que hace entregas: su ubicación, hasta cuántos km llega y sus datos de contacto
export interface Local {
  nombre: string
  lat: number
  lng: number
  radio_km: number
  direccion?: string
  telefono?: string
  horario?: Horario
  transferencia?: CuentaBancaria // si este local cobra en otra cuenta (si no, se usa la general)
}

// Cuenta para pagos por transferencia
export interface CuentaBancaria {
  banco: string // "Banco Pichincha"
  tipo: string // "Ahorros" o "Corriente"
  numero: string
  titular: string
  identificacion?: string // cédula o RUC del titular
  correo?: string // a dónde puede enviar el comprobante, si el banco lo pide
}

// Textos de la marca para el encabezado y el pie de página
export interface Marca {
  lema?: string // debajo del nombre: "Sabor manabita a domicilio"
  logo?: string // ruta de la imagen en public/, por ejemplo "logo.png" (vacío = logo de muestra)
  historia?: string // texto corto debajo del título
  descripcion?: string // frase del pie de página
  redes?: { instagram?: string; facebook?: string; tiktok?: string }
  terminos?: string // enlace a los términos y condiciones
  privacidad?: string // enlace a la política de privacidad
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
  cierre_pedidos_min?: number // se dejan de tomar pedidos estos minutos antes del cierre
    programacion?: {
    preparacion_min: number // tiempo mínimo para preparar un pedido
    intervalo_min: number // cada cuántos minutos hay una hora de entrega
    dias_adelante: number // hasta cuántos días después de hoy se puede programar
  }
  marca?: Marca
  limite_consumidor_final: number // sobre este total, la factura debe llevar datos (SRI)
  pagos: string[]
  transferencia?: CuentaBancaria // cuenta general para transferencias
  locales: Local[]
  tarifas_envio: TarifaEnvio[]
  categorias: Categoria[]
}