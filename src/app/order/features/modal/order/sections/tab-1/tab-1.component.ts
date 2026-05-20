import { Component, effect, input, OnInit, output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VehicleService } from '../../../../../../vehicle/data-access/vehicle.service';
import { TypeVehicleService } from '../../../../../../vehicle/data-access/typeVehicle.service';
import { ToolTipComponent } from '../../../../../../shared/ui/tool-tip/tool-tip.component';
import { dataVehicle } from './dataVehicle.model';
import { SpinnerComponent } from '../../../../../../shared/ui/spinner/spinner.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tab-1',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ToolTipComponent,
    SpinnerComponent,
    CommonModule,
  ],
  templateUrl: './tab-1.component.html',
  styles: ``,
})
export class Tab1Component implements OnInit {
  form = input<FormGroup | null>(null);
  valueVehicle = input<string | null>('');
  isEdit = input<boolean>(false);
  readonly = input<boolean>(false);
  vehicle = output<dataVehicle>();
  newVehicle = output<any>();
  cleanModel = output<boolean>();
  statusSel = output<any>();

  filteredVechicle: any[] = [];
  vehicleTypes: any[] = [];
  status = ['Pendiente', 'En Progreso', 'Completada', 'Por Retirar', 'Cancelada'];
  notFound = false;
  errorMessage = '';
  load = false;
  createMode = false;

  newVehicleForm: FormGroup;

  constructor(
    private service: VehicleService,
    private vehicleService: VehicleService,
    private typeVehicleService: TypeVehicleService,
    private fb: FormBuilder
  ) {
    this.newVehicleForm = this.fb.group({
      type_veh: ['', Validators.required],
      plate: ['', Validators.required],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      year_vehicle: [
        '',
        [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)],
      ],
      chassis_series: [''],
    });

    effect(() => {
      if (!this.createMode) {
        this.filterVehicle(this.valueVehicle());
      }
    });
  }

  ngOnInit() {
    this.loadVehicleTypes();
  }

  loadVehicleTypes() {
    this.typeVehicleService.combo().subscribe({
      next: (res) => { this.vehicleTypes = res; },
      error: () => {},
    });
  }

  toggleMode() {
    this.createMode = !this.createMode;
    this.newVehicleForm.reset();
    if (!this.createMode) {
      this.cleanFilter();
    } else {
      this.filteredVechicle = [];
      this.notFound = false;
      this.errorMessage = '';
    }
  }

  filterVehicle(value: string | null) {
    if (value && value.trim()) {
      this.load = true;
      this.service.filter(value.trim()).subscribe(
        (res) => {
          this.load = false;
          this.filteredVechicle = res;
        },
        (error) => {
          this.load = false;
          this.notFound = true;
          this.errorMessage = error.error.message;
        }
      );
    }
  }

  async veifyVehicle(id: string) {
    try {
      this.load = true;
      const res = await this.vehicleService.verifyVehicle(id).toPromise();
      if (res && !res.available) {
        this.load = false;
        await Swal.fire({
          icon: 'warning',
          timer: 1500,
          title: 'Vehículo no disponible',
          text: res.message,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#dc3545',
        });
        return false;
      }
      this.load = false;
      return true;
    } catch (error) {
      this.load = false;
      await Swal.fire({
        icon: 'error',
        timer: 1500,
        title: 'Error de servidor',
        text: 'No se pudo verificar el estado del vehículo.',
        confirmButtonText: 'Cerrar',
      });
      return false;
    }
  }

  async selectedVehicle(_id: string, value: string, model: string, owner: any) {
    const isAvailable = await this.veifyVehicle(_id);
    if (!isAvailable) return;
    this.vehicle.emit({ _id, value, model, owner });
    this.filteredVechicle = [];
  }

  submitNewVehicle() {
    if (this.newVehicleForm.invalid) {
      this.newVehicleForm.markAllAsTouched();
      return;
    }
    this.newVehicle.emit(this.newVehicleForm.value);
    this.newVehicleForm.reset();
    this.createMode = false;
  }

  cleanFilter() {
    this.notFound = false;
    this.errorMessage = '';
    this.filteredVechicle = [];
    this.cleanModel.emit(true);
  }

  onCheckChange(value: any) {
    this.statusSel.emit(value);
  }
}
