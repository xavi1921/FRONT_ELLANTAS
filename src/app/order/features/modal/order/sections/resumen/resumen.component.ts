import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
type totals = {
  total_mo: number;
  total_r: number;
  subTotal: number;
  total: number;
};
@Component({
  selector: 'app-resumen',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './resumen.component.html',
  styles: ``,
})

/**
 * Componente de resumen que recibe un formulario (`FormGroup`) y un objeto de totales.
 *
 * - `form`: Input que representa el `FormGroup` asociado a los datos visualizados o resumidos.
 * - `totals`: Input que contiene los valores agregados, `subtotal`, `total`, `abono`, etc.
 *
 * Este componente se enfoca en mostrar datos ya construidos y no se responsabiliza de la lógica de entrada.
 */
export class ResumenComponent {
  form = input<FormGroup | null>(null);
  totals = input<totals>();
  readonly = input<boolean>(false);
}
