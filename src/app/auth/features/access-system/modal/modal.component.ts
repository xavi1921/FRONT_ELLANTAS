import { Component, effect, input, output } from '@angular/core';
import { Role } from '../role/role.model';
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
export class ModalComponent {
  isOpen = input<boolean>(false);
  role = input<Role | null>();
  closeModal = output<void>();
  save = output<Role>();
  edit = output<Role>();

  form: FormGroup;
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      _id: [''],
      name: ['', Validators.required],
      description: ['', Validators.required],
      status: ['Activo', Validators.required],
    });

    effect(() => {
      this.updateForm();
    });
  }

  /**
   * Restablece el formulario al estado inicial.
   * Utiliza `form.reset()` para limpiar todos los controles reactivos y sus valores.
   */

  formReset() {
    this.form.reset();
  }

  /**
   * Maneja el cierre del modal
   *
   * - Reinicia el formulario al estado inicial (`formReset`).
   * - Actualiza su contenido según el contexto (creación o edición) mediante `updateForm`.
   * - Emite el evento `closeModal` para notificar al componente padre.
   */

  onClose() {
    this.formReset();
    this.updateForm();
    this.closeModal.emit();
  }

  /**
   * Actualiza el formulario de roles dependiendo del contexto (edición o creación).
   *
   * - Si existe un rol activo (`role()`), carga sus datos en el formulario usando `patchValue`.
   * - Si no hay rol, reinicia el formulario con el estado por defecto (`status: 'Activo'`).
   */

  updateForm() {
    if (this.role()) {
      this.form.patchValue({
        _id: this.role()?._id,
        name: this.role()?.name,
        description: this.role()?.description,
        status: this.role()?.status,
      });
    } else {
      this.form.reset({
        status: 'Activo',
      });
    }
  }

  /**
   * Maneja el envío del formulario de roles.
   *
   * - Si el formulario es válido, crea un objeto `data` con los valores actuales.
   * - Si hay un rol existente (`role()`), emite el evento `edit` con los datos para actualizar.
   * - Si no, elimina el `_id` (en caso de que se haya propagado por error) y emite `save` para crear uno nuevo.
   * - Finalmente, emite `closeModal` para cerrar la vista modal.
   */

  onSubmit() {
    if (this.form.valid) {
      const data = { ...this.form.value };
      if (this.role()) {
        this.edit.emit(data);
      } else {
        delete data._id;
        this.save.emit(data);
      }
      this.closeModal.emit();
    }
  }
}
