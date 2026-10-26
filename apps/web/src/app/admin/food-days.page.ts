import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CATEGORY_LABELS } from '@cc/contracts';
import { ApiService } from '../shared/api.service';
import { ButtonLabelComponent } from '../shared/button-label';

@Component({
  selector: 'cc-admin-food-days',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonLabelComponent],
  template: `
    <div class="panel">
      <div class="row">
        <h1>Días de comida</h1>
        <a class="btn btn--tomate" routerLink="/admin/dias/nuevo"><cc-btn-label text="Nuevo día" /></a>
      </div>
      @if (days(); as list) {
        <table>
          <thead><tr><th>Nombre</th><th>Fecha</th><th>Tipo</th><th>Estado</th></tr></thead>
          <tbody>
            @for (d of list; track d.id) {
              <tr>
                <td><a [routerLink]="['/admin/dias', d.id]">{{ d.name }}</a><div class="muted">/dia/{{ d.slug }}</div></td>
                <td>{{ d.ruleLabel }}</td>
                <td>{{ labels[d.category] }}</td>
                <td><span class="pill" [class.off]="!d.isActive">{{ d.isActive ? 'Visible' : 'Oculto' }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <p class="muted">Cargando…</p>
      }
    </div>
  `,
  styleUrl: './admin.scss',
})
export class FoodDaysPage {
  protected readonly labels = CATEGORY_LABELS;
  protected readonly days = toSignal(inject(ApiService).adminFoodDays());
}
