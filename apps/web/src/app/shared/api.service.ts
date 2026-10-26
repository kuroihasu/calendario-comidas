import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AdminFoodDay, CalendarEntry, CalendarResponse, CreateFoodDayInput, FoodDayDetail, UpdateFoodDayInput } from '@cc/contracts';

/** URL relativa: en el servidor Angular la resuelve contra la petición, y el proxy la lleva a la API. */
export const API = '/api/v1';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  calendar(year: number) {
    return this.http.get<CalendarResponse>(`${API}/calendar`, { params: { year } });
  }

  upcoming(limit = 6) {
    return this.http.get<CalendarEntry[]>(`${API}/calendar/upcoming`, { params: { limit } });
  }

  foodDay(slug: string) {
    return this.http.get<FoodDayDetail>(`${API}/food-days/${encodeURIComponent(slug)}`);
  }

  /* Admin: la sesión viaja en una cookie httpOnly. */
  login(email: string, password: string) {
    return this.http.post<{ email: string; role: string }>(`${API}/admin/login`, { email, password });
  }
  logout() {
    return this.http.post<void>(`${API}/admin/logout`, {});
  }
  me() {
    return this.http.get<{ email: string; role: string }>(`${API}/admin/me`);
  }
  adminFoodDays() {
    return this.http.get<AdminFoodDay[]>(`${API}/admin/food-days`);
  }
  adminFoodDay(id: string) {
    return this.http.get<AdminFoodDay>(`${API}/admin/food-days/${id}`);
  }
  createFoodDay(body: CreateFoodDayInput) {
    return this.http.post<AdminFoodDay>(`${API}/admin/food-days`, body);
  }
  updateFoodDay(id: string, body: UpdateFoodDayInput) {
    return this.http.patch<AdminFoodDay>(`${API}/admin/food-days/${id}`, body);
  }
  deleteFoodDay(id: string) {
    return this.http.delete<void>(`${API}/admin/food-days/${id}`);
  }
}

export const icsUrl = (slug?: string) => (slug ? `${API}/food-days/${slug}.ics` : `${API}/calendar.ics`);
