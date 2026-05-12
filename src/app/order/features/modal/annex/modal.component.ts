import { Component, effect, input, output } from '@angular/core';
import { Annex, Order } from '../../order-list/ordern.model';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToolTipComponent } from '../../../../shared/ui/tool-tip/tool-tip.component';
import { ValidateService } from '../../../../core/validation/validation.service';

@Component({
  selector: 'app-modal-retiro',
  imports: [CommonModule, ReactiveFormsModule, ToolTipComponent, FormsModule],
  templateUrl: './modal.component.html',
  styles: ``,
})
export class AnnexComponent {
  isOpen = input<boolean>(false);
  closeModal = output<void>();
  order = input<Order | null>();
  save = output<Annex>();
  annex: FormGroup;
  selectedType: string = 'DNI'; // valor por defecto
  constructor(
    private fb: FormBuilder,
    private validateService: ValidateService
  ) {
    this.annex = this.fb.group({
      _id: ['', Validators.required],
      delegate: ['', [Validators.required]],
      number_identification: [
        '',
        [Validators.required, this.validateCedula.bind(this)],
      ],
    });

    effect(() => {
      this.updateForm();
    });
  }
  formReset() {
    this.annex.reset();
  }
  onClose() {
    this.formReset();
    this.closeModal.emit();
  }

  /**
   * Actualiza el formulario `annex` con datos de la orden actual, si está disponible.
   *
   * - Verifica si `this.order()` retorna una orden válida.
   * - Si existe, usa `patchValue()` para inyectar el `_id` en el formulario.
   * - Esto permite reutilizar el formulario tanto para creación como para edición.
   */

  updateForm() {
    if (this.order()) {
      this.annex.patchValue({
        _id: this.order()?._id,
      });
    }
  }

  /**
   * Manejador de envío del formulario (`annex`).
   *
   * - Verifica si el formulario es válido (`this.annex.valid`).
   * - Si lo es, clona el valor del formulario (`this.annex.value`) en `data`.
   * - Emite el evento `save` con los datos del formulario.
   * - Cierra el diálogo, modal o componente mediante `onClose()`.
   */

  onSubmit() {
    if (this.annex.valid) {
      const data = { ...this.annex.value };
      this.save.emit(data);
      this.onClose();
    }
  }

  /**
   * Ajusta dinámicamente los validadores del campo `number_identification` según el tipo seleccionado.
   *
   * - Si el tipo es `'DNI'`, aplica validación de cédula (`validateCedula`).
   * - En cualquier otro caso (por ejemplo `'RUC'`), aplica validación jurídica (`validateRuc`).
   * - Asegura que `Validators.required` esté siempre presente.
   * - Llama a `updateValueAndValidity()` para que el formulario reactive los cambios.
   *
   * Este método está pensado para invocarse en respuesta a cambios de selección (`onTypeChange()`).
   */

  typeIdentification() {
    const identificacion = this.annex.get('number_identification');
    if (this.selectedType === 'DNI') {
      identificacion?.setValidators([
        Validators.required,
        this.validateCedula.bind(this),
      ]);
    } else {
      identificacion?.setValidators([
        Validators.required,
        this.validateRuc.bind(this),
      ]);
    }
    identificacion?.updateValueAndValidity();
  }

  /**
   * Manejador para cambios en el tipo de identificación.
   *
   * - Llama al método `typeIdentification()` para ajustar la lógica o validación
   *   asociada al nuevo tipo seleccionado.
   * - Generalmente vinculado a eventos de cambio (`change`) en campos select/dropdown.
   */

  onTypeChange() {
    this.typeIdentification();
  }

  /**
   * Validador personalizado para formularios reactivos que verifica si una cédula ecuatoriana es válida.
   *
   * - Si el valor está vacío (`null`, `undefined`, `''`), retorna `{ invalidCedula: true }`.
   * - Usa `validateService.validateCedula()` para validar la estructura y lógica del número.
   * - Si la validación es exitosa, retorna `null`; de lo contrario, un objeto de error.
   *
   * @param {AbstractControl} control - Control del formulario que contiene el valor a validar.
   * @returns {{ [key: string]: any } | null} Objeto de error si la cédula es inválida, o `null` si es válida.
   */

  validateCedula(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value;

    if (!value) {
      return { invalidCedula: true };
    }

    return this.validateService.validateCedula(value)
      ? null
      : { invalidCedula: true };
  }

  /**
   * Validador personalizado para formularios reactivos que verifica si un RUC jurídico es válido.
   *
   * - Retorna `{ invalidRuc: true }` si el campo está vacío o no cumple la validación.
   * - Utiliza `validateService.validateRUCJuridico()` para la lógica de validación del RUC.
   * - Si el RUC es válido, retorna `null` indicando que no hay errores.
   *
   * @param {AbstractControl} control - Control del formulario que contiene el valor del RUC.
   * @returns {{ [key: string]: any } | null} Objeto de error si no es válido o `null` si es válido.
   */

  validateRuc(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value;

    if (!value) {
      return { invalidRuc: true };
    }
    return this.validateService.validateRUCJuridico(control.value)
      ? null
      : { invalidRuc: true };
  }
}
