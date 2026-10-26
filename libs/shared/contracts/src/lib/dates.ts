/**
 * Fechas de calendario en hora de Chile. Una fecha es siempre un string
 * 'YYYY-MM-DD' para no arrastrar husos horarios entre API, SSR y navegador.
 */
export const CHILE_TZ = 'America/Santiago';

export type IsoDate = string;

export interface FixedRule {
  dateRuleType: 'fixed';
  month: number;
  day: number;
}

export interface NthWeekdayRule {
  dateRuleType: 'nth_weekday';
  month: number;
  /** 1 = lunes … 7 = domingo. */
  weekday: number;
  /** 1 a 4, o -1 para el último. */
  weekOfMonth: number;
}

export type DateRule = FixedRule | NthWeekdayRule;

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(year: number, month: number, day: number): IsoDate {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseIsoDate(date: IsoDate): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number);
  return { year, month, day };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Día ISO de la semana (1 = lunes) de una fecha de calendario. */
export function isoWeekday(year: number, month: number, day: number): number {
  const d = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return d === 0 ? 7 : d;
}

/** Fecha concreta de un día de comida en un año dado. */
export function occurrenceForYear(rule: DateRule, year: number): IsoDate {
  if (rule.dateRuleType === 'fixed') {
    return toIsoDate(year, rule.month, rule.day);
  }
  const last = daysInMonth(year, rule.month);
  if (rule.weekOfMonth === -1) {
    for (let d = last; d > last - 7; d--) {
      if (isoWeekday(year, rule.month, d) === rule.weekday) return toIsoDate(year, rule.month, d);
    }
  }
  const first = isoWeekday(year, rule.month, 1);
  const offset = (rule.weekday - first + 7) % 7;
  return toIsoDate(year, rule.month, 1 + offset + (rule.weekOfMonth - 1) * 7);
}

/** Hoy en Chile, como 'YYYY-MM-DD'. */
export function todayInChile(now: Date = new Date()): IsoDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHILE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return parts;
}

/** Días enteros de `from` a `to` (negativo si `to` ya pasó). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  const a = parseIsoDate(from);
  const b = parseIsoDate(to);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000,
  );
}

export const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

export const WEEKDAYS_ES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;

/** "viernes 24 de mayo" */
export function formatLongDate(date: IsoDate): string {
  const { year, month, day } = parseIsoDate(date);
  return `${WEEKDAYS_ES[isoWeekday(year, month, day) - 1]} ${day} de ${MONTHS_ES[month - 1]}`;
}

/** Descripción legible de la regla: "24 de mayo" o "el último viernes de mayo". */
export function describeRule(rule: DateRule): string {
  if (rule.dateRuleType === 'fixed') return `${rule.day} de ${MONTHS_ES[rule.month - 1]}`;
  const nth = rule.weekOfMonth === -1 ? 'último' : ['primer', 'segundo', 'tercer', 'cuarto'][rule.weekOfMonth - 1];
  return `el ${nth} ${WEEKDAYS_ES[rule.weekday - 1]} de ${MONTHS_ES[rule.month - 1]}`;
}
