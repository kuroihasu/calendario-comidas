import { Directive, ElementRef, inject, NgZone, OnDestroy, afterNextRender } from '@angular/core';

/** El botón se acerca un poco al cursor (solo con mouse y sin "reducir movimiento"). */
@Directive({ selector: '[ccMagnetic]' })
export class MagneticDirective implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private off?: () => void;

  constructor() {
    const zone = inject(NgZone);
    afterNextRender(() => {
      const fine = matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!fine) return;
      zone.runOutsideAngular(() => {
        const move = (e: PointerEvent) => {
          const r = this.el.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * 0.25;
          const y = (e.clientY - r.top - r.height / 2) * 0.35;
          this.el.style.translate = `${x}px ${y}px`;
        };
        const leave = () => (this.el.style.translate = '0 0');
        this.el.style.transition += ', translate 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
        this.el.addEventListener('pointermove', move);
        this.el.addEventListener('pointerleave', leave);
        this.off = () => {
          this.el.removeEventListener('pointermove', move);
          this.el.removeEventListener('pointerleave', leave);
        };
      });
    });
  }

  ngOnDestroy() {
    this.off?.();
  }
}
