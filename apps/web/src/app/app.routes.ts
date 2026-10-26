import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage) },
  { path: 'dia/:slug', loadComponent: () => import('./pages/day/day.page').then((m) => m.DayPage) },
  { path: 'calendario/:year', loadComponent: () => import('./pages/calendar/calendar.page').then((m) => m.CalendarPage) },
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage) },
];
