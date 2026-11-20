import { useRef, useState, type FormEvent } from 'react'
import { NOMBRES_IDENTIFICACION, type TipoIdentificacion } from '../identificacion'
import { calcularEntrega, textoKm, type Punto } from '../entrega'
import { entregaVacia, validarEntrega, type DatosEntrega, type PedidoListo } from '../pedido'
import type { Menu } from '../tipos'
import type { LineaPedido } from '../useCarrito'
import { precio } from '../utilidades'
import { Contador } from './Contador'
import {
  IconoAtras,
  IconoBanco,
  IconoCelular,
  IconoEfectivo,
  IconoFlechaAbajo,
  IconoMas,
  IconoTarjeta,
  IconoUbicacion,
} from './Iconos'
import { MapaEntrega } from './MapaEntrega'
import './PantallaPedido.css'

interface Props {
  menu: Menu
  lineas: LineaPedido[]
  totalPlatos: number
  subtotal: number
  onAgregar: (clave: string) => void
  onQuitar: (clave: string) => void
  onVolver: () => void
  onEnviar: (pedido: PedidoListo) => void
}

// Orden en que revisamos los campos para llevar al cliente al primer error
const ORDEN_CAMPOS: (keyof DatosEntrega)[] = [
  'lat',
  'direccion',
  'nombre',
  'apellido',
  'telefono',
  'numeroId',
  'correo',
  'direccionFactura',
  'pago',
]

const TIPOS_ID: TipoIdentificacion[] = ['cedula', 'ruc', 'pasaporte']

function iconoPago(metodo: string) {
  const m = metodo.toLowerCase()
  if (m.includes('transfer')) return <IconoBanco />
  if (m.includes('tarjeta')) return <IconoTarjeta />
  if (m.includes('efectivo')) return <IconoEfectivo />
  return <IconoCelular />
}

function ayudaPago(metodo: string) {
  const m = metodo.toLowerCase()
  if (m.includes('transfer')) return 'El local le enviará los datos de la cuenta al confirmar.'
  if (m.includes('efectivo')) return 'Si necesita cambio, indíquelo en la nota de un plato o en la referencia.'
  return ''
}

