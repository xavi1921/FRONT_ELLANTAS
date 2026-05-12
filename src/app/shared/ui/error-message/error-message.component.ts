import { Component, input } from '@angular/core';

/**
 * Componente visual reutilizable para mostrar mensajes de error en formularios o secciones de UI.
 *
 * - Expone una entrada (`message`) que contiene el texto del error a mostrar.
 * - Está diseñado para ser embebido directamente donde se requiera retroalimentación visual.
 * - Usa el selector `app-error-message` y espera una plantilla HTML asociada (`error-message.component.html`).
 */
@Component({
  selector: 'app-error-message',
  imports: [],
  templateUrl: './error-message.component.html',
  styles: ``,
})
export class ErrorMessageComponent {
  /** Mensaje de error a mostrar */
  message = input<string>('');
}
