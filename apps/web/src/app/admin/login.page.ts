import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody, loginSchema } from '@cc/contracts';
import { ApiService } from '../shared/api.service';
import { ButtonLabelComponent } from '../shared/button-label';

@Component({
  selector: 'cc-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonLabelComponent],
  template: `
    <div class="panel narrow">
      <h1>Entrar al panel</h1>
      <form (ngSubmit)="submit()">
        <label>Correo <input type="email" name="email" autocomplete="username" [(ngModel)]="email" required /></label>
        <label>Contraseña <input type="password" name="password" autocomplete="current-password" [(ngModel)]="password" required /></label>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button class="btn btn--tomate" type="submit" [disabled]="busy()"><cc-btn-label text="Entrar" /></button>
      </form>
    </div>
  `,
  styleUrl: './admin.scss',
  styles: `.narrow { max-width: 460px; } form { justify-items: stretch; } button { justify-self: start; }`,
})
export class LoginPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected email = '';
  protected password = '';
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  submit() {
    const parsed = loginSchema.safeParse({ email: this.email, password: this.password });
    if (!parsed.success) {
      this.error.set('Revisa el correo y que la contraseña tenga al menos 8 caracteres.');
      return;
    }
    this.busy.set(true);
    this.api.login(parsed.data.email, parsed.data.password).subscribe({
      next: () => this.router.navigateByUrl('/admin'),
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set((e.error as ApiErrorBody)?.error?.message ?? 'No se pudo entrar.');
      },
    });
  }
}
