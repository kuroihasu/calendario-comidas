import { FoodDay, FoodDayOccurrence } from '@prisma/client';
import { AdminFoodDay, CalendarEntry, DateRule, describeRule, FoodDaySummary, IngredientKey } from '@cc/contracts';

export function ruleOf(d: FoodDay): DateRule {
  return d.dateRuleType === 'fixed'
    ? { dateRuleType: 'fixed', month: d.month, day: d.day ?? 1 }
    : { dateRuleType: 'nth_weekday', month: d.month, weekday: d.weekday ?? 1, weekOfMonth: d.weekOfMonth ?? 1 };
}

export const isoOf = (date: Date) => date.toISOString().slice(0, 10);

export function toSummary(d: FoodDay): FoodDaySummary {
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    shortName: d.shortName,
    tagline: d.tagline,
    category: d.category,
    imageUrl: d.imageUrl,
    layers: (d.layers as IngredientKey[]) ?? [],
    ruleLabel: describeRule(ruleOf(d)),
  };
}

export function toEntry(o: FoodDayOccurrence & { foodDay: FoodDay }): CalendarEntry {
  return {
    ...toSummary(o.foodDay),
    date: isoOf(o.date),
    isConfirmed: o.isConfirmed,
    // Las ofertas llegan en la fase 3.
    offerCount: 0,
  };
}

export function toAdmin(d: FoodDay): AdminFoodDay {
  return {
    ...toSummary(d),
    description: d.description,
    sourceNote: d.sourceNote,
    isActive: d.isActive,
    dateRuleType: d.dateRuleType,
    month: d.month,
    day: d.day,
    weekday: d.weekday,
    weekOfMonth: d.weekOfMonth,
    updatedAt: d.updatedAt.toISOString(),
  };
}
