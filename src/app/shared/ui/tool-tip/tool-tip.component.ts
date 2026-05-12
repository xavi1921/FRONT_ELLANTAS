import { Component, input } from '@angular/core';

/**
 * Componente visual reutilizable para mostrar mensajes tipo tooltip.
 *
 * - Controlado a través del input `message`.
 * - Diseñado para integrarse en formularios o íconos con ayuda contextual.
 * - Se espera que la lógica de visibilidad y posicionamiento esté definida en la plantilla (`tooltip.component.html`) o estilos externos.
 */
@Component({
  selector: 'app-tool-tip',
  imports: [],
  templateUrl: './tool-tip.component.html',
  styles: ``,
})
export class ToolTipComponent {
  /** Mensaje del tooltip que se mostrará al usuario */
  message = input<string>();
}
