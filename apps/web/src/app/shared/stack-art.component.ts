import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FoodCategory, IngredientKey } from '@cc/contracts';
import { buildArt } from './stack-art';

let uid = 0;

@Component({
  selector: 'cc-stack-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[class.with-labels]': 'labels()',
  },
  template: `
    <svg [attr.viewBox]="viewBox()" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      @if (art().clip) {
        <defs>
          <clipPath [attr.id]="clipId"><path [attr.d]="art().clip" /></clipPath>
        </defs>
      }
      @for (s of art().base; track $index) {
        <ng-container [ngTemplateOutlet]="shape" [ngTemplateOutletContext]="{ $implicit: s }" />
      }
      <g [attr.clip-path]="art().clip ? 'url(#' + clipId + ')' : null">
        @for (l of art().layers; track $index) {
          <g class="layer" [style.--o]="l.offset">
            @for (s of l.shapes; track $index) {
              <ng-container [ngTemplateOutlet]="shape" [ngTemplateOutletContext]="{ $implicit: s }" />
            }
          </g>
        }
      </g>
      @if (labels()) {
        @for (l of art().layers; track $index) {
          <text class="tag" [attr.x]="art().width + 28" [attr.y]="l.cy + 7" [style.--o]="l.offset">{{ l.label }}</text>
        }
      }
      <ng-template #shape let-s>
        @switch (s.type) {
          @case ('path') { <path [attr.d]="s.d" [attr.fill]="s.fill" /> }
          @case ('rect') { <rect [attr.x]="s.x" [attr.y]="s.y" [attr.width]="s.w" [attr.height]="s.h" [attr.rx]="s.r" [attr.fill]="s.fill" /> }
          @case ('circle') { <circle [attr.cx]="s.cx" [attr.cy]="s.cy" [attr.r]="s.r" [attr.fill]="s.fill" /> }
          @case ('ellipse') { <ellipse [attr.cx]="s.cx" [attr.cy]="s.cy" [attr.rx]="s.rx" [attr.ry]="s.ry" [attr.fill]="s.fill" /> }
        }
      </ng-template>
    </svg>
  `,
  styles: `
    :host {
      display: block;
      --explode: 0;
      --gap: 26px;
    }
    svg {
      width: 100%;
      height: auto;
      overflow: visible;
    }
    .layer {
      transform: translateY(calc(var(--explode) * var(--o) * var(--gap)));
    }
    .tag {
      font: 600 22px/1 var(--font);
      fill: currentColor;
      opacity: var(--explode);
      transform: translateY(calc(var(--explode) * var(--o) * var(--gap)));
    }
  `,
  imports: [NgTemplateOutlet],
})
export class StackArtComponent {
  readonly layers = input.required<IngredientKey[]>();
  readonly category = input<FoodCategory>('sandwich');
  readonly name = input('');
  readonly labels = input(false);

  protected readonly clipId = `stack-clip-${uid++}`;
  protected readonly art = computed(() => buildArt(this.layers(), this.category()));
  protected readonly viewBox = computed(() => {
    const a = this.art();
    // Con etiquetas se agrega espacio a la derecha; arriba y abajo, aire para separar capas.
    const extraW = this.labels() ? 230 : 0;
    const pad = this.labels() ? 90 : 0;
    return `-30 ${-pad} ${a.width + 60 + extraW} ${a.height + pad * 2}`;
  });
  protected readonly label = computed(() => (this.name() ? `Ilustración: ${this.name()}` : 'Ilustración'));
}
