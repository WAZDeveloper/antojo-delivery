import { useState, type ChangeEvent } from 'react'
import { prepararComprobante } from '../comprobante'
import type { CuentaBancaria } from '../tipos'
import { precio } from '../utilidades'
import { IconoCopiar, IconoFoto, IconoListo } from './Iconos'
import './PagoTransferencia.css'

interface Props {
  cuenta: CuentaBancaria
  total: number
  totalListo: boolean // false mientras no marque su ubicación (todavía falta el envío)
  comprobante: string // "data:image/jpeg;base64,..." o ''
  error?: string
  onCambiar: (comprobante: string) => void
}

// Datos de la cuenta para transferir + botón para subir la captura del comprobante
export function PagoTransferencia({ cuenta, total, totalListo, comprobante, error, onCambiar }: Props) {
  const [copiado, setCopiado] = useState('') // qué dato se acaba de copiar
  const [preparando, setPreparando] = useState(false)
  const [errorImagen, setErrorImagen] = useState('')

  const filas: [string, string | undefined][] = [
    ['Banco', cuenta.banco],
    ['Tipo de cuenta', cuenta.tipo],
    ['Número de cuenta', cuenta.numero],
    ['Titular', cuenta.titular],
    ['Cédula / RUC', cuenta.identificacion],
    ['Correo', cuenta.correo],
  ]
  const visibles = filas.filter((fila): fila is [string, string] => Boolean(fila[1]))
  const todo = visibles.map(([nombre, valor]) => `${nombre}: ${valor}`).join('\n')

  const copiar = async (clave: string, valor: string) => {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiado(clave)
      setTimeout(() => setCopiado((actual) => (actual === clave ? '' : actual)), 2000)
    } catch {
      // Si el navegador no deja copiar, el cliente puede seleccionar el texto a mano
    }
  }

  const elegirArchivo = async (evento: ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = '' // permite volver a elegir la misma imagen
    if (!archivo) return
    setPreparando(true)
    setErrorImagen('')
    try {
      onCambiar(await prepararComprobante(archivo))
    } catch (problema) {
      setErrorImagen(problema instanceof Error ? problema.message : 'No pudimos abrir esa imagen.')
    } finally {
      setPreparando(false)
    }
  }

  const mensaje = errorImagen || error

  return (
    <div className="transferencia">
      <p className="transferencia__monto">
        Transfiera <strong>{precio(total)}</strong> a esta cuenta
        {!totalListo && <span> (marque su ubicación para sumar el envío)</span>}
      </p>

      <dl className="transferencia__datos">
        {visibles.map(([nombre, valor]) => (
          <div key={nombre} className="transferencia__fila">
            <dt>{nombre}</dt>
            <dd>
              <span>{valor}</span>
              {nombre === 'Número de cuenta' && (
                <button type="button" className="transferencia__copiar" onClick={() => copiar(nombre, valor)}>
                  {copiado === nombre ? <IconoListo tamano={16} /> : <IconoCopiar tamano={16} />}
                  {copiado === nombre ? 'Copiado' : 'Copiar'}
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <button type="button" className="transferencia__copiar-todo" onClick={() => copiar('todo', todo)}>
        {copiado === 'todo' ? <IconoListo tamano={16} /> : <IconoCopiar tamano={16} />}
        {copiado === 'todo' ? 'Datos copiados' : 'Copiar todos los datos'}
      </button>

      <div className="comprobante">
        <p className="comprobante__titulo">Cuando haya transferido, suba la captura del comprobante</p>
        {comprobante ? (
          <div className="comprobante__listo">
            <img src={comprobante} alt="Comprobante de transferencia subido" />
            <div>
              <p className="comprobante__ok">
                <IconoListo tamano={16} /> Comprobante listo
              </p>
              <label className="comprobante__cambiar">
                Cambiar imagen
                <input type="file" accept="image/*" onChange={elegirArchivo} />
              </label>
            </div>
          </div>
        ) : (
          <label className={mensaje ? 'comprobante__subir comprobante__subir--error' : 'comprobante__subir'}>
            <IconoFoto tamano={24} />
            {preparando ? 'Preparando la imagen…' : 'Subir captura'}
            <input
              id="campo-comprobante"
              type="file"
              accept="image/*"
              onChange={elegirArchivo}
              disabled={preparando}
              aria-invalid={Boolean(mensaje)}
              aria-describedby={mensaje ? 'error-comprobante' : undefined}
            />
          </label>
        )}
        {mensaje && (
          <p className="campo__error" id="error-comprobante">
            {mensaje}
          </p>
        )}
      </div>
    </div>
  )
}
