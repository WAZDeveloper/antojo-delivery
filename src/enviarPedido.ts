import type { PedidoListo } from './pedido'
import type { LineaPedido } from './useCarrito'

// Lo que muestra la pantalla "Pedido enviado"
export interface Confirmacion {
  codigo: string
  local: string
  total: number
  totalPlatos: number
  pago: string
  direccion: string
  programado: PedidoListo['programado']
  apertura: string | null // "mañana a las 8:30" si el pedido llegó con el local cerrado
}

interface Respuesta {
  ok?: boolean
  codigo?: string
  errores?: string[]
}

const ESPERA_MAXIMA = 45000 // 45 segundos (con la captura, el envío tarda un poco más)

// Manda el pedido al webhook de n8n y devuelve el código del pedido (DEL-2111-6253).
// Solo se mandan ids, opciones y cantidades: n8n vuelve a calcular los precios con el menú publicado.
export async function enviarPedido(webhook: string, lineas: LineaPedido[], pedido: PedidoListo): Promise<string> {
  if (!webhook) throw new Error('La página todavía no está conectada para recibir pedidos.')

  // La captura de la transferencia va aparte (es pesada y no se guarda en la tabla)
  const { comprobante, ...entrega } = pedido.entrega

  const cuerpo = {
    lineas: lineas.map((linea) => ({
      platoId: linea.plato.id,
      elegidas: linea.elegidas,
      nota: linea.nota,
      cantidad: linea.cantidad,
    })),
    entrega,
    comprobante, // "data:image/jpeg;base64,..." o '' si no es transferencia
    programado: pedido.programado,
    // Si el cliente llega desde WhatsApp (ManyChat), el enlace trae ?c=<id del contacto>
    contacto: new URLSearchParams(window.location.search).get('c') ?? '',
  }

  // Si n8n no responde a tiempo, cancelamos y avisamos
  const control = new AbortController()
  const temporizador = setTimeout(() => control.abort(), ESPERA_MAXIMA)

  let respuesta: Response
  try {
    respuesta = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: control.signal,
    })
  } catch {
    throw new Error('No pudimos conectarnos. Revise su internet e intente de nuevo.')
  } finally {
    clearTimeout(temporizador)
  }

  const datos = (await respuesta.json().catch(() => null)) as Respuesta | null
  if (!respuesta.ok || !datos?.ok || !datos.codigo) {
    // n8n responde { ok: false, errores: [...] } cuando algo no cuadra (p. ej. la hora ya pasó)
    throw new Error(
      datos?.errores?.length ? datos.errores.join(' ') : 'No pudimos enviar su pedido. Intente de nuevo en un momento.',
    )
  }
  return datos.codigo
}