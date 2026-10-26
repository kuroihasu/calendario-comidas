import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { parseIsoDate, todayInChile } from '@cc/contracts';
import { calendarQuerySchema, upcomingQuerySchema } from '@cc/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CalendarService } from './calendar.service';
import { toIcs } from './ics';

const PUBLIC_URL = process.env['PUBLIC_URL'] ?? 'http://localhost:4200';
const ICS_TYPE = 'text/calendar; charset=utf-8';

const PUBLIC_CACHE = 'public, max-age=300, s-maxage=3600';

@Controller()
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get('calendar')
  @Header('Cache-Control', PUBLIC_CACHE)
  getCalendar(@Query(new ZodValidationPipe(calendarQuerySchema)) q: { year: number; month?: number }) {
    return this.calendar.calendar(q.year, q.month);
  }

  @Get('calendar/upcoming')
  @Header('Cache-Control', 'public, max-age=300')
  getUpcoming(@Query(new ZodValidationPipe(upcomingQuerySchema)) q: { limit: number }) {
    return this.calendar.upcoming(q.limit);
  }

  /** Suscripción para Google Calendar o Apple Calendar: este año y el siguiente. */
  @Get('calendar.ics')
  @Header('Content-Type', ICS_TYPE)
  @Header('Cache-Control', 'public, max-age=3600')
  async getIcs() {
    const { year } = parseIsoDate(todayInChile());
    const entries = [...(await this.calendar.entriesForYear(year)), ...(await this.calendar.entriesForYear(year + 1))];
    return toIcs(entries, PUBLIC_URL);
  }

  @Get('food-days')
  @Header('Cache-Control', PUBLIC_CACHE)
  listFoodDays() {
    return this.calendar.list();
  }

  @Get('food-days/:slug.ics')
  @Header('Content-Type', ICS_TYPE)
  @Header('Content-Disposition', 'attachment; filename="dia-de-comida.ics"')
  async getFoodDayIcs(@Param('slug') slug: string) {
    const d = await this.calendar.detail(slug);
    return toIcs([{ ...d, date: d.next.date, isConfirmed: d.next.isConfirmed, offerCount: 0 }], PUBLIC_URL, d.name);
  }

  @Get('food-days/:slug')
  @Header('Cache-Control', 'public, max-age=300')
  getFoodDay(@Param('slug') slug: string) {
    return this.calendar.detail(slug);
  }
}
