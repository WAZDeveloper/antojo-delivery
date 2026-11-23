import { useEffect, useRef } from 'react'
import type { Confirmacion } from '../enviarPedido'
import { precio } from '../utilidades'
import { IconoChat } from './Iconos'
import './PantallaConfirmado.css'

interface Props {
  confirmacion: Confirmacion
  whatsapp: string // número del negocio; si está vacío no se muestra el botón
  onOtroPedido: () => void
}

export function PantallaConfirmado({ confirmacion, whatsapp, onOtroPedido }: Props) {
  const { codigo, local, total, totalPlatos, pago, direccion, programado, apertura } = confirmacion
  const titulo = useRef<HTMLHeadingElement>(null)

  // Llevar el foco al título para que los lectores de pantalla anuncien el resultado
  useEffect(() => {
    titulo.current?.focus()
  }, [])

  const numero = whatsapp.replace(/\D/g, '')
  const enlaceWhatsapp = numero
    ? `https://wa.me/${numero}?text=${encodeURIComponent(`Hola, acabo de enviar el pedido ${codigo}.`)}`
    : ''

  return (
    <main className="confirmado">
      <div className="confirmado__contenido">
      <div className="confirmado__icono" aria-hidden="true">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>

      <h1 ref={titulo} tabIndex={-1} className="confirmado__titulo">
        {programado ? 'Pedido programado' : 'Pedido enviado'}
      </h1>
      <p className="confirmado__texto">
        {programado
          ? `El local ${local} recibió su pedido para el ${programado.texto}. Como ahora está cerrado, lo confirmaremos a primera hora, cuando abra${apertura ? ` (${apertura})` : ''}, y le escribiremos por WhatsApp.`
          : `El local ${local} está revisando su pedido. Le escribiremos por WhatsApp para confirmarlo.`}
      </p>

      <dl className="confirmado__tarjeta">
        <div className="confirmado__fila confirmado__fila--codigo">
          <dt>Código del pedido</dt>
          <dd>{codigo}</dd>
        </div>
        <div className="confirmado__fila">
          <dt>
            {totalPlatos} {totalPlatos === 1 ? 'plato' : 'platos'} + envío
          </dt>
          <dd className="confirmado__total">{precio(total)}</dd>
        </div>
        {programado && (
          <div className="confirmado__fila">
            <dt>Entrega</dt>
            <dd>{programado.texto}</dd>
          </div>
        )}
        <div className="confirmado__fila">
          <dt>Pago</dt>
          <dd>{pago}</dd>
        </div>
        <div className="confirmado__fila">
          <dt>Dirección</dt>
          <dd>{direccion}</dd>
        </div>
      </dl>

      <div className="confirmado__acciones">
        {enlaceWhatsapp && (
          <a className="confirmado__whatsapp" href={enlaceWhatsapp}>
            <IconoChat />
            Volver a WhatsApp
          </a>
        )}
        <button type="button" className="confirmado__otro" onClick={onOtroPedido}>
          Hacer otro pedido
        </button>
      </div>
      </div>
    </main>
  )
}