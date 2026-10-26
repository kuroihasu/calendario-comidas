import { CalendarEntry } from '@cc/contracts';

/** Arma un iCalendar con eventos de día completo y un aviso el día anterior a las 10:00. */
export function toIcs(entries: CalendarEntry[], publicUrl: string, name = 'Días de comida de Chile'): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const compact = (iso: string) => iso.replace(/-/g, '');
  const nextDay = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  };
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calendario de Comidas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(name)}`,
    'X-WR-TIMEZONE:America/Santiago',
    ...entries.flatMap((e) => [
      'BEGIN:VEVENT',
      `UID:${e.slug}-${e.date}@calendario-comidas`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(e.date))}`,
      `SUMMARY:${esc(e.name)}`,
      `DESCRIPTION:${esc(`${e.tagline}${e.isConfirmed ? '' : '\nFecha por confirmar.'}`)}`,
      `URL:${publicUrl}/dia/${e.slug}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(`Mañana es el ${e.name}`)}`,
      'TRIGGER:-PT14H',
      'END:VALARM',
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}
