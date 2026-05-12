import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../header/theme-toggle/data-access';

/**
 * Componente que representa el contenedor visual del menú lateral (`Sidebar`) de la aplicación.
 *
 * - Expone propiedades de entrada para configuración visual (`rounded`, `extraClass`).
 * - Se conecta al `SidebarService` para reaccionar a su estado (`collapsed`).
 * - Puede incluir grupos (`app-group`) e ítems (`app-item`) como contenido proyectado.
 */
@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styles: ``,
})
export class SidebarComponent {
  /** Clases CSS adicionales para estilización personalizada */
  extraClass = input<string>('');
  /** Controla si el sidebar tiene bordes redondeados */
  rounded = input<boolean>(false);

  constructor(readonly sidebarService: SidebarService) {}
}
