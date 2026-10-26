import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Etiqueta de botón que rueda al pasar el cursor (dos copias apiladas). */
@Component({
  selector: 'cc-btn-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'btn__label' },
  template: `<span>{{ text() }}</span><span aria-hidden="true">{{ text() }}</span>`,
})
export class ButtonLabelComponent {
  readonly text = input.required<string>();
}
