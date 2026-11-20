import { ERROR_IDENTIFICACION, identificacionValida, type TipoIdentificacion } from './identificacion'
import type { Zona } from './tipos'

export type TipoFactura = 'consumidor' | 'datos'

// Lo que el cliente escribe en "Su pedido"
export interface DatosEntrega {
  // Entrega
  zona: string // nombre de la zona elegida (en el paso 7b lo reemplaza el mapa)
  direccion: string
  referencia: string
  // Sus datos
  nombre: string
  apellido: string
  telefono: string
  // Factura
  factura: TipoFactura
  tipoId: TipoIdentificacion
  numeroId: string
  correo: string
  mismaDireccion: boolean // usar la dirección de entrega en la factura
  direccionFactura: string
  // Pago
  pago: string
}

export const entregaVacia: DatosEntrega = {
  zona: '',
  direccion: '',
  referencia: '',
  nombre: '',
  apellido: '',
  telefono: '',
  factura: 'consumidor',
  tipoId: 'cedula',
  numeroId: '',
  correo: '',
  mismaDireccion: true,
  direccionFactura: '',
  pago: '',
}

// Un mensaje de error por campo (solo los que fallan)
export type Errores = Partial<Record<keyof DatosEntrega, string>>

const correoValido = (correo: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo.trim())

export function validarEntrega(datos: DatosEntrega, facturaObligatoria: boolean): Errores {
  const errores: Errores = {}

  if (!datos.zona) errores.zona = 'Elija la zona de entrega.'
  if (datos.direccion.trim().length < 5) errores.direccion = 'Escriba la dirección de entrega.'
  if (!datos.nombre.trim()) errores.nombre = 'Escriba su nombre.'
  if (!datos.apellido.trim()) errores.apellido = 'Escriba su apellido.'

  const digitos = datos.telefono.replace(/\D/g, '')
  if (digitos.length < 9 || digitos.length > 12) {
    errores.telefono = 'Escriba un teléfono válido, por ejemplo 099 123 4567.'
  }

  // Los datos de factura solo se revisan si van en la factura
  const conDatos = facturaObligatoria || datos.factura === 'datos'
  if (conDatos) {
    if (!identificacionValida(datos.tipoId, datos.numeroId.trim())) {
      errores.numeroId = ERROR_IDENTIFICACION[datos.tipoId]
    }
    if (!correoValido(datos.correo)) errores.correo = 'Escriba un correo válido para enviarle la factura.'
    if (!datos.mismaDireccion && datos.direccionFactura.trim().length < 5) {
      errores.direccionFactura = 'Escriba la dirección para la factura.'
    }
  }

  if (!datos.pago) errores.pago = 'Elija cómo va a pagar.'

  return errores
}

export const buscarZona = (zonas: Zona[], nombre: string) => zonas.find((zona) => zona.nombre === nombre)