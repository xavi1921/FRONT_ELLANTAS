import { CommonModule } from '@angular/common';
import { Component, effect, input, OnInit, output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Owner } from '../../owner-list/owner.model';
import { ValidateService } from '../../../../core/validation/validation.service';
import { TypeOwnerService } from '../../../data-access/typeOwner.service';
import { ToolTipComponent } from '../../../../shared/ui/tool-tip/tool-tip.component';
import Swal from 'sweetalert2';
import { IdentityLookupService } from '../../../../core/services/identity-lookup.service';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToolTipComponent,
    SpinnerComponent,
  ],
  templateUrl: './modal.component.html',
  styles: ``,
})

/**
 * Componente modal encargado de crear o editar un propietario (`Owner`).
 *
 * - Usa `FormGroup` reactivo para gestionar y validar los campos del formulario.
 * - Expone entradas (`input`) y salidas (`output`) modernas para integración fluida.
 * - Acepta una lista de tipos de propietario (`types`) para ser mostrada en un dropdown.
 */
export class ModalComponent implements OnInit {
  isOpen = input<boolean>(false);
  owner = input<Owner | null>();
  closeModal = output<void>();
  save = output<Owner>();
  edit = output<Owner>();
  types: any[] = [];
  load = false;

  ownerForm: FormGroup;

  /**
   * Constructor del componente `ModalComponent`, encargado de:
   *
   * - Inyectar dependencias necesarias:
   *   - `FormBuilder` para construir el `FormGroup`.
   *   - `ValidateService` para las validaciones personalizadas.
   *   - `TypeOwnerService` para obtener tipos de propietario.
   *
   * - Definir el formulario `ownerForm` con validaciones integradas:
   *   - `razon_social`, `cell_phone`, `email`, etc., con validaciones combinadas (requeridas y personalizadas).
   *
   * - Establecer un efecto reactivo con `effect(...)` que escucha cambios del componente
   *   y ejecuta `updateForm()` automáticamente cuando hay datos entrantes (`owner`).
   */
  constructor(
    private fb: FormBuilder,
    private validateService: ValidateService,
    private service: TypeOwnerService,
    private identityService: IdentityLookupService,
  ) {
    this.ownerForm = this.fb.group({
      _id: [''],
      type_sus: ['', Validators.required],
      razon_social: ['', [Validators.required, this.validateText.bind(this)]],
      identification_number: ['', [Validators.required]],
      address: ['', Validators.required],
      cell_phone: [
        '',
        [
          Validators.required,
          this.validateNumber.bind(this),
          Validators.minLength(9),
        ],
      ],
      cell_phone_2: [
        '',
        [this.validateNumber_2.bind(this), Validators.minLength(9)],
      ],
      email: ['', [Validators.required, this.validateEmail.bind(this)]],
    });
    effect(() => {
      this.updateForm();
    });
  }
  ngOnInit() {
    this.getItemsCombo();
    this.onTypeChange();
  }

  /**
   * Obtiene la lista de tipos de propietarios desde el backend y la asigna a `this.types`.
   *
   * - Llama al método `combo()` del servicio.
   * - En éxito, asigna `res.data` al arreglo local.
   * - En caso de error, muestra el log por consola.
   */
  getItemsCombo() {
    this.service.combo().subscribe(
      (res) => {
        this.types = res.data;
      },
      (error) => {
        console.log(error);
      },
    );
  }

  /**
   * Reinicia el formulario y reaplica datos si `owner` está definido.
   *
   * - Limpia el `FormGroup` (`ownerForm.reset()`).
   * - Luego invoca `updateForm()` para volver a llenar los campos si hay datos cargados.
   */
  formReset() {
    this.ownerForm.reset();
    this.updateForm();
  }

  /**
   * Emite el evento de cierre del modal hacia el componente padre.
   *
   * - Útil para cerrar el modal sin guardar cambios.
   */
  onClose() {
    this.closeModal.emit();
  }

