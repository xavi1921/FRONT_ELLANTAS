import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { RoleCombo } from '../role/role.model';
import { RoleService } from '../../../data-access/role.service';
import { ValidateService } from '../../../../core/validation/validation.service';
import { ToolTipComponent } from '../../../../shared/ui/tool-tip/tool-tip.component';
import { transformationData } from './register.model';
import Swal from 'sweetalert2';
import { RegisterService } from '../../../data-access/register.service';
@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, ToolTipComponent],
  templateUrl: './register.component.html',
  styles: ``,
})
export class RegisterComponent implements OnInit {
  form: FormGroup;
  roles: RoleCombo[] = [];
  status = true;
  isShowingPassword = false;
  isConfirmenPassword = false;
  constructor(
    private fb: FormBuilder,
    private service: RoleService,
    private serviceReg: RegisterService,
    private validateService: ValidateService
  ) {
    this.form = this.fb.group(
      {
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
        position: ['', [Validators.required, this.validateText.bind(this)]],
        startDate: ['', [Validators.required, this.validateIngreso.bind(this)]],
        gender: ['', Validators.required],
        username: ['', Validators.required],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\.,;:\-]).{8,}$/
            ),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
        roles: ['', Validators.required],
        status: ['', Validators.required],
      },
      {
        validators: this.matchPasswords.bind(this),
      }
    );
    this.updateForm();
  }

  /**
   * Método del ciclo de vida `ngOnInit` de Angular.
   * Se ejecuta al inicializar el componente y realiza la carga inicial de roles mediante `getRoles()`.
   */

  ngOnInit() {
    this.getRoles();
  }

  /**
   * Obtiene la lista de roles disponibles desde el backend utilizando el método `combo` del servicio.
   *
   * - Al recibir la respuesta, asigna los roles al array local `roles`.
   * - En caso de error, lo registra en la consola.
   */

  getRoles() {
    this.service.combo().subscribe(
      (res) => {
        this.roles = res.roles;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  /**
   * Reinicia el formulario y actualiza su contenido.
   *
   * - Limpia todos los controles reactivos mediante `form.reset()`.
   * - Vuelve a aplicar los valores predeterminados o existentes según el contexto usando `updateForm()`.
   */

  resetForm() {
    this.form.reset();
    this.updateForm();
  }
  /**
   * Alterna el estado de activación del formulario (`Activo` / `Inactivo`).
   *
   * - Invierte el valor booleano de `status`.
   * - Asigna el valor correspondiente al campo `status` del formulario (`'Activo'` o `'Inactivo'`).
   */

  toggle() {
    this.status = !this.status;
    const s = this.status ? 'Activo' : 'Inactivo';
    this.form.get('status')?.setValue(s);
  }

  /**
   * Alterna la visibilidad del campo de contraseña en el formulario.
   *
   * - Invierte el estado booleano de `isShowingPassword` para mostrar u ocultar el valor.
   */

  togglePassword() {
    this.isShowingPassword = !this.isShowingPassword;
  }

  /**
   * Alterna la visibilidad del campo de confirmación de contraseña.
   *
   * - Invierte el valor booleano de `isConfirmenPassword` para mostrar u ocultar el contenido.
   */

  togglePasswordCon() {
    this.isConfirmenPassword = !this.isConfirmenPassword;
  }
  //Validaciones Personalizadas

  /**
   * Validador personalizado que verifica si una fecha de ingreso es válida
   * utilizando una lógica externa encapsulada en `validateService`.
   *
   * - Retorna `null` si la validación es exitosa (fecha válida).
   * - Si no pasa la validación, retorna un objeto con la clave `invalidDate`.
   *
   * @param {AbstractControl} control - Control del formulario que contiene la fecha a validar.
   * @returns {{ [key: string]: any } | null} Resultado de la validación: `null` si es válido, o error si no lo es.
   */

  validateIngreso(control: AbstractControl): { [key: string]: any } | null {
    return this.validateService.validateIngreso(control.value)
      ? null
      : { invalidDate: true };
  }

  /**
   * Validador personalizado para verificar si un correo electrónico tiene un formato válido.
   *
   * - Si el valor está vacío o solo contiene espacios, retorna `null` y delega a la validación `required`.
   * - Si el formato es válido (según `validateService.validateEmail`), retorna `null`.
   * - Si no cumple con el formato, retorna `{ invalidEmail: true }`.
   *
   * @param {AbstractControl} control - Control del formulario que contiene el valor a validar.
   * @returns {{ [key: string]: any } | null} Resultado de la validación: `null` si es válido, o error si no lo es.
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
   * Validador personalizado para verificar si una cédula (número de identificación) es válida.
   *
   * - Si el valor está vacío, retorna `{ invalidCedula: true }`.
   * - Si el valor no cumple con la validación definida en `validateService.validateCedula`, retorna `{ invalidCedula: true }`.
   * - En caso válido, retorna `null`.
   *
   * @param {AbstractControl} control - Control del formulario que contiene la cédula a validar.
   * @returns {{ [key: string]: any } | null} Resultado de la validación: `null` si es válido, o error si no lo es.
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
   * Validador personalizado para verificar si un RUC jurídico es válido.
   *
   * - Si el campo está vacío, retorna `{ invalidRuc: true }`.
   * - Si el valor no cumple con la validación del servicio externo (`validateRUCJuridico`), también retorna `{ invalidRuc: true }`.
   * - Si es válido, retorna `null`.
   *
   * @param {AbstractControl} control - Control del formulario que contiene el RUC a validar.
   * @returns {{ [key: string]: any } | null} Resultado de la validación: `null` si es válido, o error si no lo es.
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
   * Validador personalizado para campos de texto.
   *
   * - Elimina espacios en blanco y verifica que el valor no esté vacío.
   * - Si está vacío, retorna `{ required: true }`, permitiendo compatibilidad con `Validators.required`.
   * - Valida que el texto contenga solo letras mediante `validateService.validarLetras`.
   * - Si es válido, retorna `null`; si no, retorna `{ invalidText: true }`.
   *
   * @param {AbstractControl} control - Control del formulario con el texto a validar.
   * @returns {{ [key: string]: any } | null} Resultado de la validación: `null` si es válido, objeto con error si no.
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
   * Validador personalizado para campos numéricos, como teléfonos o identificaciones.
   *
   * - Elimina espacios en blanco y verifica que el valor no esté vacío (`required`).
   * - Verifica que el valor contenga solo dígitos válidos mediante `validateService.validarNumeros`.
   * - Comprueba que la longitud sea exactamente 9 o 10 caracteres; si no, retorna `{ invalidLength: true }`.
   * - Si falla la validación de formato numérico, retorna `{ invalidNumber: true }`.
   * - Si pasa todas las validaciones, retorna `null`.
   *
   * @param {AbstractControl} control - Control del formulario con el número a validar.
   * @returns {{ [key: string]: any } | null} Resultado de la validación: `null` si es válido, o un objeto con el error correspondiente.
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

  // Validación a nivel de FormGroup
  /**
   * Validador personalizado para formularios reactivos que asegura que los campos
   * `password` y `confirmPassword` coincidan.
   *
   * - Compara los valores de ambos controles.
   * - Si son distintos, marca `confirmPassword` con el error `{ passwordMismatch: true }`
   *   y retorna el mismo objeto de error para el grupo.
   * - Si coinciden, retorna `null` indicando que la validación pasó.
   *
   * @param {AbstractControl} group - Grupo de controles que contiene `password` y `confirmPassword`.
   * @returns {{ [key: string]: any } | null} Objeto con error si hay discrepancia, o `null` si son iguales.
   */

  matchPasswords(group: AbstractControl): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  /**
   * Cambia los validadores del campo `dni` dependiendo del tipo de documento seleccionado (`tipoDoc`).
   *
   * - Si el tipo es `'DNI'`, aplica validadores para cédula.
   * - En cualquier otro caso, aplica validadores para RUC.
   * - Actualiza la validez del campo sin emitir evento (`emitEvent: false`).
   */

  onTypeChange() {
    const type = this.form.get('tipoDoc')?.value;
    const identificacion = this.form.get('dni');
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

  /**
   * Reinicia el formulario estableciendo valores predeterminados.
   *
   * - Define la fecha actual en formato ISO local (`yyyy-mm-dd`) como `startDate`.
   * - Establece el estado inicial como `'Activo'`, el tipo de documento como `'DNI'` y el género como `'MASCULINO'`.
   */

  updateForm() {
    const today = new Date();
    const localDate = today.toLocaleDateString('en-CA');
    this.form.reset({
      status: 'Activo',
      startDate: localDate,
      tipoDoc: 'DNI',
      gender: 'MASCULINO',
    });
  }

  /**
   * Envía los datos procesados del formulario al servicio de registro de usuarios.
   *
   * - Aplica la transformación previa mediante `transformationData`.
   * - Llama al servicio `serviceReg.create()` para enviar los datos al backend.
   * - En caso de éxito, muestra una notificación `Swal` con mensaje de confirmación.
   * - En caso de error, muestra una notificación `Swal` con el mensaje de error del backend.
   *
   * @param {any} data - Datos crudos del formulario de registro.
   */

  create(data: any) {
    const o = transformationData(data);
    this.serviceReg.create(o).subscribe(
      (res) => {
        Swal.fire({
          title: 'Cuenta de Usuario Creada Correctamente',
          icon: 'success',
          timer: 1500,
        });
      },
      (error) => {
        Swal.fire({
          title: error.error.message,
          icon: 'error',
          timer: 1500,
        });
      }
    );
  }

  /**
   * Maneja el envío del formulario de registro de usuario.
   *
   * - Verifica si el formulario es válido.
   * - Si lo es, clona los datos del formulario y los pasa al método `create` para ser procesados y enviados.
   * - Finalmente, reinicia el formulario para limpiar los campos tras la operación.
   */

  onSubmit() {
    if (this.form.valid) {
      const data = { ...this.form.value };
      this.create(data);
      this.resetForm();
    }
  }
}