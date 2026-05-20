import { CommonModule } from '@angular/common';
import { Component, effect, input, OnDestroy, output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Order } from '../../order-list/ordern.model';
import { ValidateService } from '../../../../core/validation/validation.service';
import { Tab1Component } from './sections/tab-1/tab-1.component';
import { Tab2Component } from './sections/tab-2/tab-2.component';
import { Labour, SpareParts } from '../types.model';
import { Tab3Component } from './sections/tab-3/tab-3.component';
import { Tab5Component } from './sections/tab-5/tab-5.component';
import { Tab6Component } from './sections/tab-6/tab-6.component';
import { dataVehicle } from './sections/tab-1/dataVehicle.model';
import { OrderService } from '../../../data-access/order.service';
import { ResumenComponent } from './sections/resumen/resumen.component';
import Swal from 'sweetalert2';
import { RepExtraComponent } from './sections/tab-3/rep-extra/rep-extra.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { BaseTokenService } from '../../../../shared/data-access/token/base-token.service';
import { TabLogComponent } from './sections/tab-log/tab-log.component';
@Component({
  selector: 'app-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    Tab1Component,
    Tab2Component,
    Tab3Component,
    Tab5Component,
    Tab6Component,
    ResumenComponent,
    RepExtraComponent,
    SpinnerComponent,
    TabLogComponent,
  ],
  templateUrl: './modal.component.html',
  styles: ``,
})

/**
 * Componente padre que representa el modal principal del parte de servicio.
 *
 * - Administra el estado del modal (`isOpen`) y el objeto `order`.
 * - Distribuye lógica entre tabs: ingreso, servicio, repuestos, estado del vehículo y anexos.
 * - Controla flujo de edición (`isEdit`), pestañas activas y sincronización de datos.
 * - Coordina imágenes (`imagesVehicle`), firmas, empleados seleccionados y repuestos completados.
 * - Emite eventos `closeModal`, `save` y `edit` según la acción del usuario.
 * - Administra suscripciones a distintos tabs con banderas para evitar múltiples binds.
 * - Define el formulario general (`form`) que encapsula todos los controles de los tabs.
 */
