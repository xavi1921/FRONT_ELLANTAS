import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ThemeService } from './data-access';

/**
 * Componente encargado de sincronizar y aplicar el tema visual (`light` o `dark`) en la aplicación.
 *
 * - Detecta el tema preferido del usuario desde `localStorage` o `matchMedia`.
 * - Aplica la clase `dark` al elemento raíz del DOM (`<html>`) si corresponde.
 * - Se suscribe al servicio `ThemeService` para actualizar dinámicamente el tema.
 * - Asegura limpieza reactiva mediante `ngOnDestroy()`.
 */
@Component({
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.component.html',
  styles: ``,
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  /** Suscripción al tema reactivo del `ThemeService` */
  private themeSubscription: Subscription | undefined = undefined;
  constructor(readonly themeService: ThemeService) {}

  /**
   * Inicializa el tema visual al arrancar el componente.
   *
   * - Consulta `localStorage` para respetar el tema previamente seleccionado.
   * - Si no hay preferencia, consulta `matchMedia('(prefers-color-scheme: dark)')`.
   * - Aplica visualmente la clase `dark` y actualiza el `ThemeService`.
   * - Se suscribe a cambios dinámicos para mantener sincronía visual y persistir estado.
   */
  ngOnInit(): void {
    if (
      localStorage.getItem('color-theme') === 'dark' ||
      (!('color-theme' in localStorage) &&
        'matchMedia' in window &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      this.themeService.setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      this.themeService.setTheme('light');
      document.documentElement.classList.remove('dark');
    }

    this.themeSubscription = this.themeService.theme
      .asObservable()
      .subscribe((theme) => {
        localStorage.setItem('color-theme', theme);
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      });
  }

  /**
   * Limpia la suscripción al observable del tema al destruir el componente.
   */
  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }
}
