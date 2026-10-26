import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // El admin no necesita SEO: se dibuja en el navegador.
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  // Lo público se renderiza en el servidor en cada visita (cuenta regresiva y fechas al día).
  { path: '**', renderMode: RenderMode.Server },
];
