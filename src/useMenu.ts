import { useEffect, useState } from 'react'
import type { Menu } from './tipos'

// Los tres momentos posibles al cargar el menú
export type EstadoMenu =
  | { estado: 'cargando' }
  | { estado: 'listo'; menu: Menu }
  | { estado: 'error'; mensaje: string }

export function useMenu(): EstadoMenu {
  const [resultado, setResultado] = useState<EstadoMenu>({ estado: 'cargando' })

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}menu.json`

    fetch(url, { cache: 'no-store' })
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error(`No se encontró el archivo menu.json (error ${respuesta.status}).`)
        }
        return respuesta.json() as Promise<Menu>
      })
      .then((menu) => setResultado({ estado: 'listo', menu }))
      .catch((error: unknown) => {
        const mensaje =
          error instanceof SyntaxError
            ? 'El archivo menu.json tiene un error de formato: revise comas, comillas y llaves.'
            : error instanceof Error
              ? error.message
              : 'Error desconocido.'
        setResultado({ estado: 'error', mensaje })
      })
  }, [])

  return resultado
}