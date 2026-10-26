import { z } from 'zod';
import { daysInMonth } from './dates';
import { INGREDIENT_KEYS, IngredientKey } from './ingredients';

export const FOOD_CATEGORIES = ['sandwich', 'plato', 'dulce', 'bebida', 'otro'] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  sandwich: 'Sánguches',
  plato: 'Platos',
  dulce: 'Dulces',
  bebida: 'Bebidas',
  otro: 'Otros',
};

const slug = z
  .string()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones');

const httpsUrl = z.string().url().startsWith('https://', 'La URL debe usar https');

const baseFoodDay = z.object({
  slug,
  name: z.string().trim().min(3).max(80),
  shortName: z.string().trim().min(2).max(40),
  tagline: z.string().trim().min(3).max(140),
  description: z.string().trim().min(10).max(4000),
  imageUrl: httpsUrl.nullish(),
  category: z.enum(FOOD_CATEGORIES),
  layers: z.array(z.enum(INGREDIENT_KEYS as [IngredientKey, ...IngredientKey[]])).max(12).default([]),
  isActive: z.boolean().default(true),
  sourceNote: z.string().trim().max(500).nullish(),
  dateRuleType: z.enum(['fixed', 'nth_weekday']),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31).nullish(),
  weekday: z.number().int().min(1).max(7).nullish(),
  weekOfMonth: z.number().int().refine((n) => n === -1 || (n >= 1 && n <= 4), 'Debe ser 1 a 4, o -1').nullish(),
});

type RuleFields = Pick<z.infer<typeof baseFoodDay>, 'dateRuleType' | 'month' | 'day' | 'weekday' | 'weekOfMonth'>;

/** Problemas de la regla de fecha: rechaza 31/02 y no permite 29/02. */
export function ruleProblems(v: Partial<RuleFields>): { path: string; message: string }[] {
  const out: { path: string; message: string }[] = [];
  if (v.dateRuleType === 'fixed') {
    if (v.day == null) out.push({ path: 'day', message: 'Una fecha fija necesita día' });
    else if (v.month != null && v.day > daysInMonth(2025, v.month)) {
      out.push({ path: 'day', message: 'Ese día no existe en ese mes (29/02 no está permitido)' });
    }
  }
  if (v.dateRuleType === 'nth_weekday') {
    if (v.weekday == null) out.push({ path: 'weekday', message: 'Falta el día de la semana' });
    if (v.weekOfMonth == null) out.push({ path: 'weekOfMonth', message: 'Falta la semana del mes' });
  }
  return out;
}

function checkRule(v: Partial<RuleFields>, ctx: z.RefinementCtx) {
  for (const p of ruleProblems(v)) ctx.addIssue({ code: 'custom', path: [p.path], message: p.message });
}

export const createFoodDaySchema = baseFoodDay.superRefine(checkRule);
export type CreateFoodDayInput = z.infer<typeof createFoodDaySchema>;

/** En una edición parcial, la regla se valida completa contra los valores guardados (lo hace el servicio). */
export const updateFoodDaySchema = baseFoodDay.partial();
export type UpdateFoodDayInput = z.infer<typeof updateFoodDaySchema>;

export const calendarQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export const upcomingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

export const occurrenceOverrideSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isConfirmed: z.boolean().default(true),
});

/* Respuestas de la API */

export interface FoodDaySummary {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  category: FoodCategory;
  imageUrl: string | null;
  layers: IngredientKey[];
  ruleLabel: string;
}

export interface CalendarEntry extends FoodDaySummary {
  date: string;
  isConfirmed: boolean;
  offerCount: number;
}

export interface CalendarResponse {
  year: number;
  month: number | null;
  entries: CalendarEntry[];
}

export interface FoodDayDetail extends FoodDaySummary {
  description: string;
  sourceNote: string | null;
  /** Próxima fecha desde hoy (este año o el siguiente). */
  next: { date: string; isConfirmed: boolean; daysUntil: number };
  /** Días cercanos en el calendario, para seguir navegando. */
  neighbours: { previous: CalendarEntry | null; next: CalendarEntry | null };
}

export interface AdminFoodDay extends FoodDaySummary {
  description: string;
  sourceNote: string | null;
  isActive: boolean;
  dateRuleType: 'fixed' | 'nth_weekday';
  month: number;
  day: number | null;
  weekday: number | null;
  weekOfMonth: number | null;
  updatedAt: string;
}
