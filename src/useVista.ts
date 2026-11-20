import { useEffect, useState } from 'react'

export type Vista = 'menu' | 'pedido'

const vistaActual = (): Vista => (window.location.hash === '#pedido' ? 'pedido' : 'menu')

export function useVista() {
  const [vista, setVista] = useState<Vista>(vistaActual)

  // Botón "atrás" del celular o del navegador
  useEffect(() => {
    const alNavegar = () => setVista(vistaActual())
    window.addEventListener('popstate', alNavegar)
    return () => window.removeEventListener('popstate', alNavegar)
  }, [])

  // Al cambiar de pantalla, empezar desde arriba
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [vista])

  const abrirPedido = () => {
    window.history.pushState({ vista: 'pedido' }, '', '#pedido')
    setVista('pedido')
  }

  const volverAlMenu = () => {
    if (window.history.state?.vista === 'pedido') {
      window.history.back() // el evento popstate nos devuelve al menú
    } else {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      setVista('menu')
    }
  }

  return { vista, abrirPedido, volverAlMenu }
}