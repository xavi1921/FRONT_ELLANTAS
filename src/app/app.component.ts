import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';

/**
 * Componente raíz de la aplicación.
 *
 * - Encapsula el layout general y el punto de entrada de rutas (`<router-outlet>`).
 * - Inicializa comportamientos de la librería UI `Flowbite` en el ciclo de vida `ngOnInit`.
 * - Puede utilizarse como contenedor para menús, temas globales o navegación persistente.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  /** Título de la aplicación (puede usarse en encabezados, pestañas, etc.) */
  title = 'client';

  /**
   * Hook de inicialización del componente.
   *
   * - Ejecuta `initFlowbite()` para activar componentes como tooltips, dropdowns o modales de la librería Flowbite.
   */
  ngOnInit(): void {
    initFlowbite();
  }
}
