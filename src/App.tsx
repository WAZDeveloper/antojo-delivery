import { useState } from 'react'
import './App.css'
import { Categorias } from './componentes/Categorias'
import { PlatoFila } from './componentes/PlatoFila'
import { useMenu } from './useMenu'
import { idCategoria } from './utilidades'
import { BarraPedido } from './componentes/BarraPedido'
import { resumirPedido, useCarrito } from './useCarrito'
import { PantallaPedido } from './componentes/PantallaPedido'
import { useVista } from './useVista'
import { DetallePlato } from './componentes/DetallePlato'
import type { Plato } from './tipos'

function App() {
  const datos = useMenu()
  const [activa, setActiva] = useState('')
  const [platoAbierto, setPlatoAbierto] = useState<Plato | null>(null)
  const carrito = useCarrito()

  // El resumen del pedido (solo cuando el menú ya cargó)
    const pedido = datos.estado === 'listo' ? resumirPedido(datos.menu, carrito.items) : null

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
            <span className="etiqueta">A domicilio</span>
          </div>

          <div className="hero__texto">
            <h1>¿Qué se le antoja hoy?</h1>
            <p>Elija sus platos y vea el total con envío antes de enviar el pedido.</p>
          </div>
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
            <Categorias
              categorias={datos.menu.categorias}
              activa={activa || datos.menu.categorias[0]?.nombre || ''}
              onElegir={setActiva}
            />

            {datos.menu.ejemplo && (
              <p className="aviso">Menú de ejemplo: los platos y precios todavía no son los reales.</p>
            )}

            {datos.menu.categorias.map((categoria) => (
              <section key={categoria.nombre} id={idCategoria(categoria.nombre)} className="seccion">
                <h2 className="seccion__titulo">{categoria.nombre}</h2>
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