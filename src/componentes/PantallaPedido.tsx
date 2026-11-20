import { useState, type FormEvent } from 'react'
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
const ORDEN_CAMPOS: (keyof DatosEntrega)[] = ['zona', 'direccion', 'nombre', 'telefono', 'pago']

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
  if (m.includes('efectivo')) return 'Si necesita cambio, indíquelo en la nota.'
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

  const cambiar = (campo: keyof DatosEntrega, valor: string) => {
    const nuevos = { ...entrega, [campo]: valor }
    setEntrega(nuevos)
    // Después del primer intento, los errores se corrigen mientras escribe
    if (intentoEnviar) setErrores(validarEntrega(nuevos))
  }

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault() // que la página no se recargue
    const encontrados = validarEntrega(entrega)
    setErrores(encontrados)
    setIntentoEnviar(true)

    const primero = ORDEN_CAMPOS.find((campo) => encontrados[campo])
    if (primero) {
      document.getElementById(primero === 'pago' ? 'pago-0' : `campo-${primero}`)?.focus()
      return
    }
    onEnviar(entrega, envio, total)
  }

  // Si quitó todos los platos
  if (totalPlatos === 0) {
    return (
      <div className="pedido">
        <header className="pedido__cabecera">
          <button type="button" className="boton-icono" onClick={onVolver} aria-label="Volver al menú">
            <IconoAtras />
          </button>
          <h1>Su pedido</h1>
        </header>
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
      <header className="pedido__cabecera">
        <button type="button" className="boton-icono" onClick={onVolver} aria-label="Volver al menú">
          <IconoAtras />
        </button>
        <h1>Su pedido</h1>
      </header>

      <form onSubmit={enviar} noValidate>
        {/* Platos */}
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

        {/* Entrega */}
        <section className="pedido__seccion pedido__seccion--suave" aria-labelledby="titulo-entrega">
          <h2 id="titulo-entrega">Entrega</h2>

          <div className="campo">
            <label htmlFor="campo-zona">Zona de entrega</label>
            <div className="campo__select">
              <select
                id="campo-zona"
                value={entrega.zona}
                onChange={(e) => cambiar('zona', e.target.value)}
                aria-invalid={Boolean(errores.zona)}
                aria-describedby={errores.zona ? 'error-zona' : undefined}
              >
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
            {errores.zona && (
              <p className="campo__error" id="error-zona">
                {errores.zona}
              </p>
            )}
            {zona && (
              <p className="campo__envio">
                <IconoUbicacion />
                {envio === null
                  ? 'El local le confirmará el recargo por envío según su ruta.'
                  : `Recargo por envío a esta zona: ${precio(envio)}`}
              </p>
            )}
            {!zona && <p className="campo__ayuda">{menu.aviso_envio}</p>}
          </div>

          <div className="campo">
            <label htmlFor="campo-direccion">Dirección</label>
            <input
              id="campo-direccion"
              autoComplete="street-address"
              value={entrega.direccion}
              onChange={(e) => cambiar('direccion', e.target.value)}
              aria-invalid={Boolean(errores.direccion)}
              aria-describedby={errores.direccion ? 'error-direccion' : undefined}
            />
            {errores.direccion && (
              <p className="campo__error" id="error-direccion">
                {errores.direccion}
              </p>
            )}
          </div>

          <div className="campo">
            <label htmlFor="campo-referencia">Referencia</label>
            <input
              id="campo-referencia"
              placeholder="Ej.: frente al parque, portón verde"
              value={entrega.referencia}
              onChange={(e) => cambiar('referencia', e.target.value)}
            />
          </div>

          <div className="campos-dobles">
            <div className="campo">
              <label htmlFor="campo-nombre">Nombre</label>
              <input
                id="campo-nombre"
                autoComplete="name"
                value={entrega.nombre}
                onChange={(e) => cambiar('nombre', e.target.value)}
                aria-invalid={Boolean(errores.nombre)}
                aria-describedby={errores.nombre ? 'error-nombre' : undefined}
              />
              {errores.nombre && (
                <p className="campo__error" id="error-nombre">
                  {errores.nombre}
                </p>
              )}
            </div>
            <div className="campo">
              <label htmlFor="campo-telefono">Teléfono</label>
              <input
                id="campo-telefono"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="099 123 4567"
                value={entrega.telefono}
                onChange={(e) => cambiar('telefono', e.target.value)}
                aria-invalid={Boolean(errores.telefono)}
                aria-describedby={errores.telefono ? 'error-telefono' : undefined}
              />
              {errores.telefono && (
                <p className="campo__error" id="error-telefono">
                  {errores.telefono}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Pago */}
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
          {errores.pago && (
            <p className="campo__error" id="error-pago">
              {errores.pago}
            </p>
          )}
        </fieldset>

        {/* Nota */}
        <section className="pedido__seccion">
          <div className="campo">
            <label htmlFor="campo-nota" className="campo__titulo">
              Nota para el local
            </label>
            <textarea
              id="campo-nota"
              rows={3}
              placeholder="Ej.: sin cebolla, empanadas de queso"
              value={entrega.nota}
              onChange={(e) => cambiar('nota', e.target.value)}
            />
          </div>
        </section>

        {/* Totales */}
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
          <p>El local revisará su pedido y le escribirá por WhatsApp para confirmarlo.</p>
        </div>
      </form>
    </div>
  )
}