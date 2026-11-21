import { useState } from 'react'
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
import { ORDEN_ETIQUETAS, ETIQUETAS, tieneEtiqueta } from './etiquetas'
import type { EtiquetaId, Plato } from './tipos'

function App() {
  const datos = useMenu()
  const [activa, setActiva] = useState('')
  const [platoAbierto, setPlatoAbierto] = useState<Plato | null>(null)
  const [filtro, setFiltro] = useState<EtiquetaId | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const carrito = useCarrito()

  // El resumen del pedido (solo cuando el menú ya cargó)
    const pedido = datos.estado === 'listo' ? resumirPedido(datos.menu, carrito.items) : null

  // Etiquetas que usa al menos un plato (solo esas aparecen como filtro)
  const menu = datos.estado === 'listo' ? datos.menu : null
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
        onEnviar={(datosPedido) => console.log('Pedido listo para enviar (paso 8)', { lineas: pedido.lineas, ...datosPedido })}
      />
    )
  }

  return (
    <>
      <header className="hero">
        <div className="hero__contenido">
          <div className="hero__barra">
            <span className="marca">Antojo Manabita</span>
            <span className="hero__etiqueta">A domicilio</span>
          </div>

          <div className="hero__texto">
            <h1>¿Qué se le antoja hoy?</h1>
            <p>Elija sus platos y vea el total con envío antes de enviar el pedido.</p>
          </div>

          <Buscador valor={busqueda} onCambiar={setBusqueda} />
        </div>

        <svg className="hero__onda" viewBox="0 0 1280 28" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 28V14C107 2 213 2 320 14S533 26 640 14 853 2 960 14 1173 26 1280 14V28Z"
            fill="#ffffff"
          />
        </svg>
      </header>

      <main className="contenido">
        {datos.estado === 'cargando' && <p className="aviso">Cargando el menú…</p>}

        {datos.estado === 'error' && (
          <p className="aviso aviso--error" role="alert">
            <strong>No se pudo cargar el menú.</strong> {datos.mensaje}
          </p>
        )}

        {datos.estado === 'listo' && (
          <>
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
            {pedido && (
              <BarraPedido
                totalPlatos={pedido.totalPlatos}
                subtotal={pedido.subtotal}
                onAbrir={abrirPedido}
              />
            )}
            {platoAbierto && (
              <DetallePlato
                key={platoAbierto.id}
                plato={platoAbierto}
                onCerrar={() => setPlatoAbierto(null)}
                onAgregar={(elegidas, nota, cantidad) => {
                  carrito.agregar(platoAbierto.id, elegidas, nota, cantidad)
                  setPlatoAbierto(null)
                }}
              />
            )}
    </>
  )
}

export default App