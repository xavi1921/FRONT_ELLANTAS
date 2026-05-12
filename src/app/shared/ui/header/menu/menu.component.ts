import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente visual reutilizable para construir menús contextuales o navegaciones flotantes.
 *
 * - Permite estilización externa a través de las propiedades de entrada:
 *   - `extraClass`: Clases CSS adicionales personalizadas.
 *   - `rounded`: Si el menú debe tener bordes redondeados.
 *   - `border`: Si el menú debe mostrar borde visible.
 *   - `fluid`: Si el menú debe ocupar todo el ancho disponible.
 *
 * - Este componente está preparado para funcionar con plantillas externas (`menu.component.html`)
 *   y puede extenderse con slots o proyecciones de contenido (`<ng-content>`).
 */
@Component({
  selector: 'app-menu',
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styles: ``,
})
export class MenuComponent {
  /** Clases CSS adicionales personalizadas */
  extraClass = input<string>('');
  /** Aplica bordes redondeados si es `true` */
  rounded = input<boolean>(false);
  /** Muestra borde si es `true` */
  border = input<boolean>(false);
  /** Expande el ancho del menú al contenedor si es `true` */
  fluid = input<boolean>(false);
}
