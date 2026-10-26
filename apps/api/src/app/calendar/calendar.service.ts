import { Injectable } from '@nestjs/common';
import { CalendarEntry, CalendarResponse, daysBetween, FoodDayDetail, occurrenceForYear, parseIsoDate, todayInChile } from '@cc/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { NotFound } from '../common/errors';
import { isoOf, ruleOf, toEntry, toSummary } from './mappers';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea las ocurrencias que falten para un año a partir de la regla de cada día.
   * Las generadas así quedan sin confirmar; el admin puede corregirlas.
   */
  async ensureYear(year: number): Promise<void> {
    const missing = await this.prisma.foodDay.findMany({
      where: { isActive: true, occurrences: { none: { year } } },
    });
    if (!missing.length) return;
    await this.prisma.foodDayOccurrence.createMany({
      data: missing.map((d) => ({
        foodDayId: d.id,
        year,
        date: new Date(`${occurrenceForYear(ruleOf(d), year)}T00:00:00Z`),
      })),
      skipDuplicates: true,
    });
  }

  async entriesForYear(year: number, month?: number): Promise<CalendarEntry[]> {
    await this.ensureYear(year);
    const from = new Date(Date.UTC(year, (month ?? 1) - 1, 1));
    const to = month ? new Date(Date.UTC(year, month, 1)) : new Date(Date.UTC(year + 1, 0, 1));
    const rows = await this.prisma.foodDayOccurrence.findMany({
      where: { date: { gte: from, lt: to }, foodDay: { isActive: true } },
      include: { foodDay: true },
      orderBy: [{ date: 'asc' }, { foodDay: { name: 'asc' } }],
    });
    return rows.map(toEntry);
  }

  async calendar(year: number, month?: number): Promise<CalendarResponse> {
    return { year, month: month ?? null, entries: await this.entriesForYear(year, month) };
  }

  /** Próximos días desde hoy (incluye hoy), cruzando al año siguiente si hace falta. */
  async upcoming(limit: number, today = todayInChile()): Promise<CalendarEntry[]> {
    const { year } = parseIsoDate(today);
    const entries = [...(await this.entriesForYear(year)), ...(await this.entriesForYear(year + 1))];
    return entries.filter((e) => e.date >= today).slice(0, limit);
  }

  async list() {
    const days = await this.prisma.foodDay.findMany({ where: { isActive: true }, orderBy: [{ month: 'asc' }, { day: 'asc' }] });
    return days.map(toSummary);
  }

  async detail(slug: string, today = todayInChile()): Promise<FoodDayDetail> {
    const day = await this.prisma.foodDay.findFirst({ where: { slug, isActive: true } });
    if (!day) throw new NotFound('El día de comida');

    const { year } = parseIsoDate(today);
    const timeline = [
      ...(await this.entriesForYear(year - 1)),
      ...(await this.entriesForYear(year)),
      ...(await this.entriesForYear(year + 1)),
    ];
    const index = timeline.findIndex((e) => e.id === day.id && e.date >= today);
    const current = timeline[index];

    return {
      ...toSummary(day),
      description: day.description,
      sourceNote: day.sourceNote,
      next: {
        date: current?.date ?? isoOf(new Date()),
        isConfirmed: current?.isConfirmed ?? false,
        daysUntil: current ? daysBetween(today, current.date) : 0,
      },
      neighbours: {
        previous: timeline[index - 1] ?? null,
        next: timeline[index + 1] ?? null,
      },
    };
  }
}