export function PantallaPedido({
  menu,
  lineas,
  totalPlatos,
  subtotal,
  onAgregar,
  onQuitar,
  onVolver,
  onEnviar,
}: Props) {
  const [entrega, setEntrega] = useState<DatosEntrega>(entregaVacia)
  const [intentoEnviar, setIntentoEnviar] = useState(false)
  const direccionAuto = useRef('') // última dirección que escribió el mapa (no el cliente)

  // Local, distancia y envío según el pin del mapa
  const punto: Punto | null = entrega.lat !== null && entrega.lng !== null ? { lat: entrega.lat, lng: entrega.lng } : null
  const resultado = punto ? calcularEntrega(menu, punto) : null
  const enRango = resultado?.enRango ?? false
  const envio = resultado?.enRango ? resultado.envio : 0
  const total = Math.round((subtotal + envio) * 100) / 100

  // Regla del SRI: sobre el límite, la factura debe llevar los datos del cliente
  const facturaObligatoria = total > menu.limite_consumidor_final
  const conDatos = facturaObligatoria || entrega.factura === 'datos'

  // Los errores se calculan solos en cada cambio, pero solo se muestran después del primer intento
  const errores = intentoEnviar ? validarEntrega(entrega, facturaObligatoria, enRango) : {}

  // <K extends keyof DatosEntrega>: "campo" es uno de los nombres y "valor" tiene el tipo de ese campo
  const cambiar = <K extends keyof DatosEntrega>(campo: K, valor: DatosEntrega[K]) =>
    setEntrega((antes) => ({ ...antes, [campo]: valor }))

  const ponerUbicacion = (nuevo: Punto) => setEntrega((antes) => ({ ...antes, lat: nuevo.lat, lng: nuevo.lng }))

  // El mapa sugiere la dirección, pero no borra lo que el cliente ya escribió
  const sugerirDireccion = (texto: string) =>
    setEntrega((antes) => {
      if (antes.direccion && antes.direccion !== direccionAuto.current) return antes
      direccionAuto.current = texto
      return { ...antes, direccion: texto }
    })

  // Atajo para los campos de texto: conecta value, onChange y los avisos de error
  const propsCampo = (campo: keyof DatosEntrega) => ({
    id: `campo-${campo}`,
    value: String(entrega[campo]),
    onChange: (e: { target: { value: string } }) => cambiar(campo, e.target.value),
    'aria-invalid': Boolean(errores[campo]),
    'aria-describedby': errores[campo] ? `error-${campo}` : undefined,
  })

  const mensajeError = (campo: keyof DatosEntrega) =>
    errores[campo] && (
      <p className="campo__error" id={`error-${campo}`}>
        {errores[campo]}
      </p>
    )

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setIntentoEnviar(true)
    const encontrados = validarEntrega(entrega, facturaObligatoria, enRango)

    const primero = ORDEN_CAMPOS.find((campo) => encontrados[campo])
    if (primero || !resultado?.enRango) {
      const id = primero === 'pago' ? 'pago-0' : `campo-${primero ?? 'lat'}`
      document.getElementById(id)?.focus()
      return
    }
    onEnviar({
      entrega: { ...entrega, factura: conDatos ? 'datos' : 'consumidor' },
      local: resultado.local.nombre,
      distanciaKm: Math.round(resultado.distancia * 10) / 10,
      envio: resultado.envio,
      total,
    })
  }

  const cabecera = (
    <header className="pedido__cabecera">
      <button type="button" className="boton-icono" onClick={onVolver} aria-label="Volver al menú">
        <IconoAtras />
      </button>
      <h1>Su pedido</h1>
    </header>
  )

  if (totalPlatos === 0) {
    return (
      <div className="pedido">
        {cabecera}
        <div className="pedido__vacio">
          <p>Su pedido está vacío.</p>
          <button type="button" className="boton-principal" onClick={onVolver}>
            Ver el menú
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pedido">
      {cabecera}

      <form onSubmit={enviar} noValidate>
        {/* 1. Dirección de entrega */}
        <section className="pedido__seccion pedido__seccion--suave" aria-labelledby="titulo-entrega">
          <h2 id="titulo-entrega">¿A dónde llevamos su pedido?</h2>

          <MapaEntrega
            posicion={punto}
            locales={menu.locales}
            onCambiar={ponerUbicacion}
            onDireccion={sugerirDireccion}
          />
          {!punto && mensajeError('lat')}

          {resultado?.enRango && (
            <div className="local-asignado">
              <span className="local-asignado__icono">
                <IconoUbicacion tamano={22} />
              </span>
              <div className="local-asignado__texto">
                <span>Su pedido lo prepara</span>
                <strong>Local {resultado.local.nombre}</strong>
                <span className="local-asignado__dato">
                  A {textoKm(resultado.distancia)} · envío {precio(resultado.envio)}
                </span>
              </div>
            </div>
          )}

          {resultado && !resultado.enRango && (
            <div className="fuera-rango" role="alert">
              <strong>Fuera de rango de entrega</strong>
              <span>
                Su dirección está a {textoKm(resultado.distancia)} del local más cercano ({resultado.local.nombre}).
                Por ahora entregamos hasta {resultado.local.radio_km} km.
              </span>
              {menu.whatsapp && (
                <a href={`https://wa.me/${menu.whatsapp}`} target="_blank" rel="noreferrer">
                  Consultar por WhatsApp
                </a>
              )}
            </div>
          )}

          <div className="campo">
            <label htmlFor="campo-direccion">Dirección</label>
            <input {...propsCampo('direccion')} autoComplete="street-address" />
            {mensajeError('direccion')}
          </div>

          <div className="campo">
            <label htmlFor="campo-referencia">Referencia</label>
            <input {...propsCampo('referencia')} placeholder="Ej.: casa esquinera, portón verde, 2.º piso" />
          </div>
        </section>

        {/* 2. Platos */}
        <section className="pedido__seccion" aria-labelledby="titulo-platos">
          <h2 id="titulo-platos">Platos</h2>
          {lineas.map((linea) => (
            <div key={linea.clave} className="linea">
              <div className="linea__info">
                <span className="linea__nombre">{linea.plato.nombre}</span>
                {linea.detalle && <span className="linea__extra">{linea.detalle}</span>}
                {linea.nota && <span className="linea__extra">Nota: {linea.nota}</span>}
                <span className="linea__unitario">{precio(linea.unitario)} c/u</span>
              </div>
              <Contador
                nombre={linea.plato.nombre}
                cantidad={linea.cantidad}
                onAgregar={() => onAgregar(linea.clave)}
                onQuitar={() => onQuitar(linea.clave)}
              />
              <span className="linea__subtotal">{precio(linea.subtotal)}</span>
            </div>
          ))}
          <button type="button" className="enlace-mas" onClick={onVolver}>
            <IconoMas /> Agregar más platos
          </button>
        </section>

        {/* 3. Sus datos */}
        <section className="pedido__seccion pedido__seccion--apilada" aria-labelledby="titulo-datos">
          <h2 id="titulo-datos">Sus datos</h2>
          <div className="campos-dobles">
            <div className="campo">
              <label htmlFor="campo-nombre">Nombre</label>
              <input {...propsCampo('nombre')} autoComplete="given-name" />
              {mensajeError('nombre')}
            </div>
            <div className="campo">
              <label htmlFor="campo-apellido">Apellido</label>
              <input {...propsCampo('apellido')} autoComplete="family-name" />
              {mensajeError('apellido')}
            </div>
          </div>
          <div className="campo">
            <label htmlFor="campo-telefono">Teléfono</label>
            <input {...propsCampo('telefono')} type="tel" inputMode="tel" autoComplete="tel" placeholder="099 123 4567" />
            {mensajeError('telefono')}
          </div>
        </section>

        {/* 4. Factura */}
        <section className="pedido__seccion factura" aria-labelledby="titulo-factura">
          <h2 id="titulo-factura">Factura</h2>

          <div className="segmentos" role="radiogroup" aria-labelledby="titulo-factura">
            <label
              className={[
                'segmento',
                !conDatos ? 'segmento--activo' : '',
                facturaObligatoria ? 'segmento--bloqueado' : '',
              ].join(' ')}
            >
              <input
                type="radio"
                name="factura"
                checked={!conDatos}
                disabled={facturaObligatoria}
                onChange={() => cambiar('factura', 'consumidor')}
              />
              Consumidor final
            </label>
            <label className={conDatos ? 'segmento segmento--activo' : 'segmento'}>
              <input type="radio" name="factura" checked={conDatos} onChange={() => cambiar('factura', 'datos')} />
              Con mis datos
            </label>
          </div>

          {facturaObligatoria && (
            <p className="aviso-sri">
              Su pedido supera los {precio(menu.limite_consumidor_final)}: por disposición del SRI, la factura debe
              llevar sus datos.
            </p>
          )}

          {!conDatos && <p className="campo__ayuda">La factura saldrá a nombre de Consumidor final.</p>}

          {conDatos && (
            <>
              <div className="campos-id">
                <div className="campo">
                  <label htmlFor="campo-tipoId">Tipo</label>
                  <div className="campo__select">
                    <select
                      id="campo-tipoId"
                      value={entrega.tipoId}
                      onChange={(e) => cambiar('tipoId', e.target.value as TipoIdentificacion)}
                    >
                      {TIPOS_ID.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {NOMBRES_IDENTIFICACION[tipo]}
                        </option>
                      ))}
                    </select>
                    <IconoFlechaAbajo />
                  </div>
                </div>
                <div className="campo">
                  <label htmlFor="campo-numeroId">Número</label>
                  <input
                    {...propsCampo('numeroId')}
                    inputMode={entrega.tipoId === 'pasaporte' ? 'text' : 'numeric'}
                    maxLength={entrega.tipoId === 'ruc' ? 13 : 20}
                  />
                </div>
              </div>
              {mensajeError('numeroId')}

              <div className="campo">
                <label htmlFor="campo-correo">Correo (para enviarle la factura)</label>
                <input {...propsCampo('correo')} type="email" autoComplete="email" />
                {mensajeError('correo')}
              </div>

              <label className="casilla">
                <input
                  type="checkbox"
                  checked={entrega.mismaDireccion}
                  onChange={(e) => cambiar('mismaDireccion', e.target.checked)}
                />
                Usar la dirección de entrega en la factura
              </label>

              {!entrega.mismaDireccion && (
                <div className="campo">
                  <label htmlFor="campo-direccionFactura">Dirección para la factura</label>
                  <input {...propsCampo('direccionFactura')} />
                  {mensajeError('direccionFactura')}
                </div>
              )}

              {(entrega.nombre || entrega.apellido) && (
                <p className="campo__ayuda">
                  La factura saldrá a nombre de {`${entrega.nombre} ${entrega.apellido}`.trim()}.
                </p>
              )}
            </>
          )}
        </section>

        {/* 5. Pago */}
        <fieldset className="pedido__seccion pagos" aria-describedby={errores.pago ? 'error-pago' : undefined}>
          <legend>Método de pago</legend>
          {menu.pagos.map((metodo, indice) => {
            const elegido = entrega.pago === metodo
            const ayuda = ayudaPago(metodo)
            return (
              <label key={metodo} className={elegido ? 'pago pago--elegido' : 'pago'}>
                <span className="pago__fila">
                  <input
                    id={`pago-${indice}`}
                    type="radio"
                    name="pago"
                    value={metodo}
                    checked={elegido}
                    onChange={() => cambiar('pago', metodo)}
                  />
                  {iconoPago(metodo)}
                  <span className="pago__nombre">{metodo}</span>
                </span>
                {elegido && ayuda && <span className="pago__ayuda">{ayuda}</span>}
              </label>
            )
          })}
          {mensajeError('pago')}
        </fieldset>

        {/* 6. Totales */}
        <section className="totales" aria-label="Total del pedido">
          <div className="totales__fila">
            <span>
              Subtotal · {totalPlatos} {totalPlatos === 1 ? 'plato' : 'platos'}
            </span>
            <span>{precio(subtotal)}</span>
          </div>
          <div className="totales__fila">
            <span>Envío{resultado?.enRango ? ` · ${textoKm(resultado.distancia)}` : ''}</span>
            <span>{!resultado ? 'Marque su ubicación' : resultado.enRango ? precio(envio) : 'Fuera de rango'}</span>
          </div>
          <div className="totales__total">
            <span>Total</span>
            <span>{precio(total)}</span>
          </div>
        </section>

        <div className="pedido__acciones">
          <button type="submit" className="boton-principal" disabled={resultado !== null && !resultado.enRango}>
            Enviar pedido · {precio(total)}
          </button>
          <p>
            {resultado?.enRango ? `El local ${resultado.local.nombre}` : 'El local'} revisará su pedido y le escribirá por WhatsApp para
            confirmarlo.
          </p>
        </div>
      </form>
    </div>
  )
}