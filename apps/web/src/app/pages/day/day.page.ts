import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, RESPONSE_INIT, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { CATEGORY_LABELS, FoodDayDetail, formatLongDate } from '@cc/contracts';
import { ApiService, icsUrl } from '../../shared/api.service';
import { ButtonLabelComponent } from '../../shared/button-label';
import { countdown } from '../../shared/countdown';
import { MagneticDirective } from '../../shared/magnetic.directive';
import { MorphDirective } from '../../shared/morph.directive';
import { MotionService, revealWhenReady } from '../../shared/motion.service';
import { inkOn, signatureColor } from '../../shared/stack-art';
import { StackArtComponent } from '../../shared/stack-art.component';

type Load = { day: FoodDayDetail } | { missing: true } | { failed: true };

@Component({
  selector: 'cc-day',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StackArtComponent, ButtonLabelComponent, MagneticDirective, MorphDirective],
  templateUrl: './day.page.html',
  styleUrl: './day.page.scss',
})
export class DayPage {
  private readonly api = inject(ApiService);
  private readonly motion = inject(MotionService);
  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly responseInit = inject(RESPONSE_INIT, { optional: true });
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly load = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((p) => p.get('slug') ?? ''),
      switchMap((slug) =>
        this.api.foodDay(slug).pipe(
          map((day): Load => ({ day })),
          catchError((e: HttpErrorResponse) => of<Load>(e.status === 404 ? { missing: true } : { failed: true })),
        ),
      ),
      tap((r) => this.applyMeta(r)),
    ),
  );

  protected readonly day = computed(() => {
    const l = this.load();
    return l && 'day' in l ? l.day : null;
  });
  protected readonly missing = computed(() => {
    const l = this.load();
    return !!l && 'missing' in l;
  });
  protected readonly field = computed(() => signatureColor(this.day()?.layers ?? []));
  protected readonly fieldInk = computed(() => inkOn(this.field()));
  protected readonly clock = countdown(() => this.day()?.next.date, () => this.day()?.next.daysUntil ?? 0);
  protected readonly longDate = formatLongDate;
  protected readonly categoryLabel = (c: keyof typeof CATEGORY_LABELS) => CATEGORY_LABELS[c];
  protected readonly pad = (n: number) => String(n).padStart(2, '0');
  protected readonly words = (s: string) => s.split(' ');
  /** Largo de la palabra más larga: ajusta el titular para que ninguna palabra se salga. */
  protected readonly longest = (s: string) => Math.max(6, ...s.split(' ').map((w) => w.length));
  protected readonly ics = (slug: string) => icsUrl(slug);
  protected readonly copied = signal(false);

  constructor() {
    const destroy = inject(DestroyRef);
    // La barra de navegación toma la tinta del color del día.
    const root = inject(DOCUMENT).documentElement;
    effect(() => root.style.setProperty('--bar-ink', this.day() ? this.fieldInk() : 'var(--ink)'));
    destroy.onDestroy(() => {
      root.style.removeProperty('--bar-ink');
      this.anatomyTween?.scrollTrigger?.kill();
      this.anatomyTween?.kill();
    });
    revealWhenReady(() => this.load(), () => this.anatomy());
  }

  protected async share(d: FoodDayDetail) {
    const url = location.href;
    const text = `${d.name}: ${formatLongDate(d.next.date)}`;
    if (navigator.share) {
      await navigator.share({ title: d.name, text, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2200);
  }

  /** Al bajar, las capas del dibujo se separan y aparece el nombre de cada ingrediente. */
  private anatomyTween?: gsap.core.Tween;

  private async anatomy() {
    const art = this.host.querySelector<HTMLElement>('.anatomy cc-stack-art');
    if (!art) return;
    if (this.motion.reduced) {
      art.style.setProperty('--explode', '1');
      return;
    }
    const { gsap } = await this.motion.load();
    this.anatomyTween?.scrollTrigger?.kill();
    this.anatomyTween?.kill();
    this.anatomyTween = gsap.fromTo(
      art,
      { '--explode': 0 },
      {
        '--explode': 1,
        ease: 'none',
        scrollTrigger: { trigger: '.anatomy', start: 'top 75%', end: 'center 45%', scrub: 0.6 },
      },
    );
  }

  private applyMeta(r: Load) {
    if ('day' in r) {
      const d = r.day;
      this.title.setTitle(`${d.name} ${d.next.date.slice(0, 4)}: ${formatLongDate(d.next.date)} | Calendario de Comidas`);
      this.meta.updateTag({ name: 'description', content: `${d.name}: ${d.tagline} Este año cae el ${formatLongDate(d.next.date)}.` });
      this.meta.updateTag({ property: 'og:title', content: d.name });
      this.meta.updateTag({ property: 'og:description', content: d.tagline });
      return;
    }
    if (this.responseInit) this.responseInit.status = 'missing' in r ? 404 : 502;
    this.title.setTitle('Día no encontrado | Calendario de Comidas');
  }
}
