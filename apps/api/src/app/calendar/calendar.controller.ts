import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { calendarQuerySchema, upcomingQuerySchema } from '@cc/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CalendarService } from './calendar.service';

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

  @Get('food-days')
  @Header('Cache-Control', PUBLIC_CACHE)
  listFoodDays() {
    return this.calendar.list();
  }

  @Get('food-days/:slug')
  @Header('Cache-Control', 'public, max-age=300')
  getFoodDay(@Param('slug') slug: string) {
    return this.calendar.detail(slug);
  }
}
