import './App.css'
import { useMenu } from './useMenu'

const precio = (valor: number) => `$${valor.toFixed(2)}`

function App() {

  const datos = useMenu()
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
          <p>Elija sus platos y vea el total con envío antes de enviar el pedido</p>
        </div>
      </div>

      <svg
      className="hero__onda"
      viewBox="0 0 1280 28"
      preserveAspectRatio="none"
      aria-hidden="true"
      >
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
            {datos.menu.ejemplo && (
              <p className="aviso">Menú de ejemplo: los platos y precios todavía no son los reales.</p>
            )}

            {datos.menu.categorias.map((categoria) => (
              <section key={categoria.nombre}>
                <h2>{categoria.nombre}</h2>
                <ul>
                  {categoria.platos.map((plato) => (
                    <li key={plato.id}>
                      {plato.nombre} · {precio(plato.precio)}
                      {!plato.disponible && ' (agotado hoy)'}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </main>
    </>
  )
}

export default App