  /**
   * Pregunta al usuario si desea limpiar el formulario actual mediante un diálogo de confirmación.
   *
   * - Usa `SweetAlert` para presentar la advertencia de limpieza.
   * - Si el usuario confirma la acción, invoca `formReset()` para restablecer el formulario.
   *
   * Este método previene borrados accidentales de datos ingresados.
   */
  clearTabs() {
    Swal.fire({
      title: '¿Desea limpiar el formulario?',
      text: 'Se borrarán todos los campos ingresados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.formReset();
      }
    });
  }

  /**
   * Hidrata o resetea el formulario del propietario según el contexto actual.
   *
   * - Si existe un objeto `owner`, realiza un `patchValue` con sus propiedades mapeadas.
   * - Si no existe (`null`), resetea el formulario y asigna `'Natural'` como valor por defecto en `type_sus`.
   * - Finalmente, llama a `onTypeChange()` para refrescar dependencias relacionadas con el tipo de propietario.
   */
  updateForm() {
    if (this.owner()) {
      this.ownerForm.patchValue({
        _id: this.owner()?._id,
        razon_social: this.owner()?.fullName,
        type_sus: this.owner()?.type_sus.name,
        identification_number: this.owner()?.identification_number,
        address: this.owner()?.address,
        cell_phone: this.owner()?.cell_phone,
        cell_phone_2: this.owner()?.cell_phone_2,
        email: this.owner()?.email,
      });
    } else {
      this.ownerForm.reset({
        type_sus: 'Natural',
      });
    }
    this.onTypeChange();
  }

  /**
   * Envía los datos del formulario si son válidos.
   *
   * - Clona el contenido de `ownerForm.value` para evitar mutaciones.
   * - Si existe un propietario (`owner()`):
   *   - Emite el evento `edit` con los datos actuales del formulario.
   * - Si no existe (modo creación):
   *   - Elimina `_id` del payload antes de emitir `save`.
   */
  onSubmit() {
    if (this.ownerForm.valid) {
      const data = { ...this.ownerForm.value };

      if (this.owner()) {
        this.edit.emit(data);
      } else {
        delete data._id;
        this.save.emit(data);
      }
    }
  }

  /**
   * Ajusta dinámicamente las validaciones del campo `identification_number` según el tipo seleccionado (`type_sus`).
   *
   * - Si el tipo es `'Natural'`, aplica validación para cédula.
   * - Si es cualquier otro (ej. 'Jurídica'), aplica validación para RUC.
   * - Luego actualiza la validez del campo sin emitir eventos (`emitEvent: false`),
   *   previniendo efectos colaterales como disparar observables o listeners innecesarios.
   */
  onTypeChange() {
    const type = this.ownerForm.get('type_sus')?.value;
    const identificacion = this.ownerForm.get('identification_number');
    identificacion?.clearValidators();
    if (type === 'Natural') {
      identificacion?.setValidators([
        Validators.required,
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10),
      ]);
    } else {
      identificacion?.setValidators([
        Validators.required,
        Validators.minLength(13),
        Validators.maxLength(13),
      ]);
    }

    //aplica los cambios sin emitir el evento al servicio
    identificacion?.updateValueAndValidity({ emitEvent: false });
  }

  //Validaciones Personalizadas

  /**
   * Valida si el campo contiene un correo electrónico con formato válido.
   *
   * - Si el valor está vacío, retorna `null` para permitir que `Validators.required` lo maneje.
   * - Si el formato es incorrecto, retorna `{ invalidEmail: true }`.
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
   * Valida si el valor ingresado corresponde a una cédula válida de persona natural.
   *
   * - Si no hay valor, retorna `{ invalidCedula: true }`.
   * - Valida con el servicio interno. Si no pasa, retorna `{ invalidCedula: true }`.
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
   * Valida si el valor ingresado corresponde a un RUC jurídico válido.
   *
   * - Si no hay valor, retorna `{ invalidRuc: true }`.
   * - Si falla la validación, retorna `{ invalidRuc: true }`.
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
   * Valida si el texto ingresado contiene solo letras.
   *
   * - Si está vacío o es solo espacios, retorna `{ required: true }`.
   * - Si contiene caracteres inválidos, retorna `{ invalidName: true }`.
   */
  validateText(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value?.trim(); // Evita espacios vacíos o valores null/undefined

    if (!value) {
      return { required: true }; // Se alinea con Validators.required
    }

    return this.validateService.validarLetras(value)
      ? null
      : { invalidName: true };
  }

  /**
   * Valida que el valor ingresado sea un número válido para celulares.
   *
   * - Si está vacío, retorna `{ required: true }`.
   * - Si contiene caracteres no numéricos, retorna `{ invalidNumber: true }`.
   * - Si la longitud no es 9 ni 10, retorna `{ invalidLength: true }`.
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
   * Valida opcionalmente el número secundario (`cell_phone_2`).
   *
   * - Si está vacío, retorna `null` (es un campo opcional).
   * - Si tiene valor pero no es numérico o tiene longitud inválida, retorna errores.
   */
  validateNumber_2(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value?.trim(); // Evita espacios vacíos o valores null/undefined

    if (!value) {
      return null;
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
   * Realiza la búsqueda automática según el tipo de cliente y el ID ingresado.
   */
  lookupIdentity() {
    const idNumber = this.ownerForm.get('identification_number')?.value;
    const type = this.ownerForm.get('type_sus')?.value;
    const identificationCtrl = this.ownerForm.get('identification_number');
    if (!identificationCtrl || !idNumber || idNumber.length < 10) return;

    this.load = true;

    const request$ =
      type === 'Natural'
        ? this.identityService.getNaturalPerson(idNumber)
        : this.identityService.getCompanyByRuc(idNumber);

    request$.pipe(finalize(() => (this.load = false))).subscribe({
      next: (res) => {
        if (res.data) {
          identificationCtrl.setErrors(null);
          const datos = res.data?.datos ?? res.data;

          const normalizedOwner = {
            razon_social: datos.nombres || datos.razon_social,

            address: datos.direccion,
            cell_phone: datos.celular1 || datos.telefono,
            cell_phone_2: datos.celular2,
            email: datos.correo,
          };

          this.ownerForm.patchValue(normalizedOwner);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Datos cargados',
            showConfirmButton: false,
            timer: 2000,
          });
        }
      },
      error: (err) => {
        if (type !== 'Natural') {
          identificationCtrl.setErrors({ rucNotFound: true });
          identificationCtrl.markAsTouched();
          return;
        }
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Registro no encontrado',
          text: 'No se encontró información del cliente. Por favor, ingrese los datos de forma manual.',
          showConfirmButton: false,
          timer: 5500,
          timerProgressBar: true,
        });
      },
    });
  }
}
