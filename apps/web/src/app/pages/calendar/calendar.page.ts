import { ChangeDetectionStrategy, Component, computed, inject, RESPONSE_INIT } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { catchError, map, of, switchMap } from 'rxjs';
import { CalendarResponse, todayInChile } from '@cc/contracts';
import { ApiService, icsUrl } from '../../shared/api.service';
import { BoardComponent } from '../../shared/board.component';
import { ButtonLabelComponent } from '../../shared/button-label';
import { revealWhenReady } from '../../shared/motion.service';

@Component({
  selector: 'cc-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, BoardComponent, ButtonLabelComponent],
  template: `
    <header class="top wrap">
      <h1 class="display">Calendario {{ year() }}</h1>
      <div class="top__side">
        <p>{{ count() }} días de comida en Chile, de enero a diciembre. Suscríbete y aparecen solos en tu calendario.</p>
        <div class="years">
          <a class="btn btn--ghost" [routerLink]="['/calendario', year() - 1]"><cc-btn-label [text]="'← ' + (year() - 1)" /></a>
          <a class="btn btn--ghost" [routerLink]="['/calendario', year() + 1]"><cc-btn-label [text]="year() + 1 + ' →'" /></a>
          <a class="btn btn--tomate" [href]="ics"><cc-btn-label text="Suscribirme" /></a>
        </div>
      </div>
    </header>
    <section class="board-wrap" aria-label="Días del año">
      <div class="wrap">
        @if (data(); as c) {
          <cc-board [entries]="c.entries" [today]="today" />
        } @else if (data() === null) {
          <p>No pudimos cargar el calendario. Intenta de nuevo en un momento.</p>
        }
      </div>
    </section>
  `,
  styles: `
    .top {
      display: grid;
      grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
      gap: var(--gutter);
      align-items: end;
      padding-top: 160px;
      padding-bottom: clamp(48px, 6vw, 96px);
      h1 { font-size: var(--step-4); }
    }
    .top__side { display: grid; gap: 24px; p { max-width: 40ch; font-size: var(--step-1); line-height: 1.4; } }
    .years { display: flex; flex-wrap: wrap; gap: 10px; }
    .board-wrap { background: var(--pizarra); color: var(--tiza); padding-block: var(--section); }
    @media (max-width: 900px) { .top { grid-template-columns: 1fr; padding-top: 120px; } }
  `,
})
export class CalendarPage {
  private readonly api = inject(ApiService);
  private readonly responseInit = inject(RESPONSE_INIT, { optional: true });
  private readonly title = inject(Title);
  protected readonly today = todayInChile();
  protected readonly ics = icsUrl();

  protected readonly year = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((p) => Number(p.get('year')))),
    { initialValue: Number(todayInChile().slice(0, 4)) },
  );

  protected readonly data = toSignal<CalendarResponse | null | undefined>(
    inject(ActivatedRoute).paramMap.pipe(
      map((p) => Number(p.get('year'))),
      switchMap((y) => {
        if (!Number.isInteger(y) || y < 2020 || y > 2100) {
          if (this.responseInit) this.responseInit.status = 404;
          return of(null);
        }
        this.title.setTitle(`Calendario de comidas ${y} en Chile | Días de comida mes a mes`);
        return this.api.calendar(y).pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: undefined },
  );

  protected readonly count = computed(() => this.data()?.entries.length ?? 0);

  constructor() {
    revealWhenReady(() => this.data());
  }
}
