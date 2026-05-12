import { Component, effect, input, output } from '@angular/core';
import { Labour } from '../../labour-list/labour.model';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToolTipComponent } from '../../../../shared/ui/tool-tip/tool-tip.component';
import { ValidateService } from '../../../../core/validation/validation.service';

@Component({
  selector: 'app-modal',
  imports: [CommonModule, ReactiveFormsModule, ToolTipComponent],
  templateUrl: './modal.component.html',
  styles: ``,
})
export class ModalComponent {
  isOpen = input<boolean>(false);
  labour = input<Labour | null>();
  closeModal = output<void>();
  save = output<Labour>();
  edit = output<Labour>();

  labourForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private validateService: ValidateService
  ) {
    this.labourForm = this.fb.group({
      _id: [''],
      name: ['', [Validators.required, Validators.minLength(8)]],
      price: [
        0,
        [
          Validators.required,
          Validators.min(0),
          this.validatePrecio.bind(this),
        ],
      ],
    });

    effect(() => {
      this.updateForm();
    });
  }

  /**
   * Reinicia el formulario de actividades (`labourForm`) a su estado inicial.
   *
   * - Limpia todos los campos del formulario, eliminando valores, estados de validación y errores.
   * - Útil después de crear o cancelar una acción para dejar el formulario listo para una nueva entrada.
   */

  formReset() {
    this.labourForm.reset();
  }

  /**
   * Cierra el modal de actividades y reinicia el formulario.
   *
   * - Llama a `formReset()` para limpiar el formulario.
   * - Emite el evento `closeModal` para notificar al componente padre sobre el cierre.
   */

  onClose() {
    this.formReset();
    this.closeModal.emit();
  }

  /**
   * Validador personalizado para campos de precio en formularios.
   *
   * - Verifica que el valor no sea `null`, `undefined` ni una cadena vacía.
   * - Convierte el valor a string y lo normaliza:
   *    - Quita espacios en blanco (`trim()`).
   *    - Reemplaza comas por puntos como separador decimal.
   * - Usa `validateService.validarPrecios()` para validar si el número es correcto.
   *
   * @param {AbstractControl} control - Control del formulario a validar.
   * @returns {{ [key: string]: any } | null} Objeto de error si es inválido, o `null` si es válido.
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
   * Actualiza los valores del formulario `labourForm` con los datos de la actividad seleccionada.
   *
   * - Si existe una actividad (`labour()`), utiliza `patchValue()` para precargar sus datos:
   *   - `_id`, `name` y `price`.
   * - Si no hay actividad seleccionada, reinicia el formulario con `reset()` y establece `price` en 0.
   *
   * - Este método se utiliza al abrir el formulario de edición o crear uno nuevo, garantizando que el estado del formulario coincida con el contexto actual.
   */

  updateForm() {
    if (this.labour()) {
      this.labourForm.patchValue({
        _id: this.labour()?._id,
        name: this.labour()?.name,
        price: this.labour()?.price,
      });
    } else {
      this.labourForm.reset({
        price: 0,
      });
    }
  }

  /**
   * Envía los datos del formulario de actividades (`labourForm`) si es válido.
   *
   * - Verifica que el formulario sea válido.
   * - Clona el valor del formulario para evitar mutaciones directas.
   * - Si existe una actividad (`labour()`):
   *   - Emite el evento `edit` con los datos actualizados.
   * - Si no existe:
   *   - Elimina el campo `_id` (si está presente).
   *   - Emite el evento `save` con los datos de la nueva actividad.
   */

  onSubmit() {
    if (this.labourForm.valid) {
      const data = { ...this.labourForm.value };
      if (this.labour()) {
        this.edit.emit(data);
      } else {
        delete data._id;
        this.save.emit(data);
      }
    }
  }
}
