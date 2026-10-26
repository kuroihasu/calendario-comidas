import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { afterNextRender, DestroyRef, effect, ElementRef, inject, Injectable, Injector, PLATFORM_ID, untracked } from '@angular/core';
import type Lenis from 'lenis';

type Gsap = typeof import('gsap').gsap;

/**
 * Scroll suave (Lenis) y animaciones (GSAP + ScrollTrigger), solo en el navegador.
 * Con "reducir movimiento" no hay scroll suave ni desplazamientos; el contenido se ve igual.
 */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly doc = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private lenis?: Lenis;
  private loading?: Promise<{ gsap: Gsap; ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger }>;

  get reduced(): boolean {
    return !this.browser || this.doc.defaultView!.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  load() {
    if (!this.browser) return Promise.reject(new Error('server'));
    this.loading ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis')]).then(([g, st, l]) => {
      const gsap = g.gsap;
      const ScrollTrigger = st.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      if (!this.reduced) {
        this.lenis = new l.default({ lerp: 0.11, wheelMultiplier: 1 });
        this.lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((t) => this.lenis?.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
      }
      this.doc.documentElement.classList.add('js-ready');
      return { gsap, ScrollTrigger };
    });
    return this.loading;
  }

  /**
   * Recalcula los puntos de disparo. Al navegar, la página anterior sigue un momento
   * en el DOM (y la View Transition corre encima), así que se mide de nuevo después.
   */
  async refresh() {
    const { ScrollTrigger } = await this.load();
    for (const ms of [60, 450, 900]) setTimeout(() => ScrollTrigger.refresh(), ms);
  }

  scrollTo(target: number | string | HTMLElement, immediate = false) {
    if (this.lenis) this.lenis.scrollTo(target as never, { immediate, duration: 1.2 });
    else if (typeof target === 'number') this.doc.defaultView?.scrollTo({ top: target });
    else (typeof target === 'string' ? this.doc.querySelector(target) : target)?.scrollIntoView();
  }

  /**
   * Entrada por sección: cada [data-reveal] sube y aparece, escalonado, una sola vez.
   * Devuelve una función para limpiar al salir de la página.
   */
  async reveal(root: HTMLElement): Promise<() => void> {
    const { gsap, ScrollTrigger } = await this.load();
    const ctx = gsap.context(() => {
      const groups = new Map<Element, HTMLElement[]>();
      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        const section = el.closest('section, header, footer') ?? root;
        groups.set(section, [...(groups.get(section) ?? []), el]);
      });
      groups.forEach((els, section) => {
        if (this.reduced) {
          gsap.set(els, { opacity: 1, y: 0 });
          return;
        }
        gsap.to(els, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: section, start: 'top 82%', once: true },
        });
      });
      ScrollTrigger.refresh();
    }, root);
    return () => ctx.revert();
  }
}

/**
 * Activa las entradas de la página cuando su contenido ya está dibujado.
 * Al navegar, los datos llegan después del primer render; por eso se espera a `ready`.
 */
export function revealWhenReady(ready: () => unknown, after?: () => void) {
  const motion = inject(MotionService);
  const host = inject(ElementRef).nativeElement as HTMLElement;
  const injector = inject(Injector);
  let cleanup: (() => void) | undefined;
  inject(DestroyRef).onDestroy(() => cleanup?.());
  effect(() => {
    if (!ready()) return;
    untracked(() =>
      afterNextRender(
        async () => {
          cleanup?.();
          cleanup = await motion.reveal(host).catch(() => undefined);
          after?.();
        },
        { injector },
      ),
    );
  });
}
