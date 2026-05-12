import { CommonModule } from '@angular/common';
import { Component, effect, input, OnInit, output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToolTipComponent } from '../../../../shared/ui/tool-tip/tool-tip.component';
import { Vehicle } from '../../vehicle-list/vehicle.model';
import { TypeVehicleService } from '../../../data-access/typeVehicle.service';
import { OwnerService } from '../../../../owner/data-access/owner.service';
import Swal from 'sweetalert2';
import { IdentityLookupService } from '../../../../core/services/identity-lookup.service';
import { finalize } from 'rxjs';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';

type filterOwner = {
  _id: string;
  fullName: string;
};
@Component({
  selector: 'app-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToolTipComponent,
    FormsModule,
    SpinnerComponent,
  ],
  templateUrl: './modal.component.html',
  styles: ``,
})

/**
 * Componente modal que gestiona vehículos (creación y edición).
 *
 * - Reactivo, tipado, y controlado externamente mediante inputs y outputs.
 * - Administra la entrada de datos, filtrado, validación y estado visual.
 */
export class ModalComponent implements OnInit {
  isOpen = input<boolean>(false);
  vehicle = input<Vehicle | null>(null);
  closeModal = output<void>();
  save = output<Vehicle>();
  edit = output<Vehicle>();
  types: any[] = [];
  filteredVehicle: any[] = [];
  years: number[] = [];
  vehicleForm: FormGroup;
  filteredOwner: filterOwner[] = [];
  notFoundOwner = false;
  errorMessage = '';
  isReadonly = false;
  load = false;
  vehicleClassMap: Record<string, string> = {
    AUTOMOVIL: 'AUTOS',
    'VEHICULO UTILITARIO': 'CAMIONETA',
    CAMION: 'PESADO',
  };

  /**
   * Constructor del `ModalComponent` para gestionar entidades `Vehicle`.
   *
   * - Inicializa el formulario `vehicleForm` con validadores requeridos para campos clave.
   * - Usa `effect()` para sincronizar la entrada `vehicle` con el formulario.
   * - Escucha cambios en `valueFilter` para activar filtros de propietario en tiempo real.
   *
   * @param fb - `FormBuilder` para construir el formulario reactivo.
   * @param service - Servicio de tipos de vehículo (`TypeVehicleService`) usado para combos.
   * @param serviceOwner - Servicio de propietarios (`OwnerService`) para búsqueda de dueños.
   */
  constructor(
    private fb: FormBuilder,
    private service: TypeVehicleService,
    private serviceOwner: OwnerService,
    private identityService: IdentityLookupService
  ) {
    this.vehicleForm = this.fb.group({
      _id: [''],
      type_veh: ['', Validators.required],
      owner: ['', Validators.required],
      plate: ['', Validators.required],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      year_vehicle: ['', Validators.required],
      chassis_series: [''],
      valueFilter: [''],
    });
    effect(() => {
      this.updateForm();
    });
    this.vehicleForm.get('valueFilter')?.valueChanges.subscribe((value) => {
      const trimedValue = value.trim();
      const intitialValue = this.vehicle()?.owner.fullName;
      if (value === '' || value == null) {
        this.cleanFilter();
        return;
      }
      if (!this.vehicle()) {
        this.filterOwner(value);
      }
      if (trimedValue !== intitialValue) {
        this.filterOwner(value);
      }
    });
  }

  /**
   * Hook de inicialización del componente.
   *
   * - Carga los tipos de vehículo para el combo inicial (`type_veh`).
   */
  ngOnInit() {
    this.getItemsCombo();
  }

  /**
   * Genera un arreglo descendente de años desde el actual hasta 1990.
   *
   * - Se utiliza para poblar el selector de `year_vehicle`.
   */
  generateYears() {
    const currentYear = new Date().getFullYear();
    this.years = Array.from(
      { length: currentYear - 1989 },
      (_, i) => currentYear - i
    );
  }

  /**
   * Reinicia el formulario a estado limpio y aplica el primer tipo por defecto.
   *
   * - Llama a `updateForm()` y `selectFirstType()` para dejarlo sincronizado.
   */
  formReset() {
    this.vehicleForm.reset();
    this.updateForm();
    this.selectFirstType();
  }

  /**
   * Emite el evento para cerrar el modal sin realizar acción.
   */
  onClose() {
    this.closeModal.emit();
  }

