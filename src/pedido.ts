import { ERROR_IDENTIFICACION, identificacionValida, type TipoIdentificacion } from './identificacion'

export type TipoFactura = 'consumidor' | 'datos'

// Lo que el cliente escribe en "Su pedido"
export interface DatosEntrega {
  // Entrega
  lat: number | null // ubicación del pin en el mapa (null = todavía no marcó)
  lng: number | null
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
  // Pedido programado (solo cuando el local está cerrado)
  fechaEntrega: string // "2026-11-21"
  horaEntrega: number | null // minutos del día: 750 = 12:30
  // Pago
  pago: string
}

export const entregaVacia: DatosEntrega = {
  lat: null,
  lng: null,
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
  fechaEntrega: '',
  horaEntrega: null,
  pago: '',
}

// Un mensaje de error por campo (solo los que fallan)
export type Errores = Partial<Record<keyof DatosEntrega, string>>

const correoValido = (correo: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo.trim())

export function validarEntrega(
  datos: DatosEntrega,
  facturaObligatoria: boolean,
  enRango: boolean,
  horaElegida = true, // false si el local está cerrado y todavía no eligió una hora
): Errores {
  const errores: Errores = {}

  if (datos.lat === null || datos.lng === null) {
    errores.lat = 'Marque en el mapa dónde entregamos su pedido.'
  } else if (!enRango) {
    errores.lat = 'Su dirección está fuera de rango de entrega.'
  }
  if (enRango && !horaElegida) errores.horaEntrega = 'Elija el día y la hora de entrega.'
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

// Lo que sale de "Su pedido" cuando todo está correcto (en el paso 8 se envía a n8n)
export interface PedidoListo {
  entrega: DatosEntrega
  local: string
  distanciaKm: number
  envio: number
  total: number
  programado: { fecha: string; desde: string; hasta: string; texto: string } | null // null = local abierto, se prepara ya
}