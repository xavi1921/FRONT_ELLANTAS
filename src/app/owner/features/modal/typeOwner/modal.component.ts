import { Component, effect, input, output } from '@angular/core';
import { Type } from '../../owner-type-list/typeOwner.model';
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
 * Componente modal para gestionar creación y edición de tipos de propietario (`Type`).
 *
 * - Expone bindings modernos con `input()` y `output()` para una integración fluida.
 * - Permite apertura controlada (`isOpen`) y contexto de edición (`type`).
 * - Emite eventos `save` o `edit` según la operación realizada.
 * - `closeModal` permite comunicar al padre que debe cerrar el modal.
 */
export class ModalComponent {
  isOpen = input<boolean>(false);
  type = input<Type | null>();
  closeModal = output<void>();
  save = output<Type>();
  edit = output<Type>();

  types: FormGroup;

  /**
   * Constructor del componente modal de tipo de propietario.
   *
   * - Inyecta `FormBuilder` para construir el formulario `types`.
   * - Define campos validados:
   *   - `_id`: Campo oculto usado en modo edición.
   *   - `name`: Campo requerido con mínimo de 4 caracteres.
   *   - `observation`: Campo requerido con mínimo de 6 caracteres.
   *
   * - Ejecuta un `effect(...)` al inicializar para aplicar `updateForm()` automáticamente
   *   cuando cambien los inputs reactivos (`type()`).
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
   * Reinicia los campos del formulario de tipo de propietario (`types`) a su estado inicial.
   *
   * - Útil para limpiar el formulario cuando se cambia de contexto (por ejemplo, al cerrar o reutilizar el modal).
   */
  formReset() {
    this.types.reset();
  }

  /**
   * Cierra el modal invocando primero el reseteo del formulario, luego emitiendo el evento hacia el componente padre.
   *
   * - Previene residuos de estado en futuras aperturas.
   * - Asegura que el modal se cierre en estado limpio.
   */
  onClose() {
    this.formReset();
    this.closeModal.emit();
  }

  /**
   * Llena el formulario `types` con los datos recibidos a través del `input` `type`.
   *
   * - Si `type()` existe, usa `patchValue(...)` para hidratar el formulario con sus propiedades.
   * - Si no, invoca `formReset()` para limpiar el formulario y dejarlo en estado base.
   *
   * Esto permite reusar el modal tanto en modo edición como en modo creación con coherencia visual.
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
   * Ejecuta el envío del formulario `types` si este es válido.
   *
   * - Clona los valores del formulario en `data`.
   * - Si `type()` existe (modo edición), emite `edit` con `data`.
   * - Si no existe (modo creación), elimina `_id` y emite `save`.
   *
   * Esta bifurcación permite que el componente padre determine si debe persistir o actualizar el registro.
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
