import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { parseIsoDate, todayInChile } from '@cc/contracts';
import { ButtonLabelComponent } from './shared/button-label';
import { icsUrl } from './shared/api.service';
import { MagneticDirective } from './shared/magnetic.directive';
import { MotionService } from './shared/motion.service';

@Component({
  selector: 'cc-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, ButtonLabelComponent, MagneticDirective],
  template: `
    <a class="skip" href="#contenido">Saltar al contenido</a>
    <nav class="bar wrap" aria-label="Principal">
      <a class="mark" routerLink="/" aria-label="Calendario de Comidas, inicio">
        <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="12" width="44" height="12" rx="6" fill="#D8954A"/><rect x="8" y="25" width="48" height="6" rx="3" fill="#F5EEDA"/><rect x="8" y="31" width="48" height="6" rx="3" fill="#7FA845"/><rect x="4" y="37" width="56" height="8" rx="4" fill="#C0503A"/><rect x="10" y="46" width="44" height="9" rx="4.5" fill="#D8954A"/></svg>
        <span>Calendario de Comidas</span>
      </a>
      <div class="links">
        <a class="link hide-sm" routerLink="/" fragment="lo-que-viene">Lo que viene</a>
        <a class="link" [routerLink]="['/calendario', year]">El año</a>
        <a class="link hide-sm" routerLink="/" fragment="tu-fecha">Tu fecha</a>
      </div>
      <a class="btn bar__cta" [href]="ics" ccMagnetic><cc-btn-label text="Suscribirme" /></a>
    </nav>

    <main id="contenido">
      <router-outlet />
    </main>

    <footer class="foot">
      <div class="foot__cols wrap">
        <p>
          Las fechas marcadas “por confirmar” no tienen una fuente oficial: las publican sangucherías, marcas o medios, y
          pueden moverse. Si sabes la fecha correcta, escríbenos.
        </p>
        <ul>
          <li><a class="link" routerLink="/">Inicio</a></li>
          <li><a class="link" [routerLink]="['/calendario', year]">Calendario {{ year }}</a></li>
          <li><a class="link" [routerLink]="['/calendario', year + 1]">Calendario {{ year + 1 }}</a></li>
          <li><a class="link" [href]="ics">Suscribirme al calendario (.ics)</a></li>
        </ul>
      </div>
      <p class="foot__word display" aria-hidden="true">Comidas</p>
    </footer>
  `,
  styleUrl: './app.scss',
})
export class App {
  protected readonly year = parseIsoDate(todayInChile()).year;
  protected readonly ics = icsUrl();

  constructor() {
    const motion = inject(MotionService);
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => motion.refresh().catch(() => undefined));
  }
}
