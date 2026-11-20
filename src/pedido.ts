import type { Zona } from './tipos'

// Lo que el cliente escribe en "Su pedido"
export interface DatosEntrega {
  zona: string // nombre de la zona elegida
  direccion: string
  referencia: string
  nombre: string
  telefono: string
  pago: string
  nota: string
}

export const entregaVacia: DatosEntrega = {
  zona: '',
  direccion: '',
  referencia: '',
  nombre: '',
  telefono: '',
  pago: '',
  nota: '',
}

// Un mensaje de error por campo (solo los que fallan)
export type Errores = Partial<Record<keyof DatosEntrega, string>>

export function validarEntrega(datos: DatosEntrega): Errores {
  const errores: Errores = {}

  if (!datos.zona) errores.zona = 'Elija la zona de entrega.'
  if (datos.direccion.trim().length < 5) errores.direccion = 'Escriba la dirección de entrega.'
  if (!datos.nombre.trim()) errores.nombre = 'Escriba su nombre.'

  const digitos = datos.telefono.replace(/\D/g, '')
  if (digitos.length < 9 || digitos.length > 12) {
    errores.telefono = 'Escriba un teléfono válido, por ejemplo 099 123 4567.'
  }

  if (!datos.pago) errores.pago = 'Elija cómo va a pagar.'

  return errores
}

export const buscarZona = (zonas: Zona[], nombre: string) => zonas.find((zona) => zona.nombre === nombre)