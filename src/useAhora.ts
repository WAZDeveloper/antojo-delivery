import { useEffect, useState } from 'react'

// La hora actual, que se actualiza sola cada minuto (para el letrero Abierto / Cerrado)
export function useAhora() {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), 60_000)
    return () => clearInterval(reloj) // al salir de la página, se detiene el reloj
  }, [])

  return ahora
}