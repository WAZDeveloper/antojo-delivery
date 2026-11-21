import { resumenHorario } from '../horario'
import type { Menu } from '../tipos'
import { IconoCamara, IconoChat, IconoMeGusta, IconoMusica } from './Iconos'
import { Logo } from './Logo'
import './PiePagina.css'

export function PiePagina({ menu }: { menu: Menu }) {
  const marca = menu.marca ?? {}
  const redes = [
    { nombre: 'Instagram', url: marca.redes?.instagram, icono: <IconoCamara /> },
    { nombre: 'Facebook', url: marca.redes?.facebook, icono: <IconoMeGusta /> },
    { nombre: 'TikTok', url: marca.redes?.tiktok, icono: <IconoMusica /> },
  ].filter((red) => red.url) // solo las que tienen enlace en menu.json
  const whatsapp = menu.whatsapp.replace(/\D/g, '')
  const anio = new Date().getFullYear()

  return (
    <footer className="pie">
      <div className="pie__contenido">
        <div className="pie__marca">
          <div className="pie__nombre">
            <Logo src={marca.logo} tamano={46} />
            <span>{menu.negocio}</span>
          </div>
          {marca.descripcion && <p>{marca.descripcion}</p>}
          {whatsapp && (
            <a className="pie__whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
              <IconoChat />
              ¿Dudas con su pedido? Escríbanos
            </a>
          )}
        </div>

        <section className="pie__seccion" aria-labelledby="pie-locales">
          <h2 id="pie-locales">Nuestros locales</h2>
          {menu.locales.map((local) => (
            <div key={local.nombre} className="pie__local">
              <strong>{local.nombre}</strong>
              {local.direccion && <span>{local.direccion}</span>}
              {local.horario && <span>{resumenHorario(local.horario)}</span>}
              <span className="pie__enlaces">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${local.lat},${local.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Cómo llegar
                </a>
                {local.telefono && <a href={`tel:${local.telefono.replace(/[^\d+]/g, '')}`}>{local.telefono}</a>}
              </span>
            </div>
          ))}
        </section>

        <div className="pie__columna">
          <section className="pie__seccion" aria-labelledby="pie-pagos">
            <h2 id="pie-pagos">Formas de pago</h2>
            <div className="pie__chips">
              {menu.pagos.map((pago) => (
                <span key={pago} className="pie__chip">
                  {pago}
                </span>
              ))}
            </div>
          </section>

          {redes.length > 0 && (
            <section className="pie__seccion" aria-labelledby="pie-redes">
              <h2 id="pie-redes">Síganos</h2>
              <div className="pie__chips">
                {redes.map((red) => (
                  <a key={red.nombre} className="pie__red" href={red.url} target="_blank" rel="noreferrer">
                    {red.icono}
                    {red.nombre}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="pie__legal">
        <span>
          © {anio} {menu.negocio} · Precios en dólares (USD)
        </span>
        {(marca.terminos || marca.privacidad) && (
          <span>
            {marca.terminos && <a href={marca.terminos}>Términos y condiciones</a>}
            {marca.terminos && marca.privacidad && ' · '}
            {marca.privacidad && <a href={marca.privacidad}>Política de privacidad</a>}
          </span>
        )}
      </div>
    </footer>
  )
}