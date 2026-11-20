import './App.css'

function App() {
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
      {/* Aquí irán las categorías y los platos (paso 5) */}
    </main>
    </>
  )
}

export default App