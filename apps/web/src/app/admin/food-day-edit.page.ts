import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AdminFoodDay,
  ApiErrorBody,
  CATEGORY_LABELS,
  createFoodDaySchema,
  describeRule,
  FOOD_CATEGORIES,
  INGREDIENT_KEYS,
  INGREDIENTS,
  IngredientKey,
  MONTHS_ES,
  WEEKDAYS_ES,
} from '@cc/contracts';
import { ApiService } from '../shared/api.service';
import { ButtonLabelComponent } from '../shared/button-label';
import { StackArtComponent } from '../shared/stack-art.component';

type Draft = Omit<AdminFoodDay, 'id' | 'ruleLabel' | 'updatedAt'>;

const EMPTY: Draft = {
  slug: '',
  name: '',
  shortName: '',
  tagline: '',
  description: '',
  imageUrl: null,
  category: 'sandwich',
  layers: ['pan', 'carne', 'pan'],
  isActive: true,
  sourceNote: null,
  dateRuleType: 'fixed',
  month: 1,
  day: 1,
  weekday: null,
  weekOfMonth: null,
};

@Component({
  selector: 'cc-admin-food-day-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, ButtonLabelComponent, StackArtComponent],
  templateUrl: './food-day-edit.page.html',
  styleUrl: './admin.scss',
  styles: `
    .layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 48px; align-items: start; }
    .preview { position: sticky; top: 24px; padding: 32px; border-radius: 24px; background: var(--surface); display: grid; gap: 12px; }
    .layers { display: flex; flex-wrap: wrap; gap: 8px; }
    .layers button { border: 0; border-radius: 999px; padding: 6px 12px; cursor: pointer; background: var(--surface); }
    .layers .chosen { background: var(--ink); color: var(--ground); }
    .swatch { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } .preview { position: static; } }
  `,
})
export class FoodDayEditPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');

  protected readonly draft = signal<Draft>({ ...EMPTY });
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly message = signal('');
  protected readonly busy = signal(false);

  protected readonly categories = FOOD_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }));
  protected readonly months = MONTHS_ES;
  protected readonly weekdays = WEEKDAYS_ES;
  protected readonly ingredients = INGREDIENT_KEYS.map((k) => ({ key: k, ...INGREDIENTS[k] }));
  protected readonly ruleLabel = computed(() => {
    const d = this.draft();
    try {
      return d.dateRuleType === 'fixed'
        ? describeRule({ dateRuleType: 'fixed', month: d.month, day: d.day ?? 1 })
        : describeRule({ dateRuleType: 'nth_weekday', month: d.month, weekday: d.weekday ?? 1, weekOfMonth: d.weekOfMonth ?? 1 });
    } catch {
      return '';
    }
  });

  constructor() {
    if (this.id) {
      this.api.adminFoodDay(this.id).subscribe((d) => {
        const { id: _id, ruleLabel: _r, updatedAt: _u, ...rest } = d;
        this.draft.set(rest);
      });
    }
  }

  protected set<K extends keyof Draft>(key: K, value: Draft[K]) {
    this.draft.update((d) => ({ ...d, [key]: value }));
  }

  protected label(k: IngredientKey) {
    return INGREDIENTS[k].label;
  }

  protected num(v: string): number | null {
    return v === '' ? null : Number(v);
  }

  protected addLayer(k: IngredientKey) {
    this.set('layers', [...this.draft().layers, k]);
  }
  protected removeLayer(i: number) {
    this.set('layers', this.draft().layers.filter((_, j) => j !== i));
  }

  protected save() {
    const d = this.draft();
    const payload = {
      ...d,
      imageUrl: d.imageUrl || null,
      sourceNote: d.sourceNote || null,
      day: d.dateRuleType === 'fixed' ? d.day : null,
      weekday: d.dateRuleType === 'nth_weekday' ? d.weekday : null,
      weekOfMonth: d.dateRuleType === 'nth_weekday' ? d.weekOfMonth : null,
    };
    // Mismo esquema que valida la API: avisa antes de enviar.
    const parsed = createFoodDaySchema.safeParse(payload);
    if (!parsed.success) {
      this.errors.set(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
      this.message.set('Revisa los campos marcados.');
      return;
    }
    this.errors.set({});
    this.busy.set(true);
    const req = this.id ? this.api.updateFoodDay(this.id, parsed.data) : this.api.createFoodDay(parsed.data);
    req.subscribe({
      next: () => this.router.navigateByUrl('/admin'),
      error: (e: HttpErrorResponse) => this.fail(e),
    });
  }

  protected remove() {
    if (!this.id || !confirm('¿Borrar este día y todas sus fechas? No se puede deshacer.')) return;
    this.api.deleteFoodDay(this.id).subscribe({
      next: () => this.router.navigateByUrl('/admin'),
      error: (e: HttpErrorResponse) => this.fail(e),
    });
  }

  private fail(e: HttpErrorResponse) {
    this.busy.set(false);
    const body = (e.error as ApiErrorBody)?.error;
    this.errors.set(Object.fromEntries((body?.details ?? []).map((d) => [d.path, d.message])));
    this.message.set(body?.message ?? 'No se pudo guardar.');
  }
}
