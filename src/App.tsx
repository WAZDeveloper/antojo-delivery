import { useEffect, useState } from 'react'
import './App.css'
import { Categorias } from './componentes/Categorias'
import { PlatoFila } from './componentes/PlatoFila'
import { useMenu } from './useMenu'
import { idCategoria, normalizar } from './utilidades'
import { BarraPedido } from './componentes/BarraPedido'
import { resumirPedido, useCarrito } from './useCarrito'
import { PantallaPedido } from './componentes/PantallaPedido'
import { useVista } from './useVista'
import { DetallePlato } from './componentes/DetallePlato'
import { FiltrosEtiquetas } from './componentes/FiltrosEtiquetas'
import { Buscador } from './componentes/Buscador'
import { MasPedidos } from './componentes/MasPedidos'
import { Encabezado } from './componentes/Encabezado'
import { PiePagina } from './componentes/PiePagina'
import { estadoGeneral } from './horario'
import { useAhora } from './useAhora'
import { ORDEN_ETIQUETAS, ETIQUETAS, tieneEtiqueta } from './etiquetas'
import type { EtiquetaId, Plato } from './tipos'
import { enviarPedido, type Confirmacion } from './enviarPedido'
import { PantallaConfirmado } from './componentes/PantallaConfirmado'
import { leerPedidoEnlace, necesitaElegir, quitarPedidoDelEnlace, type ItemEnlace } from './pedidoEnlace'

