import { Component, effect, input, output } from '@angular/core';
import { Type } from '../../../../owner/features/owner-type-list/typeOwner.model';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToolTipComponent } from '../../../../shared/ui/tool-tip/tool-tip.component';

@Component({
  selector: 'app-modal',
  imports: [CommonModule, ReactiveFormsModule, ToolTipComponent],
  templateUrl: './modal.component.html',
  styles: ``,
})

/**
 * Componente modal reutilizable para gestionar entidades `Type`.
 *
 * - Controlado externamente mediante `isOpen` y `type`.
 * - Emite eventos de guardado, edición y cierre.
 * - Administra el formulario reactivo `types` con validaciones y estado.
 */
export class ModalComponent {
  isOpen = input<boolean>(false);
  type = input<Type | null>();
  closeModal = output<void>();
  save = output<Type>();
  edit = output<Type>();

  /** Formulario reactivo que encapsula los campos de la entidad `Type` */
  types: FormGroup;

  /**
   * Constructor del componente modal que gestiona entidades `Type`.
   *
   * - Inicializa el formulario reactivo `types` con validadores específicos:
   *   - `name`: requerido, mínimo 4 caracteres.
   *   - `observation`: requerido, mínimo 6 caracteres.
   * - Usa un efecto (`effect`) para sincronizar el formulario con el estado actual del input `type`.
   *
   * @param fb - `FormBuilder` inyectado para construir el formulario.
   */
  constructor(private fb: FormBuilder) {
    this.types = this.fb.group({
      _id: [''],
      name: ['', [Validators.required, Validators.minLength(4)]],
      observation: ['', [Validators.required, Validators.minLength(6)]],
    });

    effect(() => {
      this.updateForm();
    });
  }

  /**
   * Resetea el formulario `types` a su estado inicial.
   *
   * - Limpia todos los campos.
   * - No aplica valores por defecto.
   */
  formReset() {
    this.types.reset();
  }

  /**
   * Cierra el modal y reinicia el formulario.
   *
   * - Llama a `formReset()` para limpiar estado.
   * - Emite el evento `closeModal` para notificar al componente padre.
   */
  onClose() {
    this.formReset();
    this.closeModal.emit();
  }

  /**
   * Actualiza el formulario con los datos del `Type` cargado (si existe).
   *
   * - Si hay un `type`, aplica sus propiedades al formulario (`patchValue`).
   * - Si no hay entidad cargada, reinicia el formulario a estado limpio.
   */
  updateForm() {
    if (this.type()) {
      this.types.patchValue({
        _id: this.type()?._id,
        name: this.type()?.name,
        observation: this.type()?.observation,
      });
    } else {
      this.formReset();
    }
  }

  /**
   * Envía los datos del formulario si es válido.
   *
   * - Clona el contenido actual de `types`.
   * - Si existe entidad, emite evento `edit`.
   * - Si no existe, elimina el `_id` y emite evento `save`.
   */
  onSubmit() {
    if (this.types.valid) {
      const data = { ...this.types.value };
      if (this.type()) {
        this.edit.emit(data);
      } else {
        delete data._id;
        this.save.emit(data);
      }
    }
  }
}
