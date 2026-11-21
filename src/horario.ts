import type { DiaSemana, Horario, Local } from './tipos'

// Mismo orden que getDay() de JavaScript: 0 = domingo
const DIAS: DiaSemana[] = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']
const NOMBRE_DIA: Record<DiaSemana, string> = {
  lun: 'lunes',
  mar: 'martes',
  mie: 'miércoles',
  jue: 'jueves',
  vie: 'viernes',
  sab: 'sábado',
  dom: 'domingo',
}
const DIA_CORTO: Record<DiaSemana, string> = {
  lun: 'Lun',
  mar: 'Mar',
  mie: 'Mié',
  jue: 'Jue',
  vie: 'Vie',
  sab: 'Sáb',
  dom: 'Dom',
}

// Ecuador no cambia la hora durante el año: siempre es UTC−5.
// Así el letrero es correcto aunque el celular del cliente tenga otra zona horaria.
export function horaEcuador(fecha = new Date()) {
  const ec = new Date(fecha.getTime() - 5 * 3600 * 1000)
  return { indiceDia: ec.getUTCDay(), minutos: ec.getUTCHours() * 60 + ec.getUTCMinutes() }
}

const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

// 450 → "7:30"
export const textoHora = (minutos: number) => `${Math.floor(minutos / 60)}:${String(minutos % 60).padStart(2, '0')}`

export type EstadoLocal =
  | { abierto: true; pedidosHasta: number } // minutos del día
  | { abierto: false; proxima: { diasDespues: number; dia: DiaSemana; minutos: number } | null }

// ¿Este local está tomando pedidos ahora? Si no, ¿cuándo vuelve a abrir?
export function estadoLocal(local: Local, cierreMin: number, fecha = new Date()): EstadoLocal {
  const { indiceDia, minutos } = horaEcuador(fecha)
  const horario = local.horario ?? {}

  const hoy = horario[DIAS[indiceDia]]
  if (hoy) {
    const abre = aMinutos(hoy[0])
    const pedidosHasta = aMinutos(hoy[1]) - cierreMin
    if (minutos >= abre && minutos < pedidosHasta) return { abierto: true, pedidosHasta }
    if (minutos < abre) return { abierto: false, proxima: { diasDespues: 0, dia: DIAS[indiceDia], minutos: abre } }
  }

  // Buscar el próximo día que abre
  for (let i = 1; i <= 7; i++) {
    const dia = DIAS[(indiceDia + i) % 7]
    const rango = horario[dia]
    if (rango) return { abierto: false, proxima: { diasDespues: i, dia, minutos: aMinutos(rango[0]) } }
  }
  return { abierto: false, proxima: null }
}

export interface EstadoGeneral {
  tipo: 'abierto' | 'pronto' | 'cerrado'
  texto: string
}

// El letrero del encabezado: abierto si al menos un local está tomando pedidos
export function estadoGeneral(locales: Local[], cierreMin: number, fecha = new Date()): EstadoGeneral | null {
  const conHorario = locales.filter((l) => l.horario)
  if (conHorario.length === 0) return null

  const estados = conHorario.map((l) => estadoLocal(l, cierreMin, fecha))
  const { minutos } = horaEcuador(fecha)

  const abiertos = estados.filter((e): e is Extract<EstadoLocal, { abierto: true }> => e.abierto)
  if (abiertos.length > 0) {
    const hasta = Math.max(...abiertos.map((e) => e.pedidosHasta))
    const pronto = hasta - minutos <= 30
    return {
      tipo: pronto ? 'pronto' : 'abierto',
      texto: `${pronto ? 'Cierra pronto' : 'Abierto'} · pedidos hasta ${textoHora(hasta)}`,
    }
  }

  const proximas = estados
    .flatMap((e) => (!e.abierto && e.proxima ? [e.proxima] : []))
    .sort((a, b) => a.diasDespues - b.diasDespues || a.minutos - b.minutos)
  const p = proximas[0]
  if (!p) return { tipo: 'cerrado', texto: 'Cerrado por ahora' }

  const cuando = p.diasDespues === 0 ? 'hoy' : p.diasDespues === 1 ? 'mañana' : `el ${NOMBRE_DIA[p.dia]}`
  return { tipo: 'cerrado', texto: `Cerrado · abrimos ${cuando} a las ${textoHora(p.minutos)}` }
}

// Para el pie de página: "Lun a jue 8:30–17:30 · Vie 8:30–19:00 · …"
export function resumenHorario(horario: Horario): string {
  const semana: DiaSemana[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
  const grupos: { desde: DiaSemana; hasta: DiaSemana; texto: string }[] = []

  for (const dia of semana) {
    const rango = horario[dia]
    const texto = rango ? `${textoHora(aMinutos(rango[0]))}–${textoHora(aMinutos(rango[1]))}` : 'cerrado'
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.texto === texto) ultimo.hasta = dia // mismo horario que el día anterior: se juntan
    else grupos.push({ desde: dia, hasta: dia, texto })
  }

  return grupos
    .map((g) => {
      const dias = g.desde === g.hasta ? DIA_CORTO[g.desde] : `${DIA_CORTO[g.desde]} a ${DIA_CORTO[g.hasta].toLowerCase()}`
      return `${dias} ${g.texto}`
    })
    .join(' · ')
}