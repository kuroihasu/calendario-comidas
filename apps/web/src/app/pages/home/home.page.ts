import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { catchError, of } from 'rxjs';
import { daysBetween, daysInMonth, formatLongDate, MONTHS_ES, parseIsoDate, todayInChile, toIsoDate } from '@cc/contracts';
import { ApiService, icsUrl } from '../../shared/api.service';
import { BoardComponent } from '../../shared/board.component';
import { ButtonLabelComponent } from '../../shared/button-label';
import { countdown } from '../../shared/countdown';
import { MagneticDirective } from '../../shared/magnetic.directive';
import { MorphDirective } from '../../shared/morph.directive';
import { MotionService, revealWhenReady } from '../../shared/motion.service';
import { StackArtComponent } from '../../shared/stack-art.component';

@Component({
  selector: 'cc-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StackArtComponent, BoardComponent, ButtonLabelComponent, MagneticDirective, MorphDirective],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly api = inject(ApiService);
  private readonly motion = inject(MotionService);
  private readonly host = inject(ElementRef).nativeElement as HTMLElement;

  protected readonly today = todayInChile();
  protected readonly year = parseIsoDate(this.today).year;
  protected readonly ics = icsUrl();

  protected readonly upcoming = toSignal(this.api.upcoming(7).pipe(catchError(() => of([]))), { initialValue: [] });
  protected readonly calendar = toSignal(this.api.calendar(this.year).pipe(catchError(() => of(null))), { initialValue: null });

  protected readonly next = computed(() => this.upcoming()[0]);
  protected readonly rail = computed(() => this.upcoming().slice(1));
  protected readonly nextDays = computed(() => (this.next() ? daysBetween(this.today, this.next()!.date) : 0));
  protected readonly clock = countdown(() => this.next()?.date, this.nextDays);
  protected readonly longDate = formatLongDate;
  protected readonly pad = (n: number) => String(n).padStart(2, '0');
  protected readonly words = (s: string) => s.split(' ');
  /** Largo de la palabra más larga: ajusta el titular para que ninguna palabra se salga. */
  protected readonly longest = (s: string) => Math.max(6, ...s.split(' ').map((w) => w.length));

  /* Tu fecha: el día de comida más cercano a un día y mes cualquiera. */
  protected readonly months = MONTHS_ES;
  protected readonly pickMonth = signal(parseIsoDate(this.today).month);
  protected readonly pickDay = signal(parseIsoDate(this.today).day);
  protected readonly dayOptions = computed(() => Array.from({ length: daysInMonth(2026, this.pickMonth()) }, (_, i) => i + 1));
  protected readonly match = computed(() => {
    const entries = this.calendar()?.entries ?? [];
    if (!entries.length) return null;
    const picked = toIsoDate(2026, this.pickMonth(), Math.min(this.pickDay(), daysInMonth(2026, this.pickMonth())));
    let best: { entry: (typeof entries)[number]; diff: number } | null = null;
    for (const e of entries) {
      const { month, day } = parseIsoDate(e.date);
      // Distancia hacia adelante en un ciclo anual, sin importar el año.
      let diff = daysBetween(picked, toIsoDate(2026, month, day));
      if (diff < 0) diff += 365;
      if (!best || diff < best.diff) best = { entry: e, diff };
    }
    return best;
  });

  constructor() {
    const title = inject(Title);
    const meta = inject(Meta);
    title.setTitle('Calendario de Comidas de Chile: Día del Completo, del Churrasco y más');
    meta.updateTag({
      name: 'description',
      content: 'Todos los días de comida que se celebran en Chile, mes a mes: Día del Completo, del Chacarero, del Churrasco, de la Sopaipilla y más, con cuenta regresiva.',
    });

    revealWhenReady(() => this.calendar() && this.next(), () => this.heroMotion());
    inject(DestroyRef).onDestroy(() => this.heroCtx?.revert());
  }

  protected setMonth(v: string) {
    this.pickMonth.set(Number(v));
  }
  protected setDay(v: string) {
    this.pickDay.set(Number(v));
  }

  protected scrollRail(dir: 1 | -1, rail: HTMLElement) {
    rail.scrollBy({ left: dir * rail.clientWidth * 0.8, behavior: this.motion.reduced ? 'auto' : 'smooth' });
  }

  /** El plato del hero entra girando y el dibujo baja al plato; al hacer scroll, el plato se aleja. */
  private async heroMotion() {
    if (this.motion.reduced) return;
    const { gsap } = await this.motion.load();
    this.heroCtx?.revert();
    this.heroCtx = gsap.context(() => this.heroTweens(gsap));
  }

  private heroCtx?: gsap.Context;

  private heroTweens(gsap: typeof import('gsap').gsap) {
    const plate = this.host.querySelector('.hero__plate');
    const art = this.host.querySelector('.hero__art');
    const words = this.host.querySelectorAll('.hero h1 .w');
    gsap.from(words, { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.07 });
    gsap.from(plate, { scale: 0.4, rotate: -40, opacity: 0, duration: 1.3, ease: 'expo.out', delay: 0.1 });
    gsap.to(plate, { yPercent: 18, rotate: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    // Se anima el svg interno: el contenedor tiene su propia transición CSS al pasar el cursor.
    const svg = art?.querySelector('svg');
    if (!svg) return;
    gsap
      .timeline({ delay: 0.45 })
      .from(svg, { y: -160, opacity: 0, duration: 1.1, ease: 'bounce.out' })
      .to(svg, { y: -12, rotate: -1.5, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }
}
