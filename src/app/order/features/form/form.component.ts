import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import Swal from 'sweetalert2';
import { ModalServiceComponent } from './modal/modal-service/modal-service.component';
import { TabLogComponent } from '../modal/order/sections/tab-log/tab-log.component';
import { OrderService } from '../../data-access/order.service';
import { VehicleService } from '../../../vehicle/data-access/vehicle.service';
import { TypeVehicleService } from '../../../vehicle/data-access/typeVehicle.service';
import { IdentityLookupService } from '../../../core/services/identity-lookup.service';
import { OwnerService } from '../../../owner/data-access/owner.service';
import { ModalComponent as OwnerModalComponent } from '../../../owner/features/modal/owner/modal.component';
import { Owner } from '../../../owner/features/owner-list/owner.model';
import { LabourService } from '../../../inventory/data-access/labour.service';
import { ProductService } from '../../../inventory/data-access/product.service';
import { Order } from '../order-list/ordern.model';
import { employeeService } from '../../../user/data-access/employee.service';
// Interfaces
interface Vehicle {
  _id: string;
  plate: string;
  model: string;
  year_vehicle?: number;
  owner: Owner;
  hasActiveOrder?: boolean;
}

interface Service {
  _id: string;
  name: string;
  series: string;
  price: number;
  sale_price: number;
  description?: string;
}

interface SparePart {
  _id: string;
  name: string;
  cost: number;
  stock: number;
}

