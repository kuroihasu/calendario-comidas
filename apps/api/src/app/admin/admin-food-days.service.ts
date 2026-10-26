import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateFoodDayInput, occurrenceForYear, parseIsoDate, ruleProblems, todayInChile, UpdateFoodDayInput } from '@cc/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException, NotFound, ValidationError } from '../common/errors';
import { ruleOf, toAdmin } from '../calendar/mappers';

const RULE_FIELDS = ['dateRuleType', 'month', 'day', 'weekday', 'weekOfMonth'] as const;

@Injectable()
export class AdminFoodDaysService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const days = await this.prisma.foodDay.findMany({ orderBy: [{ month: 'asc' }, { day: 'asc' }, { name: 'asc' }] });
    return days.map(toAdmin);
  }

  async get(id: string) {
    const day = await this.prisma.foodDay.findUnique({ where: { id } });
    if (!day) throw new NotFound('El día de comida');
    return toAdmin(day);
  }

  async create(adminId: string, input: CreateFoodDayInput) {
    const day = await this.prisma.$transaction(async (tx) => {
      const created = await tx.foodDay.create({ data: this.toData(input) as Prisma.FoodDayCreateInput });
      await this.regenerate(tx, created.id);
      await this.audit(tx, adminId, created.id, 'create', input);
      return created;
    });
    return toAdmin(day);
  }

  async update(adminId: string, id: string, input: UpdateFoodDayInput) {
    const current = await this.prisma.foodDay.findUnique({ where: { id } });
    if (!current) throw new NotFound('El día de comida');

    // La regla se valida completa: lo nuevo sobre lo guardado.
    const merged = { ...current, ...input };
    const problems = ruleProblems(merged);
    if (problems.length) throw new ValidationError(problems);

    const ruleChanged = RULE_FIELDS.some((f) => f in input && input[f] !== current[f]);
    const day = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.foodDay.update({ where: { id }, data: this.toData(input) });
      if (ruleChanged) await this.regenerate(tx, id);
      await this.audit(tx, adminId, id, 'update', input);
      return updated;
    });
    return toAdmin(day);
  }

  async remove(adminId: string, id: string) {
    await this.get(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.foodDay.delete({ where: { id } });
      await this.audit(tx, adminId, id, 'delete', null);
    });
  }

  /** Corrige la fecha de un año puntual (por ejemplo, si una marca la movió). */
  async setOccurrence(adminId: string, id: string, body: { year: number; date: string; isConfirmed: boolean }) {
    await this.get(id);
    if (parseIsoDate(body.date).year !== body.year) {
      throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'BUSINESS_RULE', 'La fecha debe caer en el año indicado', {
        subcode: 'OCCURRENCE_YEAR_MISMATCH',
      });
    }
    const date = new Date(`${body.date}T00:00:00Z`);
    const occ = await this.prisma.foodDayOccurrence.upsert({
      where: { foodDayId_year: { foodDayId: id, year: body.year } },
      create: { foodDayId: id, year: body.year, date, isConfirmed: body.isConfirmed },
      update: { date, isConfirmed: body.isConfirmed },
    });
    await this.audit(this.prisma, adminId, id, 'set_occurrence', body);
    return { year: occ.year, date: body.date, isConfirmed: occ.isConfirmed };
  }

  /** Recalcula este año y el siguiente con la regla vigente; los años pasados no se tocan. */
  private async regenerate(tx: Prisma.TransactionClient, id: string) {
    const day = await tx.foodDay.findUniqueOrThrow({ where: { id } });
    const { year } = parseIsoDate(todayInChile());
    await tx.foodDayOccurrence.deleteMany({ where: { foodDayId: id, year: { gte: year } } });
    await tx.foodDayOccurrence.createMany({
      data: [year, year + 1].map((y) => ({
        foodDayId: id,
        year: y,
        date: new Date(`${occurrenceForYear(ruleOf(day), y)}T00:00:00Z`),
        isConfirmed: true,
      })),
    });
  }

  private toData(input: UpdateFoodDayInput): Prisma.FoodDayUpdateInput {
    const { layers, ...rest } = input;
    return { ...rest, ...(layers ? { layers: layers as Prisma.InputJsonValue } : {}) };
  }

  private audit(tx: Prisma.TransactionClient, adminId: string, entityId: string, action: string, diff: unknown) {
    return tx.auditLog.create({
      data: { adminId, entity: 'food_day', entityId, action, diff: (diff ?? undefined) as Prisma.InputJsonValue },
    });
  }
}
