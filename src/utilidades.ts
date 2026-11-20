// Funciones pequeñas que usan varios componentes

// 4.5 → "$4.50"
export const precio = (valor: number) => `$${valor.toFixed(2)}`

// "Platos fuertes" → "cat-platos-fuertes" (para los enlaces de las categorías)
export const idCategoria = (nombre: string) =>
  'cat-' +
  nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')