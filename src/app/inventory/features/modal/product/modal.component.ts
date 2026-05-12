import { CommonModule } from '@angular/common';
import { Component, effect, input, OnInit, output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Product } from '../../inventory-list/products.model';
import { ValidateService } from '../../../../core/validation/validation.service';
import { ProductService } from '../../../data-access/product.service';
import { ToolTipComponent } from '../../../../shared/ui/tool-tip/tool-tip.component';
@Component({
  selector: 'app-modal',
  imports: [CommonModule, ReactiveFormsModule, ToolTipComponent],
  templateUrl: './modal.component.html',
  styles: ``,
})
export class ModalComponent {
  isOpen = input<boolean>(false);
  product = input<Product | null>();
  closeModal = output<void>();
  save = output<Product>();
  edit = output<Product>();

  productForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private validateService: ValidateService,
    private service: ProductService
  ) {
    this.productForm = this.fb.group({
      _id: [''],
      name: ['', Validators.required],
      brand: ['', Validators.required],
      series: ['', Validators.required],
      purchase_price: [
        0,
        [
          Validators.required,
          Validators.min(0),
          this.validatePrecio.bind(this),
        ],
      ],
      sale_price: [
        0,
        [
          Validators.required,
          Validators.min(0),
          this.validatePrecio.bind(this),
        ],
      ],
      stock: [30000, [Validators.required, this.validatStock.bind(this)]],
    });

    effect(() => {
      this.updateForm();
    });
  }

  /**
   * Reinicia el formulario de productos (`productForm`) a su estado inicial.
   *
   * - Limpia todos los campos y estados de validación.
   * - Útil después de guardar, cancelar o cerrar el formulario para dejarlo listo para una nueva entrada.
   */

  formReset() {
    this.productForm.reset();
  }

  /**
   * Cierra el modal de productos, reinicia el formulario y actualiza su contenido.
   *
   * - Ejecuta `formReset()` para limpiar campos y validaciones.
   * - Llama a `updateForm()` para establecer los valores iniciales según contexto (creación o edición).
   * - Emite el evento `closeModal` para notificar al componente padre del cierre.
   */

  onClose() {
    this.formReset();
    this.updateForm();
    this.closeModal.emit();
  }

  /**
   * Validador personalizado para verificar la validez del campo de precio.
   *
   * - Evalúa si el valor está vacío (`null`, `undefined` o cadena vacía); en ese caso, devuelve `{ required: true }`.
   * - Convierte el valor a cadena, elimina espacios (`trim()`) y reemplaza comas por puntos como separador decimal.
   * - Utiliza `validateService.validarPrecios(value)` para determinar si el número es válido.
   *
   * @param {AbstractControl} control - Control del formulario que contiene el valor del precio.
   * @returns {{ [key: string]: any } | null} Objeto con errores si es inválido; `null` si es válido.
   */

  validatePrecio(control: AbstractControl): { [key: string]: any } | null {
    let value = control.value;

    if (value === null || value === undefined || value === '') {
      return { required: true };
    }

    value = String(value).trim(); // Convertir a string antes de trim()

    value = value.replace(',', '.'); // Reemplaza coma por punto antes de validar

    return this.validateService.validarPrecios(value)
      ? null
      : { invalidNumber: true };
  }

  /**
   * Validador personalizado para campos de stock en formularios.
   *
   * - Verifica que el valor no sea `null`, `undefined` ni una cadena vacía.
   * - Convierte el valor a string, elimina espacios con `trim()`.
   * - Valida que el valor contenga únicamente caracteres numéricos mediante `validateService.validarNumeros()`.
   * - Comprueba que el número sea mayor o igual a 1.
   *
   * @param {AbstractControl} control - Control del formulario que contiene el valor de stock.
   * @returns {{ [key: string]: any } | null} Objeto de error si es inválido, o `null` si es válido.
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
   * Actualiza el formulario `productForm` con los datos de un producto existente o lo reinicia para creación.
   *
   * - Si existe un producto (`product()`):
   *   - Rellena el formulario con sus datos (`_id`, `name`, `brand`, `series`, `purchase_price`, `sale_price`, `stock`).
   * - Si no hay producto:
   *   - Reinicia el formulario con valores predeterminados:
   *     - `purchase_price`: 0
   *     - `sale_price`: 0
   *     - `stock`: 30000
   */

  updateForm() {
    if (this.product()) {
      this.productForm.patchValue({
        _id: this.product()?._id,
        name: this.product()?.name,
        brand: this.product()?.brand,
        series: this.product()?.series,
        purchase_price: this.product()?.purchase_price,
        sale_price: this.product()?.sale_price,
        stock: this.product()?.stock,
      });
    } else {
      this.productForm.reset({
        purchase_price: 0,
        sale_price: 0,
        stock: 30000,
      });
    }
  }

  /**
   * Envía los datos del formulario de productos (`productForm`) si son válidos.
   *
   * - Verifica si el formulario es válido (`valid`).
   * - Clona los valores del formulario en `data` para evitar mutaciones directas.
   * - Si existe un producto (`product()`), emite el evento `edit` con los datos actualizados.
   * - Si es un nuevo producto:
   *    - Elimina el campo `_id` si está presente.
   *    - Emite el evento `save` con los datos del nuevo producto.
   */

  onSubmit() {
    if (this.productForm.valid) {
      const data = { ...this.productForm.value };
      if (this.product()) {
        this.edit.emit(data);
      } else {
        delete data._id;
        this.save.emit(data);
      }
    }
  }
}
