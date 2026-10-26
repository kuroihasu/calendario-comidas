import { ChangeDetectionStrategy, Component, inject, RESPONSE_INIT } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ButtonLabelComponent } from '../../shared/button-label';
import { StackArtComponent } from '../../shared/stack-art.component';

@Component({
  selector: 'cc-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonLabelComponent, StackArtComponent],
  template: `
    <header class="lost wrap">
      <cc-stack-art [layers]="['pan', 'pan']" name="Un pan sin nada adentro" />
      <h1 class="display">Pan sin nada adentro</h1>
      <p>Esta página no existe. Vuelve al calendario y busca el día que quieres celebrar.</p>
      <a class="btn btn--tomate" routerLink="/"><cc-btn-label text="Ir al calendario" /></a>
    </header>
  `,
  styles: `
    .lost { min-height: 92svh; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; gap: 24px; padding-bottom: var(--section); padding-top: 140px; }
    h1 { font-size: var(--step-3); max-width: 10ch; }
    cc-stack-art { width: min(280px, 60vw); }
  `,
})
export class NotFoundPage {
  constructor() {
    const init = inject(RESPONSE_INIT, { optional: true });
    if (init) init.status = 404;
    inject(Title).setTitle('Página no encontrada | Calendario de Comidas');
  }
}
