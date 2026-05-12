import { Component, input, output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ToolTipComponent } from '../../../../../../../shared/ui/tool-tip/tool-tip.component';
import { CommonModule } from '@angular/common';

/**
 * Estructura que representa los totales monetarios de una orden o formulario.
 *
 * - `total_mo`: Total correspondiente a mano de obra (MO).
 * - `total_r`: Total correspondiente a repuestos.
 * - `subTotal`: Suma parcial de todos los conceptos antes de aplicar impuestos o descuentos.
 * - `total`: Monto final total después de ajustes (subTotal +/- ajustes).
 */

type totals = {
  total_mo: number;
  total_r: number;
  subTotal: number;
  total: number;
};
@Component({
  selector: 'app-rep-extra',
  imports: [ReactiveFormsModule, FormsModule, CommonModule, ToolTipComponent],
  templateUrl: './rep-extra.component.html',
})

/**
 * Componente encargado de gestionar repuestos adicionales en un formulario dinámico.
 *
 * Inputs:
 * - `form`: Formulario principal (`FormGroup`) asociado a los datos de repuestos.
 * - `partsArray`: Arreglo reactivo (`FormArray`) que contiene las entradas de repuestos.
 * - `totals`: Objeto con información de totales calculados o acumulados (`subtotal`, `impuestos`, etc.).
 *
 * Outputs:
 * - `newArray`: Emite el arreglo actualizado de repuestos (por ejemplo, al añadir uno nuevo).
 * - `deleteArray`: Emite el índice del repuesto eliminado.
 * - `incr`: Emite el índice de una entrada cuya cantidad fue incrementada.
 * - `decr`: Emite el índice de una entrada cuya cantidad fue decrementada.
 * - `price`: Emite información de precio para sincronizar con el componente padre.
 * - `pushIncrement`: Emite un índice o valor relacionado a un aumento explícito de cantidad o unidades.
 */
export class RepExtraComponent {
  form = input<FormGroup | null>(null);
  partsArray = input<FormArray | null>(null);
  totals = input<totals>();
  readonly=input<boolean>(false)
  newArray = output<any>();
  deleteArray = output<number>();
  incr = output<number>();
  decr = output<number>();
  price = output<object>({});
  pushIncrement = output<number>();

  /**
   * Emite un evento `newArray` con la cadena `'add'` para notificar al componente padre
   * que debe agregar una nueva entrada (por ejemplo, un repuesto adicional).
   *
   * Este patrón permite delegar la lógica de construcción del nuevo objeto al componente contenedor.
   */
  add() {
    this.newArray.emit('add');
  }

  /**
   * Elimina un control de repuesto específico del `FormArray` `partsArray`.
   *
   * - Verifica si el arreglo `partsArray` está definido.
   * - Obtiene el índice del `AbstractControl` especificado.
   * - Si el índice es válido, emite el evento `deleteArray` con ese índice.
   *
   * Esta lógica permite que el componente padre controle la eliminación,
   * manteniendo el flujo unidireccional y la sincronización de estado visual.
   *
   * @param {AbstractControl} item - Control del repuesto que se desea eliminar.
   */

  delete(item: AbstractControl) {
    const parts = this.partsArray();
    if (!parts) return;

    const index = parts.controls.indexOf(item);
    if (index !== -1) {
      this.deleteArray.emit(index);
    }
  }
  /**
   * Emite el índice de una entrada en `partsArray` cuyo valor debe ser incrementado.
   *
   * - El evento `incr` permite que el componente padre maneje la lógica asociada
   *   (por ejemplo, aumentar la cantidad de un repuesto).
   *
   * @param {number} index - Índice del repuesto que se desea incrementar.
   */

  increment(index: number) {
    this.incr.emit(index);
  }

  /**
   * Emite el índice de una entrada en `partsArray` cuya cantidad debe ser decrementada.
   *
   * - El evento `decr` informa al componente padre que debe reducir la cantidad del repuesto en la posición indicada.
   *
   * @param {number} index - Índice de la entrada que será decrementada.
   */

  decrement(index: number) {
    this.decr.emit(index);
  }

  /**
   * Emite el índice de una entrada del `partsArray` para indicar un aumento especial o condicionado.
   *
   * - El evento `pushIncrement` puede ser utilizado para manejar aumentos que dependen de condiciones
   *   específicas, por ejemplo: sumar en bloques, activar descuentos escalonados, o manipular un contador visual.
   *
   * @param {number} index - Índice del elemento afectado por la acción.
   */

  toggleIncrease(index: number) {
    this.pushIncrement.emit(index);
  }
}