  /**
   * Consulta los tipos de vehículo disponibles desde el backend.
   *
   * - Asigna los resultados a `types`.
   * - Aplica por defecto el primer tipo (`selectFirstType()`).
   */
  getItemsCombo() {
    this.service.combo().subscribe(
      (res) => {
        this.types = res.data;
        this.selectFirstType();
      },
      (error) => {
        console.log(error);
      }
    );
  }

  /**
   * Asigna el primer tipo del combo a `type_veh` si existe.
   */
  selectFirstType() {
    if (this.types.length > 0) {
      this.vehicleForm.get('type_veh')?.setValue(this.types[0].name);
    }
  }

  /**
   * Actualiza el formulario con los datos de `vehicle`, si existen.
   *
   * - Si hay entidad, activa modo lectura y precarga el formulario.
   * - Si no, resetea y aplica tipo por defecto.
   */
  updateForm() {
    if (this.vehicle()) {
      this.isReadonly = true;
      this.vehicleForm.patchValue({
        _id: this.vehicle()?._id,
        type_veh: this.vehicle()?.type_veh.name,
        owner: this.vehicle()?.owner._id,
        plate: this.vehicle()?.plate,
        brand: this.vehicle()?.brand,
        model: this.vehicle()?.model,
        year_vehicle: this.vehicle()?.year_vehicle,
        chassis_series: this.vehicle()?.chassis_series,
        valueFilter: this.vehicle()?.owner.fullName,
      });
    } else {
      this.selectFirstType();
      this.vehicleForm.reset({
        _id: '',
        type_veh: '',
        owner: '',
        plate: '',
        brand: '',
        model: '',
        year_vehicle: '',
        chassis_series: '',
        valueFilter: '',
      });
    }
  }

  /**
   * Envía los datos del formulario si es válido.
   *
   * - Emite `edit` si hay entidad cargada.
   * - Si es creación, elimina el `_id` y emite `save`.
   */
  onSubmit() {
    if (this.vehicleForm.valid) {
      const data = { ...this.vehicleForm.value };
      if (this.vehicle()) {
        this.edit.emit(data);
      } else {
        delete data._id;
        this.save.emit(data);
      }
    }
  }

  /**
   * Filtra propietarios por nombre ingresado.
   *
   * - Si hay coincidencias, los asigna a `filteredOwner`.
   * - Si falla, activa `notFoundOwner` y muestra mensaje contextual.
   *
   * @param value - Texto a buscar por nombre.
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
   * Limpia resultados de búsqueda de propietarios y mensajes de error.
   */
  cleanFilter() {
    this.filteredOwner = [];
    this.notFoundOwner = false;
    this.errorMessage = '';
  }

  /**
   * Asigna un propietario seleccionado al formulario.
   *
   * - Setea el `owner._id` en el campo oculto.
   * - Muestra visualmente `owner.fullName` en `valueFilter`.
   *
   * @param owner - Objeto propietario seleccionado desde el dropdown.
   */
  selectOwner(owner: any) {
    this.vehicleForm.get('owner')?.setValue(owner._id);
    this.vehicleForm
      .get('valueFilter')
      ?.setValue(owner.fullName, { emitEvent: false });
    this.filteredOwner = [];
  }

  /**
   * Muestra una confirmación antes de limpiar el formulario.
   *
   * - Si se confirma, llama a `formReset()`.
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

  setVehicleTypeFromClass(vehicleClass: string) {
    const mappedCode = this.vehicleClassMap[vehicleClass];

    if (!mappedCode) return;

    const selectedType = this.types.find((t) => t.name === mappedCode);

    if (selectedType) {
      this.vehicleForm.patchValue({
        type_veh: selectedType.name,
      });
    }
  }

  /**
   * Consulta los datos del vehículo por placa y llena el formulario automáticamente.
   */
  lookupVehicle() {
    const plate = this.vehicleForm.get('plate')?.value;

    if (!plate || plate.length < 6) {
      Swal.fire(
        'Atención',
        'Por favor ingrese una placa válida para buscar.',
        'warning'
      );
      return;
    }

    this.load = true;
    this.identityService
      .getVehicleByPlate(plate)
      .pipe(finalize(() => (this.load = false)))
      .subscribe({
        next: (res) => {
          if (res) {
            this.vehicleForm.patchValue({
              brand: res.data.marca,
              model: res.data.modelo,
              year_vehicle: res.data.anio,
              chassis_series: res.data.chasis,
            });
            this.setVehicleTypeFromClass(res.data.clase);
          }
        },
        error: (err) => {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'No se encontró información para esta placa',
            text: 'Ingrese los datos de forma manual, por favor.',
            showConfirmButton: false,
            timer: 5500,
            timerProgressBar: true,
          });
        },
      });
  }
}
