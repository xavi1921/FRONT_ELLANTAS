import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  input,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ValidateService } from '../../../core/validation/validation.service';
import { Appointment } from '../appointment-list/appointment.model';
import { OwnerService } from '../../../owner/data-access/owner.service';
import { VehicleService } from '../../../vehicle/data-access/vehicle.service';
import { ToolTipComponent } from '../../../shared/ui/tool-tip/tool-tip.component';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-appointment',
  imports: [CommonModule, ReactiveFormsModule, ToolTipComponent],
  templateUrl: './appointment.component.html',
  styles: ``,
})
export class AppointmentComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private subscriptionsInitialized = false;
  isOpen = input<boolean>(false);
  appointment = input<Appointment | null>();
  closeModal = output<void>();
  save = output<Appointment>();
  edit = output<Appointment>();
  filteredOwner: any[] = [];
  vehiclesFromOwner: any[] = [];
  isReadonly = false;
  form: FormGroup;
  notFoundOwner = false;
  errorMessage = '';
  constructor(
    private fb: FormBuilder,
    private validaService: ValidateService,
    private serviceOwner: OwnerService,
    private serviceVehicle: VehicleService
  ) {
    this.form = this.fb.group({
      _id: [''],
      subscriber: ['', [Validators.required]],
      vehicle: ['', Validators.required],
      appointment_date: ['', [Validators.required]],
      appointment_time: ['', Validators.required],
      description: ['', [Validators.required]],
      notes: ['', [Validators.required, this.validateText.bind(this)]],
      notification_status: ['NO'],
      isConfirmed: ['NO', Validators.required],
      valueFilter: [''],
    });

    effect(() => {
      this.updateForm();
    });
    this.initializeSubscriptions();
  }

  /**
   * Inicializa la suscripción al campo `valueFilter` del formulario, asegurando que sólo se configure una vez.
   * Aplica filtros condicionales dinámicos según el valor ingresado por el usuario.
   *
   * - Si no hay una cita seleccionada, invoca `filterOwner` con el valor.
   * - Si el valor está vacío, ejecuta `cleanFilter`.
   * - Siempre filtra el vehículo basado en el suscriptor actual del formulario.
   */

  initializeSubscriptions() {
    if (this.subscriptionsInitialized) return;
    this.form
      .get('valueFilter')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (!this.appointment()) {
          this.filterOwner(value);
        }
        if (value === '') {
          this.cleanFilter();
        }
        this.filterVehicle(this.form.get('subscriber')?.value);
      });

    this.subscriptionsInitialized = true;
  }
  /**
   * Reinicia todos los campos del formulario al estado inicial.
   * Utiliza el método `reset()` de Angular Reactive Forms para limpiar los valores del formulario.
   */

  formReset() {
    this.form.reset();
  }
  /**
   * Maneja el cierre del modal de cita.
   * Reinicia el formulario, actualiza su estado y emite el evento de cierre para notificar al componente padre.
   */

  onClose() {
    this.formReset();
    this.updateForm();
    this.closeModal.emit();
  }

  /**
   * Asigna un propietario seleccionado al formulario.
   * Establece el campo `subscriber` con el ID del propietario y el campo `valueFilter`
   * con su nombre completo (sin emitir eventos). También actualiza los vehículos
   * relacionados y limpia la lista `filteredOwner`.
   *
   * @param {any} owner - Objeto del propietario seleccionado con propiedades `_id` y `fullName`.
   */

  selectOwner(owner: any) {
    this.form.get('subscriber')?.setValue(owner._id);
    this.form
      .get('valueFilter')
      ?.setValue(owner.fullName, { emitEvent: false });
    this.filterVehicle(owner._id);
    this.filteredOwner = [];
  }

  /**
   * Filtra propietarios (`Owner`) según el valor de búsqueda ingresado.
   * Si el valor es válido, realiza una solicitud al servicio para recuperar coincidencias.
   * Actualiza la lista `filteredOwner` en caso de éxito o establece el indicador `notFoundOwner`
   * y el mensaje de error si ocurre un fallo.
   *
   * @param {string | null} value - Texto de búsqueda ingresado por el usuario.
   */

  filterOwner(value: string | null) {
    if (value && value.trim()) {
      this.notFoundOwner = false;
      this.serviceOwner.filter(value.trim()).subscribe(
        (res) => {
          this.filteredOwner = res;
        },
        (error) => {
          this.notFoundOwner = true;
          this.errorMessage = error.error.message;
        }
      );
    }
  }

  /**
   * Asigna al formulario el vehículo seleccionado desde un elemento `<select>`.
   * Extrae el valor del evento del selector HTML y actualiza el campo `vehicle` del formulario reactivo.
   * @param {Event} event - Evento del cambio generado al seleccionar un vehículo.
   */

  selectVehicle(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.form.get('vehicle')?.setValue(selectedValue);
  }

  /**
   * Filtra la lista de vehículos asociados a un propietario (`subscriber`) específico.
   * Si se encuentra fuera del modo de edición (`!appointment()`), limpia el campo de vehículo seleccionado.
   * Actualiza la propiedad `vehiclesFromOwner` con los resultados obtenidos del servicio.
   * @param {string | null} value - ID del propietario (subscriber) para recuperar los vehículos relacionados.
   */

  filterVehicle(value: string | null) {
    if (value && value.trim()) {
      this.serviceVehicle.filterCombo(value.trim()).subscribe(
        (res) => {
          if (!this.appointment()) {
            this.form.get('vehicle')?.setValue('');
          }
          this.vehiclesFromOwner = res;
        },
        (error) => {
          console.log(error);
        }
      );
    }
  }

  /**
   * Validador personalizado para campos de texto.
   * Verifica que el valor no esté vacío y que cumpla con una validación de letras definida por `validaService`.
   *
   * - Si el campo está vacío o solo contiene espacios, retorna `{ required: true }`.
   * - Si el valor no contiene solo letras válidas, retorna `{ invalidName: true }`.
   * - Si pasa ambas validaciones, retorna `null` (valor válido).
   *
   * @param {AbstractControl} control - Control del formulario que contiene el valor a validar.
   * @returns {{ [key: string]: any } | null} Objeto con el tipo de error o `null` si es válido.
   */

  validateText(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value?.trim(); // Evita espacios vacíos o valores null/undefined

    if (!value) {
      return { required: true };
    }

    return this.validaService.validarLetras(value)
      ? null
      : { invalidName: true };
  }

  /**
   * Restablece el estado del filtro de propietarios.
   * Limpia la lista de coincidencias (`filteredOwner`), oculta cualquier indicador de "no encontrado"
   * y elimina mensajes de error asociados.
   */

  cleanFilter() {
    this.filteredOwner = [];
    this.notFoundOwner = false;
    this.errorMessage = '';
  }

  /**
   * Actualiza el formulario de citas (`Appointment`) dependiendo del contexto (edición o creación).
   *
   * - Si hay una cita seleccionada (`appointment()`), llena el formulario con sus valores
   *   y activa el modo solo lectura.
   * - Si no hay cita, restablece el formulario con valores predeterminados (fecha y hora actuales,
   *   confirmación y notificación en "NO").
   */

  updateForm() {
    if (this.appointment()) {
      this.isReadonly = true;
      const appointment_date = this.appointment()?.appointment_date
        ? new Date(this.appointment()!.appointment_date)
            .toISOString()
            .split('T')[0]
        : '';
      this.form.patchValue({
        _id: this.appointment()?._id,
        subscriber: this.appointment()?.subscriber._id,
        vehicle: this.appointment()?.vehicle._id,
        appointment_date: appointment_date,
        appointment_time: this.appointment()?.appointment_time,
        description: this.appointment()?.description,
        notes: this.appointment()?.notes,
        notification_status: this.appointment()?.notification_status,
        isConfirmed: this.appointment()?.isConfirmed,
        valueFilter: this.appointment()?.subscriber.fullName,
      });
    } else {
      const today = new Date();
      const localDate = today.toLocaleDateString('en-CA');
      const localTime = today.toTimeString().slice(0, 5);
      this.form.reset({
        appointment_date: localDate,
        appointment_time: localTime,
        isConfirmed: 'NO',
        notification_status: 'NO',
      });
    }
  }

  /**
   * Maneja el evento de envío del formulario de citas.
   *
   * - Si el formulario es válido, construye un objeto `data` con los valores actuales del formulario.
   * - Si existe una cita activa (`appointment()`), emite el evento `edit` para actualizarla.
   * - En caso contrario, emite el evento `save` para crear una nueva cita.
   */

  onSubmit() {
    if (this.form.valid) {
      const data = { ...this.form.value };
      if (this.appointment()) {
        this.edit.emit(data);
      } else {
        this.save.emit(data);
      }
    }
  }

  /**
   * Método del ciclo de vida de Angular que se ejecuta al destruir el componente.
   * Emite y completa el observable `destroy$` para finalizar correctamente las suscripciones
   * y evitar pérdidas de memoria.
   */

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
