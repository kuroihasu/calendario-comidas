import { Directive, ElementRef, inject, input } from '@angular/core';

/**
 * Marca el dibujo de un día justo antes de navegar, para que la View Transition
 * lo lleve hasta la cabecera de la página del día. Solo uno por página lleva el nombre.
 */
@Directive({
  selector: '[ccMorph]',
  host: { '(click)': 'mark()' },
})
export class MorphDirective {
  readonly ccMorph = input.required<string>();
  private readonly el = inject(ElementRef).nativeElement as HTMLElement;

  mark() {
    // Un nombre de transición solo puede estar una vez en la página.
    document.querySelectorAll<HTMLElement>('[data-morph-active], [style*="view-transition-name"]').forEach((n) => {
      n.style.viewTransitionName = '';
      delete n.dataset['morphActive'];
    });
    const art = this.el.querySelector<HTMLElement>('cc-stack-art');
    const title = this.el.querySelector<HTMLElement>('[data-morph-title]');
    for (const [node, name] of [[art, 'stack'], [title, 'day-title']] as const) {
      if (!node) continue;
      node.style.viewTransitionName = name;
      node.dataset['morphActive'] = '';
    }
  }
}
