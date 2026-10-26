import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CalendarEntry, CATEGORY_LABELS, FOOD_CATEGORIES, FoodCategory, MONTHS_ES, parseIsoDate, WEEKDAYS_ES, isoWeekday } from '@cc/contracts';
import { StackArtComponent } from './stack-art.component';

interface MonthRow {
  month: number;
  name: string;
  entries: CalendarEntry[];
}

/**
 * La pizarra del año: los meses en filas, como la carta de una fuente de soda,
 * con la fecha donde iría el precio. Filtro por categoría y vista previa del dibujo.
 */
@Component({
  selector: 'cc-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StackArtComponent],
  template: `
    <div class="filters" role="group" aria-label="Filtrar por tipo">
      @for (f of filters; track f.value) {
        <button type="button" class="chip" [class.on]="filter() === f.value" [attr.aria-pressed]="filter() === f.value" (click)="filter.set(f.value)">
          {{ f.label }}
        </button>
      }
    </div>

    <div class="months" (pointermove)="follow($event)" (pointerleave)="preview.set(null)">
      @for (m of months(); track m.month) {
        <div class="month" data-reveal>
          <h3 class="month__name display">{{ m.name }}</h3>
          @if (m.entries.length) {
            <ul class="items">
              @for (e of m.entries; track e.slug) {
                <li>
                  <a class="item" [class.past]="e.date < today()" [class.today]="e.date === today()" [routerLink]="['/dia', e.slug]"
                     (pointerenter)="preview.set(e)" (focus)="preview.set(null)">
                    <span class="item__name">{{ e.name }}</span>
                    <span class="item__meta">
                      @if (!e.isConfirmed) { <span class="tbc">por confirmar</span> }
                      @if (e.date === today()) { <span class="tbc">hoy</span> }
                      <span class="item__date num">{{ weekday(e.date) }} {{ day(e.date) }}</span>
                    </span>
                  </a>
                </li>
              }
            </ul>
          } @else {
            <p class="empty">Sin días de comida este mes{{ filter() ? ' en ' + filterLabel() : '' }}.</p>
          }
        </div>
      }
    </div>

    <div class="preview" #previewEl aria-hidden="true" [class.show]="preview()">
      @if (preview(); as p) {
        <cc-stack-art [layers]="p.layers" [category]="p.category" />
      }
    </div>
  `,
  styleUrl: './board.component.scss',
})
export class BoardComponent {
  readonly entries = input.required<CalendarEntry[]>();
  readonly today = input.required<string>();

  protected readonly filter = signal<FoodCategory | null>(null);
  protected readonly preview = signal<CalendarEntry | null>(null);
  private readonly previewEl = viewChild<ElementRef<HTMLElement>>('previewEl');
  private readonly host = inject(ElementRef).nativeElement as HTMLElement;

  protected readonly filters = [
    { value: null, label: 'Todo' },
    ...FOOD_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
  ] as { value: FoodCategory | null; label: string }[];

  protected readonly filterLabel = computed(() => (this.filter() ? CATEGORY_LABELS[this.filter()!].toLowerCase() : ''));

  protected readonly months = computed<MonthRow[]>(() => {
    const f = this.filter();
    const rows = MONTHS_ES.map((name, i) => ({ month: i + 1, name, entries: [] as CalendarEntry[] }));
    for (const e of this.entries()) {
      if (f && e.category !== f) continue;
      rows[parseIsoDate(e.date).month - 1].entries.push(e);
    }
    return rows;
  });

  protected day = (d: string) => parseIsoDate(d).day;
  protected weekday = (d: string) => {
    const { year, month, day } = parseIsoDate(d);
    return WEEKDAYS_ES[isoWeekday(year, month, day) - 1].slice(0, 3);
  };

  protected follow(e: PointerEvent) {
    const el = this.previewEl()?.nativeElement;
    if (!el || e.pointerType !== 'mouse') return;
    const r = this.host.getBoundingClientRect();
    el.style.transform = `translate3d(${e.clientX - r.left + 28}px, ${e.clientY - r.top - 120}px, 0)`;
  }
}