export class ModalComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private subscriptionsInitialized = false;
  private tab2LabourSubscribed = false;
  private tab3AbonoSubscribed = false;
  private tab3SparePartsSubscribed = false;
  private tab3ExtraSparePartsSubscribed = false;

  isOpen = input<boolean>(false);
  order = input<Order | null>();
  closeModal = output<void>();
  save = output<Order>();
  edit = output<Order>();
  types: any[] = [];
  isEdit = false;
  load: boolean = false;

  activeTab: string = 'Ingreso';
  tabs: string[] = ['Ingreso', 'Servicio', 'Estado del Vehiculo', 'Anexos'];
  private readonly BASE_TABS = ['Ingreso', 'Servicio', 'Estado del Vehiculo', 'Anexos'];
  currentOrderId: string | null = null;
  vehicleFilter = '';
  imagesVehicle: any[] = [];
  imagesVehicleData: any;
  imagesRemoved: string[] = [];
  completedLabours: any[] = [];
  filteredEmployee: any[] = [];
  selectedEmployees: any[] = [];
  form: FormGroup;
  allPaymentMethods: any[] = [
    { label: 'Tarjeta de Credito / Debito', value: 'tarjeta' },
    { label: 'Efectivo', value: 'efectivo' },
    { label: 'Transferencia', value: 'Transferencia' },
    { label: 'Credito', value: 'Credito' },
  ];
  paymentMethods: any;
  /**
   * Constructor principal del componente `ModalComponent`, encargado de:
   *
   * - Instanciar y estructurar el `FormGroup` principal (`form`) con subgrupos correspondientes a cada tab:
   *    - `tab1`: Información de ingreso del vehículo.
   *    - `tab2`: Mano de obra aplicada.
   *    - `tab3`: Repuestos y costos asociados.
   *    - `tab3_extra`: Repuestos no programados o adicionales.
   *    - `tab5`: Estado visual del vehículo, incluyendo imágenes.
   *    - `tab6`: Información del anexo (autorizaciones y responsables).
   *
   * - Aplica validaciones reactivas como `Validators.required` y validación personalizada (`validateIngreso`).
   * - Define estructuras base con valores por defecto o vacíos.
   * - Lanza efectos reactivos para:
   *    - Limpiar `tab6` al inicializar.
   *    - Invocar `updateForm()` y `checkIfCompleted()` cuando el formulario cambie.
   * - Ejecuta lógica de inicialización: `isSubmitDisabled()` y `initializeSubscriptions()`.
   *
   * Este constructor establece la base lógica y visual para todo el modal — cada campo conectado, cada pestaña escuchando.
   *
   * @param {FormBuilder} fb - Servicio de Angular para crear formularios reactivos.
   * @param {OrderService} service - Servicio para operaciones de datos relacionadas al parte de servicio.
   * @param {ValidateService} validateService - Servicio personalizado de validaciones (ej. rango de fechas).
   */
  constructor(
    private fb: FormBuilder,
    private service: OrderService,
    private validateService: ValidateService,
    private token: BaseTokenService
  ) {
    this.form = this.fb.group({
      tab1: this.fb.group({
        _id: [''],
        codigo: [''],
        kmts: [''],
        key_veh: [''],
        start_date: [
          '',
          [Validators.required, this.validateIngreso.bind(this)],
        ],
        start_time: ['', Validators.required],
        request: ['', Validators.required],
        vehicleFilter: ['', Validators.required],
        model_veh: [''],
        status: this.fb.array(['Pendiente']),
        contact_client: [''],
        contact_client_2: [''],
        ownerId: [''],
        vehicleId: [''],
        vehicleData: this.fb.group({
          type_veh: [''],
          plate: [''],
          brand: [''],
          model: [''],
          year_vehicle: [''],
          chassis_series: [''],
        }),
        observation: [''],
        client: [''],
        client_contact: [false],
      }),
      tab2: this.fb.group({
        labours: this.fb.array<Labour>([]),
        _id: [''],
        total: [0],
      }),
      tab3: this.fb.group({
        _id: [''],
        spare_parts: this.fb.array<SpareParts>([]),
        total_mo: [0],
        total_r: [0],
        subTotal: [0],
        abono: [0],
        paymentM: [''],
        total: [0],
      }),
      tab5: this.fb.group({
        _idVehicleCondition: [''],
        images: this.fb.array<any>([]),
      }),
      tab6: this.fb.group({
        createdBy: [''],
        delegate: [''],
        identification: [''],
      }),
      tab3_extra: this.fb.group({
        spare_parts: this.fb.array<SpareParts>([]),
      }),
    });

    effect(() => {
      this.form.get('tab6')?.reset();
      this.updateForm();
      this.checkIfCompleted();
    });
    this.isSubmitDisabled();
    this.initializeSubscriptions();
  }
  ngOnInit(): void {
    const roles = this.token.decodedToken()?.roles || [];
    this.paymentMethods = this.getAvailablePaymentMethods(roles);
  }

  /**
   * Inicializa las suscripciones necesarias para el formulario reactivo,
   * evitando múltiples registros en cada apertura del modal.
   *
   * - Escucha los cambios de `vehicleFilter` en `tab1`.
   * - Si no hay una orden (`order()` vacío), actualiza el filtro local (`vehicleFilter`)
   *   con el valor introducido por el usuario.
   * - Se asegura de que la suscripción solo se registre una vez por instancia,
   *   utilizando el flag `subscriptionsInitialized`.
   * - Utiliza `takeUntil(this.destroy$)` para cancelar automáticamente
   *   la suscripción al destruir el componente.
   *
   * Este método mantiene la reactividad controlada y evita fugas de memoria o
   * registros duplicados.
   */

  initializeSubscriptions() {
    if (this.subscriptionsInitialized) return;

    this.form
      .get('tab1.vehicleFilter')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const trimmedValue = value?.trim();
        const initialPlate = this.order()?.preInvoice.vehicle.plate?.trim();
        if (!this.order()) {
          this.vehicleFilter = value;
          return;
        }
        // Si hay orden, solo permite buscar si el usuario borró o cambió el valor original
        if (trimmedValue !== initialPlate) {
          this.vehicleFilter = trimmedValue;
        }
      });

    this.subscriptionsInitialized = true;
  }

  /**
   * Cambia la pestaña activa del modal, actualizando `activeTab` con el nombre proporcionado.
   *
   * - Se espera que `tab` coincida con uno de los valores del arreglo `tabs[]`.
   * - Al cambiar, el sistema puede condicionar la visualización de secciones específicas o ejecutar lógica asociada.
   *
   * Este método se usa típicamente desde elementos de navegación de tabs (`(click)="selectTab('Estado del Vehiculo')"`).
   *
   * @param {string} tab - Nombre de la pestaña a activar.
   */

  selectTab(tab: string) {
    this.activeTab = tab;
  }

  /**
   * Verifica si una pestaña específica está actualmente activa en el modal.
   *
   * - Compara el nombre proporcionado (`tab`) con el valor de `activeTab`.
   * - Devuelve `true` si la pestaña coincide, `false` en caso contrario.
   *
   * Este método suele utilizarse para aplicar clases visuales condicionales en la plantilla:
   *
   * ```html
   * <li [class.active]="isActive('Anexos')">Anexos</li>
   * ```
   *
   * @param {string} tab - Nombre de la pestaña a verificar.
   * @returns {boolean} `true` si la pestaña es la actualmente activa, `false` si no lo es.
   */

  isActive(tab: string) {
    return this.activeTab === tab;
  }

  /**
   * Maneja la selección de un vehículo desde un autocompletado o lista de opciones,
   * actualizando múltiples campos del formulario `tab1` sin emitir eventos de cambio.
   *
   * - Establece los valores de:
   *    - `vehicleFilter`: Texto del vehículo seleccionado.
   *    - `vehicleId`: Identificador interno del vehículo.
   *    - `model_veh`: Modelo del vehículo.
   *    - `ownerId`: ID del propietario.
   *    - `client`: Nombre completo del propietario.
   *    - `contact_client`: Teléfono principal del propietario.
   *    - `contact_client_2`: Segundo teléfono del propietario.
   *
   * El uso de `{ emitEvent: false }` asegura que no se disparen observables durante la actualización masiva.
   *
   * @param {dataVehicle} o - Objeto que representa al vehículo seleccionado con metadatos asociados.
   */
  onNewVehicle(vehicleData: any) {
    this.form.get('tab1.vehicleId')?.setValue('', { emitEvent: false });
    this.form.get('tab1.vehicleFilter')?.setValue(vehicleData.plate, { emitEvent: false });
    this.form.get('tab1.model_veh')?.setValue(vehicleData.model, { emitEvent: false });
    this.form.get('tab1.ownerId')?.setValue('', { emitEvent: false });
    this.form.get('tab1.client')?.setValue('Sin propietario', { emitEvent: false });
    this.form.get('tab1.contact_client')?.setValue('', { emitEvent: false });
    this.form.get('tab1.contact_client_2')?.setValue('', { emitEvent: false });
    this.form.get('tab1.vehicleData')?.setValue(vehicleData, { emitEvent: false });
  }

  selectedVehicle(o: dataVehicle) {
    this.form
      .get('tab1.vehicleFilter')
      ?.setValue(o.value, { emitEvent: false });
    this.form.get('tab1.vehicleId')?.setValue(o._id, { emitEvent: false });
    this.form.get('tab1.model_veh')?.setValue(o.model, { emitEvent: false });
    this.form.get('tab1.ownerId')?.setValue(o.owner?._id ?? '', { emitEvent: false });
    this.form.get('tab1.vehicleData')?.reset({ emitEvent: false });
    this.form
      .get('tab1.client')
      ?.setValue(o.owner?.fullName ?? 'Sin propietario', { emitEvent: false });
    this.form
      .get('tab1.contact_client')
      ?.setValue(o.owner?.cell_phone ?? '', { emitEvent: false });
    this.form
      .get('tab1.contact_client_2')
      ?.setValue(o.owner?.cell_phone_2 ?? '', { emitEvent: false });
  }

  /**
   * Limpia los campos asociados al modelo del vehículo y datos de contacto del cliente
   * en la sección de ingreso (`tab1`) del formulario reactivo.
   *
   * - Vacía los campos:
   *   - `model_veh`: Modelo del vehículo.
   *   - `client`: Nombre del propietario.
   *   - `contact_client`: Teléfono principal.
   *   - `contact_client_2`: Segundo teléfono.
   *
   * Todas las actualizaciones se realizan con `{ emitEvent: false }` para evitar
   * disparos innecesarios de validadores o suscripciones conectadas.
   *
   * @param {boolean} is - Parámetro de control externo (actualmente no utilizado dentro del método).
   */
  cleanModel(is: boolean) {
    this.form.get('tab1.model_veh')?.setValue('', { emitEvent: false });
    this.form.get('tab1.client')?.setValue('', { emitEvent: false });
    this.form.get('tab1.contact_client')?.setValue('', { emitEvent: false });
    this.form.get('tab1.contact_client_2')?.setValue('', { emitEvent: false });
  }

  /**
   * Devuelve el `FormGroup` correspondiente a la pestaña de ingreso (`tab1`)
   * desde el formulario principal del componente.
   *
   * - Verifica que el control sea efectivamente una instancia de `FormGroup`.
   * - En caso contrario, retorna `null` para prevenir errores de tipo en tiempo de ejecución.
   *
   * Este método es útil para simplificar la lectura y edición del formulario de ingreso,
   * tanto en componentes hijos como en la plantilla.
   *
   * @returns {FormGroup | null} El `FormGroup` de `tab1` si existe, o `null` si no es válido.
   */
  getTab1Form(): FormGroup | null {
    const control = this.form.get('tab1');
    return control instanceof FormGroup ? control : null;
  }

  /**
   * Acceso tipado al `FormArray` de estados dentro del grupo `tab1` del formulario principal.
   *
   * - Retorna el control `status` casteado como `FormArray`.
   * - Permite iterar, insertar o eliminar estados asociados al parte de servicio.
   *
   * Útil en plantillas como:
   * ```html
   * <div *ngFor="let state of statusArray.controls; let i = index">
   *   <input [formControlName]="i" />
   * </div>
   * ```
   *
   * @returns {FormArray} Arreglo reactivo de estados para `tab1`.
   */
  get statusArray(): FormArray {
    return this.form.get('tab1.status') as FormArray;
  }

  /**
   * Maneja el cambio de estado desde una lista de checkboxes, actualizando
   * el `FormArray` `status` en `tab1` según selección o deselección.
   *
   * - Si el checkbox fue marcado (`checked = true`) y el valor no existe,
   *   agrega un nuevo `FormControl(value)` al arreglo.
   * - Si fue desmarcado (`checked = false`) y el valor existe, lo elimina usando `removeAt(...)`.
   * - Tras cada cambio, invoca `checkIfCompleted()` para validar o actualizar lógica visual.
   *
   * Este método permite una edición dinámica y controlada del array de estados.
   *
   * @param {any} event - Evento de cambio disparado por el checkbox.
   */

  onChangeStatus(event: any) {
    const statusArray = this.statusArray;
    const value = event.target.value;
    const isChecked = event.target.checked;

    const index = statusArray.value.indexOf(value);

    if (isChecked && index === -1) {
      statusArray.push(new FormControl(value));
    } else if (!isChecked && index !== -1) {
      statusArray.removeAt(index);
    }
    this.checkIfCompleted();
  }

  /**
   * Verifica si el estado actual del parte incluye `"Completada"` dentro del `FormArray` `status` (`tab1`).
   *
   * - Si el estado `"Completada"` está presente y el modal **no** está en modo edición (`isEdit = false`):
   *   - Si no hay labores (`labourArray.length === 0`), ejecuta `add()` para insertar una labor por defecto.
   *   - Si no hay repuestos (`partsArray.length === 0`), ejecuta `addParts()` para inicializar una entrada vacía.
   *
   * - En todos los casos donde `"Completada"` está marcada:
   *   - Actualiza `completedLabours` con una copia reactiva del contenido actual de `labourArray`.
   *
   * Este método mantiene la coherencia de los datos requeridos antes del cierre del parte,
   * evitando entregas incompletas o sin registros de acción.
   */
  checkIfCompleted() {
    const statusValues = this.form.get('tab1.status')?.value || [];

    if (statusValues.includes('Completada')) {
      if (!this.isEdit) {
        if (this.labourArray.length === 0) {
          this.add();
        }
        if (this.partsArray.length === 0) {
          this.addParts();
        }
      }
      this.completedLabours = this.labourArray.value.map((labour: any) => ({
        ...labour,
      }));
    }
  }

  /**
   * Devuelve el `FormGroup` correspondiente a la pestaña de mano de obra (`tab2`).
   *
   * - Si el grupo ya existe en el formulario principal (`form`), lo retorna.
   * - Si no existe (caso improbable), crea un nuevo grupo con:
   *    - `labours`: `FormArray` vacío.
   *    - `total`: Inicializado en `0`.
   *
   * Además, establece una suscripción única a los cambios en `labours.valueChanges`
   * para recalcular automáticamente el total (`updateTotal()`), evitando dobles registros
   * mediante la bandera `tab2LabourSubscribed`.
   *
   * @returns {FormGroup} Grupo de datos para `tab2`, incluyendo labores y total asociado.
   */
  getTab2Form(): FormGroup {
    const form =
      (this.form.get('tab2') as FormGroup) ??
      this.fb.group({
        labours: this.fb.array([]),
        total: [0],
      });

    // Solo suscribirse una vez
    if (!this.tab2LabourSubscribed) {
      form
        .get('labours')
        ?.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateTotal();
        });
      this.tab2LabourSubscribed = true;
    }

    return form;
  }

  /**
   * Devuelve el `FormGroup` correspondiente al tab de repuestos (`tab3`),
   * incluyendo lógica reactiva para recalcular totales automáticamente.
   *
   * - Si el grupo ya existe (`form.get('tab3')`), lo retorna; de lo contrario, crea uno nuevo con:
   *   - `spare_parts`: Arreglo de repuestos inicial vacío.
   *   - `total_mo`, `total_r`, `subTotal`, `abono`, `total`: Campos numéricos con valor por defecto `0`.
   *
   * Lógica adicional:
   * - Si no está suscrita la lógica de `abono`, se suscribe:
   *   - Normaliza el valor si viene como string con coma (`,`) y recalcula totales (`calculateTotals`).
   * - Si no está suscrita la lógica de `spare_parts`, también se enlaza su recalculo.
   * - Ejecuta un cálculo inicial de totales al retornar el grupo.
   *
   * @returns {FormGroup} Grupo reactivo listo para el tab de repuestos, con lógica de actualización embebida.
   */

  getTab3Form(): FormGroup {
    const total_mo = this.form.get('tab2.total')?.value;
    const form =
      (this.form.get('tab3') as FormGroup) ??
      this.fb.group({
        spare_parts: this.fb.array([]),
        total_mo: [0],
        total_r: [0],
        subTotal: [0],
        abono: [0],
        total: [0],
      });

    // Solo suscribirse una vez para abono
    if (!this.tab3AbonoSubscribed) {
      form
        .get('abono')
        ?.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe((value) => {
          if (typeof value === 'string') {
            const fixedValue = value.replace(',', '.');
            if (fixedValue !== value) {
              form.get('abono')?.setValue(fixedValue, { emitEvent: false });
            }
            this.calculateTotals(form, total_mo);
          } else {
            this.calculateTotals(form, total_mo);
          }
        });
      this.tab3AbonoSubscribed = true;
    }

    // Solo suscribirse una vez para spare_parts
    if (!this.tab3SparePartsSubscribed) {
      form
        .get('spare_parts')
        ?.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.calculateTotals(form, total_mo);
        });
      this.tab3SparePartsSubscribed = true;
    }

    this.calculateTotals(form, total_mo);
    return form;
  }

  /**
   * Devuelve el `FormGroup` correspondiente al tab de repuestos adicionales (`tab3_extra`),
   * incluyendo lógica para recalcular los totales cuando cambian los repuestos.
   *
   * - Si el grupo ya existe (`form.get('tab3_extra')`), lo reutiliza.
   * - Si no existe, crea un nuevo grupo con:
   *    - `spare_parts`: Un `FormArray` vacío.
   *
   * - Se asegura de que la suscripción a `spare_parts.valueChanges` se registre solo una vez,
   *   usando la bandera `tab3ExtraSparePartsSubscribed`.
   * - Cada cambio en `spare_parts` desencadena `calculateTotals(...)`, usando el `total_mo` proveniente de `tab2`.
   * - También llama a `calculateTotals(...)` al retornar el form, para asegurar sincronización inicial.
   *
   * @returns {FormGroup} Grupo reactivo correspondiente a `tab3_extra`.
   */

  getTab3ExtraForm(): FormGroup {
    const total_mo = this.form.get('tab2.total')?.value;
    const form =
      (this.form.get('tab3_extra') as FormGroup) ??
      this.fb.group({
        spare_parts: this.fb.array([]),
      });

    // Solo suscribirse una vez
    if (!this.tab3ExtraSparePartsSubscribed) {
      form
        .get('spare_parts')
        ?.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.calculateTotals(form, total_mo);
        });
      this.tab3ExtraSparePartsSubscribed = true;
    }

    this.calculateTotals(form, total_mo);
    return form;
  }

  /**
   * Devuelve el `FormGroup` correspondiente al tab de condición del vehículo (`tab5`),
   * asegurando un acceso consistente incluso si el grupo no ha sido inicializado explícitamente.
   *
   * - Si el grupo ya existe en el formulario principal (`form.get('tab5')`), lo retorna casteado como `FormGroup`.
   * - Si no existe, crea uno nuevo con:
   *   - `_idVehicleCondition`: Control de texto para referencia de condición (ej. ID del checklist).
   *   - `images`: `FormArray` para almacenar las imágenes asociadas al estado visual del vehículo.
   *
   * Este método permite una gestión desacoplada y reutilizable del subformulario asociado al estado del vehículo.
   *
   * @returns {FormGroup} El grupo de controles reactivos para `tab5`.
   */

  getTab5Form(): FormGroup {
    const form =
      (this.form.get('tab5') as FormGroup) ??
      this.fb.group({
        _idVehicleCondition: [''],
        images: this.fb.array([]),
      });

    return form;
  }

  /**
   * Devuelve el `FormGroup` correspondiente al tab de anexos (`tab6`),
   * si el control existe y es una instancia válida.
   *
   * - Comprueba que `this.form.get('tab6')` sea un `FormGroup`.
   * - Si lo es, lo retorna; si no, devuelve `null` para prevenir errores.
   *
   * Este método permite interactuar con los campos del anexo (ej. `createdBy`, `delegate`, `identification`)
   * de forma segura y desacoplada.
   *
   * @returns {FormGroup | null} El subgrupo reactivo de `tab6`, o `null` si no es válido.
   */

  getTab6Form(): FormGroup | null {
    const control = this.form.get('tab6');
    return control instanceof FormGroup ? control : null;
  }

  /**
   * Devuelve el `FormGroup` correspondiente al tab 7 (`tab7`) del formulario principal.
   *
   * - Realiza una búsqueda directa con `form.get('tab7')` y lo castea como `FormGroup`.
   * - Se asume que `tab7` ya está registrado dentro del `FormGroup` raíz (`this.form`).
   *
   * Este método es útil si `tab7` encapsula formularios adicionales como auditoría, historial técnico,
   * validaciones externas, encuestas post-servicio o métricas del sistema.
   *
   * @returns {FormGroup} El grupo reactivo correspondiente a `tab7`.
   */
  getTab7Form(): FormGroup {
    return this.form.get('tab7') as FormGroup;
  }

  /**
   * Calcula y actualiza los totales del formulario de repuestos (`tab3`), incluyendo lógica
   * para recargos, abonos, y repuestos adicionales (`tab3_extra`).
   *
   * - Itera sobre los `spare_parts` del formulario base (`form`) y del formulario global (`tab3_extra`).
   * - Aplica recargo del 10% en caso de pago con tarjeta (`paymentM = 'tarjeta'`) o si
   *   `applyIncrease` está activado en el repuesto adicional.
   * - Redondea cada línea individual (`totalIn`) a 2 decimales y actualiza los campos correspondientes.
   * - Calcula:
   *    - `total_r`: Total de repuestos.
   *    - `subTotal`: Suma de `total_mo` y `total_r`.
   *    - `total`: Subtotal menos el `abono` (si aplica).
   * - Actualiza los campos globales del formulario (`form`) sin emitir eventos.
   *
   * @param {FormGroup} form - Formulario reactivo que contiene los repuestos y valores numéricos.
   * @param {number} total_mo - Total de mano de obra proveniente de `tab2`.
   */

  calculateTotals(form: FormGroup, total_mo: number): void {
    const partsArray = form.get('spare_parts') as FormArray;
    const partsArrayExtra = this.form.get(
      'tab3_extra.spare_parts'
    ) as FormArray;
    const paymentMethod = this.form.get('tab3.paymentM')?.value;
    let total_r = 0;

    partsArray.controls.forEach((control: AbstractControl) => {
      const amount = parseFloat(control.get('amount')?.value) || 0;
      const salePrice = parseFloat(control.get('sale_price')?.value) || 0;

      let totalIn = amount * salePrice;

      if (paymentMethod === 'tarjeta') {
        totalIn *= 1.1; // Aplicar recargo por tarjeta
      }

      // Redondear a 2 decimales
      totalIn = Math.round(totalIn * 100) / 100;

      // Setear el total individual de esta fila
      control.get('totalIn')?.setValue(totalIn, { emitEvent: false });

      // Sumar al total general
      total_r += totalIn;
    });
    partsArrayExtra.controls.forEach((control: AbstractControl) => {
      const amount = parseFloat(control.get('amount')?.value) || 0;
      const salePrice = parseFloat(control.get('sale_price')?.value) || 0;
      const applyIncrease = control.get('applyIncrease')?.value;

      let totalIn = amount * salePrice;

      // Aplicar recargo del 10% si `applyIncrease` está activado
      if (applyIncrease) {
        totalIn *= 1.1;
      }

      // Redondear a 2 decimales
      totalIn = Math.round(totalIn * 100) / 100;

      // Setear el total individual de esta fila
      control.get('totalIn')?.setValue(totalIn, { emitEvent: false });

      // Sumar al total general
      total_r += totalIn;
    });
    let subTotal = total_mo + total_r;

    // El subtotal ya tiene aplicado el recargo individual si es 'tarjeta'
    const abono = form.get('abono')?.value ?? 0;

    let total = subTotal;
    if (subTotal > 0) {
      total -= abono;
    }

    // Setear los valores globales
    form.get('totalIn')?.setValue(total, { emitEvent: false });
    form.get('total_mo')?.setValue(total_mo, { emitEvent: false });
    form.get('total_r')?.setValue(total_r, { emitEvent: false });
    form.get('subTotal')?.setValue(subTotal, { emitEvent: false });
    form.get('total')?.setValue(total, { emitEvent: false });
  }

  /**
   * Calcula y actualiza los totales del formulario de repuestos (`tab3`), incluyendo lógica
   * para recargos, abonos, y repuestos adicionales (`tab3_extra`).
   *
   * - Itera sobre los `spare_parts` del formulario base (`form`) y del formulario global (`tab3_extra`).
   * - Aplica recargo del 10% en caso de pago con tarjeta (`paymentM = 'tarjeta'`) o si
   *   `applyIncrease` está activado en el repuesto adicional.
   * - Redondea cada línea individual (`totalIn`) a 2 decimales y actualiza los campos correspondientes.
   * - Calcula:
   *    - `total_r`: Total de repuestos.
   *    - `subTotal`: Suma de `total_mo` y `total_r`.
   *    - `total`: Subtotal menos el `abono` (si aplica).
   * - Actualiza los campos globales del formulario (`form`) sin emitir eventos.
   *
   * @param {FormGroup} form - Formulario reactivo que contiene los repuestos y valores numéricos.
   * @param {number} total_mo - Total de mano de obra proveniente de `tab2`.
   */

  get tab3Totals() {
    return {
      total_mo: this.form.get('tab3.total_mo')?.value
        ? this.form.get('tab3.total_mo')?.value
        : 0,
      total_r: this.form.get('tab3.total_r')?.value
        ? this.form.get('tab3.total_r')?.value
        : 0,
      subTotal: this.form.get('tab3.subTotal')?.value
        ? this.form.get('tab3.subTotal')?.value
        : 0,
      total: this.form.get('tab3.total')?.value
        ? this.form.get('tab3.total')?.value
        : 0,
    };
  }

  /**
   * Limpia completamente un `FormArray` eliminando todos sus controles hijos.
   *
   * - Utiliza un bucle `while` que remueve elementos desde el inicio (`index 0`)
   *   hasta que el arreglo queda vacío (`formArray.length === 0`).
   * - No emite eventos secundarios durante la limpieza.
   *
   * Ideal para reinicializar `FormArrays` sin necesidad de reemplazarlos por una nueva instancia.
   *
   * @param {FormArray} formArray - Arreglo reactivo a limpiar.
   */
  clearFormArray(formArray: FormArray) {
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }

  /**
   * Limpia completamente el `FormArray` de imágenes asociado a `imagesArray`.
   *
   * - Itera mediante un bucle `while` eliminando desde el índice `0` hasta vaciar el arreglo.
   * - No reemplaza la instancia del `FormArray`, lo que preserva bindings o suscripciones activas.
   *
   * Ideal para reiniciar el flujo de carga de imágenes sin perder estructura reactiva.
   */
  clearImagesArray() {
    const images = this.imagesArray;
    while (images.length !== 0) {
      images.removeAt(0);
    }
  }

  /**
   * Muestra una alerta de confirmación (usando `Swal.fire`) para preguntar al usuario
   * si desea limpiar todos los campos del formulario principal.
   *
   * - Si el usuario confirma ("Sí, limpiar"), ejecuta `this.formReset()`.
   * - Si cancela, no se realiza ninguna acción.
   *
   * Esta lógica protege al usuario de pérdidas accidentales y aplica una limpieza
   * visualmente comprensible y reversible antes de tomar acción destructiva.
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

  //funciones para el tab2

  /**
   * Getter para acceder de forma tipada al `FormArray` de labores dentro del grupo `tab2`.
   *
   * - Utiliza el método `getTab2Form()` para asegurar que el grupo existe y está correctamente estructurado.
   * - Devuelve el control `labours` casteado como `FormArray`.
   *
   * Ideal para trabajar en plantillas (`labourArray.controls`) o agregar/quitar elementos desde lógica de negocio.
   *
   * @returns {FormArray} Arreglo reactivo con las labores registradas en `tab2`.
   */
  get labourArray(): FormArray {
    return this.getTab2Form().get('labours') as FormArray;
  }

  localMechanics: { _id: string; fullName: string; position?: string }[] = [];

  get orderMechanics(): { _id: string; fullName: string; position?: string }[] {
    return this.localMechanics;
  }

  onMechanicAdded(mechanic: { _id: string; fullName: string; position?: string }): void {
    const seen = new Set<string>();
    const rebuilt: { _id: string; fullName: string; position?: string }[] = [];

    for (const control of this.labourArray.controls) {
      const id: string = control.get('employee')?.value;
      const name: string = control.get('employeeName')?.value;
      if (id && !seen.has(id)) {
        seen.add(id);
        const existing = this.localMechanics.find((m) => m._id === id);
        rebuilt.push(existing ?? { _id: id, fullName: name });
      }
    }

    if (!seen.has(mechanic._id)) {
      rebuilt.push(mechanic);
    }

    this.localMechanics = rebuilt;
  }

  /**
   * Crea un `FormGroup` representando una labor individual dentro del parte de servicio.
   *
   * Campos definidos:
   * - `name`: Nombre de la labor, requerido. `FormControl<string>`.
   * - `cost`: Costo unitario de la labor. Requiere validación estándar y lógica personalizada (`validateCost`).
   * - `totalIn`: Total calculado. Inicialmente `0`, no editable directamente.
   * - `isCustom`: Bandera para indicar si la labor fue definida manualmente por el usuario.
   *
   * Todos los campos son `nonNullable` para mantener consistencia tipada y evitar valores `null`.
   *
   * @returns {FormGroup} Grupo reactivo representando una entrada de labor.
   */
  createLabourForm(): FormGroup {
    return this.fb.group({
      name: new FormControl('', {
        nonNullable: true,
        validators: Validators.required,
      }),
      cost: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, this.validateCost.bind(this)],
      }),
      totalIn: new FormControl(0, {
        nonNullable: true,
      }),
      isCustom: new FormControl(false, { nonNullable: true }),
      employee: new FormControl('', { nonNullable: true }),
      employeeName: new FormControl('', { nonNullable: true }),
      date: new FormControl<Date | null>(null),
    });
  }

  /**
   * Agrega una nueva labor al `FormArray` de `labourArray` dentro de `tab2`,
   * previa validación del estado `"Completada"` en `tab1.status`.
   *
   * - Verifica si el estado `"Completada"` está presente.
   *   - Si existe y **no está en la posición esperada** (`index !== 1`), lo elimina del arreglo de estados.
   *   - Esto asegura que `"Completada"` no esté mal posicionado dentro del flujo lógico del parte.
   *
   * - Luego, agrega un nuevo `FormGroup` generado por `createLabourForm()` al `labourArray`.
   *
   * Este método garantiza consistencia semántica del estado antes de permitir modificaciones
   * sensibles como agregar labores.
   */
  add() {
    const status = this.form.get('tab1.status') as FormArray;
    const statusValues = status.value;
    if (statusValues.includes('Completada')) {
      const index = statusValues.indexOf('Completada');
      if (index !== 1) {
        this.statusArray.removeAt(index);
      }
    }
    this.labourArray.push(this.createLabourForm());
  }

  /**
   * Verifica si las labores actuales (`labourArray`) coinciden con las registradas
   * previamente como completadas (`completedLabours`) y ajusta el estado `"Completada"`
   * en `tab1.status` en consecuencia.
   *
   * - Si `labourArray` está vacío, se elimina el estado `"Completada"` y se retorna.
   * - Si al menos una labor coincide (por `name` y `cost`) con una previamente completada:
   *    - Y `"Completada"` no está en `status`, se agrega como nuevo estado.
   * - Si no hay coincidencias, se asegura de remover `"Completada"` del estado.
   *
   * Esta lógica mantiene el estado del parte sincronizado con la veracidad de su contenido
   * y evita marcar como completado un parte sin tareas asociadas.
   */
  checkLaboursCompleted() {
    const currentLabours = this.labourArray.value;

    if (currentLabours.length === 0) {
      this.removeCompletedStatus();
      return;
    }

    const hasMatch = currentLabours.some((labour: any) => {
      return this.completedLabours.some((completed: any) => {
        return completed.name === labour.name && completed.cost === labour.cost;
      });
    });

    if (hasMatch) {
      const statusValues = this.form.get('tab1.status')?.value || [];
      if (!statusValues.includes('Completada')) {
        this.statusArray.push(new FormControl('Completada'));
      }
    } else {
      this.removeCompletedStatus();
    }
  }

  /**
   * Elimina el estado `"Completada"` del `FormArray` `tab1.status`, si está presente.
   *
   * - Obtiene el arreglo actual de estados (`status.value`).
   * - Busca el índice de `"Completada"` en el arreglo.
   * - Si existe (`index !== -1`), lo elimina mediante `removeAt(...)`.
   *
   * Este método asegura la integridad del flujo lógico del parte,
   * removiendo el estado final cuando las condiciones ya no se cumplen (ej. labores vacías).
   */
  removeCompletedStatus() {
    const status = this.form.get('tab1.status') as FormArray;
    const statusValues = status.value;
    const index = statusValues.indexOf('Completada');
    if (index !== -1) {
      this.statusArray.removeAt(index);
    }
  }

  /**
   * Elimina una labor del `FormArray` (`labourArray`) en la posición especificada
   * y luego evalúa si el parte sigue siendo válido para marcarse como `"Completada"`.
   *
   * - Llama a `labourArray.removeAt(index)` para eliminar la labor en la posición dada.
   * - Usa `setTimeout()` para diferir la ejecución de `checkLaboursCompleted()`,
   *   permitiendo que Angular procese primero el cambio en la estructura del formulario.
   *
   * Esta lógica asegura que el estado del parte de servicio se mantenga sincronizado con
   * la información visible del usuario.
   *
   * @param {number} index - Índice de la labor a eliminar.
   */
  delete(index: number) {
    this.labourArray.removeAt(index);
    setTimeout(() => this.checkLaboursCompleted());
  }

  /**
   * Calcula el total general de las labores en `tab2`, aplicando un recargo del 10%
   * si el método de pago es `'tarjeta'`, y actualiza tanto el total individual (`totalIn`)
   * de cada tarea como el acumulado (`tab2.total`).
   *
   * - Itera sobre cada control en el `FormArray` `tab2.labours`.
   * - Extrae el `cost` de cada tarea.
   * - Si `paymentM = 'tarjeta'`, aplica 10% adicional al costo individual.
   * - Redondea `totalIn` a dos decimales y lo asigna al campo correspondiente.
   * - Suma cada `totalIn` al total general si su valor es mayor que 0.
   * - Finalmente, actualiza `tab2.total` con el resultado.
   *
   * Todos los `setValue` se realizan con `{ emitEvent: false }` para evitar
   * disparos innecesarios de lógica conectada.
   */
  updateTotal() {
    const laboursArray = this.form.get('tab2.labours') as FormArray;
    const paymentMethod = this.form.get('tab3.paymentM')?.value;

    let total = 0;

    laboursArray.controls.forEach((control) => {
      const cost = parseFloat(control.get('cost')?.value) || 0;

      let totalIn = cost;

      // Aplica 10% extra si el método de pago es tarjeta
      if (paymentMethod === 'tarjeta') {
        totalIn = cost * 1.1;
      }

      // Redondear
      totalIn = Math.round(totalIn * 100) / 100;

      // Guardar el totalIn individual en cada tarea
      control.get('totalIn')?.setValue(totalIn, { emitEvent: false });

      // Sumar al total general
      if (totalIn > 0) {
        total += totalIn;
      }
    });

    // Actualizar total general
    this.form.get('tab2.total')?.setValue(total, { emitEvent: false });
  }

  //funciones para el tab 3

  /**
   * Accede de forma tipada al `FormArray` `spare_parts` dentro del grupo `tab3`.
   *
   * - Utiliza `getTab3Form()` para obtener el `FormGroup` de repuestos.
   * - Devuelve el control `spare_parts` casteado como `FormArray`.
   *
   * Este getter permite iterar, insertar o eliminar elementos desde `tab3` con mínima repetición
   * y máxima expresividad en plantillas o lógica del componente.
   *
   * @returns {FormArray} Arreglo de controles reactivos correspondiente a los repuestos en `tab3`.
   */
  get partsArray(): FormArray {
    return this.getTab3Form().get('spare_parts') as FormArray;
  }

  /**
   * Accede de forma tipada al `FormArray` `spare_parts` del grupo `tab3_extra`.
   *
   * - Llama a `getTab3ExtraForm()` para obtener el grupo correspondiente.
   * - Devuelve el control `spare_parts` casteado como `FormArray`.
   *
   * Este getter facilita el acceso reutilizable al arreglo de repuestos extra, permitiendo
   * iteración, adición y eliminación desde lógica del componente o la plantilla.
   *
   * @returns {FormArray} Arreglo de controles para repuestos adicionales en `tab3_extra`.
   */
  get partsArrayExtra(): FormArray {
    return this.getTab3ExtraForm().get('spare_parts') as FormArray;
  }

  /**
   * Crea un `FormGroup` representando un repuesto dentro de `partsArray` o `partsArrayExtra`.
   *
   * Campos incluidos:
   * - `_id`: Identificador del repuesto, requerido. Usado como referencia a catálogo o base de datos.
   * - `amount`: Cantidad del repuesto, mínimo 1. Inicializado en `1`.
   * - `sale_price`: Precio de venta unitario. Incluye validador personalizado (`validatePrecio`).
   * - `totalIn`: Total por ítem (`amount × sale_price`). Inicializado en `0`, calculado externamente.
   *
   * Todos los controles son `nonNullable` para evitar estados ambiguos y facilitar tipado estricto.
   *
   * @returns {FormGroup} Grupo reactivo con validación para agregar repuestos al formulario.
   */
  createPartsForm(): FormGroup {
    return this.fb.group({
      _id: new FormControl('', {
        nonNullable: true,
        validators: Validators.required,
      }),
      amount: new FormControl(1, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      sale_price: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, this.validatePrecio.bind(this)],
      }),
      totalIn: new FormControl(0, {
        nonNullable: true,
      }),
    });
  }

  /**
   * Crea un `FormGroup` representando un repuesto adicional (extra) ingresado manualmente,
   * utilizado típicamente en el tab `tab3_extra`.
   *
   * Campos definidos:
   * - `product`: Nombre del repuesto manual (string libre), requerido.
   * - `amount`: Cantidad del repuesto (default 1), con mínimo de `1`.
   * - `sale_price`: Precio unitario. Valida con `validatePrecio`.
   * - `totalIn`: Total calculado para esta línea (`amount × sale_price [+ recargo si aplica]`).
   * - `applyIncrease`: Bandera que indica si se debe aplicar un recargo del 10% (por ejemplo, por pago con tarjeta).
   *
   * Todos los campos usan `nonNullable` para garantizar consistencia y valores definidos.
   *
   * @returns {FormGroup} Grupo reactivo representando un repuesto ingresado manualmente.
   */
  createPartsExtraForm(): FormGroup {
    return this.fb.group({
      product: new FormControl('', {
        nonNullable: true,
        validators: Validators.required,
      }),
      amount: new FormControl(1, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      sale_price: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, this.validatePrecio.bind(this)],
      }),
      totalIn: new FormControl(0, {
        nonNullable: true,
      }),
      applyIncrease: new FormControl(false, { nonNullable: true }),
    });
  }

  /**
   * Agrega un nuevo repuesto al `FormArray` de `tab3.spare_parts` usando el
   * formulario base generado por `createPartsForm()`.
   *
   * - Utiliza el getter `partsArray` para acceder de forma segura al arreglo reactivo.
   * - Inserta un nuevo `FormGroup` representando un repuesto con validadores definidos.
   *
   * Este método simplifica la adición manual desde la UI, manteniendo consistencia
   * estructural y validación inmediata.
   */
  addParts() {
    this.partsArray.push(this.createPartsForm());
  }

  /**
   * Agrega un nuevo repuesto manual al `FormArray` de `tab3_extra.spare_parts`,
   * utilizando el formulario base definido por `createPartsExtraForm()`.
   *
   * - Usa el getter `partsArrayExtra` para acceder al arreglo reactivo correspondiente.
   * - Inserta un `FormGroup` con validación completa, incluyendo `applyIncrease`.
   *
   * Ideal para modelos donde el usuario puede cargar insumos no registrados en inventario,
   * con lógica de recargo activable manualmente.
   */
  addPartsExtra() {
    this.partsArrayExtra.push(this.createPartsExtraForm());
  }

  /**
   * Elimina un repuesto del `FormArray` `tab3.spare_parts` en la posición indicada.
   *
   * - Utiliza el getter `partsArray` para acceder al arreglo reactivo.
   * - Llama a `removeAt(index)` para eliminar el `FormGroup` correspondiente al índice dado.
   *
   * Ideal para operaciones de eliminación directa desde la interfaz o en respuesta a eventos
   * de usuario (ej. clic en icono de “eliminar repuesto”).
   *
   * @param {number} index - Índice del repuesto a eliminar en `partsArray`.
   */
  deleteParts(index: number) {
    this.partsArray.removeAt(index);
  }

  /**
   * Elimina un repuesto manual del `FormArray` correspondiente a `tab3_extra.spare_parts`,
   * en la posición indicada.
   *
   * - Usa el getter `partsArrayExtra` para acceder de forma segura al arreglo reactivo.
   * - Elimina el `FormGroup` en el índice especificado mediante `removeAt(index)`.
   *
   * Este método es ideal para responder a interacciones en la interfaz (ej. eliminar fila con ícono),
   * manteniendo consistencia con el modelo y evitando residuos lógicos.
   *
   * @param {number} index - Índice del repuesto a eliminar en `partsArrayExtra`.
   */
  deletePartsExtra(index: number) {
    this.partsArrayExtra.removeAt(index);
  }

  /**
   * Incrementa en `1` la cantidad (`amount`) del repuesto ubicado en la posición indicada
   * dentro del `FormArray` `tab3.spare_parts`.
   *
   * - Utiliza el getter `partsArray` para acceder al arreglo reactivo.
   * - Obtiene el control `amount` del índice especificado.
   * - Si existe, incrementa su valor actual en `1`.
   *
   * Esta función puede ser llamada desde botones "+" en la interfaz para modificar cantidades
   * de forma intuitiva y reactiva.
   *
   * @param {number} index - Índice del repuesto a incrementar.
   */
  incrementAmount(index: number) {
    const parts = this.partsArray;
    const control = parts.at(index).get('amount');
    if (control) {
      const amount = control.value;
      control.setValue(amount + 1);
    }
  }

  /**
   * Incrementa en `1` la cantidad (`amount`) del repuesto adicional ubicado en el índice indicado
   * dentro del `FormArray` `tab3_extra.spare_parts`.
   *
   * - Utiliza el getter `partsArrayExtra` para acceder al conjunto reactivo de repuestos manuales.
   * - Obtiene el control `amount` en la posición dada.
   * - Si existe, aumenta su valor actual en `1`.
   *
   * Este método está diseñado para usarse desde la interfaz (botón “+”), manteniendo
   * coherencia con la lógica de `incrementAmount()` para repuestos de inventario.
   *
   * @param {number} index - Índice del repuesto extra cuya cantidad se desea incrementar.
   */
  incrementAmountExtra(index: number) {
    const parts = this.partsArrayExtra;
    const control = parts.at(index).get('amount');
    if (control) {
      const amount = control.value;
      control.setValue(amount + 1);
    }
  }

  /**
   * Decrementa en `1` la cantidad (`amount`) del repuesto ubicado en el índice especificado
   * dentro del `FormArray` `tab3.spare_parts`, siempre que su valor sea mayor a `1`.
   *
   * - Usa el getter `partsArray` para acceder al arreglo reactivo.
   * - Obtiene el control `amount` en la posición indicada.
   * - Si existe y su valor actual es mayor a `1`, lo decrementa en `1`.
   *
   * Este método garantiza que el campo `amount` nunca sea menor que `1`, evitando errores
   * lógicos o inconsistencias visuales en la interfaz.
   *
   * @param {number} index - Índice del repuesto a decrementar en `partsArray`.
   */
  decrementAmount(index: number) {
    const parts = this.partsArray;
    const control = parts.at(index).get('amount');

    if (control) {
      const amount = control.value;
      if (amount > 1) {
        control.setValue(amount - 1);
      }
    }
  }

  /**
   * Decrementa en `1` la cantidad (`amount`) del repuesto adicional ubicado en el índice dado
   * dentro del `FormArray` `tab3_extra.spare_parts`, siempre que sea mayor a `1`.
   *
   * - Usa el getter `partsArrayExtra` para acceder al conjunto reactivo.
   * - Si el control `amount` existe y su valor actual es mayor a `1`, lo decrementa en `1`.
   *
   * Este método mantiene la simetría con `decrementAmount(...)` para repuestos de inventario
   * y previene estados inválidos como `0` o negativos en campos numéricos críticos.
   *
   * @param {number} index - Índice del repuesto adicional a decrementar.
   */
  decrementAmountExtra(index: number) {
    const parts = this.partsArrayExtra;
    const control = parts.at(index).get('amount');

    if (control) {
      const amount = control.value;
      if (amount > 1) {
        control.setValue(amount - 1);
      }
    }
  }

  /**
   * Actualiza el campo `sale_price` del repuesto ubicado en el índice indicado
   * dentro del `FormArray` `tab3.spare_parts`.
   *
   * - Accede al control `sale_price` del repuesto usando el índice (`index`).
   * - Si el control existe, le asigna el nuevo valor de precio (`price`) usando `setValue`.
   *
   * Útil para actualizar precios desde lógica externa, como búsqueda por catálogo o selección desde diálogo.
   *
   * @param o - Objeto que contiene:
   *   - `index`: Posición del repuesto a actualizar.
   *   - `price`: Nuevo precio de venta a aplicar.
   */
  priceProduct(o: any) {
    const { index, price } = o;
    const parts = this.partsArray;
    const control = parts.at(index).get('sale_price');
    if (control) {
      control.setValue(price);
    }
  }

  /**
   * Actualiza el campo `sale_price` de un repuesto adicional ubicado en el índice proporcionado
   * dentro del `FormArray` `tab3_extra.spare_parts`.
   *
   * - Accede al control `sale_price` del repuesto manual según el `index`.
   * - Si el control existe, asigna el nuevo valor `price` mediante `setValue`.
   *
   * Este método permite actualizar precios dinámicamente desde lógica externa (por ejemplo,
   * resultado de una búsqueda o sugerencia del sistema).
   *
   * @param o - Objeto que contiene:
   *   - `index`: Índice del repuesto a actualizar.
   *   - `price`: Nuevo precio de venta a aplicar.
   */
  priceProductExtra(o: any) {
    const { index, price } = o;
    const parts = this.partsArrayExtra;
    const control = parts.at(index).get('sale_price');
    if (control) {
      control.setValue(price);
    }
  }

  /**
   * Alterna el valor del campo `applyIncrease` del repuesto adicional ubicado en el índice indicado
   * dentro del `FormArray` `tab3_extra.spare_parts`.
   *
   * - Usa el getter `partsArrayExtra` para obtener el arreglo reactivo correspondiente.
   * - Localiza el control `applyIncrease` dentro del `FormGroup` en la posición dada.
   * - Si existe, invierte su valor actual (`true ↔ false`).
   *
   * Este método permite activar o desactivar visualmente el recargo del 10% desde la interfaz (checkbox),
   * manteniendo la lógica de cálculo separada para claridad estructural.
   *
   * @param {number} index - Índice del repuesto extra a modificar.
   */
  aplyIncrement(index: number) {
    const parts = this.partsArrayExtra;
    const control = parts.at(index).get('applyIncrease');
    if (control) {
      control.setValue(!control.value);
    }
  }

  /**
   * Actualiza el campo `cost` de una labor ubicada en el índice indicado dentro del `FormArray`
   * `tab2.labours`, asignando un nuevo valor de precio.
   *
   * - Usa el índice `index` para localizar el `FormGroup` correspondiente en `labourArray`.
   * - Accede al control `cost` y, si existe, le asigna el nuevo valor `price` mediante `setValue(...)`.
   *
   * Este método puede usarse desde selección de tarifa, resultado de búsqueda o asignación manual.
   *
   * @param o - Objeto con:
   *   - `index`: Índice de la labor a actualizar.
   *   - `price`: Nuevo costo unitario a aplicar.
   */
  priceLabour(o: any) {
    const { index, price } = o;
    const parts = this.labourArray;
    const control = parts.at(index).get('cost');
    if (control) {
      control.setValue(price);
    }
  }

  /**
   * Actualiza por completo el `FormArray` `tab2.labours` a partir de un arreglo externo de objetos `labour`,
   * reemplazando su contenido con nuevos `FormGroup` generados dinámicamente.
   *
   * - Por cada entrada del arreglo `data`, crea un `FormGroup` con:
   *   - `name`: Nombre de la labor (requerido).
   *   - `cost`: Precio unitario de la labor (requerido, validado con `validateCost`).
   *   - `totalIn`: Inicializado en `0`, usado para calcular el total en etapas posteriores.
   *
   * - Limpia el contenido actual de `labourArray` con `.clear()`.
   * - Inserta los nuevos formularios uno a uno mediante `.push(...)`.
   *
   * Este método se utiliza para sincronizar el formulario con datos preexistentes,
   * por ejemplo tras cargar un parte guardado o desde backend.
   *
   * @param data - Arreglo de objetos `{ name: string, cost: number }` representando labores a cargar.
   */
  mapLabourUpdate(data: any) {
    const labourGroup = data.map((item: any) => {
      return this.fb.group({
        name: new FormControl(item.name, [Validators.required]),
        cost: new FormControl(item.cost, [
          Validators.required,
          this.validateCost.bind(this),
        ]),
        totalIn: new FormControl(0),
        isCustom: new FormControl(false),
        employee: new FormControl(item.employee?._id ?? (typeof item.employee === 'string' ? item.employee : '') ?? ''),
        employeeName: new FormControl(item.employee?.fullName ?? ''),
        date: new FormControl(item.date ?? null),
      });
    });
    this.labourArray.clear();
    labourGroup.forEach((o: any) => {
      this.labourArray.push(o);
    });
  }

  /**
   * Reemplaza por completo el contenido del `FormArray` `tab3.spare_parts` con
   * nuevos `FormGroup` generados a partir de un arreglo externo de repuestos.
   *
   * - Por cada objeto `item` en `data`, se construye un `FormGroup` con:
   *   - `_id`: Identificador del repuesto (mapeado desde `item.product`).
   *   - `amount`: Cantidad del repuesto.
   *   - `sale_price`: Precio unitario de venta.
   *   - `totalIn`: Inicializado en `0` (calculado posteriormente).
   *
   * - Limpia el `FormArray` actual con `.clear()`.
   * - Inserta cada nuevo grupo mediante `.push(...)`.
   *
   * Este método es útil al cargar partes desde persistencia o recuperación de un parte guardado.
   *
   * @param data - Arreglo de objetos `{ product: string, amount: number, sale_price: number }`
   *               representando repuestos a cargar.
   */
  mapPartsUpdate(data: any) {
    const partsGroup = data.map((item: any) => {
      return this.fb.group({
        _id: new FormControl(item.product, [Validators.required]),
        amount: new FormControl(item.amount, [Validators.required]),
        sale_price: new FormControl(item.sale_price, [Validators.required]),
        totalIn: new FormControl(0),
      });
    });
    this.partsArray.clear();
    partsGroup.forEach((o: any) => {
      this.partsArray.push(o);
    });
  }

  /**
   * Reemplaza completamente el contenido del `FormArray` `tab3_extra.spare_parts` con
   * repuestos manuales generados a partir de un arreglo externo de datos.
   *
   * - Por cada entrada de `data`, construye un `FormGroup` con:
   *   - `product`: Nombre del repuesto (texto libre).
   *   - `amount`: Cantidad solicitada.
   *   - `sale_price`: Precio de venta unitario.
   *   - `totalIn`: Inicializado en `0`, se calcula posteriormente.
   *   - `applyIncrease`: Bandera booleana para aplicar recargo (true/false).
   *
   * - Limpia el `FormArray` actual con `.clear()`.
   * - Inserta los grupos generados mediante `.push(...)`.
   *
   * Este método es útil para cargar registros manuales guardados desde backend o importar
   * contenido externo (por ejemplo, desde archivo Excel o API de otra fuente).
   *
   * @param data - Arreglo de objetos `{ product: string, amount: number, sale_price: number, applyIncrease: boolean }`
   */
  mapPartsExUpdate(data: any) {
    const partsGroup = data.map((item: any) => {
      return this.fb.group({
        product: new FormControl(item.product, [Validators.required]),
        amount: new FormControl(item.amount, [Validators.required]),
        sale_price: new FormControl(item.sale_price, [Validators.required]),
        totalIn: new FormControl(0),
        applyIncrease: new FormControl(item.applyIncrease),
      });
    });
    this.partsArrayExtra.clear();
    partsGroup.forEach((o: any) => {
      this.partsArrayExtra.push(o);
    });
  }

  /**
   * Actualiza el `FormArray` `tab1.status` reemplazando su contenido con los valores del
   * arreglo recibido `statuses`.
   *
   * - Llama a `.clear()` para eliminar cualquier estado anterior.
   * - Itera sobre `statuses`, creando un nuevo `FormControl` por cada valor y lo agrega al arreglo.
   *
   * Esta función es útil al cargar partes previamente guardadas o sincronizar con selección múltiple
   * externa.
   *
   * @param statuses - Arreglo de strings representando los estados a cargar (ej. `["Programada", "En progreso"]`).
   */
  mapStatusUpdate(statuses: string[]) {
    const statusArray = this.statusArray;
    statusArray.clear(); // limpiamos por si ya hay algo

    statuses.forEach((status) => {
      statusArray.push(new FormControl(status));
    });
  }

  /**
   * Accede de forma tipada al `FormArray` `images` dentro del grupo `tab5`.
   *
   * - Llama a `getTab5Form()` para obtener el `FormGroup` asociado a la pestaña de imágenes.
   * - Devuelve el control `images` casteado como `FormArray`, permitiendo iterar o modificar su contenido.
   *
   * Este getter facilita operaciones como agregar, eliminar o recorrer imágenes asociadas al parte,
   * ya sea desde lógica del componente o desde la plantilla.
   *
   * @returns {FormArray} Arreglo de controles que representan las imágenes vinculadas al formulario de `tab5`.
   */
  get imagesArray(): FormArray {
    return this.getTab5Form().get('images') as FormArray;
  }

  /**
   * Limpia completamente los `FormArray` correspondientes a `labourArray`, `partsArray`
   * y `partsArrayExtra` utilizando el método auxiliar `clearFormArray(...)`.
   *
   * - Borra todas las labores, repuestos normales y repuestos adicionales del formulario.
   * - Cada arreglo se limpia con llamada a `clearFormArray(...)`, que encapsula la lógica de borrado.
   *
   * Este método puede utilizarse al reiniciar formularios, cargar datos nuevos o preparar
   * el estado base antes de crear nuevas entradas.
   */
  cleanFormArray() {
    this.clearFormArray(this.labourArray);
    this.clearFormArray(this.partsArray);
    this.clearFormArray(this.partsArrayExtra);
  }

  /**
   * Inicializa o actualiza el formulario principal (`this.form`) con los datos
   * de la orden actual, si existe (`order()`), o prepara el estado base para una nueva creación.
   *
   * - Si `order` existe:
   *   - Establece `isEdit` a `true`.
   *   - Llena múltiples secciones del formulario (`tab1`, `tab3`, `tab5`, `tab6`) con `patchValue`.
   *   - Asigna imágenes a `imagesVehicleData`.
   *   - Llama a funciones auxiliares para mapear `status`, `labour`, `spare_parts` y `spare_parts_extra`.
   *
   * - Si `order` no existe:
   *   - Reinicia `completedLabours` y `selectedEmployees`.
   *   - Aplica valores predeterminados al formulario, como fecha/hora actuales, método de pago y abono.
   *
   * Esta función centraliza la lógica de carga/edición del formulario de parte de servicio.
   * También asegura la reactividad entre tabs, datos externos y la estructura interna del formulario.
   */
  updateForm() {
    const order = this.order();
    this.isEdit = !!order;
    this.currentOrderId = order?._id ?? null;
    this.tabs = order
      ? [...this.BASE_TABS, 'Historial']
      : [...this.BASE_TABS];
    this.formResetTab();
    this.localMechanics = (order as any)?.mechanics ?? [];
    if (order) {
      const start_date = order.start_date
        ? new Date(order.start_date).toISOString().split('T')[0]
        : '';

      this.form.patchValue({
        tab1: {
          _id: order._id,
          codigo: order.codigo,
          kmts: order.kmts,
          start_date,
          start_time: order.start_time,
          request: order.request,
          vehicleFilter: order.preInvoice?.vehicle?.plate ?? '',
          model_veh: order.preInvoice?.vehicle?.model ?? '',
          key_veh: order.key_veh ?? '',
          ownerId: order.preInvoice?.subscriber?._id ?? '',
          contact_client: order.preInvoice?.subscriber?.cell_phone ?? '',
          contact_client_2: order.preInvoice?.subscriber?.cell_phone_2 ?? '',
          vehicleId: order.preInvoice?.vehicle?._id ?? '',
          observation: order.observation ?? '',
          client: order.preInvoice?.subscriber?.fullName ?? '',
          client_contact: order.contact_client ?? '',
        },
        tab3: {
          _id: order.preInvoice?._id ?? '',
          paymentM: order.preInvoice?.paymentM ?? '',
          abono: order.preInvoice?.abono ?? 0,
        },
        tab5: {
          _idVehicleCondition: order.vehicleCondition?._id ?? '',
        },
        tab6: {
          createdBy: order.created_by ?? 'SUPER ADMIN',
          delegate: order.retiro?.delegate ?? 'Sin Asignar',
          identification: order.retiro?.number_identification ?? 'Sin Asignar',
        },
      });

      this.imagesVehicleData = order.vehicleCondition?.images ?? [];

      // Agrupar funciones de mapeo con validación mejorada
      if (Array.isArray(order.status) && order.status.length > 0) {
        this.mapStatusUpdate(order.status);
      }

      if (Array.isArray(order.labour) && order.labour.length > 0) {
        this.mapLabourUpdate(order.labour);
      }

      if (Array.isArray(order.spare_parts) && order.spare_parts.length > 0) {
        this.mapPartsUpdate(order.spare_parts);
      }

      if (
        Array.isArray(order.spare_parts_extra) &&
        order.spare_parts_extra.length > 0
      ) {
        this.mapPartsExUpdate(order.spare_parts_extra);
      }
    } else {
      // Inicializar valores predeterminados
      this.completedLabours = []; // ← AGREGAR ESTA LÍNEA
      this.selectedEmployees = []; // ← AGREGAR ESTA LÍNEA
      const today = new Date();
      const localDate = today.toLocaleDateString('en-CA');
      const localTime = today.toTimeString().slice(0, 5);

      this.form.get('tab1')?.reset({
        status: ['Pendiente'],
        start_date: localDate,
        start_time: localTime,
      });

      this.form.get('tab3')?.reset({
        paymentM: 'tarjeta',
        abono: 0,
      });
    }
  }

  /**
   * Indica si existen imágenes cargadas en el formulario, ya sea en tiempo real (`imagesVehicle`)
   * o provenientes de datos precargados (`imagesVehicleData`).
   *
   * - Retorna `true` si al menos uno de los arreglos tiene longitud mayor a cero.
   * - Se usa típicamente para condicionar visibilidad de galerías, botones de descarga
   *   o controles de visualización en la plantilla.
   *
   * @returns {boolean} `true` si hay imágenes presentes, `false` en caso contrario.
   */
  get hasImages(): boolean {
    return (
      (this.imagesVehicle && this.imagesVehicle.length > 0) ||
      (this.imagesVehicleData && this.imagesVehicleData.length > 0)
    );
  }

  /**
   * Restaura por completo el estado de los formularios `tab2` y `tab5`,
   * así como los arrays asociados a imágenes, labores y repuestos.
   *
   * - Llama a `.reset()` sobre los grupos `tab2` (labores) y `tab5` (condición del vehículo).
   * - Limpia el arreglo `imagesVehicle` y deja `imagesVehicleData` como `null`.
   * - Llama a `clearImagesArray()` para vaciar el `FormArray` de imágenes del formulario.
   * - Limpia los `FormArray` de `labourArray`, `partsArray` y `partsArrayExtra`.
   *
   * Este método es útil al cambiar entre modos (`edición ↔ creación`) o al
   * reiniciar la interfaz reactiva tras carga de datos.
   */
  formResetTab() {
    this.form.get('tab2')?.reset();
    this.form.get('tab5')?.reset();
    this.imagesVehicle = [];
    this.imagesVehicleData = null;
    this.clearImagesArray();
    this.clearFormArray(this.labourArray);
    this.clearFormArray(this.partsArray);
    this.clearFormArray(this.partsArrayExtra);
  }

  /**
   * Determina si el botón de envío del formulario debe estar deshabilitado, en función
   * del estado de los datos cargados y los campos del formulario.
   *
   * - Evalúa si el único estado seleccionado es `"Pendiente"` o `"En Progreso"`.
   * - Si solo está `"Pendiente"` o `"En Progreso"`:
   *   - Permite el envío solo si `tab1` es válido.
   *   - Si hay datos cargados en `partsArray`, `partsArrayExtra` o `labourArray`, también deben ser válidos.
   * - Si hay otro estado adicional (ej. `"Terminado"`):
   *   - Se evalúa la validez global de todo el `form`.
   *
   * Esta lógica asegura que el botón de enviar solo se active si:
   * - Los formularios visibles están correctamente validados.
   * - Y si hay datos cargados que deben verificarse (repuestos o labores), estos también estén validados.
   *
   * @returns `true` si el botón debe estar deshabilitado, `false` si se puede habilitar.
   */
  isSubmitDisabled(): boolean {
    const selectedStatuses = this.form.get('tab1.status')?.value || [];
    const lastStatus = selectedStatuses[selectedStatuses.length - 1];
    const isPendienteOnly =
      selectedStatuses.length === 1 &&
      (lastStatus === 'Pendiente' || lastStatus === 'En Progreso');
    const tab1Form = this.form.get('tab1');

    const partsArrayValid = this.partsArray?.valid ?? true;
    const partsArrayExtraValid = this.partsArrayExtra?.valid ?? true;
    const labourArrayValid = this.labourArray?.valid ?? true;

    const anyArrayHasData =
      this.partsArray.length > 0 ||
      this.partsArrayExtra.length > 0 ||
      this.labourArray.length > 0;

    if (isPendienteOnly) {
      if (anyArrayHasData) {
        return (
          !tab1Form?.valid ||
          !partsArrayValid ||
          !partsArrayExtraValid ||
          !labourArrayValid
        );
      }
      return !tab1Form?.valid;
    } else {
      return !this.form.valid;
    }
  }

  /**
   * Procesa el envío del formulario principal (`this.form`) si pasa las validaciones definidas en `isSubmitDisabled()`.
   *
   * - Si hay archivos en `imagesVehicle`, los filtra por tamaño y los sube con `uploadConditionVehicle(...)`.
   *   - Las URLs resultantes se agregan a `data.images`.
   * - Si ya existe una orden (`this.order()`):
   *   - Combina las imágenes nuevas con las existentes en `order.vehicleCondition.images`.
   *   - Elimina las imágenes marcadas como eliminadas en `this.imagesRemoved`.
   *   - Emite los datos mediante `this.edit.emit(...)`.
   * - Si no hay orden previa:
   *   - Elimina `data._id` si existe.
   *   - Emite los datos mediante `this.save.emit(...)`.
   *
   * Después del envío:
   * - Limpia el formulario con `formReset()`.
   * - Cierra el diálogo mediante `onClose()`.
   */
  async onSubmit() {
    if (this.isSubmitDisabled() === false) {
      const data = { ...this.form.value };
      // Verificamos si existe imagesVehicle y si tiene archivos válidos
      const validFiles =
        this.imagesVehicle && this.imagesVehicle.length > 0
          ? this.imagesVehicle.filter((file: any) => file && file.size > 0)
          : [];
      if (validFiles.length > 0) {
        try {
          const uploadResponse = await this.uploadConditionVehicle(validFiles);
          // Si ya existen imágenes, las agregamos a las nuevas
          data.images = data.images
            ? [...data.images, ...uploadResponse.imageUrls]
            : uploadResponse.imageUrls;
        } catch (error) {
          console.error('Error al subir imágenes:');
        }
      }

      // Asegurarse de que data.images sea un arreglo
      data.images = Array.isArray(data.images) ? data.images : [];

      if (this.order()) {
        // Si ya hay imágenes en order, las agregamos a las nuevas
        const existingImages = this.order()?.vehicleCondition?.images || [];
        data.images = [...existingImages, ...data.images]; // Combina las imágenes existentes con las nuevas
        // Filtra las imágenes eliminadas
        if (this.imagesRemoved && this.imagesRemoved.length > 0) {
          data.images = data.images.filter(
            (img: string) => !this.imagesRemoved.includes(img)
          );
        }
        this.edit.emit(data);
      } else {
        delete data._id;
        this.save.emit(data);
      }
      this.formReset();
      this.onClose();
    }
  }

  /**
   * Asigna el arreglo de imágenes del vehículo (`imagesVehicle`) con el valor recibido.
   *
   * - Este método se utiliza comúnmente desde la vista o componente hijo
   *   para establecer las imágenes capturadas o seleccionadas por el usuario.
   * - No realiza validación interna: se asume que el formato del arreglo es válido (ej. `File[]` o `string[]`).
   *
   * @param images - Arreglo de imágenes cargadas o seleccionadas para la condición del vehículo.
   */
  vehicleCondition(images: any) {
    this.imagesVehicle = images;
  }

  /**
   * Marca una imagen como eliminada y la remueve del arreglo local `imagesVehicle`.
   *
   * - Agrega la `url` proporcionada al arreglo `imagesRemoved`, que se usará
   *   para filtrar imágenes durante el guardado (`onSubmit()`).
   * - Busca la imagen correspondiente en `imagesVehicle` comparando por `image.url`.
   * - Si se encuentra, remueve esa imagen del arreglo con `splice(...)`.
   *
   * Este método sincroniza el estado visual del componente con el registro
   * lógico de imágenes eliminadas, permitiendo control completo sobre la persistencia final.
   *
   * @param url - URL de la imagen a eliminar del listado visual y registrar como eliminada.
   */
  handleImageRemoval(url: string) {
    this.imagesRemoved.push(url);
    const index = this.imagesVehicle.findIndex(
      (image: any) => image.url === url
    );
    if (index !== -1) {
      this.imagesVehicle.splice(index, 1);
    }
  }

  /**
   * Sube imágenes del estado del vehículo mediante el servicio `uploadImages(...)`,
   * envolviendo la operación en una `Promise` para facilitar el uso con `async/await`.
   *
   * - Llama a `this.service.uploadImages(images)`, que retorna un `Observable`.
   * - Se suscribe internamente y resuelve o rechaza la `Promise` según respuesta o error.
   *
   * Este método permite usar sintaxis secuencial `await uploadConditionVehicle(...)`
   * en lugar de manejar manualmente suscripciones dentro del componente.
   *
   * @param images - Arreglo de archivos (por ejemplo `File[]`) a subir al servidor.
   * @returns {Promise<any>} Promesa que resuelve con la respuesta del backend (`res`) o
   * rechaza con el error recibido.
   */
  uploadConditionVehicle(images: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.service.uploadImages(images).subscribe(
        (res) => {
          resolve(res);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Maneja el cambio en el método de pago u opciones relacionadas,
   * invocando `updateTotal()` para recalcular montos actualizados.
   *
   * - Este método puede ser utilizado por elementos de formulario como `select`, `radio` o `checkbox`
   *   que modifican condiciones comerciales (ej. aplicar recargos o descuentos).
   * - El cálculo real se delega a `updateTotal()`, manteniendo la lógica separada para claridad.
   *
   * Este patrón asegura una respuesta inmediata en la interfaz cuando el usuario modifica
   * formas de pago u opciones con impacto financiero.
   */
  onPaymentChange() {
    this.updateTotal();
  }

  //tab7

  /**
   * Validador personalizado para un `FormArray` que representa empleados seleccionados.
   *
   * - Retorna `null` si el arreglo tiene al menos un elemento (válido).
   * - Retorna `{ required: true }` si el arreglo está vacío o no existe.
   *
   * Este validador puede utilizarse para asegurar que se haya asignado al menos un responsable
   * o colaborador en partes de trabajo donde la intervención humana es obligatoria.
   *
   * @param control - Objeto `AbstractControl` esperado como `FormArray`.
   * @returns Un objeto de error (`{ required: true }`) si el arreglo está vacío, `null` si es válido.
   */
  validateEmployees(control: AbstractControl): { [key: string]: any } | null {
    const formArray = control as any;
    return formArray && formArray.length > 0 ? null : { required: true };
  }

  /**
   * Accede tipadamente al `FormArray` `employees` dentro del grupo `tab7` del formulario principal.
   *
   * - Devuelve el arreglo de empleados seleccionado en la pestaña de asignación.
   * - Permite realizar operaciones como agregar, eliminar o validar empleados desde código o plantilla.
   *
   * Este getter mejora la legibilidad al evitar múltiples accesos repetidos como
   * `this.form.get('tab7.employees')`, centralizando el acceso al arreglo.
   *
   * @returns {FormArray} Arreglo reactivo de empleados en `tab7`.
   */
  get employeesArray(): FormArray {
    return this.form.get('tab7.employees') as FormArray;
  }

  /**
   * Agrega un empleado al arreglo `selectedEmployees` y al `FormArray` `employeesArray`
   * si aún no ha sido seleccionado.
   *
   * - Evalúa si el empleado ya está presente mediante `isEmployeeSelected(...)`.
   * - Si no lo está:
   *   - Lo agrega al arreglo visual `selectedEmployees`.
   *   - Añade su `_id` al `FormArray` `tab7.employees` mediante un nuevo `FormControl`.
   *
   * Este método permite selección dinámica de personal, manteniendo coherencia visual y de validación.
   *
   * @param employee - Objeto que representa al empleado a agregar (debe contener al menos `_id`).
   */
  select(employee: any) {
    if (this.isEmployeeSelected(employee._id)) return;
    this.selectedEmployees.push(employee);
    this.employeesArray.push(new FormControl(employee._id));
  }

  /**
   * Verifica si un empleado con el `id` proporcionado ya ha sido seleccionado.
   *
   * - Itera sobre el arreglo `selectedEmployees` y compara contra `_id`.
   * - Retorna `true` si el empleado ya está presente, `false` en caso contrario.
   *
   * Este método se utiliza para evitar duplicaciones al seleccionar empleados,
   * manteniendo la coherencia entre `selectedEmployees` y `employeesArray`.
   *
   * @param id - Identificador único del empleado a verificar.
   * @returns `true` si el empleado ya fue seleccionado, `false` si no lo está.
   */
  isEmployeeSelected(id: string): boolean {
    return this.selectedEmployees.some((e) => e._id === id);
  }

  /**
   * Elimina un empleado del arreglo `selectedEmployees` y del `FormArray` `employeesArray`
   * en la posición indicada.
   *
   * - Utiliza `splice(...)` para quitar al empleado del arreglo visual.
   * - Usa `removeAt(...)` para eliminar el control correspondiente en el `FormArray`.
   *
   * Esta operación mantiene la coherencia entre la selección visual y la representación
   * estructurada del formulario, permitiendo validaciones limpias y sincrónicas.
   *
   * @param index - Índice del empleado a eliminar en ambos arreglos.
   */
  removeEmployee(index: number): void {
    this.selectedEmployees.splice(index, 1);
    this.employeesArray.removeAt(index);
  }

  /**
   * Accede al `FormGroup` correspondiente a la pestaña de empleados (`tab7`) en el formulario principal.
   *
   * - Utiliza `this.form.get('tab7')` para obtener el control.
   * - Verifica que el control sea una instancia válida de `FormGroup`.
   * - Si lo es, lo retorna; si no, retorna `null` como medida de seguridad.
   *
   * Este método es útil para abstraer el acceso a `tab7` desde múltiples partes del código
   * sin repetir lógica defensiva de verificación.
   *
   * @returns {FormGroup | null} El grupo de `tab7` si está disponible, o `null` si no lo es.
   */
  getTabEForm(): FormGroup | null {
    const control = this.form.get('tab7');
    return control instanceof FormGroup ? control : null;
  }

  /**
   * Determina si debe mostrarse el botón asociado, en función del estado actual de la orden.
   *
   * - Recupera el arreglo de estados desde `this.order()?.status`.
   * - Retorna `true` si el estado **no** incluye `"Cancelada"`, lo que permite mostrar el botón.
   * - Retorna `false` si la orden ha sido cancelada, ocultando así el botón.
   *
   * Este método es útil para condicionar elementos interactivos en la interfaz,
   * evitando acciones sobre órdenes ya canceladas.
   *
   * @returns `true` si el botón debe mostrarse, `false` si debe ocultarse.
   */
  shouldShowButton(): boolean {
    const statusArray = this.order()?.status;
    return !statusArray?.includes('Cancelada');
  }

  /**
   * Determina si la orden actual está en estado de solo lectura.
   *
   * - Considera como "sólo lectura" aquellas con estado `Cancelada`.
   * - Retorna `true` si `order().status` incluye dicha palabra.
   *
   * @returns `true` si la orden está cancelada, `false` en cualquier otro caso.
   */
  isReadOnly(): boolean {
    return this.order()?.status?.includes('Cancelada') ?? false;
  }

  //validadores

  /**
   * Validador personalizado que utiliza `validateService.validateIngreso(...)`
   * para comprobar si la fecha de ingreso es válida.
   *
   * - Envía `control.value` al método `validateIngreso` del servicio externo.
   * - Si la validación pasa, retorna `null` (válido).
   * - Si falla, retorna `{ invalidDate: true }`, lo que marca el campo como inválido.
   *
   * Este validador es útil para validar fechas de ingreso según reglas de negocio,
   * como formato, rango permitido o restricciones específicas (por ejemplo, no fechas futuras).
   *
   * @param control - Control de formulario cuya fecha debe validarse.
   * @returns Objeto de error si es inválido, o `null` si es válido.
   */
  validateIngreso(control: AbstractControl): { [key: string]: any } | null {
    return this.validateService.validateIngreso(control.value)
      ? null
      : { invalidDate: true };
  }

  /**
   * Validador personalizado para campos numéricos que representan costos unitarios.
   *
   * - Verifica que el valor no sea `null`, `undefined` ni cadena vacía.
   * - Limpia el valor: lo convierte en `string`, recorta espacios y reemplaza comas por puntos.
   * - Intenta hacer `parseFloat(...)` del valor resultante.
   * - Retorna `{ required: true }` si está vacío.
   * - Retorna `{ invalidNumber: true }` si no es un número positivo válido.
   * - En caso de pasar los checks básicos, delega a `validateService.validarPrecios(...)`
   *   que puede contener reglas adicionales de negocio (por ejemplo, precio mínimo/máximo).
   *
   * Este validador puede usarse en campos como `cost` o `sale_price`, donde se
   * espera que el usuario ingrese un valor numérico confiable.
   *
   * @param control - Control de formulario que contiene el valor a validar.
   * @returns Objeto con error si el valor es inválido, `null` si es válido.
   */
  validateCost(control: AbstractControl): { [key: string]: any } | null {
    let value = control.value;

    if (value === null || value === undefined || value === '') {
      return { required: true };
    }

    value = String(value).trim();
    value = value.replace(',', '.');
    const numericValue = parseFloat(value);

    if (numericValue < 0 || isNaN(numericValue)) {
      return { invalidNumber: true };
    }

    return this.validateService.validarPrecios(value)
      ? null
      : { invalidNumber: true };
  }

  /**
   * Validador personalizado para campos de precio unitario.
   *
   * - Verifica que el valor no sea `null`, `undefined` ni cadena vacía.
   * - Normaliza el valor convirtiéndolo a `string`, limpiando espacios y reemplazando comas por puntos decimales.
   * - Intenta convertir el valor a número (`parseFloat`) y valida:
   *   - Si el valor es exactamente `0`, retorna `{ zeroNotAllowed: true }`.
   *   - Si es un número negativo o inválido, retorna `{ invalidNumber: true }`.
   * - Si pasa validaciones básicas, delega la lógica final a `validateService.validarPrecios(value)`.
   *   - Si es válido según el servicio, retorna `null`; de lo contrario, `{ invalidNumber: true }`.
   *
   * Este validador es ideal para campos sensibles como `precio_unitario`, donde se requiere
   * un número positivo y compatible con formatos internacionales (coma/punto).
   *
   * @param control - Control del formulario que contiene el valor de precio.
   * @returns Un objeto de error si el valor es inválido; `null` si es válido.
   */
  validatePrecio(control: AbstractControl): { [key: string]: any } | null {
    let value = control.value;

    if (value === null || value === undefined || value === '') {
      return { required: true };
    }

    value = String(value).trim(); // Convertir a string antes de trim()

    value = value.replace(',', '.'); // Reemplaza coma por punto antes de validar
    const numericValue = parseFloat(value);

    if (numericValue === 0) {
      return { zeroNotAllowed: true };
    }

    if (numericValue < 0 || isNaN(numericValue)) {
      return { invalidNumber: true };
    }
    return this.validateService.validarPrecios(value)
      ? null
      : { invalidNumber: true };
  }

  /**
   * Reinicia el formulario principal (`this.form`) y reconstruye su estado
   * actual invocando `updateForm()`.
   *
   * - Llama a `.reset()` sobre todo el formulario para eliminar valores y validaciones previas.
   * - A continuación, ejecuta `updateForm()` que repuebla el formulario basándose
   *   en la lógica definida (edición con `order()` o valores iniciales por defecto).
   *
   * Este método es ideal para usar tras una acción de guardar, cancelar o limpiar pantalla
   * antes de editar un nuevo registro.
   */
  formReset() {
    this.form.reset();
    this.updateForm();
  }

  /**
   * Maneja el cierre del modal o panel actual, restaurando el estado visual y de formulario.
   *
   * - Establece `activeTab` en `'Ingreso'` para asegurar que la siguiente apertura
   *   del formulario comience en una pestaña conocida y predecible.
   * - Llama a `formReset()` para limpiar el formulario y reconstruirlo desde su estado base.
   * - Emite el evento `closeModal` para informar al componente padre que debe ocultar la interfaz actual.
   *
   * Este método asegura un cierre limpio y reutilizable, preservando la UX y evitando
   * estados residuales entre sesiones.
   */
  onClose() {
    this.activeTab = 'Ingreso';
    this.formReset();
    this.closeModal.emit();
  }

  getAvailablePaymentMethods(
    currentUserRoles: string[]
  ): { label: string; value: string }[] {
    const isSuperAdmin = currentUserRoles.includes('Super Admin');
    return isSuperAdmin
      ? this.allPaymentMethods
      : this.allPaymentMethods.filter((method) => method.value !== 'Credito');
  }

  /**
   * Lifecycle hook que se ejecuta cuando el componente está a punto de destruirse.
   *
   * - Emite un valor (`next()`) en el sujeto `destroy$` para activar la desuscripción
   *   de todos los `takeUntil(this.destroy$)` en observables activos.
   * - Completa el sujeto con `complete()` para liberar recursos.
   *
   * Este patrón asegura que no haya fugas de memoria ni listeners pendientes,
   * y permite una limpieza reactiva de suscripciones cuando el componente se destruye.
   */

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