interface ServiceSelection {
  service: Service;
  tabName: string;
  rowIndex: number;
}
interface Mechanic {
  _id: string;
  fullName: string;
  role?: string;
  speciality?: string;
  position?: string;
}
@Component({
  selector: 'app-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ModalServiceComponent,
    TabLogComponent,
    OwnerModalComponent,
  ],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnInit, OnDestroy {
  orderForm!: FormGroup;
  activeTab = 'orderInfo';
  orderId: string | null = null;
  isEditMode = false;
  isLoading = false;
  isFormDisabled = false;
  isSubmitting: boolean = false;

  // Vehicle filtering
  filteredVehicles: Vehicle[] = [];
  showVehicleSuggestions = false;
  selectedVehicle: Vehicle | null = null;

  // Inline vehicle creation
  vehicleCreateMode = false;
  newVehicleForm!: FormGroup;
  vehicleTypes: any[] = [];
  vehicleLookupLoading = false;
  ownerSearchTerm = '';
  ownerSearchResults: any[] = [];
  showOwnerDropdown = false;
  ownerSearchLoading = false;
  private ownerSearchTimer: any = null;
  // Inline owner creation
  ownerCreateMode = false;
  private vehicleClassMap: Record<string, string> = {
    AUTOMOVIL: 'AUTOS',
    'VEHICULO UTILITARIO': 'CAMIONETA',
    CAMION: 'PESADO',
  };

  // Status management
  orderStatuses = [
    'Pendiente',
    'En Progreso',
    'Completada',
    'Por Retirar',
    'Cancelada',
  ];
  paymentMethods: any[] = [
    { label: 'Tarjeta de Credito / Debito', value: 'tarjeta' },
    { label: 'Efectivo', value: 'efectivo' },
    { label: 'Transferencia', value: 'Transferencia' },
    { label: 'Credito', value: 'Credito' },
  ];
  // Modal state for services
  showServiceModal = false;
  modalServices: Service[] = [];
  modalSearchTerm = '';
  modalLoading = false;
  currentModalTab = '';
  currentModalRowIndex = -1;
  title = '';
  noVehiclesFound = false;
  // Service filtering
  filteredServices: { [key: string]: Service[] } = {};
  isLoadingServices: { [key: string]: boolean } = {};
  showServiceDropdown: { [key: string]: boolean } = {};

  // Spare parts filtering
  filteredSpareParts: { [key: string]: SparePart[] } = {};
  isLoadingSpareParts: { [key: string]: boolean } = {};
  showSparePartsDropdown: { [key: string]: boolean } = {};
  minDate!: string;

  assignedMechanics: Mechanic[] = [];
  mechanicSearchTerm = '';
  mechanicSearchResults: Mechanic[] = [];
  showMechanicDropdown = false;
  isLoadingMechanics = false;
  private mechanicSearch$ = new BehaviorSubject<string>('');
  private backupWork: any = null;
  private destroy$ = new Subject<void>();
  private searchSubjects: { [key: string]: BehaviorSubject<string> } = {};

  labourMechanicTerms: { [key: number]: string } = {};
  labourMechanicResults: { [key: number]: any[] } = {};
  showLabourMechanicDrop: { [key: number]: boolean } = {};
  labourMechanicDropPositions: {
    [key: number]: { top: number | null; bottom: number | null; left: number; width: number; maxHeight: number };
  } = {};
  labourPendingMechanic: { [key: number]: { mechanic: any; amount: number | null } | null } = {};
  activeLabourPopover: number | null = null;
  labourPopoverPos: { top: number | null; bottom: number | null; left: number; width: number; maxHeight: number } = {
    top: 0, bottom: null, left: 0, width: 288, maxHeight: 420,
  };
  private labourPopoverBtnRef: HTMLElement | null = null;
  private labourPopoverScrollHandler: (() => void) | null = null;
  private labourMechanicTimers: { [key: number]: any } = {};
  private labourMechanicInputRefs: { [key: number]: HTMLInputElement } = {};
  private labourMechanicScrollHandler: (() => void) | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private orderService: OrderService,
    private vehicleService: VehicleService,
    private typeVehicleService: TypeVehicleService,
    private identityLookupService: IdentityLookupService,
    private ownerService: OwnerService,
    private labourService: LabourService,
    private productService: ProductService,
    private employeeService: employeeService,
  ) {
    this.initializeForm();
    this.newVehicleForm = this.fb.group({
      type_veh: ['', Validators.required],
      plate: ['', Validators.required],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      year_vehicle: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      chassis_series: [''],
    });
  }

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.loadOrderById(this.orderId);
    } else {
      this.generateOrderCode();
      this.addInitialRows();
    }
    this.setupVehicleSearch();
    this.setupMechanicSearch();
    this.loadVehicleTypes();

    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    Object.values(this.searchSubjects).forEach((subject) => {
      if (!subject.closed) {
        subject.complete();
      }
    });
    this.clearBackupData();
    this.filteredVehicles = [];
    this.modalServices = [];
    this.filteredServices = {};
    this.filteredSpareParts = {};
    this._stopLabourMechanicScrollListener();
    this._stopLabourPopoverScrollListener();
    Object.values(this.labourMechanicTimers).forEach((t) => clearTimeout(t));
  }

  clearBackupData(): void {
    this.backupWork = null;
  }
  private initializeForm(): void {
    const currentDate = new Date();
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    this.orderForm = this.fb.group({
      _id: [''],
      _idPreinvoice: [''],
      codigo: [''],
      kmts: [''],
      key_veh: [''],
      plate: [''],
      start_date: [
        currentDate.toISOString().substring(0, 10),
        Validators.required,
      ],
      start_time: [currentTime, Validators.required],
      request: ['', Validators.required],

      // Vehicle filtering and selection
      vehicleFilter: ['', Validators.required],
      model_veh: [''],
      year_veh: [''],
      contact_client_1: [''],
      contact_client_2: [''],
      ownerId: [''],
      vehicleId: [''],
      vehicleData: this.fb.group({
        type_veh: [''], plate: [''], brand: [''],
        model: [''], year_vehicle: [''], chassis_series: [''],
      }),

      // Status and observations
      status: [['Pendiente', 'En Progreso'], Validators.required],
      observation: [''],
      client: [''],
      client_contact: [false],

      // Services arrays
      labours: this.fb.array([]),
      spare_parts: this.fb.array([]),
      spare_parts_extra: this.fb.array([]),

      // Totals
      total_mo: [0],
      total_r: [0],
      subtotal: [0],
      abono: [0],
      paymentM: ['tarjeta'],
      total: [0],

      // Annexes
      createBy: [''],
      delegate: [''],
      identification: [''],
      updatedAt: null,
    });

    // Watch for status changes to handle validation
    this.orderForm
      .get('status')
      ?.valueChanges.subscribe((statuses: string[]) => {
        this.handleStatusChange(statuses);
      });

    // Watch for payment changes to recalculate totals
    this.orderForm.get('abono')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });

    this.orderForm.get('paymentM')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  private addInitialRows(): void {
    this.addLabour();
    this.addSparePart();
    this.addSparePartExtra();
  }

  private generateOrderCode(): void {
    this.orderService.generateCode().subscribe((res) => {
      this.orderForm.patchValue({ codigo: res.nextCode });
    });
  }

  private setupVehicleSearch(): void {
    this.orderForm
      .get('vehicleFilter')
      ?.valueChanges.pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        filter((value) => !!value && value.length > 2),
        tap(() => {
          this.isLoading = true;
          this.filteredVehicles = [];
          this.noVehiclesFound = false;
        }),
        switchMap((value) =>
          this.searchVehicles(value).pipe(
            catchError((err) => {
              this.filteredVehicles = [];
              this.showVehicleSuggestions = true;
              this.noVehiclesFound = true;
              return of([]);
            }),
          ),
        ),
      )
      .subscribe((vehicles: any) => {
        this.filteredVehicles = vehicles;
        this.showVehicleSuggestions = true;
        this.isLoading = false;
        this.noVehiclesFound = vehicles.length === 0;
      });
  }

  private searchVehicles(query: string): any {
    return this.vehicleService.filter(query).pipe(map((res) => res));
  }

  selectVehicle(vehicle: Vehicle): void {
    if (vehicle.hasActiveOrder) {
      Swal.fire({
        title: 'Vehículo no disponible',
        text: 'Este vehículo ya está asociado a una orden activa. No puede ser seleccionado.',
        icon: 'warning',
        timer: 2500,
        timerProgressBar: true,
      });
      return;
    }

    this.selectedVehicle = vehicle;
    this.orderForm.patchValue(
      {
        vehicleFilter: vehicle.owner ? `${vehicle.plate} - ${vehicle.owner.fullName}` : vehicle.plate,
        vehicleId: vehicle._id,
        model_veh: vehicle.model,
        year_veh: vehicle.year_vehicle ?? '',
        ownerId: vehicle.owner ?? null,
        plate: vehicle.plate,
        contact_client_1: vehicle.owner?.cell_phone ?? '',
        contact_client_2: vehicle.owner?.cell_phone_2 ?? '',
        client: vehicle.owner?.fullName ?? 'Sin propietario',
      },
      { emitEvent: false },
    );
    this.showVehicleSuggestions = false;
  }
  loadVehicleTypes(): void {
    this.typeVehicleService.combo().subscribe({
      next: (res) => { this.vehicleTypes = res.data ?? res; },
      error: () => {},
    });
  }

  lookupVehicleByPlate(): void {
    const plate = this.newVehicleForm.get('plate')?.value;
    if (!plate || plate.length < 6) {
      Swal.fire('Atención', 'Ingrese una placa válida (mínimo 6 caracteres) para buscar.', 'warning');
      return;
    }
    this.vehicleLookupLoading = true;
    this.identityLookupService.getVehicleByPlate(plate)
      .pipe(finalize(() => (this.vehicleLookupLoading = false)))
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.newVehicleForm.patchValue({
              brand: res.data.marca,
              model: res.data.modelo,
              year_vehicle: res.data.anio,
              chassis_series: res.data.chasis,
            });
            this.setVehicleTypeFromClass(res.data.clase);
          }
        },
        error: () => {
          Swal.fire({
            toast: true, position: 'top-end', icon: 'info',
            title: 'No se encontró información para esta placa',
            text: 'Ingrese los datos de forma manual.',
            showConfirmButton: false, timer: 4000, timerProgressBar: true,
          });
        },
      });
  }

  private setVehicleTypeFromClass(vehicleClass: string): void {
    const mapped = this.vehicleClassMap[vehicleClass];
    if (!mapped) return;
    const found = this.vehicleTypes.find((t) => t.name === mapped);
    if (found) this.newVehicleForm.patchValue({ type_veh: found.name });
  }

  toggleVehicleMode(): void {
    this.vehicleCreateMode = !this.vehicleCreateMode;
    this.newVehicleForm.reset();
    if (this.vehicleCreateMode) {
      this.filteredVehicles = [];
      this.showVehicleSuggestions = false;
      this.orderForm.patchValue({ vehicleFilter: '', vehicleId: '' }, { emitEvent: false });
    } else {
      this.orderForm.get('vehicleData')?.reset();
    }
  }

  submitNewVehicle(): void {
    if (this.newVehicleForm.invalid) {
      this.newVehicleForm.markAllAsTouched();
      return;
    }
    const vd = this.newVehicleForm.value;
    this.orderForm.patchValue({
      vehicleFilter: vd.plate,
      model_veh: vd.model,
      year_veh: vd.year_vehicle,
      plate: vd.plate,
      vehicleId: '',
      ownerId: '',
      client: 'Sin propietario',
      contact_client_1: '',
      contact_client_2: '',
    }, { emitEvent: false });
    this.orderForm.get('vehicleData')?.setValue(vd, { emitEvent: false });
    this.vehicleCreateMode = false;
    this.newVehicleForm.reset();
  }

  onOwnerInput(): void {
    clearTimeout(this.ownerSearchTimer);
    const term = this.ownerSearchTerm.trim();
    if (!term || term.length < 2) {
      this.ownerSearchResults = [];
      this.showOwnerDropdown = false;
      return;
    }
    this.ownerSearchLoading = true;
    this.ownerSearchTimer = setTimeout(() => {
      this.ownerService.filter(term).subscribe({
        next: (res) => {
          this.ownerSearchResults = res.owners ?? res.data ?? res ?? [];
          this.showOwnerDropdown = this.ownerSearchResults.length > 0;
          this.ownerSearchLoading = false;
        },
        error: () => {
          this.ownerSearchResults = [];
          this.ownerSearchLoading = false;
        },
      });
    }, 300);
  }

  selectOwner(owner: any): void {
    this.orderForm.patchValue({
      ownerId: owner._id,
      client: owner.fullName,
      contact_client_1: owner.cell_phone ?? '',
      contact_client_2: owner.cell_phone_2 ?? '',
    }, { emitEvent: false });
    this.ownerSearchTerm = '';
    this.ownerSearchResults = [];
    this.showOwnerDropdown = false;
  }

  hideOwnerDropdown(): void {
    setTimeout(() => { this.showOwnerDropdown = false; }, 200);
  }

  toggleOwnerCreateMode(): void {
    this.ownerCreateMode = !this.ownerCreateMode;
    if (this.ownerCreateMode) {
      this.ownerSearchTerm = '';
      this.ownerSearchResults = [];
      this.showOwnerDropdown = false;
    }
  }

  onOwnerSaved(data: any): void {
    this.ownerService.create(data).subscribe({
      next: (res: any) => {
        const created = res.subscriber ?? res.data ?? res;
        this.selectOwner({
          _id: created._id,
          fullName: created.fullName ?? data.razon_social,
          cell_phone: created.cell_phone ?? data.cell_phone,
          cell_phone_2: created.cell_phone_2 ?? data.cell_phone_2,
        });
        this.ownerCreateMode = false;
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cliente creado y asignado', showConfirmButton: false, timer: 2500 });
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Error al crear el cliente', text: err?.error?.message ?? 'Inténtalo de nuevo.' });
      },
    });
  }

  clearVehicleSelection(): void {
    this.selectedVehicle = null;
    this.filteredVehicles = [];
    this.showVehicleSuggestions = false;
    this.noVehiclesFound = false;
    this.orderForm.patchValue({
      vehicleFilter: '',
      vehicleId: null,
      model_veh: '',
      year_veh: '',
      ownerId: '',
      plate: '',
      contact_client_1: '',
      contact_client_2: '',
      client: '',
    });
  }

  hideSuggestions(): void {
    setTimeout(() => {
      this.showVehicleSuggestions = false;
    }, 200);
  }

  // Status management
  private handleStatusChange(statuses: string[]): void {
    const currentStatus = statuses[statuses.length - 1];

    if (currentStatus === 'Completada') {
      this.validateCompletedOrder();
    } else if (currentStatus === 'Cancelada') {
      this.handleCancelledOrder();
    }
  }

  private validateCompletedOrder(): void {
    const labours = this.labours.value;
    const spareParts = this.spare_parts.value;

    if (labours.length === 0 || !labours.some((l: any) => l.name)) {
      this.addLabour();
      Swal.fire({
        title: 'Actividad requerida',
        text: 'Recuerde que ebe agregar al menos una actividad para completar la orden.',
        icon: 'warning',
      });
    }

    if (spareParts.length === 0 || !spareParts.some((s: any) => s.product)) {
      this.addSparePart();
      Swal.fire({
        title: 'Repuesto requerido',
        text: 'Recuerde que debe agregar al menos un repuesto para completar la orden.',
        icon: 'warning',
      });
    }
  }

  private handleCancelledOrder(): void {
    if (this.orderId) {
      this.orderService.cancelar(this.orderId).subscribe((res) => {
        this.isFormDisabled = true;
        this.orderForm.disable({ emitEvent: false });
        Swal.fire({
          title: 'Orden Cancelada',
          text: 'Esta orden está en modo de solo lectura.',
          icon: 'info',
          timer: 2000,
        });
      });
    }
  }

  toggleStatus(status: string): void {
    if (this.isFormDisabled) return;

    const currentStatuses = this.orderForm.get('status')?.value || [];
    const statusIndex = currentStatuses.indexOf(status);

    if (statusIndex > -1) {
      currentStatuses.splice(statusIndex, 1);
    } else {
      currentStatuses.push(status);
    }

    this.orderForm.patchValue({ status: currentStatuses });
  }

  isStatusActive(status: string): boolean {
    const currentStatuses = this.orderForm.get('status')?.value || [];
    return currentStatuses.includes(status);
  }

  // Form Arrays getters
  get labours(): FormArray {
    return this.orderForm.get('labours') as FormArray;
  }

  get spare_parts(): FormArray {
    return this.orderForm.get('spare_parts') as FormArray;
  }

  get spare_parts_extra(): FormArray {
    return this.orderForm.get('spare_parts_extra') as FormArray;
  }

  // Labour management
  createLabourGroup(labour?: any): FormGroup {
    const mechanicsArray = this.fb.array(
      (labour?.mechanics ?? []).map((m: any) =>
        this.fb.group({
          employee: [m.employee?._id ?? m.employee ?? ''],
          employeeName: [m.employee?.fullName ?? m.employeeName ?? ''],
          amount: [m.amount ?? 0],
        })
      )
    );

    const group = this.fb.group({
      name: [labour?.name || ''],
      cost: [labour?.cost || 0],
      date: [labour?.date ?? null],
      mechanics: mechanicsArray,
    });

    group.valueChanges.subscribe(() => {
      this.updateValidatorsConditional(
        group,
        ['name', 'cost'],
        ['name', 'cost'],
      );
      this.calculateTotals();
    });

    return group;
  }

  getLabourMechanicsArray(labourIndex: number): FormArray {
    return this.labours.at(labourIndex).get('mechanics') as FormArray;
  }

  getLabourAssigned(labourIndex: number): number {
    const arr = this.getLabourMechanicsArray(labourIndex);
    return arr.controls.reduce(
      (sum, c) => sum + (Number(c.get('amount')?.value) || 0),
      0,
    );
  }

  getLabourRemaining(labourIndex: number): number {
    const cost = Number(this.labours.at(labourIndex).get('cost')?.value) || 0;
    return parseFloat(Math.max(0, cost - this.getLabourAssigned(labourIndex)).toFixed(2));
  }

  cancelPendingMechanic(labourIndex: number): void {
    this.labourPendingMechanic[labourIndex] = null;
  }

  confirmMechanicToLabour(labourIndex: number): void {
    const pending = this.labourPendingMechanic[labourIndex];
    if (!pending) return;

    const amount = Number(pending.amount) || 0;
    const remaining = this.getLabourRemaining(labourIndex);

    if (amount <= 0) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'El monto debe ser mayor a 0', timer: 2000, showConfirmButton: false });
      return;
    }
    if (amount > remaining + 0.001) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: `Excede el disponible ($${remaining.toFixed(2)})`, timer: 2500, showConfirmButton: false });
      return;
    }

    const arr = this.getLabourMechanicsArray(labourIndex);
    if (arr.controls.some(c => c.get('employee')?.value === pending.mechanic._id)) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Este mecánico ya fue agregado', timer: 2000, showConfirmButton: false });
      return;
    }

    arr.push(this.fb.group({
      employee: [pending.mechanic._id],
      employeeName: [pending.mechanic.fullName],
      amount: [amount],
    }));

    if (!this.assignedMechanics.some(m => m._id === pending.mechanic._id)) {
      this.assignedMechanics = [...this.assignedMechanics, {
        _id: pending.mechanic._id,
        fullName: pending.mechanic.fullName,
        role: pending.mechanic.role || pending.mechanic.position,
        speciality: pending.mechanic.speciality,
      }];
    }

    this.labourPendingMechanic[labourIndex] = null;
    this.calculateTotals();
  }

  removeMechanicFromLabour(labourIndex: number, mechanicIndex: number): void {
    const arr = this.getLabourMechanicsArray(labourIndex);
    const removedId = arr.at(mechanicIndex).get('employee')?.value as string;
    arr.removeAt(mechanicIndex);

    if (removedId) {
      const stillUsed = this.labours.controls.some((ctrl) => {
        const mArr = ctrl.get('mechanics') as FormArray;
        return mArr?.controls.some((mc) => mc.get('employee')?.value === removedId);
      });
      if (!stillUsed) {
        this.assignedMechanics = this.assignedMechanics.filter((m) => m._id !== removedId);
      }
    }

    this.calculateTotals();
  }

  addLabour(labour?: any): void {
    this.labours.push(this.createLabourGroup(labour));
  }

  removeLabour(index: number, labour: any): void {
    if (this.labours.length < 1) return;
    if (this.activeLabourPopover === index) this.closeLabourPopover();

    if (labour.value.saved && labour.value._id) {
      Swal.fire({
        title: '¿Deseas eliminar esta actividad?',
        text: `${labour.value.name} - Costo: ${labour.value.cost}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed && this.orderId) {
          this.orderService
            .deleteLabour(this.orderId, labour.value._id)
            .subscribe({
              next: () => {
                this.labours.removeAt(index);
                // Si no queda ninguna fila, agregamos una nueva vacía
                if (this.labours.length === 0) {
                  this.addLabour();
                }
                this.calculateTotals();
                Swal.fire(
                  'Eliminado',
                  'Actividad eliminada correctamente',
                  'success',
                );
              },
              error: (err) => {
                Swal.fire('Error', 'No se pudo eliminar la actividad', 'error');
              },
            });
        }
      });
    } else {
      this.labours.removeAt(index);
      // Si no queda ninguna fila, agregamos una nueva vacía
      if (this.labours.length === 0) {
        this.addLabour();
      }
      this.calculateTotals();
    }
  }

  // Spare parts management
  createSparePartGroup(sparePart?: any): FormGroup {
    const group = this.fb.group({
      _id: [sparePart?._id || ''],
      product: [sparePart?.product || ''],
      amount: [sparePart?.amount || 1],
      sale_price: [sparePart?.sale_price || 0],
    });
    group.valueChanges.subscribe(() => {
      this.updateValidatorsConditional(
        group,
        ['product', 'amount', 'sale_price'],
        ['product', 'amount', 'sale_price'],
      );
      this.calculateTotals();
    });

    return group;
  }

  addSparePart(sparePart?: any): void {
    this.spare_parts.push(this.createSparePartGroup(sparePart));
  }

  removeSparePart(index: number, part: any): void {
    if (this.spare_parts.length < 1) return;

    if (part.value.saved && part.value._id) {
      Swal.fire({
        title: '¿Deseas eliminar este repuesto?',
        text: `${part.value.product} - Cantidad: ${part.value.amount}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed && this.orderId) {
          this.orderService
            .deleteSparePart(this.orderId, part.value._id)
            .subscribe({
              next: () => {
                this.spare_parts.removeAt(index);
                if (this.spare_parts.length === 0) {
                  this.addSparePart();
                }
                this.calculateTotals();
                Swal.fire(
                  'Eliminado',
                  'Repuesto eliminado correctamente',
                  'success',
                );
              },
              error: (err) => {
                Swal.fire('Error', 'No se pudo eliminar el repuesto', 'error');
              },
            });
        }
      });
    } else {
      this.spare_parts.removeAt(index);
      if (this.spare_parts.length === 0) {
        this.addSparePart();
      }
      this.calculateTotals();
    }
  }

  // Extra spare parts management
  createSparePartExtraGroup(sparePartExtra?: any): FormGroup {
    const group = this.fb.group({
      product: [sparePartExtra?.product || ''],
      amount: [sparePartExtra?.amount || 1],
      sale_price: [sparePartExtra?.sale_price || 0],
      applyIncrease: [sparePartExtra?.applyIncrease || false],
    });
    group.valueChanges.subscribe(() => {
      this.updateValidatorsConditional(
        group,
        ['product', 'amount', 'sale_price'],
        ['product', 'amount', 'sale_price'],
      );
      this.calculateTotals();
    });

    return group;
  }

  addSparePartExtra(sparePartExtra?: any): void {
    this.spare_parts_extra.push(this.createSparePartExtraGroup(sparePartExtra));
  }

  removeSparePartExtra(index: number, part: any): void {
    if (this.spare_parts_extra.length < 1) return;

    if (part.value.saved && part.value._id) {
      Swal.fire({
        title: '¿Deseas eliminar este repuesto extra?',
        text: `${part.value.product} - Cantidad: ${part.value.amount}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed && this.orderId) {
          this.orderService
            .deleteSparePartExtra(this.orderId, part.value._id)
            .subscribe({
              next: () => {
                this.spare_parts_extra.removeAt(index);
                if (this.spare_parts_extra.length === 0) {
                  this.addSparePartExtra();
                }
                this.calculateTotals();
                Swal.fire(
                  'Eliminado',
                  'Repuesto extra eliminado correctamente',
                  'success',
                );
              },
              error: (err) => {
                Swal.fire(
                  'Error',
                  'No se pudo eliminar el repuesto extra',
                  'error',
                );
              },
            });
        }
      });
    } else {
      this.spare_parts_extra.removeAt(index);
      if (this.spare_parts_extra.length === 0) {
        this.addSparePartExtra();
      }
      this.calculateTotals();
    }
  }

  // Service filtering for labours
  filterServices(event: Event, tabName: string, rowIndex: number): void {
    this.isLoading = true;
    const key = `${tabName}_${rowIndex}`;
    const value = (event.target as HTMLInputElement).value;
    if (!value) {
      this.isLoading = false;
      return;
    }
    this.setupServiceSearchForRow(key);
    this.searchSubjects[key].next(value);
  }

  private setupServiceSearchForRow(key: string): void {
    if (this.searchSubjects[key]) return;

    this.searchSubjects[key] = new BehaviorSubject<string>('');
    this.searchSubjects[key]
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm: string) => {
          if (!searchTerm || searchTerm.length < 1) {
            this.filteredServices[key] = [];
            this.isLoadingServices[key] = false;
            return of([]);
          }

          this.isLoadingServices[key] = true;
          return this.labourService.filterLabours(searchTerm).pipe(
            catchError(() => {
              this.isLoadingServices[key] = false;
              return of([]);
            }),
          );
        }),
      )
      .subscribe((services: any) => {
        this.filteredServices[key] = services.labours;
        this.isLoadingServices[key] = false;
        this.isLoading = false;
        if (services.labours.length > 0) {
          this.openServiceModal(
            'Actividad',
            key,
            this.searchSubjects[key].getValue(),
            services.labours,
          );
        }
      });
  }

  // Spare parts filtering
  filterSpareParts(event: Event, tabName: string, rowIndex: number): void {
    this.isLoading = true;
    const key = `${tabName}_${rowIndex}`;
    const value = (event.target as HTMLInputElement).value;
    if (!value) {
      this.isLoading = false;
      return;
    }
    this.setupSparePartSearchForRow(key);
    this.searchSubjects[key].next(value);
  }

  private setupSparePartSearchForRow(key: string): void {
    if (this.searchSubjects[key]) return;

    this.searchSubjects[key] = new BehaviorSubject<string>('');
    this.searchSubjects[key]
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm: string) => {
          if (!searchTerm || searchTerm.length < 1) {
            this.filteredSpareParts[key] = [];
            this.isLoadingSpareParts[key] = false;
            return of([]);
          }

          this.isLoadingSpareParts[key] = true;
          return this.productService.filterProducts(searchTerm).pipe(
            catchError(() => {
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: `No se encontro el producto ${searchTerm}`,
                showConfirmButton: false,
                timer: 2750,
                timerProgressBar: true,
              });
              this.isLoading = false;
              this.isLoadingServices[key] = false;
              return of([]);
            }),
          );
        }),
      )
      .subscribe((spareParts: any) => {
        this.filteredSpareParts[key] = spareParts.products;
        this.isLoadingSpareParts[key] = false;
        this.showSparePartsDropdown[key] = spareParts.products.length > 0;

        if (spareParts.products.length > 0) {
          const servicesForModal: Service[] = spareParts.products.map(
            (part: any) => ({
              _id: part._id,
              name: `${part.series}-${part.name}`,
              sale_price: part.sale_price,
              description: `Stock: ${part.stock}`,
            }),
          );
          this.isLoading = false;
          this.openServiceModal(
            'Repuesto',
            key,
            this.searchSubjects[key].getValue(),
            servicesForModal,
          );
        }
      });
  }

  selectSparePart(
    sparePart: SparePart,
    formGroup: AbstractControl,
    tabName: string,
    rowIndex: number,
  ): void {
    const fg = formGroup as FormGroup;
    const key = `${tabName}_${rowIndex}`;

    fg.patchValue({
      name: sparePart.name,
      sale_price: sparePart.cost,
    });

    this.filteredSpareParts[key] = [];
    this.showSparePartsDropdown[key] = false;
  }

  // Modal management
  openServiceModal(
    title: string,
    key: string,
    searchTerm: string,
    services: Service[],
  ): void {
    const lastUnderscoreIndex = key.lastIndexOf('_');
    const tabName = key.substring(0, lastUnderscoreIndex);
    const rowIndexStr = key.substring(lastUnderscoreIndex + 1);
    const rowIndex = Number.parseInt(rowIndexStr, 10);

    this.title = title;
    this.currentModalTab = tabName;
    this.currentModalRowIndex = rowIndex;
    this.modalSearchTerm = searchTerm;
    this.modalServices = services;
    this.modalLoading = false;
    this.showServiceModal = true;
  }

  onServiceSelected(selection: ServiceSelection): void {
    const formArray = this.getFormArrayByTabName(selection.tabName);
    if (formArray && formArray.at(selection.rowIndex)) {
      const formGroup = formArray.at(selection.rowIndex) as FormGroup;

      if (selection.tabName === 'labours') {
        formGroup.patchValue({
          name: selection.service.name,
          cost: selection.service.price,
        });
      } else if (selection.tabName === 'spare_parts') {
        const selectedId = selection.service._id;

        // Revisar si el repuesto ya está en alguna otra fila, excluyendo la fila actual
        const isAlreadyAdded = this.spare_parts.controls.some(
          (control, index) => {
            return (
              index !== selection.rowIndex &&
              control.get('_id')?.value === selectedId
            );
          },
        );
        if (isAlreadyAdded) {
          // Si ya está agregado, muestra una alerta y no actualiza la fila
          Swal.fire({
            icon: 'warning',
            title: 'Repuesto Duplicado',
            text: `El repuesto "${selection.service.name}" ya ha sido agregado a la orden.`,
            confirmButtonColor: '#ffc107',
            timer: 3000,
          });
          formGroup.get('product')?.setValue('');
          // Cierra el modal, pero no actualiza la fila
          this.onServiceModalClosed(); // Llama a la función de cierre del modal
          return; // Detiene la ejecución
        }
        formGroup.patchValue({
          _id: selection.service._id,
          product: selection.service.name,
          sale_price: selection.service.sale_price,
        });
      }
      this.calculateTotals();
    }

    this.showServiceModal = false;
  }

  onServiceModalClosed(): void {
    this.showServiceModal = false;
    this.modalServices = [];
    this.modalSearchTerm = '';
    this.currentModalTab = '';
    this.currentModalRowIndex = -1;
  }

  private getFormArrayByTabName(tabName: string): FormArray | null {
    switch (tabName) {
      case 'labours':
        return this.labours;
      case 'spare_parts':
        return this.spare_parts;
      default:
        return null;
    }
  }

  // Calculations
  private calculateTotals(): void {
    const paymentMethod = this.orderForm.get('paymentM')?.value;
    const isCardPayment = paymentMethod === 'tarjeta';

    let laboursTotal = this.labours.value.reduce(
      (sum: number, labour: any) => sum + (Number(labour.cost) || 0),
      0,
    );

    if (isCardPayment) {
      laboursTotal = laboursTotal * 1.1;
    }

    let sparePartsTotal = this.spare_parts.value.reduce(
      (sum: number, part: any) =>
        sum + (part.amount || 0) * (part.sale_price || 0),
      0,
    );

    if (isCardPayment) {
      sparePartsTotal = sparePartsTotal * 1.1;
    }

    const sparePartsExtraTotal = this.spare_parts_extra.value.reduce(
      (sum: number, part: any) => {
        let partTotal = (part.amount || 0) * (part.sale_price || 0);

        if (part.applyIncrease) {
          partTotal = partTotal * 1.1;
        }
        return sum + partTotal;
      },
      0,
    );

    const totalRepuestos = sparePartsTotal + sparePartsExtraTotal;
    const subtotal = laboursTotal + totalRepuestos;
    const abono = this.orderForm.get('abono')?.value || 0;
    const total = subtotal - abono;

    this.orderForm.patchValue(
      {
        total_mo: laboursTotal,
        total_r: totalRepuestos,
        subtotal: subtotal,
        total: total,
      },
      { emitEvent: false },
    );
  }

  // Tab management
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Form submission
  onSubmit(): void {
    if (this.orderForm.valid) {
      const formData = this.orderForm.value;

      if (this.orderId) {
        this.updateOrder(formData);
      } else {
        this.createOrder(formData);
      }
    } else {
      this.orderForm.markAllAsTouched();
      Swal.fire({
        title: 'Campos inválidos',
        text: 'Por favor, completa todos los campos requeridos.',
        icon: 'error',
        timer: 2500,
      });
    }
  }
  private buildOrderPayload(formValue: any): any {
    return {
      _id: formValue._id,
      codigo: formValue.codigo,
      kmts: formValue.kmts,
      key_veh: formValue.key_veh,
      status: formValue.status,
      start_date: formValue.start_date,
      start_time: formValue.start_time,
      request: formValue.request,
      mechanics: this.assignedMechanics.map((m) => m._id),
      labour: formValue.labours
        .filter((item: any) => item.name)
        .map((item: any) => ({
          name: item.name,
          cost: item.cost || 0,
          date: item.date ?? new Date(),
          mechanics: (item.mechanics || [])
            .filter((m: any) => m.employee)
            .map((m: any) => ({ employee: m.employee, amount: m.amount || 0 })),
        })),

      spare_parts: formValue.spare_parts
        .filter((item: any) => item.product)
        .map((item: any) => ({
          name: item.product,
          product: item._id,
          amount: item.amount,
          sale_price: item.sale_price,
        })),

      spare_parts_extra: formValue.spare_parts_extra
        .filter((item: any) => item.product)
        .map((item: any) => ({
          product: item.product,
          amount: item.amount,
          sale_price: item.sale_price,
          applyIncrease: item.applyIncrease,
        })),

      preInvoice: {
        _id: formValue._idPreinvoice,
        subscriber: formValue.ownerId || null,
        vehicle: formValue.vehicleId || null,
        ...(!formValue.vehicleId && formValue.vehicleData?.plate
          ? { vehicleData: formValue.vehicleData }
          : {}),
        total_inventory: formValue.total_r,
        total_labour: formValue.total_mo,
        sub_total: formValue.subtotal,
        abono: formValue.abono,
        paymentM: formValue.paymentM,
        total: formValue.total,
      },

      observation: formValue.observation,
      contact_client: !!formValue.client_contact,
      updatedAt: formValue.updatedAt,
    };
  }

  private createOrder(data: any): void {
    this.isSubmitting = true;
    const payload = this.buildOrderPayload(data);

    this.orderService.create(payload).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: 'Orden creada',
          text: 'La orden se ha registrado exitosamente',
          confirmButtonColor: '#3085d6',
          timer: 3000,
          timerProgressBar: true,
        }).then(() => {
          this.router.navigate(['/order']);
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear la orden. Inténtalo de nuevo.',
          confirmButtonColor: '#d33',
        });
        this.isSubmitting = false;
      },
    });
  }

  private updateOrder(data: any): void {
    this.isSubmitting = true;
    const payload = this.buildOrderPayload(data);

    this.orderService.update(payload).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: 'Orden Actualizada',
          text: 'La orden se ha actualizado exitosamente',
          confirmButtonColor: '#3085d6',
          timer: 3000,
          timerProgressBar: true,
        }).then(() => {
          window.location.reload();
        });
      },
      error: (err) => {
        this.isSubmitting = false; // Importante resetear aquí

        // Si el error es de concurrencia (409)
        if (err.status === 409) {
          this.handleConcurrencyError();
        } else {
          Swal.fire({
            icon: 'error',
            title: err?.error?.title || 'Error',
            text: err?.error?.message || 'Ha ocurrido un error inesperado.',
            confirmButtonColor: '#d33',
          });
        }
      },
    });
  }

  private setActiveTabAutomatically(): void {
    const laboursArray = this.labours.controls;
    const sparesArray = this.spare_parts.controls;
    const extrasArray = this.spare_parts_extra.controls;

    if (
      laboursArray.some((l) => l.get('saved')?.value || l.get('name')?.value)
    ) {
      this.activeTab = 'labours';
    } else if (
      sparesArray.some((s) => s.get('saved')?.value || s.get('product')?.value)
    ) {
      this.activeTab = 'spare_parts';
    } else if (
      extrasArray.some((e) => e.get('saved')?.value || e.get('product')?.value)
    ) {
      this.activeTab = 'spare_parts_extra';
    } else {
      this.activeTab = 'labours'; // fallback si no hay datos
    }
  }
  private formatDateForInput(date: string | Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private patchOrderForm(order: Order): void {
    const sub: any = order.preInvoice.subscriber;
    this.orderForm.patchValue(
      {
        _id: order._id,
        codigo: order.codigo,
        kmts: order.kmts,
        key_veh: order.key_veh,
        plate: order.preInvoice.vehicle.plate,
        start_date: this.formatDateForInput(order.start_date),
        start_time: order.start_time,
        request: order.request,
        vehicleFilter: sub
          ? `${order.preInvoice.vehicle.plate}-${sub.fullName}`
          : order.preInvoice.vehicle.plate,
        model_veh: order.preInvoice.vehicle.model,
        year_veh: order.preInvoice.vehicle.year_vehicle ?? '',
        contact_client_1: sub?.cell_phone ?? '',
        contact_client_2: sub?.cell_phone_2 ?? '',
        ownerId: sub?._id ?? '',
        vehicleId: order.preInvoice.vehicle._id,
        status: order.status,
        observation: order.observation,
        client: sub?.fullName ?? 'Sin propietario',
        client_contact: order.contact_client,
        total_mo: order.preInvoice?.total_labour,
        total_r: order.preInvoice?.total_inventory,
        subtotal: order.preInvoice?.sub_total,
        abono: order.preInvoice?.abono,
        paymentM: order.preInvoice?.paymentM,
        total: order.preInvoice?.total,
        _idPreinvoice: order.preInvoice._id,
        createBy: order.created_by,
        delegate: order.retiro?.delegate,
        identification: order.retiro?.number_identification,
        updatedAt: order.updatedAt,
      },
      { emitEvent: false },
    );
    if ((order as any).mechanics && Array.isArray((order as any).mechanics)) {
      this.assignedMechanics = (order as any).mechanics.map((m: any) => ({
        _id: m._id || m,
        fullName: m.fullName || m.name || 'Mecánico',
        role: m.role || m.position,
        speciality: m.speciality,
      }));
    }
    this.labourMechanicTerms = {};
    const laboursFG =
      order.labour?.map((item: any) => {
        let mechanicsFG: FormGroup[];
        if (item.mechanics?.length > 0) {
          mechanicsFG = item.mechanics.map((m: any) =>
            this.fb.group({
              employee: [m.employee?._id ?? m.employee ?? ''],
              employeeName: [m.employee?.fullName ?? ''],
              amount: [m.amount ?? 0],
            })
          );
        } else if (item.employee) {
          // Formato legado: campo employee único → convertir a array mechanics
          const empId = item.employee?._id ?? item.employee ?? '';
          const empName = item.employee?.fullName ?? '';
          mechanicsFG = [
            this.fb.group({
              employee: [empId],
              employeeName: [empName],
              amount: [item.cost ?? 0],
            }),
          ];
          if (empId && !this.assignedMechanics.some((m) => m._id === empId)) {
            this.assignedMechanics.push({
              _id: empId,
              fullName: empName,
              role: (item.employee as any)?.position,
            });
          }
        } else {
          mechanicsFG = [];
        }
        return this.fb.group({
          _id: [item._id],
          name: [item.name],
          cost: [item.cost],
          saved: [true],
          date: [item.date ?? null],
          mechanics: this.fb.array(mechanicsFG),
        });
      }) || [];
    if (!laboursFG.length) laboursFG.push(this.createLabourGroup());
    this.orderForm.setControl('labours', this.fb.array(laboursFG));

    const sparesFG =
      order.spare_parts?.map((item: any) =>
        this.fb.group({
          _id: [item.product._id], // referencia al id de producto
          product: [item.name || `${item.product.series}-${item.product.name}`],
          amount: [item.amount],
          sale_price: [item.sale_price],
          saved: [true], // marcado como guardado
        }),
      ) || [];
    if (!sparesFG.length) sparesFG.push(this.createSparePartGroup());
    this.orderForm.setControl('spare_parts', this.fb.array(sparesFG));

    const extraFG =
      order.spare_parts_extra?.map((item: any) =>
        this.fb.group({
          _id: [item._id],
          product: [item.product],
          amount: [item.amount],
          sale_price: [item.sale_price],
          applyIncrease: [item.applyIncrease],
          saved: [true], // marcado como guardado
        }),
      ) || [];
    if (!extraFG.length) extraFG.push(this.createSparePartExtraGroup());
    this.orderForm.setControl('spare_parts_extra', this.fb.array(extraFG));
    this.setActiveTabAutomatically();
    this.disableFormArrays();
    this.isLoading = false;
  }
  private disableFormArrays(): void {
    for (const group of this.labours.controls) {
      (group as FormGroup).disable();
    }
    for (const group of this.spare_parts.controls) {
      (group as FormGroup).disable();
    }
    for (const group of this.spare_parts_extra.controls) {
      (group as FormGroup).disable();
    }
  }

  private loadOrderById(id: string): void {
    this.isLoading = true;
    this.isEditMode = true;
    this.isFormDisabled = true;
    this.orderForm.disable();
    this.orderService.getById(id).subscribe((res) => {
      this.patchOrderForm(res);
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.orderForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  enableEditMode(): void {
    this.isFormDisabled = false;
    this.orderForm.enable({ emitEvent: false });
    Swal.fire({
      title: 'Modo Edición Activado',
      icon: 'info',
      timer: 1500,
      timerProgressBar: true,
    });
  }

  onEdit(): void {
    if (!this.orderId) {
      this.enableEditMode();
      return;
    }

    this.isLoading = true;

    this.orderService.checkConcurrency(this.orderId).subscribe({
      next: (dbOrder) => {
        this.isLoading = false;
        const loadedUpdatedAt = this.orderForm.get('updatedAt')?.value;
        const dbUpdatedAt = dbOrder.updatedAt;

        if (loadedUpdatedAt !== dbUpdatedAt) {
          Swal.fire({
            title: 'Cambios detectados',
            html: 'La orden fue modificada por otro usuario.<br>Recargue la página para evitar sobrescribir información.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Recargar ahora',
            cancelButtonText: 'Permanecer',
            confirmButtonColor: '#0D9488',
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.reload();
            }
          });
        } else {
          this.enableEditMode();
        }
      },
      error: () => {
        this.isLoading = false;
        Swal.fire(
          'Error',
          'No se pudo verificar la versión de la orden.',
          'error',
        );
      },
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/order/New']);
  }
  hasSpareParts(key: string): boolean {
    return (
      !!this.showSparePartsDropdown[key] &&
      (this.filteredSpareParts[key]?.length ?? 0) > 0
    );
  }

  formatDecimal(
    arrayName: 'labours' | 'spare_parts' | 'spare_parts_extra',
    index: number,
    controlName: string,
  ): void {
    const formArray = this.orderForm.get(arrayName) as FormArray;
    const control = formArray.at(index).get(controlName);

    let value = control?.value;

    if (value !== null && value !== undefined && value !== '') {
      // Normalizar coma a punto
      value = value.toString().replace(',', '.');

      const num = parseFloat(value);

      if (!isNaN(num)) {
        // Siempre mostrar 2 decimales
        control?.setValue(num.toFixed(2), { emitEvent: false });
      }
      this.calculateTotals();
    }
  }

  applyIncreaseExtra(index: number) {
    const part = this.spare_parts_extra.at(index);
    if (!part.get('applyIncrease')?.value) {
      part.patchValue({
        applyIncrease: true,
      });
    } else {
      part.patchValue({
        applyIncrease: false,
      });
    }

    this.calculateTotals();
  }

  private updateValidatorsConditional(
    group: FormGroup,
    fields: string[], // Campos a validar (ej: ['name', 'amount', 'sale_price'])
    requiredIfNotEmpty: string[], // Campos que disparan la validación si tienen valor
  ): void {
    // Verificar si hay algún valor en los campos disparadores
    const shouldBeRequired = requiredIfNotEmpty.some((field) => {
      const value = group.get(field)?.value;
      return (
        value !== null &&
        value !== undefined &&
        value.toString().trim() !== '' &&
        value !== 0
      );
    });

    // Aplicar o limpiar validadores según corresponda
    fields.forEach((field) => {
      if (shouldBeRequired) {
        // Definir validadores según el tipo de campo
        const control = group.get(field);
        if (field === 'name') {
          control?.setValidators([Validators.required]);
        } else if (field === 'amount') {
          control?.setValidators([Validators.required, Validators.min(1)]);
        } else if (field === 'sale_price' || field === 'cost') {
          control?.setValidators([Validators.required, Validators.min(0)]);
        }
      } else {
        group.get(field)?.clearValidators();
      }
      group.get(field)?.updateValueAndValidity({ emitEvent: false });
    });
  }
  // Verifica si alguna fila de labours es inválida
  hasInvalidLabours(): boolean {
    return this.labours.controls.some((control) => control.invalid);
  }

  // Verifica si alguna fila de repuestos es inválida
  hasInvalidSpareParts(): boolean {
    return this.spare_parts.controls.some((control) => control.invalid);
  }

  // Verifica si alguna fila de repuestos extra es inválida
  hasInvalidSparePartsExtra(): boolean {
    return this.spare_parts_extra.controls.some((control) => control.invalid);
  }

  get isCancelled(): boolean {
    return (
      Array.isArray(this.orderForm.get('status')?.value) &&
      this.orderForm.get('status')?.value.includes('Cancelada')
    );
  }

  handleConcurrencyError(): void {
    Swal.fire({
      title: 'Datos desactualizados',
      text: 'Otro usuario ha modificado esta orden mientras tú editabas. Necesitas traer los datos más recientes del servidor.',
      icon: 'warning',
      confirmButtonText: 'Actualizar ahora',
      confirmButtonColor: '#0D9488',
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.refreshOrderData();
      }
    });
  }
  syncArray(
    currentArray: FormArray,
    backupRows: any[],
    identityFn: (item: any) => any,
    addFn: (data: any) => void,
  ) {
    const rows = backupRows ?? [];

    rows.forEach((backupItem) => {
      const idValue = identityFn(backupItem);
      if (!backupItem || !idValue) return;

      const existingControl = currentArray.controls.find(
        (control) =>
          identityFn(control.value).toString().trim() ===
          idValue.toString().trim(),
      );

      if (existingControl) {
        existingControl.patchValue(
          {
            ...backupItem,
          },
          { emitEvent: false },
        );
      } else {
        addFn(backupItem);
      }
    });
  }
  mergeFormArrays(backup: any) {
    this.syncArray(
      this.labours,
      backup.labours,
      (item) => item.name,
      (data) => this.addLabour(data),
    );

    this.syncArray(
      this.spare_parts,
      backup.spare_parts,
      (item) => item.product,
      (data) => this.addSparePart(data),
    );

    this.syncArray(
      this.spare_parts_extra,
      backup.spare_parts_extra,
      (item) => item.product,
      (data) => this.addSparePartExtra(data),
    );
  }
  restoreUserWork(backupWork: any, newServerVersion: any) {
    this.enableEditMode();

    const { labours, spare_parts, spare_parts_extra, ...simpleFields } =
      backupWork;

    this.orderForm.patchValue(
      {
        ...simpleFields,
        updatedAt: newServerVersion,
      },
      { emitEvent: false },
    );

    this.mergeFormArrays(backupWork);

    this.calculateTotals();

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Cambios Mezclados',
      text: 'Se han mantenido tus ediciones junto a los cambios del servidor',
      timer: 2500,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }

  rebuildFormArraysFromBackup(backup: any) {
    const laboursArray = this.fb.array(
      backup.labours.map((l: any) => this.createLabourGroup(l)),
    );
    this.orderForm.setControl('labours', laboursArray);

    const sparesArray = this.fb.array(
      backup.spare_parts.map((s: any) => this.createSparePartGroup(s)),
    );
    this.orderForm.setControl('spare_parts', sparesArray);

    const extrasArray = this.fb.array(
      backup.spare_parts_extra.map((e: any) =>
        this.createSparePartExtraGroup(e),
      ),
    );
    this.orderForm.setControl('spare_parts_extra', extrasArray);
  }

  promptRestoreWork(backupWork: any, newServerVersion: Date) {
    Swal.fire({
      title: '¿Recuperar cambios previos?',
      text: 'Detectamos que tenías cambios sin guardar. ¿Deseas restaurar tus datos sobre la versión actualizada del servidor?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar mi trabajo',
      cancelButtonText: 'No, dejar versión del servidor',
      confirmButtonColor: '#0D9488',
    }).then((result) => {
      if (result.isConfirmed) {
        this.restoreUserWork(backupWork, newServerVersion);
      }
    });
  }

  hasNewItems(dirtyData: any): boolean {
    return (
      this.labours.length > 1 ||
      this.spare_parts.length > 1 ||
      this.spare_parts_extra.length > 1
    );
  }
  getDirtyValues(form: FormGroup): any {
    const dirtyValues: any = {};
    Object.keys(form.controls).forEach((key) => {
      const currentControl = form.get(key);
      if (currentControl?.dirty) {
        dirtyValues[key] = currentControl.value;
      }
    });
    return dirtyValues;
  }
  refreshOrderData(): void {
    if (!this.orderId) return;
    this.backupWork = this.orderForm.getRawValue();

    this.isLoading = true;
    this.orderService.getById(this.orderId).subscribe({
      next: (serverOrder) => {
        this.patchOrderForm(serverOrder);

        const hasSomethingToRestore =
          this.backupWork.labours?.length > 0 ||
          this.backupWork.spare_parts?.length > 0 ||
          this.backupWork.spare_parts_extra?.length > 0;

        if (hasSomethingToRestore) {
          this.promptRestoreWork(this.backupWork, serverOrder.updatedAt);
        }
      },
      error: () => {
        this.isLoading = false;
        Swal.fire('Error', 'No se pudo sincronizar.', 'error');
      },
    });
  }
  private setupMechanicSearch(): void {
    this.mechanicSearch$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300), // Espera 300ms a que el usuario termine de escribir
        distinctUntilChanged(), // Solo continúa si el texto realmente cambió
        switchMap((term) => {
          // Si el input está vacío o tiene menos de 2 letras, limpiamos y no buscamos
          if (!term || term.length < 2) {
            this.mechanicSearchResults = [];
            this.isLoadingMechanics = false;
            this.showMechanicDropdown = false;
            return of([]);
          }

          this.isLoadingMechanics = true;

          return this.employeeService.filterMechanics(term).pipe(
            catchError((error) => {
              console.error('Error al buscar mecánicos:', error);
              return of([]);
            }),
          );
        }),
      )
      .subscribe((res: any) => {
        const mechanics = res.employees || res.data || res || [];

        this.mechanicSearchResults = (mechanics as any[])
          .map((m: any) => ({
            _id: m._id,
            fullName: m.fullName,
            role: m.role || m.position,
            speciality: m.speciality,
          }))
          .filter((m) => !this.assignedMechanics.some((a) => a._id === m._id));

        this.isLoadingMechanics = false;
        this.showMechanicDropdown = this.mechanicSearchResults.length > 0;
      });
  }

  onMechanicSearchInput(): void {
    if (this.isFormDisabled) return;
    this.mechanicSearch$.next(this.mechanicSearchTerm);
    this.showMechanicDropdown = false;
  }

  hideMechanicDropdown(): void {
    setTimeout(() => {
      this.showMechanicDropdown = false;
    }, 200);
  }

  addMechanic(mechanic: Mechanic): void {
    if (this.isFormDisabled) return;
    if (!this.assignedMechanics.some((m) => m._id === mechanic._id)) {
      this.assignedMechanics = [...this.assignedMechanics, mechanic];
    }
    this.mechanicSearchTerm = '';
    this.mechanicSearchResults = [];
    this.showMechanicDropdown = false;
  }

  removeMechanic(mechanicId: string): void {
    if (this.isFormDisabled) return;

    const mechanic = this.assignedMechanics.find((m) => m._id === mechanicId);
    const labourCount = this.labours.controls.filter((ctrl) => {
      const mArr = ctrl.get('mechanics') as FormArray;
      return mArr?.controls.some((mc) => mc.get('employee')?.value === mechanicId);
    }).length;

    const text = labourCount > 0
      ? `${mechanic?.fullName ?? 'El mecánico'} está asignado en ${labourCount} mano${labourCount > 1 ? 's' : ''} de obra. Al quitarlo se eliminará de todas ellas.`
      : 'El mecánico será removido de esta orden.';

    Swal.fire({
      title: '¿Quitar mecánico?',
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0D9488',
    }).then((result) => {
      if (result.isConfirmed) {
        this.assignedMechanics = this.assignedMechanics.filter((m) => m._id !== mechanicId);

        for (const labourCtrl of this.labours.controls) {
          const mArr = labourCtrl.get('mechanics') as FormArray;
          if (!mArr) continue;
          for (let i = mArr.length - 1; i >= 0; i--) {
            if (mArr.at(i).get('employee')?.value === mechanicId) {
              mArr.removeAt(i);
            }
          }
        }

        this.calculateTotals();
      }
    });
  }

  replaceMechanic(mechanicId: string): void {
    if (this.isFormDisabled) return;
    this.removeMechanic(mechanicId);
    // Focus mechanic search after removal
    setTimeout(() => {
      const input = document.getElementById('mechanic-search');
      if (input) input.focus();
    }, 400);
  }

  getMechanicInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  get popoverIdx(): number {
    return this.activeLabourPopover ?? 0;
  }

  openLabourPopover(index: number, btn: HTMLElement): void {
    if (this.activeLabourPopover === index) {
      this.closeLabourPopover();
      return;
    }
    this.activeLabourPopover = index;
    this.labourPopoverBtnRef = btn;
    this._recalcLabourPopoverPos();
    this._startLabourPopoverScrollListener();
  }

  closeLabourPopover(): void {
    this.activeLabourPopover = null;
    this.labourPopoverBtnRef = null;
    this._stopLabourPopoverScrollListener();
  }

  private _recalcLabourPopoverPos(): void {
    const btn = this.labourPopoverBtnRef;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const w = 288;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openAbove = spaceBelow < 280 && spaceAbove > spaceBelow;
    let left = rect.left;
    if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
    this.labourPopoverPos = {
      top: openAbove ? null : rect.bottom + 4,
      bottom: openAbove ? window.innerHeight - rect.top + 4 : null,
      left,
      width: w,
      maxHeight: Math.min(420, openAbove ? spaceAbove : spaceBelow),
    };
  }

  private _startLabourPopoverScrollListener(): void {
    if (this.labourPopoverScrollHandler) return;
    this.labourPopoverScrollHandler = () => this._recalcLabourPopoverPos();
    window.addEventListener('scroll', this.labourPopoverScrollHandler, true);
    window.addEventListener('resize', this.labourPopoverScrollHandler);
  }

  private _stopLabourPopoverScrollListener(): void {
    if (!this.labourPopoverScrollHandler) return;
    window.removeEventListener('scroll', this.labourPopoverScrollHandler, true);
    window.removeEventListener('resize', this.labourPopoverScrollHandler);
    this.labourPopoverScrollHandler = null;
  }

  onLabourMechanicInput(index: number): void {
    if (this.isFormDisabled) return;
    const term = this.labourMechanicTerms[index] || '';
    clearTimeout(this.labourMechanicTimers[index]);
    this.labourMechanicResults[index] = [];
    this.showLabourMechanicDrop[index] = false;

    if (!term) {
      this.labours.at(index).get('employee')?.setValue('', { emitEvent: false });
      this.labours.at(index).get('employeeName')?.setValue('', { emitEvent: false });
      return;
    }

    if (term.length < 2) return;

    this.labourMechanicTimers[index] = setTimeout(() => {
      this.employeeService.filterMechanics(term).subscribe({
        next: (res: any) => {
          const list = res.employees || res.data || res || [];
          this.labourMechanicResults[index] = list;
          this.showLabourMechanicDrop[index] = list.length > 0;
        },
        error: () => {
          this.labourMechanicResults[index] = [];
        },
      });
    }, 300);
  }

  selectLabourMechanic(index: number, mechanic: any): void {
    this.labourMechanicTerms[index] = '';
    this.labourMechanicResults[index] = [];
    this.showLabourMechanicDrop[index] = false;
    const defaultAmount = this.getLabourRemaining(index);
    this.labourPendingMechanic[index] = { mechanic, amount: defaultAmount > 0 ? defaultAmount : null };
  }

  hideLabourMechanicDrop(index: number): void {
    setTimeout(() => {
      this.showLabourMechanicDrop[index] = false;
      delete this.labourMechanicInputRefs[index];
      if (Object.keys(this.labourMechanicInputRefs).length === 0) {
        this._stopLabourMechanicScrollListener();
      }
    }, 200);
  }

  updateLabourMechanicDropPosition(index: number, input: HTMLInputElement): void {
    this.labourMechanicInputRefs[index] = input;
    this._recalcLabourMechanicPosition(index);
    this._startLabourMechanicScrollListener();
  }

  private _recalcLabourMechanicPosition(index: number): void {
    const input = this.labourMechanicInputRefs[index];
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 4;
    const spaceAbove = rect.top - 4;
    const openAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
    this.labourMechanicDropPositions[index] = {
      top: openAbove ? null : rect.bottom + 2,
      bottom: openAbove ? window.innerHeight - rect.top + 2 : null,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(192, openAbove ? spaceAbove : spaceBelow),
    };
  }

  private _startLabourMechanicScrollListener(): void {
    if (this.labourMechanicScrollHandler) return;
    this.labourMechanicScrollHandler = () => {
      Object.keys(this.labourMechanicInputRefs).forEach((k) => {
        this._recalcLabourMechanicPosition(Number(k));
      });
    };
    window.addEventListener('scroll', this.labourMechanicScrollHandler, true);
    window.addEventListener('resize', this.labourMechanicScrollHandler);
  }

  private _stopLabourMechanicScrollListener(): void {
    if (!this.labourMechanicScrollHandler) return;
    window.removeEventListener('scroll', this.labourMechanicScrollHandler, true);
    window.removeEventListener('resize', this.labourMechanicScrollHandler);
    this.labourMechanicScrollHandler = null;
  }
}
