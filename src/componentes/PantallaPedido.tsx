import { useState, type FormEvent } from 'react'
import { NOMBRES_IDENTIFICACION, type TipoIdentificacion } from '../identificacion'
import { buscarZona, entregaVacia, validarEntrega, type DatosEntrega, type Errores } from '../pedido'
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
import './PantallaPedido.css'

interface Props {
  menu: Menu
  lineas: LineaPedido[]
  totalPlatos: number
  subtotal: number
  onAgregar: (clave: string) => void
  onQuitar: (clave: string) => void
  onVolver: () => void
  onEnviar: (entrega: DatosEntrega, envio: number | null, total: number) => void
}

// Orden en que revisamos los campos para llevar al cliente al primer error
const ORDEN_CAMPOS: (keyof DatosEntrega)[] = [
  'zona',
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
  const [errores, setErrores] = useState<Errores>({})
  const [intentoEnviar, setIntentoEnviar] = useState(false)

  const zona = buscarZona(menu.zonas, entrega.zona)
  const envio = zona ? zona.envio : null
  const total = Math.round((subtotal + (envio ?? 0)) * 100) / 100
  const locales = [...new Set(menu.zonas.map((z) => z.local))]

  // Regla del SRI: sobre el límite, la factura debe llevar los datos del cliente
  const facturaObligatoria = total > menu.limite_consumidor_final
  const conDatos = facturaObligatoria || entrega.factura === 'datos'

  // <K extends keyof DatosEntrega>: "campo" es uno de los nombres y "valor" tiene el tipo de ese campo
  const cambiar = <K extends keyof DatosEntrega>(campo: K, valor: DatosEntrega[K]) => {
    const nuevos = { ...entrega, [campo]: valor }
    setEntrega(nuevos)
    if (intentoEnviar) setErrores(validarEntrega(nuevos, facturaObligatoria))
  }

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
    const encontrados = validarEntrega(entrega, facturaObligatoria)
    setErrores(encontrados)
    setIntentoEnviar(true)

    const primero = ORDEN_CAMPOS.find((campo) => encontrados[campo])
    if (primero) {
      document.getElementById(primero === 'pago' ? 'pago-0' : `campo-${primero}`)?.focus()
      return
    }
    onEnviar({ ...entrega, factura: conDatos ? 'datos' : 'consumidor' }, envio, total)
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
        {/* 1. Dirección de entrega (en el paso 7b se suma el mapa) */}
        <section className="pedido__seccion pedido__seccion--suave" aria-labelledby="titulo-entrega">
          <h2 id="titulo-entrega">¿A dónde llevamos su pedido?</h2>

          <div className="campo">
            <label htmlFor="campo-zona">Zona de entrega</label>
            <div className="campo__select">
              <select {...propsCampo('zona')}>
                <option value="">Elija su zona…</option>
                {locales.map((local) => (
                  <optgroup key={local} label={`Local ${local}`}>
                    {menu.zonas
                      .filter((z) => z.local === local)
                      .map((z) => (
                        <option key={z.nombre} value={z.nombre}>
                          {z.nombre}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <IconoFlechaAbajo />
            </div>
            {mensajeError('zona')}
            {zona && (
              <p className="campo__envio">
                <IconoUbicacion />
                {envio === null
                  ? `Local ${zona.local} · el recargo por envío se confirma según su ruta.`
                  : `Local ${zona.local} · envío ${precio(envio)}`}
              </p>
            )}
            {!zona && <p className="campo__ayuda">{menu.aviso_envio}</p>}
          </div>

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
            <span>Envío{zona ? ` · ${zona.nombre}` : ''}</span>
            <span>{!zona ? 'Elija su zona' : envio === null ? 'Por confirmar' : precio(envio)}</span>
          </div>
          <div className="totales__total">
            <span>Total</span>
            <span>{precio(total)}</span>
          </div>
          {zona && envio === null && <p className="totales__nota">Más el recargo por envío que le confirme el local.</p>}
        </section>

        <div className="pedido__acciones">
          <button type="submit" className="boton-principal">
            Enviar pedido · {precio(total)}
          </button>
          <p>
            {zona ? `El local ${zona.local}` : 'El local'} revisará su pedido y le escribirá por WhatsApp para
            confirmarlo.
          </p>
        </div>
      </form>
    </div>
  )
}