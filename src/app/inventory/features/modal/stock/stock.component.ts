import { CommonModule } from '@angular/common';
import { Component, effect, input, output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToolTipComponent } from '../../../../shared/ui/tool-tip/tool-tip.component';
import { ValidateService } from '../../../../core/validation/validation.service';
import { Product } from '../../inventory-list/products.model';
import { Labour } from '../../../../order/features/modal/types.model';

@Component({
  selector: 'app-stock',
  imports: [CommonModule, ReactiveFormsModule, ToolTipComponent],
  templateUrl: './stock.component.html',
  styles: ``,
})
export class StockComponent {
  isOpen = input<boolean>(false);
  product = input<Product | null>();
  closeModal = output<void>();
  edit = output<Product>();

  stockForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private validateService: ValidateService
  ) {
    this.stockForm = this.fb.group({
      _id: [''],
      stock: [1, [Validators.required, this.validatStock.bind(this)]],
    });

    effect(() => {
      this.updateForm();
    });
  }

  /**
   * Reinicia el formulario de stock (`stockForm`) y emite el evento de cierre del modal.
   *
   * - `formReset()`: Limpia todos los campos del formulario de stock.
   * - `onClose()`: Llama a `formReset()` y emite `closeModal` para informar al componente padre.
   */

  formReset() {
    this.stockForm.reset();
  }
  onClose() {
    this.formReset();
    this.closeModal.emit();
  }

  /**
   * Validador personalizado para el campo de stock en formularios reactivos.
   *
   * - Verifica que el valor no sea `null`, `undefined` ni una cadena vacía.
   * - Convierte el valor a string y elimina espacios (`trim()`).
   * - Valida si contiene solo caracteres numéricos mediante `validateService.validarNumeros()`.
   * - Comprueba que el número sea mayor o igual a 1.
   *
   * @param {AbstractControl} control - Control del formulario que contiene el valor de stock.
   * @returns {{ [key: string]: any } | null} Objeto de error si el valor no es válido; `null` si es correcto.
   */

  validatStock(control: AbstractControl): { [key: string]: any } | null {
    let value = control.value;

    if (value === null || value === undefined || value === '') {
      return { required: true };
    }

    value = String(value).trim(); // Convertir a string antes de trim()

    if (!this.validateService.validarNumeros(value)) {
      return { invalidNumber: true }; // Solo permite números
    }

    if (Number(value) < 1) {
      return { min: { min: 1, actual: value } }; // Indica que el valor es menor que 1
    }

    return null;
  }

  /**
   * Actualiza el formulario `stockForm` con los datos del producto o lo reinicia para nuevo registro.
   *
   * - Si existe un producto (`product()`):
   *   - Precarga `_id` y `stock` en el formulario mediante `patchValue()`.
   * - Si no hay producto:
   *   - Reinicia el formulario estableciendo `stock` en 0 como valor inicial.
   */

  updateForm() {
    if (this.product()) {
      this.stockForm.patchValue({
        _id: this.product()?._id,
        stock: this.product()?.stock,
      });
    } else {
      this.stockForm.reset({
        stock: 0,
      });
    }
  }

  /**
   * Envía los datos del formulario de stock (`stockForm`) si es válido.
   *
   * - Verifica que el formulario sea válido.
   * - Clona los valores para evitar mutaciones involuntarias.
   * - Si hay un producto asociado (`product()`):
   *   - Emite el evento `edit` con los datos del formulario.
   * - Finaliza llamando a `onClose()` para limpiar el estado y cerrar el modal.
   */

  onSubmit() {
    if (this.stockForm.valid) {
      const data = { ...this.stockForm.value };
      if (this.product()) {
        this.edit.emit(data);
      }
      this.onClose();
    }
  }
}