function App() {
  const datos = useMenu()
  const [activa, setActiva] = useState('')
  const [platoAbierto, setPlatoAbierto] = useState<Plato | null>(null)
  const [filtro, setFiltro] = useState<EtiquetaId | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [confirmado, setConfirmado] = useState<Confirmacion | null>(null) // pedido recién enviado
  // Pedido que llega armado desde WhatsApp en el enlace (?pedido=...)
  const [enlaceLeido, setEnlaceLeido] = useState(false)
  const [cola, setCola] = useState<ItemEnlace[]>([]) // platos del enlace a los que les falta elegir algo
  const [avisoEnlace, setAvisoEnlace] = useState<{ platos: number; noEncontrados: number } | null>(null)
  const [omitidos, setOmitidos] = useState<string[]>([]) // platos de la cola que el cliente cerró sin elegir
  const carrito = useCarrito()
  const ahora = useAhora() // se actualiza cada minuto

  // El resumen del pedido (solo cuando el menú ya cargó)
    const pedido = datos.estado === 'listo' ? resumirPedido(datos.menu, carrito.items) : null

  // Etiquetas que usa al menos un plato (solo esas aparecen como filtro)
  const menu = datos.estado === 'listo' ? datos.menu : null

  // Pedido armado desde WhatsApp: se lee una sola vez, apenas carga el menú.
  // (Cambiar el estado mientras se dibuja está permitido si es del mismo componente y con una condición que corta)
  if (menu && !enlaceLeido) {
    setEnlaceLeido(true)
    const leido = leerPedidoEnlace(menu)
    if (leido) {
      if (leido.items.length > 0) {
        carrito.vaciar() // el pedido de WhatsApp reemplaza lo que hubiera en el carrito
        for (const item of leido.items) {
          if (!necesitaElegir(item.plato, item.elegidas)) carrito.agregar(item.plato.id, item.elegidas, '', item.cantidad)
        }
        setCola(leido.items.filter((item) => necesitaElegir(item.plato, item.elegidas)))
      }
      setAvisoEnlace({
        platos: leido.items.reduce((suma, item) => suma + item.cantidad, 0),
        noEncontrados: leido.noEncontrados,
      })
    }
  }
  // Ya leído, se quita ?pedido= de la dirección para que al recargar no se agregue otra vez
  useEffect(() => {
    if (enlaceLeido) quitarPedidoDelEnlace()
  }, [enlaceLeido])

  // Letrero del encabezado: Abierto / Cierra pronto / Cerrado
  const estado = menu ? estadoGeneral(menu.locales, menu.cierre_pedidos_min ?? 30, ahora) : null
  const etiquetasUsadas = menu
    ? ORDEN_ETIQUETAS.filter((id) => menu.categorias.some((c) => c.platos.some((p) => tieneEtiqueta(p, id))))
    : []

  // ¿El plato cumple el filtro y la búsqueda? (la búsqueda ignora tildes y mayúsculas)
  const textoBuscado = normalizar(busqueda.trim())
  const coincide = (plato: Plato) =>
    (!filtro || tieneEtiqueta(plato, filtro)) &&
    (!textoBuscado || normalizar(`${plato.nombre} ${plato.detalle}`).includes(textoBuscado))

  // Las categorías con sus platos, ya filtradas (las que quedan vacías no se muestran)
  const categoriasVisibles = (menu?.categorias ?? [])
    .map((c) => ({ ...c, platos: c.platos.filter(coincide) }))
    .filter((c) => c.platos.length > 0)
  const filtrando = filtro !== null || textoBuscado !== ''

  // Para el carrusel: platos disponibles con la etiqueta "mas-pedido"
  const masPedidos = (menu?.categorias ?? [])
    .flatMap((c) => c.platos)
    .filter((p) => p.disponible && tieneEtiqueta(p, 'mas-pedido'))
    .slice(0, 8) // como máximo 8 en el carrusel

  const quitarFiltros = () => {
    setFiltro(null)
    setBusqueda('')
  }
  const platosVisibles = categoriasVisibles.reduce((suma, c) => suma + c.platos.length, 0)
  // Si la categoría elegida quedó oculta por el filtro, se marca la primera que se ve
  const categoriaActiva = categoriasVisibles.some((c) => c.nombre === activa) ? activa : (categoriasVisibles[0]?.nombre ?? '')

    const { vista, abrirPedido, volverAlMenu } = useVista()

  // Ventana del plato: la que abrió el cliente, o la siguiente de la cola del pedido de WhatsApp
  const enCola = platoAbierto ? undefined : cola[0]
  const platoEnPantalla = platoAbierto ?? enCola?.plato ?? null
  const cerrarDetalle = (agregado: boolean) => {
    if (platoAbierto) return setPlatoAbierto(null)
    if (!agregado && enCola) setOmitidos((antes) => [...antes, enCola.plato.nombre])
    setCola((antes) => antes.slice(1)) // pasa al siguiente plato de la cola
  }
  const avisoCola = (item: ItemEnlace) => {
    const faltan = (item.plato.opciones ?? [])
      .filter((g) => g.obligatorio && !item.elegidas[g.nombre]?.length)
      .map((g) => g.nombre.toLowerCase())
    return `De su pedido por WhatsApp: elija ${faltan.join(' y ')} para agregarlo.`
  }

  // Pantalla "Pedido enviado"
  if (confirmado) {
    return (
      <PantallaConfirmado
        confirmacion={confirmado}
        whatsapp={menu?.whatsapp ?? ''}
        onOtroPedido={() => {
          setConfirmado(null)
          window.scrollTo(0, 0)
        }}
      />
    )
  }

  // Pantalla "Su pedido"
  if (vista === 'pedido' && datos.estado === 'listo' && pedido) {
    return (
      <PantallaPedido
        menu={datos.menu}
        lineas={pedido.lineas}
        totalPlatos={pedido.totalPlatos}
        subtotal={pedido.subtotal}
        onAgregar={carrito.sumar}
        onQuitar={carrito.restar}
        onVolver={volverAlMenu}
        onEnviar={async (datosPedido) => {
          // Si n8n no lo recibe, enviarPedido lanza un error y PantallaPedido lo muestra
          const codigo = await enviarPedido(datos.menu.webhook, pedido.lineas, datosPedido)
          setConfirmado({
            codigo,
            local: datosPedido.local,
            total: datosPedido.total,
            totalPlatos: pedido.totalPlatos,
            pago: datosPedido.entrega.comprobante
              ? `${datosPedido.entrega.pago} · comprobante enviado ✓`
              : datosPedido.entrega.pago,
            direccion: datosPedido.entrega.direccion,
            programado: datosPedido.programado,
            apertura: datosPedido.apertura,
          })
          carrito.vaciar()
          volverAlMenu() // quita #pedido de la dirección: "atrás" ya no vuelve a un pedido vacío
        }}
      />
    )
  }

  return (
    <>
      <Encabezado menu={menu} estado={estado}>
        <Buscador valor={busqueda} onCambiar={setBusqueda} />
      </Encabezado>

      <main className="contenido">
        {datos.estado === 'cargando' && <p className="aviso">Cargando el menú…</p>}

        {datos.estado === 'error' && (
          <p className="aviso aviso--error" role="alert">
            <strong>No se pudo cargar el menú.</strong> {datos.mensaje}
          </p>
        )}

        {datos.estado === 'listo' && (
          <>
            {avisoEnlace && cola.length === 0 && (
              <div className="aviso aviso--enlace" role="status">
                <p>
                  {pedido && pedido.totalPlatos > 0 ? (
                    <>
                      <strong>Su pedido de WhatsApp ya está en el carrito.</strong> Revíselo y ponga su dirección.
                    </>
                  ) : (
                    <strong>No encontramos los platos de su pedido en el menú.</strong>
                  )}
                  {omitidos.length > 0 && ` Falta agregar: ${omitidos.join(', ')}.`}
                  {avisoEnlace.noEncontrados > 0 &&
                    pedido &&
                    pedido.totalPlatos > 0 &&
                    ` ${avisoEnlace.noEncontrados === 1 ? 'Un plato no lo encontramos' : `${avisoEnlace.noEncontrados} platos no los encontramos`} en el menú.`}
                </p>
                {pedido && pedido.totalPlatos > 0 && (
                  <button
                    type="button"
                    className="boton-agregar"
                    onClick={() => {
                      setAvisoEnlace(null)
                      abrirPedido()
                    }}
                  >
                    Ver pedido
                  </button>
                )}
              </div>
            )}

            <FiltrosEtiquetas disponibles={etiquetasUsadas} activo={filtro} onCambiar={setFiltro} />

            {filtrando && (
              <p className="aviso aviso--filtro" role="status">
                <span>
                  {textoBuscado ? (
                    <>
                      Resultados para <strong>«{busqueda.trim()}»</strong>
                    </>
                  ) : (
                    'Mostrando'
                  )}
                  {filtro && (
                    <>
                      {textoBuscado ? ' en ' : ' '}
                      <strong>{ETIQUETAS[filtro].filtro}</strong>
                    </>
                  )}{' '}
                  · {platosVisibles} {platosVisibles === 1 ? 'plato' : 'platos'}
                </span>
                <button type="button" onClick={quitarFiltros}>
                  {textoBuscado && filtro ? 'Quitar todo' : textoBuscado ? 'Borrar búsqueda' : 'Quitar filtro'}
                </button>
              </p>
            )}

            {filtrando && platosVisibles === 0 && (
              <div className="sin-resultados">
                <p>No encontramos platos con esa búsqueda. Pruebe con otra palabra o vea todo el menú.</p>
                <button type="button" className="boton-agregar" onClick={quitarFiltros}>
                  Ver todo el menú
                </button>
              </div>
            )}

            {!filtrando && (
              <MasPedidos
                platos={masPedidos}
                cantidadPorPlato={pedido?.cantidadPorPlato ?? {}}
                onElegir={setPlatoAbierto}
              />
            )}

            <Categorias
              categorias={categoriasVisibles}
              activa={categoriaActiva}
              onElegir={setActiva}
            />

            {datos.menu.ejemplo && (
              <p className="aviso">Menú de ejemplo: los platos y precios todavía no son los reales.</p>
            )}

            {categoriasVisibles.map((categoria) => (
              <section key={categoria.nombre} id={idCategoria(categoria.nombre)} className="seccion">
                <div className="seccion__cabecera">
                  <h2 className="seccion__titulo">{categoria.nombre}</h2>
                  <p className="seccion__detalle">
                    {[
                      categoria.descripcion,
                      `${categoria.platos.length} ${categoria.platos.length === 1 ? 'plato' : 'platos'}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="seccion__platos">
                  {categoria.platos.map((plato) => (
                    <PlatoFila
                      key={plato.id}
                      plato={plato}
                      enPedido={pedido?.cantidadPorPlato[plato.id] ?? 0}
                      onElegir={() => setPlatoAbierto(plato)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </main>

      {menu && <PiePagina menu={menu} />} 
            {pedido && (
              <BarraPedido
                totalPlatos={pedido.totalPlatos}
                subtotal={pedido.subtotal}
                onAbrir={abrirPedido}
              />
            )}
            {platoEnPantalla && (
              <DetallePlato
                key={enCola ? `cola-${platoEnPantalla.id}` : platoEnPantalla.id}
                plato={platoEnPantalla}
                cantidadInicial={enCola?.cantidad}
                elegidasIniciales={enCola?.elegidas}
                aviso={enCola ? avisoCola(enCola) : undefined}
                onCerrar={() => cerrarDetalle(false)}
                onAgregar={(elegidas, nota, cantidad) => {
                  carrito.agregar(platoEnPantalla.id, elegidas, nota, cantidad)
                  cerrarDetalle(true)
                }}
              />
            )}
    </>
  )
}

export default App