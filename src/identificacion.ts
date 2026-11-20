// Validación de documentos de Ecuador para la factura

export type TipoIdentificacion = 'cedula' | 'ruc' | 'pasaporte'

export const NOMBRES_IDENTIFICACION: Record<TipoIdentificacion, string> = {
  cedula: 'Cédula',
  ruc: 'RUC',
  pasaporte: 'Pasaporte',
}

// Cédula: 10 dígitos, provincia válida y último dígito verificador (módulo 10)
export function cedulaValida(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false

  const provincia = Number(cedula.slice(0, 2))
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false
  if (Number(cedula[2]) >= 6) return false

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  let suma = 0
  for (let i = 0; i < 9; i++) {
    let valor = Number(cedula[i]) * coeficientes[i]
    if (valor > 9) valor -= 9
    suma += valor
  }
  const verificador = (10 - (suma % 10)) % 10
  return verificador === Number(cedula[9])
}

// RUC: 13 dígitos que terminan en 001. Si es de persona natural, los 10 primeros son su cédula.
export function rucValido(ruc: string): boolean {
  if (!/^\d{13}$/.test(ruc) || !ruc.endsWith('001')) return false
  const tercero = Number(ruc[2])
  if (tercero < 6) return cedulaValida(ruc.slice(0, 10))
  return tercero === 6 || tercero === 9 // entidades públicas y sociedades
}

export const pasaporteValido = (pasaporte: string) => /^[A-Za-z0-9]{5,20}$/.test(pasaporte)

export function identificacionValida(tipo: TipoIdentificacion, numero: string): boolean {
  if (tipo === 'cedula') return cedulaValida(numero)
  if (tipo === 'ruc') return rucValido(numero)
  return pasaporteValido(numero)
}

export const ERROR_IDENTIFICACION: Record<TipoIdentificacion, string> = {
  cedula: 'Revise la cédula: deben ser 10 dígitos válidos.',
  ruc: 'Revise el RUC: 13 dígitos que terminan en 001.',
  pasaporte: 'Escriba el número de pasaporte (letras y números).',
}