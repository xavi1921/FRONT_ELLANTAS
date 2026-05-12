import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Componente visual que representa una ruta breadcrumb dinámica basada en la URL actual.
 *
 * - Se suscribe a los cambios de navegación para reconstruir los segmentos (`segments`) en cada cambio de ruta.
 * - Expone la utilidad `getPathForSegment(...)` para armar enlaces parciales acumulativos tipo `/modulo/seccion/actual`.
 */
@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.component.html',
  styles: ``,
})
export class BreadcrumbComponent implements OnInit {
  /** Segmentos de la ruta actual, divididos por `/` */
  segments: string[] = [];
  constructor(private router: Router) {}

  /**
   * Hook de inicialización del componente.
   *
   * - Obtiene los segmentos iniciales.
   * - Inicia la escucha de eventos de navegación.
   */
  ngOnInit() {
    this.getUrlSegments();
    this.listenEventRoute();
  }

  /**
   * Divide la URL actual en segmentos no vacíos.
   *
   * - Actualiza `segments` para renderizar los breadcrumbs.
   */
  getUrlSegments() {
    //se almacena en segments la ruta actual dividido por / y elimina los espacios en blanco con filter
    this.segments = this.router.url.split('/').filter(Boolean);
  }

  /**
   * Se suscribe a cambios de navegación para mantener sincronizado el breadcrumb.
   *
   * - Escucha eventos `NavigationEnd` y actualiza `segments`.
   */
  listenEventRoute() {
    //escucha si se dan cambios en la ruta para obtener los nuevos segmenos por ruta
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.getUrlSegments();
      });
  }

  /**
   * Construye la ruta acumulativa parcial hasta el índice dado.
   *
   * - Útil para enlazar cada nivel del breadcrumb correctamente.
   *
   * @param index - Índice del segmento actual.
   * @returns Ruta parcial acumulada desde el inicio hasta dicho segmento.
   */
  getPathForSegment(index: number): string {
    return '/' + this.segments.slice(0, index + 1).join('/');
  }
}
