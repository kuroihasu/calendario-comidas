import { DestroyRef, inject, signal, afterNextRender } from '@angular/core';
import { CHILE_TZ } from '@cc/contracts';

/**
 * Cuenta regresiva hasta las 00:00 (hora de Chile) de una fecha.
 * En el servidor muestra solo los días; en el navegador corre por segundo.
 */
export function countdown(date: () => string | undefined, initialDays: () => number) {
  const state = signal({ days: 0, hours: 0, minutes: 0, seconds: 0, live: false });
  const destroy = inject(DestroyRef);

  afterNextRender(() => {
    const tick = () => {
      const d = date();
      if (!d) return;
      const ms = chileMidnight(d) - Date.now();
      const s = Math.max(0, Math.floor(ms / 1000));
      state.set({ days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, live: true });
    };
    tick();
    const id = setInterval(tick, 1000);
    destroy.onDestroy(() => clearInterval(id));
  });

  return () => (state().live ? state() : { ...state(), days: initialDays() });
}

/** Momento UTC de las 00:00 en Santiago para una fecha 'YYYY-MM-DD'. */
function chileMidnight(date: string): number {
  const guess = Date.parse(`${date}T00:00:00Z`);
  const local = new Date(new Date(guess).toLocaleString('en-US', { timeZone: CHILE_TZ }));
  const utc = new Date(new Date(guess).toLocaleString('en-US', { timeZone: 'UTC' }));
  return guess + (utc.getTime() - local.getTime());
}
