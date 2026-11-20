import L, { type Map as MapaLeaflet } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRef, useState } from 'react'
import { AttributionControl, CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMapEvents } from 'react-leaflet'
import type { Punto } from '../entrega'
import type { Local } from '../tipos'
import './MapaEntrega.css'

// Pin rojo dibujado con CSS (ver .pin-entrega en MapaEntrega.css)
const iconoPin = L.divIcon({
  className: 'pin-entrega',
  html: '<span class="pin-entrega__gota"></span>',
  iconSize: [36, 46],
  iconAnchor: [18, 44], // la punta del pin es el punto exacto
})

interface Props {
  posicion: Punto | null
  locales: Local[]
  onCambiar: (punto: Punto) => void
  onDireccion: (texto: string) => void // nombre de la calle encontrado para ese punto
}

// Componente "invisible" que escucha los toques sobre el mapa
function AlTocarElMapa({ onTocar }: { onTocar: (punto: Punto) => void }) {
  useMapEvents({
    click: (e) => onTocar({ lat: e.latlng.lat, lng: e.latlng.lng }),
  })
  return null
}

const NOMINATIM = 'https://nominatim.openstreetmap.org'

export function MapaEntrega({ posicion, locales, onCambiar, onDireccion }: Props) {
  const mapa = useRef<MapaLeaflet | null>(null)
  const ultimaConsulta = useRef(0)
  const [gps, setGps] = useState<'' | 'buscando' | 'error'>('')
  const [busqueda, setBusqueda] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [sinResultados, setSinResultados] = useState(false)

  // El mapa empieza mostrando todos los locales
  const limites = locales.length ? L.latLngBounds(locales.map((l) => [l.lat, l.lng] as [number, number])) : undefined

  // OpenStreetMap pide máximo 1 consulta por segundo: esperamos si hace falta
  const esperarTurno = async () => {
    const espera = Math.max(0, 1100 - (Date.now() - ultimaConsulta.current))
    if (espera) await new Promise((listo) => setTimeout(listo, espera))
    ultimaConsulta.current = Date.now()
  }

  // Busca el nombre de la calle del punto elegido
  const nombrarPunto = async (punto: Punto) => {
    try {
      await esperarTurno()
      const url = `${NOMINATIM}/reverse?format=jsonv2&zoom=18&accept-language=es&lat=${punto.lat}&lon=${punto.lng}`
      const respuesta = await fetch(url)
      if (!respuesta.ok) return
      const datos = (await respuesta.json()) as { address?: Record<string, string>; display_name?: string }
      const a = datos.address ?? {}
      const calle = [a.road, a.house_number].filter(Boolean).join(' ')
      const barrio = a.neighbourhood ?? a.suburb ?? a.village ?? a.town ?? a.city
      const texto = [calle, barrio].filter(Boolean).join(', ') || datos.display_name || ''
      if (texto) onDireccion(texto)
    } catch {
      // Sin internet o servicio ocupado: el cliente escribe la dirección a mano
    }
  }

  const elegir = (punto: Punto, acercar = false) => {
    onCambiar(punto)
    if (acercar) mapa.current?.flyTo([punto.lat, punto.lng], 17)
    void nombrarPunto(punto)
  }

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      setGps('error')
      return
    }
    setGps('buscando')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps('')
        elegir({ lat: pos.coords.latitude, lng: pos.coords.longitude }, true)
      },
      () => setGps('error'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const buscar = async () => {
    if (busqueda.trim().length < 3) return
    setBuscando(true)
    setSinResultados(false)
    try {
      await esperarTurno()
      const texto = encodeURIComponent(`${busqueda}, Pichincha`)
      const respuesta = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=1&countrycodes=ec&accept-language=es&q=${texto}`)
      const lista = (await respuesta.json()) as { lat: string; lon: string }[]
      if (lista.length === 0) {
        setSinResultados(true)
        return
      }
      elegir({ lat: Number(lista[0].lat), lng: Number(lista[0].lon) }, true)
    } catch {
      setSinResultados(true)
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="mapa-entrega">
      <div className="mapa-entrega__buscar">
        <label htmlFor="buscar-direccion" className="visualmente-oculto">
          Buscar calle o barrio
        </label>
        <input
          id="buscar-direccion"
          type="search"
          placeholder="Buscar calle o barrio"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault() // que Enter no envíe todo el pedido
              void buscar()
            }
          }}
        />
        <button type="button" onClick={() => void buscar()} disabled={buscando}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </div>
      {sinResultados && <p className="campo__error">No encontramos ese lugar. Pruebe con otra calle o mueva el pin.</p>}

      <div className="mapa-entrega__marco">
        <MapContainer
          ref={mapa}
          bounds={limites}
          boundsOptions={{ padding: [30, 30] }}
          center={limites ? undefined : [-0.22, -78.5]}
          zoom={limites ? undefined : 12}
          scrollWheelZoom={false}
          attributionControl={false}
          className="mapa-entrega__mapa"
        >
          <AttributionControl prefix={false} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AlTocarElMapa onTocar={(punto) => elegir(punto)} />

          {locales.map((local) => (
            <CircleMarker
              key={local.nombre}
              center={[local.lat, local.lng]}
              radius={9}
              pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1e6b3c', fillOpacity: 1 }}
            >
              <Tooltip>Local {local.nombre}</Tooltip>
            </CircleMarker>
          ))}

          {posicion && (
            <Marker
              position={[posicion.lat, posicion.lng]}
              icon={iconoPin}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const punto = (e.target as L.Marker).getLatLng()
                  elegir({ lat: punto.lat, lng: punto.lng })
                },
              }}
            />
          )}
        </MapContainer>

        <button type="button" id="campo-lat" className="mapa-entrega__gps" onClick={usarMiUbicacion}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          {gps === 'buscando' ? 'Buscando…' : 'Usar mi ubicación'}
        </button>
      </div>

      <p className="campo__ayuda">
        {gps === 'error'
          ? 'No pudimos usar su ubicación. Toque el mapa o busque su calle.'
          : posicion
            ? 'Arrastre el pin hasta su puerta para que el repartidor llegue sin perderse.'
            : 'Toque el mapa o use su ubicación para marcar dónde entregamos.'}
      </p>
    </div>
  )
}