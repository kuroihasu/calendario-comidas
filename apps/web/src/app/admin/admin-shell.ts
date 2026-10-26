import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ApiService } from '../shared/api.service';

@Component({
  selector: 'cc-admin-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="sub">
      <a routerLink="/admin" class="link">Días de comida</a>
      <button type="button" class="link out" (click)="logout()">Salir</button>
    </div>
    <router-outlet />
  `,
  styles: `
    .sub { position: absolute; top: 96px; left: 0; right: 0; display: flex; gap: 24px; padding-inline: var(--gutter); font-weight: 600; max-width: 1200px; margin-inline: auto; }
    .out { background: none; border: 0; padding: 0; cursor: pointer; margin-left: auto; }
    :host { display: block; position: relative; padding-top: 20px; }
  `,
})
export class AdminShell {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  logout() {
    this.api.logout().subscribe(() => this.router.navigateByUrl('/admin/login'));
  }
}
