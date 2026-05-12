import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'dark' | 'light';

/**
 * Servicio global encargado de gestionar el estado del tema visual de la aplicación.
 *
 * - Expone un `BehaviorSubject<Theme>` que representa el modo actual (`'light' | 'dark'`).
 * - Permite cambiar explícitamente el tema (`setTheme(...)`) o alternarlo (`toggleTheme()`).
 * - Ideal para consumir desde componentes como `ThemeToggleComponent`, sidebars o layouts.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  /** Estado actual del tema visual ('light' o 'dark') */
  theme = new BehaviorSubject<Theme>('light');

  /**
   * Establece el tema visual de forma explícita.
   *
   * @param theme - Modo deseado: `'light'` o `'dark'`.
   */
  setTheme(theme: Theme) {
    this.theme.next(theme);
  }

  /**
   * Alterna el tema visual entre `'dark'` y `'light'`.
   *
   * - Se basa en el valor actual del `BehaviorSubject`.
   */
  toggleTheme() {
    const theme = this.theme.getValue();
    this.setTheme(theme === 'dark' ? 'light' : 'dark');
  }
}
