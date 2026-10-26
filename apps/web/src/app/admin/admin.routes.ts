import { inject } from '@angular/core';
import { Route, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ApiService } from '../shared/api.service';

const signedIn = () => {
  const router = inject(Router);
  return inject(ApiService)
    .me()
    .pipe(
      map(() => true),
      catchError(() => of(router.createUrlTree(['/admin/login']))),
    );
};

export const adminRoutes: Route[] = [
  { path: 'login', loadComponent: () => import('./login.page').then((m) => m.LoginPage) },
  {
    path: '',
    canActivate: [signedIn],
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', loadComponent: () => import('./food-days.page').then((m) => m.FoodDaysPage) },
      { path: 'dias/nuevo', loadComponent: () => import('./food-day-edit.page').then((m) => m.FoodDayEditPage) },
      { path: 'dias/:id', loadComponent: () => import('./food-day-edit.page').then((m) => m.FoodDayEditPage) },
    ],
  },
];
