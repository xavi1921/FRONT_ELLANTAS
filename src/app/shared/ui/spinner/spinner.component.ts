import { Component, input } from '@angular/core';

/**
 * Componente visual reutilizable para mostrar un indicador de carga (`spinner`).
 *
 * - Controlado mediante el input `load` para encender o apagar su visibilidad.
 * - Ideal para mostrar durante operaciones asíncronas: peticiones HTTP, validaciones, etc.
 * - Se espera que `templateUrl` contenga lógica condicional (`*ngIf="load"`) y animación visual.
 */
@Component({
  selector: 'app-spinner',
  imports: [],
  templateUrl: './spinner.component.html',
  styles: ``,
})
export class SpinnerComponent {
  /** Controla si el spinner debe estar visible (`true`) o no (`false`) */
  load = input<boolean>(false);
}
