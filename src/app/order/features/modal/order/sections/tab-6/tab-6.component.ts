import { Component, input } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-tab-6',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './tab-6.component.html',
  styles: ``,
})

/**
 * Componente de anexo (Tab6) que permite capturar información administrativa
 * y adicional relacionada con el retiro del vehículo u operaciones complementarias.
 *
 * - Recibe un `FormGroup` reactivo como `input`, que contiene los campos del anexo.
 * - Se espera que el formulario incluya controles como:
 *    - `retirado_por`: Persona que retira el vehículo.
 *    - `creado_por`: Usuario que genera el parte.
 *
 * Este componente funciona como un paso final para validar contexto administrativo
 * antes de emitir el parte definitivo.
 */
export class Tab6Component {
  form = input<FormGroup | null>(null);
}
