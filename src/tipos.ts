// Tipos: describen la forma exacta de los datos de menu.json

export interface Plato {
  id: string
  nombre: string
  detalle: string
  precio: number
  foto: string
  disponible: boolean
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
    pagos: string[]
    zonas: Zona[]
    categorias: Categoria[]
}