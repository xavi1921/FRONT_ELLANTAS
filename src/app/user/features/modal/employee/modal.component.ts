import { Component, effect, input, output } from '@angular/core';
import { Employee } from '../../employee-list/employee.model';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ValidateService } from '../../../../core/validation/validation.service';
import { ToolTipComponent } from '../../../../shared/ui/tool-tip/tool-tip.component';

/**
 * Componente modal reutilizable para la creación y edición de empleados.
 *
 * - Usa `ReactiveFormsModule` para manejo de formularios tipados y validaciones personalizadas.
 * - Soporta validación dinámica de cédula/RUC, correos, fechas y texto.
 * - Se controla mediante entradas (`employee`, `isOpen`) y salidas (`save`, `edit`, `closeModal`).
 * - Integra automáticamente los cambios mediante efecto reactivo (`effect()`).
 */
@Component({
  selector: 'app-modal',
  imports: [CommonModule, ReactiveFormsModule, ToolTipComponent],
  templateUrl: './modal.component.html',
  styles: ``,
})
export class ModalComponent {
  isOpen = input<boolean>(false);
  employee = input<Employee | null>(null);
  closeModal = output<void>();
  save = output<Employee>();
  edit = output<Employee>();

  employeeForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private validateService: ValidateService
  ) {
    this.employeeForm = this.fb.group({
      _id: [''],
      tipoDoc: ['', Validators.required],
      dni: ['', [Validators.required, this.validateCedula.bind(this)]],
      fullName: ['', [Validators.required, this.validateText.bind(this)]],
      cellPhone: [
        '',
        [
          Validators.required,
          this.validateNumber.bind(this),
          Validators.minLength(9),
        ],
      ],
      email: ['', [Validators.required, this.validateEmail.bind(this)]],
      position: ['', [Validators.required]],
      startDate: ['', [Validators.required, this.validateIngreso.bind(this)]],
      gender: ['', Validators.required],
    });
    this.formReset();
    effect(() => {
      this.updateForm();
    });
  }

  /**
   * Resetea el formulario de empleado.
   *
   * - Limpia todos los campos del `FormGroup`.
   * - Reconstruye los valores desde el `input()` `employee`, si existe.
   * - Si no hay empleado seleccionado, aplica valores por defecto.
   */
  formReset() {
    this.employeeForm.reset();
    this.employee();
    this.updateForm();
  }

  /**
   * Cierra el modal y resetea el formulario a su estado inicial.
   */
  onClose() {
    this.formReset();
    this.updateForm();
    this.closeModal.emit();
  }
  //Validaciones Personalizadas

  /**
   * Valida la fecha de ingreso laboral.
   *
   * @returns `null` si la fecha es válida según reglas de negocio, o `{ invalidDate: true }` en caso contrario.
   */
  validateIngreso(control: AbstractControl): { [key: string]: any } | null {
    return this.validateService.validateIngreso(control.value)
      ? null
      : { invalidDate: true };
  }

  /**
   * Valida una dirección de correo electrónico.
   *
   * - Ignora cadenas vacías para delegar a `Validators.required`.
   * @returns `null` si es válido, o `{ invalidEmail: true }` si el formato no cumple.
   */
  validateEmail(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value?.trim();

    if (!value) {
      return null; // Dejar que `required` maneje este caso
    }

    return this.validateService.validateEmail(control.value)
      ? null
      : { invalidEmail: true };
  }

  /**
   * Valida una cédula ecuatoriana.
   *
   * @returns `null` si la cédula es válida, o `{ invalidCedula: true }` si no cumple.
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
   * Valida un RUC jurídico.
   *
   * @returns `null` si el RUC es válido, o `{ invalidRuc: true }` si es incorrecto o vacío.
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

  /**
   * Valida que el texto ingresado contenga únicamente letras válidas.
   *
   * @returns `null` si es válido, o `{ invalidText: true }` si contiene caracteres no permitidos.
   */
  validateText(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value?.trim(); // Evita espacios vacíos o valores null/undefined

    if (!value) {
      return { required: true }; // Se alinea con Validators.required
    }

    return this.validateService.validarLetras(value)
      ? null
      : { invalidText: true };
  }

  /**
   * Valida que el campo sea un número válido de 9 o 10 dígitos.
   *
   * - Verifica longitud y que contenga solo caracteres numéricos.
   * @returns `null` si es válido, o errores específicos: `{ required }`, `{ invalidNumber }`, `{ invalidLength }`.
   */
  validateNumber(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value?.trim(); // Evita espacios vacíos o valores null/undefined

    if (!value) {
      return { required: true }; // Se alinea con Validators.required
    }
    if (!this.validateService.validarNumeros(value)) {
      return { invalidNumber: true };
    }

    if (value.length !== 9 && value.length !== 10) {
      return { invalidLength: true };
    }
    return this.validateService.validarNumeros(value)
      ? null
      : { invalidNumber: true };
  }

  /**
   * Inicializa el formulario con los datos del empleado si existe,
   * o con valores por defecto si es un nuevo registro.
   */
  updateForm() {
    if (this.employee()) {
      const startDate =
        this.employee()?.startDate !== undefined
          ? new Date(this.employee()!.startDate).toISOString().split('T')[0]
          : '';

      this.employeeForm.patchValue({
        ...this.employee(),
        startDate,
      });
    } else {
      const today = new Date();
      const localDate = today.toLocaleDateString('en-CA');
      this.employeeForm.reset({
        _id: '',
        tipoDoc: 'DNI',
        dni: '',
        fullName: '',
        cellPhone: '',
        email: '',
        position: 'SECRETARIA',
        startDate: localDate,
        gender: 'MASCULINO',
      });
    }
  }

  /**
   * Envía el formulario si es válido, emitiendo `edit` o `save` según el contexto.
   */
  onSubmit() {
    if (this.employeeForm.valid) {
      const data = { ...this.employeeForm.value };
      if (this.employee()) {
        this.edit.emit(data);
      } else {
        delete data._id;
        this.save.emit(data);
      }
    }
  }

  /**
   * Reasigna las validaciones del campo `dni` en función del tipo de documento.
   */
  onTypeChange() {
    const type = this.employeeForm.get('tipoDoc')?.value;
    const identificacion = this.employeeForm.get('dni');
    if (type === 'DNI') {
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

    //aplica los cambios sin emitir el evento al servicio
    identificacion?.updateValueAndValidity({ emitEvent: false });
  }
}
