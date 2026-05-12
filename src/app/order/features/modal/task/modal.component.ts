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
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToolTipComponent } from '../../../../shared/ui/tool-tip/tool-tip.component';
import { ValidateService } from '../../../../core/validation/validation.service';
import { Task } from '../../task-list/task.model';
import { employeeService } from '../../../../user/data-access/employee.service';
import { Tab2Component } from '../order/sections/tab-2/tab-2.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-modal',
  imports: [CommonModule, ReactiveFormsModule, ToolTipComponent, Tab2Component],
  templateUrl: './modal.component.html',
  styles: ``,
})

/**
 * Componente modal encargado de gestionar tareas asignadas a empleados mediante
 * un formulario reactivo y eventos personalizados.
 *
 * - Define inputs como `isOpen` y `task` para controlar visibilidad y datos entrantes.
 * - Expone outputs como `closeModal` y `edit` para comunicar acciones al componente padre.
 * - Contiene lógica para filtrado de empleados, validación de asignación y visibilidad de campos.
 * - Usa `destroy$` para desuscribirse de observables correctamente al destruirse (`ngOnDestroy()`).
 *
 * Este componente encapsula la lógica visual y reactiva necesaria para
 * administrar tareas individuales de manera coherente con el resto del sistema.
 */
export class ModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isOpen = input<boolean>(false);
  task = input<Task | null>();
  closeModal = output<void>();
  edit = output<Task>();

  taskForm: FormGroup;
  filteredEmployee: any[] = [];
  notFoundOwner = false;
  errorMessage = '';
  notSelected = false;
  isShowingPassword = false;
  selectedEmployees: any[] = [];
  message = 'No hay empleados asignados a esta tarea.';
  orderCode = '';
  previousStatus: string | null = null;
  longLabour: number = 0;

  private tab2LabourSubscribed = false;

  /**
   * Constructor del componente `ModalComponent`, encargado de:
   *
   * - Inyectar dependencias clave:
   *   - `FormBuilder` para construir el formulario reactivo `taskForm`.
   *   - `ValidateService` para aplicar validaciones personalizadas.
   *   - `employeeService` para consultas o lógica relacionada con empleados.
   *
   * - Inicializar el formulario `taskForm` con grupos y arreglos como:
   *   - `employees`: incluye validador personalizado `validateEmployees`.
   *   - `tab2.labours`: se gestionan desde un subgrupo.
   *
   * - Registrar efectos:
   *   - Ejecuta `updateForm()` de forma reactiva cuando el componente se inicializa,
   *     permitiendo cargar datos en modo edición o establecer valores base.
   *
   * - Subscribirse a `valueChanges` de `valueFilter`:
   *   - Llama a `filterEmployee(...)` para buscar empleados.
   *   - Limpia el filtro si el valor está vacío (`''`), restaurando el listado.
   *
   * Este constructor establece la base funcional y reactiva del componente modal
   * para la gestión de tareas vinculadas a empleados.
   */
  constructor(
    private fb: FormBuilder,
    private validateService: ValidateService,
    private serviceEmployee: employeeService
  ) {
    this.taskForm = this.fb.group({
      _id: [''],
      order: [''],
      vehicle: [''],
      kmts: [''],
      completed: [false],
      codigo: [''],
      request: [''],
      key_veh: [''],
      employees: this.fb.array([], [this.validateEmployees.bind(this)]),
      spare_parts: this.fb.array<any>([]),
      status: [''],
      valueFilter: [''],
      tab2: this.fb.group({
        _id: [''],
        labours: this.fb.array([]),
        total: [0],
      }),
      observation: [''],
    });
    effect(() => {
      this.updateForm();
    });
    this.taskForm.get('valueFilter')?.valueChanges.subscribe((value) => {
      this.filterEmployee(value);
      if (value === '') {
        this.cleanFilter();
      }
    });
  }

  ngOnInit(): void {
    this.toggleChange();
  }

  /**
   * Escucha cambios en el control `completed` del formulario y actualiza el estado `status`
   * según las condiciones definidas, respetando validaciones y consistencia de datos.
   *
   * - Si el toggle se activa (`completed = true`):
   *   - Si hay empleados asignados, cambia `status` a `"Completada"` y guarda el estado anterior.
   *   - Si no hay empleados, revierte el toggle a `false` sin emitir el evento (`emitEvent: false`).
   *
   * - Si el toggle se desactiva (`completed = false`):
   *   - Restaura el `previousStatus` si es distinto a `"Completada"`.
   *   - Si no hay estado anterior, evalúa y asigna:
   *     - `"En Progreso"` si hay empleados asignados.
   *     - `"Pendiente"` si no los hay.
   *
   * Este método mantiene la coherencia entre los estados de presentación y negocio
   * dentro del formulario `taskForm`, y evita inconsistencias lógicas en la asignación de tareas.
   */
  toggleChange() {
    this.taskForm
      .get('completed')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((completed: boolean) => {
        const statusControl = this.taskForm.get('status');
        const employees = this.taskForm.get('employees') as FormArray;
        const currentStatus = statusControl?.value;

        // Al activar toggle (completed = true)
        if (completed) {
          // Si hay empleados asignados, cambiar a Completada
          if (employees.length > 0) {
            this.previousStatus = currentStatus;
            statusControl?.setValue('Completada');
          } else {
            // Si no hay empleados, no se permite marcar como completada
            this.taskForm
              .get('completed')
              ?.setValue(false, { emitEvent: false });
          }
        }

        // Al desactivar toggle (completed = false)
        else {
          // Restaurar el estado anterior si estaba guardado
          if (this.previousStatus && this.previousStatus !== 'Completada') {
            statusControl?.setValue(this.previousStatus);
          } else {
            // Si no hay estado anterior o era Completada, evaluar nuevamente
            if (employees.length > 0) {
              statusControl?.setValue('En Progreso');
            } else {
              statusControl?.setValue('Pendiente');
            }
          }

          this.previousStatus = null;
        }
      });
  }

  /**
   * Validador personalizado para un `FormArray` de empleados asignados.
   *
   * - Retorna `null` si el arreglo contiene al menos un elemento.
   * - Retorna `{ required: true }` si el arreglo está vacío o no existe.
   *
   * Este validador es útil para garantizar que se haya asignado al menos un empleado
   * antes de permitir el envío del formulario.
   *
   * @param control - Control de tipo `AbstractControl`, esperado como `FormArray`.
   * @returns Objeto de error si no hay empleados asignados, o `null` si es válido.
   */
  validateEmployees(control: AbstractControl): { [key: string]: any } | null {
    const formArray = control as any;
    return formArray && formArray.length > 0 ? null : { required: true };
  }

  /**
   * Accede de forma tipada al `FormArray` `spare_parts` dentro del formulario `taskForm`.
   *
   * - Facilita operaciones como agregar, eliminar o validar repuestos asignados a la tarea.
   * - Mejora la legibilidad al evitar múltiples llamados a `taskForm.get(...)`.
   *
   * Este getter es útil para interactuar de forma clara y segura con la lista de repuestos
   * desde el componente o en la plantilla.
   *
   * @returns {FormArray} Arreglo de repuestos reactivo del formulario de tareas.
   */
  get sparePartsArray(): FormArray {
    return this.taskForm.get('spare_parts') as FormArray;
  }

  /**
   * Accede de forma tipada al `FormArray` de empleados (`employees`) dentro del formulario `taskForm`.
   *
   * - Este arreglo reactivo contiene los identificadores de los empleados asignados a la tarea.
   * - Permite manipulación directa desde el componente (ej. agregar, quitar, validar) de los controles individuales.
   * - Mejora la legibilidad evitando múltiples llamadas a `taskForm.get(...)` con `as FormArray`.
   *
   * Este patrón es útil para mantener el control y validación de asignaciones desde la lógica de negocio.
   *
   * @returns {FormArray} Arreglo reactivo de empleados asignados.
   */
  get employeesArray(): FormArray {
    return this.taskForm.get('employees') as FormArray;
  }

  /**
   * Actualiza dinámicamente el `FormArray` `labourArray` con los datos de labores (`data`),
   * creando un grupo reactivo por cada elemento e incluyendo lógica para sincronizar `cost` y `totalIn`.
   *
   * - Mapea cada ítem de `data` a un `FormGroup` con:
   *   - `name`: Campo requerido.
   *   - `cost`: Campo requerido y validado con `validateCost`.
   *   - `totalIn`: Inicializado igual a `cost` y sincronizado por suscripción.
   *
   * - Cada grupo escucha cambios en `cost` y actualiza `totalIn` sin emitir evento (`emitEvent: false`),
   *   permitiendo una lógica derivada sin recircular eventos.
   *
   * - Limpia el `labourArray` anterior y lo repuebla con los nuevos grupos construidos.
   * - Actualiza `longLabour` con la longitud actual del arreglo de labores.
   *
   * Este método es ideal para reconstruir la pestaña de labores a partir de datos de edición
   * o respuestas del backend.
   *
   * @param data - Arreglo de objetos con propiedades `name` y `cost` (u otras necesarias).
   */
  mapLabourUpdate(data: any) {
    const labourGroup = data.map((item: any) => {
      const group = this.fb.group({
        name: new FormControl(item.name, [Validators.required]),
        cost: new FormControl(item.cost, [
          Validators.required,
          this.validateCost.bind(this),
        ]),
        totalIn: new FormControl(item.cost),
      });

      group.get('cost')?.valueChanges.subscribe((newCost) => {
        group.get('totalIn')?.setValue(newCost, { emitEvent: false });
      });

      return group;
    });

    // Limpiar y setear los nuevos grupos
    this.labourArray.clear();
    labourGroup.forEach((group: FormGroup) => {
      this.labourArray.push(group);
    });
    this.longLabour = this.labourArray.length;
  }

  /**
   * Actualiza el `FormArray` `sparePartsArray` con los datos de repuestos recibidos (`data`),
   * creando un grupo reactivo por cada ítem del arreglo.
   *
   * - Mapea cada objeto de `data` a un `FormGroup` con los campos:
   *   - `series`: Control reactivo con el valor de `item.series`.
   *   - `product`: Control reactivo con el valor de `item.product`.
   *   - `amount`: Control reactivo con el valor de `item.amount`.
   *
   * - Limpia previamente el `sparePartsArray` para evitar duplicados.
   * - Inserta cada grupo recién construido en el `FormArray` de repuestos.
   *
   * Este método es ideal para poblar el formulario con datos existentes,
   * como en el caso de edición de una tarea previamente guardada.
   *
   * @param data - Arreglo de objetos de repuestos con las propiedades `series`, `product` y `amount`.
   */
  mapPartsUpdate(data: any) {
    const partsGroup = data.map((item: any) => {
      return this.fb.group({
        series: new FormControl(item.series),
        product: new FormControl(item.product),
        amount: new FormControl(item.amount),
      });
    });
    this.sparePartsArray.clear();
    partsGroup.forEach((o: any) => {
      this.sparePartsArray.push(o);
    });
  }

  /**
   * Normaliza un arreglo de partes de repuesto (`data`) según su origen (extra o regular),
   * transformando la estructura para que se alinee con el formato esperado en el sistema.
   *
   * - Si `isExtra` es `true`, construye un objeto con:
   *   - `series: null` (ya que los extras no llevan series),
   *   - `product: { name: item.product }` para mantener nombre explícito,
   *   - `amount`: cantidad del repuesto.
   *
   * - Si `isExtra` es `false`, utiliza:
   *   - `series`: tomado de `item.product.series` o `null` si no existe,
   *   - `product`: objeto completo `item.product`,
   *   - `amount`: cantidad proporcionada.
   *
   * Este método es útil para unificar la estructura de datos antes de insertarlos en un `FormArray`,
   * especialmente cuando se mezclan fuentes internas (productos con estructura completa) y externas (nombre plano).
   *
   * @param data - Arreglo de objetos de repuestos (formato flexible).
   * @param isExtra - Bandera que indica si los datos provienen de repuestos externos/extra.
   * @returns {any[]} Arreglo normalizado de repuestos listo para ser mapeado a controles reactivos.
   */
  normalizeParts(data: any[], isExtra: boolean): any[] {
    return data.map((item) => {
      if (isExtra) {
        return {
          series: null,
          product: { name: item.product },
          amount: item.amount,
        };
      } else {
        return {
          series: item.product.series || null,
          product: item.product,
          amount: item.amount,
        };
      }
    });
  }

  /**
   * Combina y normaliza los repuestos (`spare_parts`) y repuestos extra (`spare_parts_extra`)
   * provenientes de la orden (`task.order`), retornando un solo arreglo consolidado.
   *
   * - Verifica que cada fuente (`spare_parts` y `spare_parts_extra`) sea un arreglo válido y no vacío.
   * - Llama a `normalizeParts(...)` con la bandera `isExtra` correspondiente para adaptar la estructura.
   * - Une ambos conjuntos en un arreglo único `parts`.
   *
   * Este método es ideal para preparar los datos antes de ser mapeados a controles reactivos
   * o enviados al backend, manteniendo estructura consistente.
   *
   * @param task - Objeto que contiene una orden con propiedades `spare_parts` y `spare_parts_extra`.
   * @returns {any[]} Arreglo unificado de repuestos normalizados.
   */
  combinateParts(task: any): any[] {
    const parts: any[] = [];
    if (
      Array.isArray(task.order.spare_parts) &&
      task.order.spare_parts.length > 0
    ) {
      const normalized = this.normalizeParts(task.order.spare_parts, false);
      parts.push(...normalized);
    }
    if (
      Array.isArray(task.order.spare_parts_extra) &&
      task.order.spare_parts_extra.length > 0
    ) {
      const normalizedExtra = this.normalizeParts(
        task.order.spare_parts_extra,
        true
      );
      parts.push(...normalizedExtra);
    }
    return parts;
  }

  /**
   * Reconstruye el formulario `taskForm` a partir de los datos de la tarea actual (`this.task()`),
   * garantizando coherencia entre estado reactivo, selección de empleados, repuestos y labores.
   *
   * - Verifica si `task()` devuelve datos válidos.
   * - Limpia completamente el arreglo `employeesArray` y `selectedEmployees`.
   * - Si existen empleados en la tarea, los agrega al `FormArray` y al arreglo visual.
   *
   * - Si existen labores (`order.labour`), actualiza el `FormArray` `labourArray` mediante `mapLabourUpdate(...)`.
   * - Combina los repuestos y repuestos extra mediante `combinateParts(...)`, y si hay datos,
   *   actualiza `sparePartsArray` usando `mapPartsUpdate(...)`.
   *
   * - Finalmente, aplica `patchValue()` con valores principales:
   *   - `_id`, `codigo`, `order`, `vehicle`, `kmts`, `employee`, `status`, `request`, `key_veh`, `valueFilter`, `completed`.
   *   - Usa `{ emitEvent: false }` para evitar disparar reacciones mientras repuebla.
   *
   * - Asigna el código de orden (`orderCode`) al valor actual de `task.order.codigo` si existe.
   *
   * Este método centraliza la lógica de reconstrucción del formulario para modo edición o previsualización.
   */
  updateForm() {
    if (this.task()) {
      const task = this.task(); // para no repetir llamadas
      this.clearFormArray(this.employeesArray);
      this.selectedEmployees = [];
      if (Array.isArray(task?.employee)) {
        this.clearFormArray(this.employeesArray); // Limpia primero
        this.selectedEmployees = [];

        task.employee.forEach((emp) => {
          this.addEmployeeToForm(emp);
          this.selectedEmployees.push(emp);
        });
      }
      if (Array.isArray(task?.order.labour) && task?.order.labour.length > 0) {
        this.mapLabourUpdate(task?.order.labour);
      }
      const combinedParts = this.combinateParts(task);
      if (combinedParts.length > 0) {
        this.mapPartsUpdate(combinedParts);
      }
      this.taskForm.patchValue(
        {
          _id: task?._id,
          codigo: task?.order?.codigo || '',
          order: task?.order._id,
          vehicle: task?.vehicle._id,
          kmts: task?.order.kmts,
          employee: task?.employee?._id || '',
          status: task?.status,
          valueFilter: task?.employee?.fullName || '',
          completed: task?.status === 'Completada' ? task?.completed : false,
          request: task?.order.request || '',
          key_veh: task?.order.key_veh || '',
          observation: task?.order.observation || '',
        },
        { emitEvent: false }
      );
      this.orderCode = task?.order?.codigo ?? '';
    }
  }

  /**
   * Reinicia el formulario `taskForm`, eliminando todos los valores y errores actuales.
   *
   * - Llama a `.reset()` sobre el `FormGroup`, dejando los controles en su estado inicial.
   * - No repuebla valores ni ejecuta lógica adicional como `updateForm()`.
   *
   * Este método es útil para operaciones puntuales donde solo se requiere limpiar el formulario
   * sin necesidad de reconstruirlo desde la fuente de datos.
   */
  formReset() {
    this.taskForm.reset();
  }

  /**
   * Limpia el estado del filtro de empleados, restaurando los valores a su estado base.
   *
   * - Vacía el arreglo `filteredEmployee`, eliminando resultados de búsqueda previos.
   * - Restablece `notFoundOwner` a `false`, indicando que no hay error de búsqueda activa.
   * - Borra cualquier mensaje de error existente (`errorMessage = ''`).
   *
   * Este método se utiliza para reiniciar el estado visual cuando el campo de filtro
   * es borrado o al reintentar una búsqueda desde cero.
   */

  cleanFilter() {
    this.filteredEmployee = [];
    this.notFoundOwner = false;
    this.errorMessage = '';
  }

  /**
   * Elimina todos los controles dentro de un `FormArray`, uno por uno.
   *
   * - Utiliza un bucle `while` para asegurar que el array sea limpiado completamente,
   *   ejecutando `removeAt(0)` repetidamente hasta que `length === 0`.
   *
   * Este método es útil para reiniciar dinámicamente arreglos reactivos en formularios,
   * garantizando que se liberen referencias y se resetee el estado.
   *
   * @param formArray - Instancia de `FormArray` que se desea vaciar.
   */
  clearFormArray(formArray: FormArray) {
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }

  /**
   * Maneja el cierre del modal de tareas, eliminando datos dinámicos y notificando al componente padre.
   *
   * - Limpia completamente el `FormArray` de empleados (`employeesArray`).
   * - Limpia el `FormArray` de labores (`labourArray`) para evitar residuos de ediciones previas.
   * - Emite el evento `closeModal` para que el componente contenedor o padre cierre el modal visualmente.
   *
   * Este método asegura que al cerrar el modal no queden datos residuales que puedan contaminar futuras ediciones
   * o inserciones, garantizando un flujo limpio y predecible.
   */
  onClose() {
    this.clearFormArray(this.employeesArray);
    this.clearFormArray(this.labourArray);
    this.closeModal.emit();
  }

  /**
   * Maneja el envío del formulario `taskForm`, verificando su validez y ejecutando las acciones correspondientes.
   *
   * - Si el formulario es válido:
   *   - Clona el valor completo con `{ ...this.taskForm.value }`.
   *   - Si existe una tarea activa (`this.task()`), emite los datos con el `Output` `edit`.
   *   - Llama a `onClose()` para cerrar y limpiar el modal/formulario.
   *
   * - Si el formulario es inválido:
   *   - Establece `this.message` con un mensaje de advertencia, indicando que se requiere
   *     al menos un empleado filtrado y asignado.
   *
   * Este método garantiza que solo se envíen tareas con datos válidos y que se preserven
   * reglas de negocio relacionadas con la asignación de empleados.
   */
  onSubmit() {
    if (this.taskForm.valid) {
      const data = { ...this.taskForm.value };
      if (this.task()) {
        this.edit.emit(data);
      }
      this.onClose();
    } else {
      this.message = 'Debe de filtrar y asignar almenos un empleado.';
    }
  }

  /**
   * Agrega un empleado a la lista seleccionada y al `FormArray`, si aún no ha sido incluido.
   *
   * - Verifica con `isEmployeeSelected(_id)` si el empleado ya está en la selección.
   * - Si no lo está:
   *   - Lo agrega a `selectedEmployees`.
   *   - Llama a `addEmployeeToForm(...)` para insertarlo en el formulario.
   *   - Ejecuta `verifyArray()` para validar o actualizar la estructura.
   *
   * - Limpia el campo de búsqueda (`valueFilter`) y su estado visual:
   *   - `setValue('', { emitEvent: false })` evita disparar lógica innecesaria.
   *   - `markAsPristine()` y `markAsUntouched()` restablecen el estilo visual del input.
   *   - Vacía el arreglo `filteredEmployee` para eliminar resultados previos.
   *
   * Este método asegura una asignación segura y limpia de empleados dentro del flujo de edición de tareas.
   *
   * @param employee - Objeto de empleado con al menos `_id` como identificador único.
   */
  select(employee: any) {
    if (!this.isEmployeeSelected(employee._id)) {
      this.selectedEmployees.push(employee);
      this.addEmployeeToForm(employee);

      this.verifyArray();
    }

    // Limpiar el campo de filtro
    this.taskForm.get('valueFilter')?.setValue('', { emitEvent: false });
    this.taskForm.get('valueFilter')?.markAsPristine();
    this.taskForm.get('valueFilter')?.markAsUntouched();
    this.filteredEmployee = [];
  }

  /**
   * Filtra empleados a partir de un valor ingresado, actualizando el arreglo `filteredEmployee`
   * y los estados visuales relacionados (`notFoundOwner`, `errorMessage`).
   *
   * - Si el valor existe y no está vacío tras aplicar `trim()`:
   *   - Reinicia el estado `notFoundOwner` a `false`.
   *   - Llama a `filterMechanics` del servicio `employeeService` con el valor limpio.
   *   - En caso de éxito (`subscribe`):
   *     - Asigna la respuesta (`res`) a `filteredEmployee`.
   *   - En caso de error:
   *     - Establece `notFoundOwner = true`.
   *     - Captura el mensaje de error en `errorMessage`.
   *
   * Este método reactiva el flujo de filtrado de empleados a medida que el usuario escribe,
   * y permite mostrar retroalimentación visual inmediata si no se encuentran coincidencias.
   *
   * @param value - Cadena ingresada en el campo de filtro; puede ser nula.
   */
  filterEmployee(value: string | null) {
    if (value && value.trim()) {
      this.notFoundOwner = false;
      this.serviceEmployee.filterMechanics(value.trim()).subscribe(
        (res) => {
          this.filteredEmployee = res;
        },
        (error) => {
          this.notFoundOwner = true;
          this.errorMessage = error.error.message;
        }
      );
    }
  }

  /**
   * Agrega un nuevo `FormControl` al `FormArray` `employeesArray` con el `_id` del empleado especificado.
   *
   * - Crea un nuevo control con el identificador único del empleado (`employee._id`).
   * - Inserta el control en el arreglo reactivo `employeesArray`, lo que habilita su validación y seguimiento.
   *
   * Este método permite que el empleado seleccionado quede formalmente asignado a la tarea dentro del formulario.
   *
   * @param employee - Objeto de empleado con propiedad `_id` como identificador único.
   */
  addEmployeeToForm(employee: any) {
    this.employeesArray.push(this.fb.control(employee._id));
  }

  /**
   * Verifica si un empleado con el ID especificado ya ha sido asignado (seleccionado).
   *
   * - Itera sobre el arreglo `selectedEmployees` para buscar coincidencias por `_id`.
   * - Devuelve `true` si se encuentra una coincidencia, `false` en caso contrario.
   *
   * Este método previene duplicaciones en la selección de empleados al momento de
   * agregarlos al formulario o a la lista visual.
   *
   * @param employeeId - Identificador único del empleado a verificar.
   * @returns `true` si el empleado ya ha sido seleccionado; `false` si no.
   */

  isEmployeeSelected(employeeId: string): boolean {
    return this.selectedEmployees.some((emp) => emp._id === employeeId);
  }

  /**
   * Verifica la cantidad de empleados asignados y ajusta el estado `status` y el toggle `completed` en consecuencia.
   *
   * - Si no hay empleados (`employees.length === 0`):
   *   - Si el toggle `completed` estaba en `true`, se revierte a `false` (`emitEvent: true`).
   *   - Asigna el estado `"Pendiente"` al control `status`.
   *
   * - Si hay empleados asignados:
   *   - Si `completed` está en `true`, el estado pasa a `"Completada"`.
   *   - Si `completed` está en `false`, se asigna `"En Progreso"`.
   *
   * Este método asegura coherencia visual y lógica entre asignaciones activas, el estado
   * de tarea y el control de finalización (`completed`), evitando inconsistencias involuntarias.
   */
  verifyArray() {
    const completed = this.taskForm.get('completed')?.value;
    const employees = this.taskForm.get('employees') as FormArray;
    const statusControl = this.taskForm.get('status');

    if (employees.length === 0) {
      // Si no hay empleados, resetear el toggle si estaba en true
      if (completed) {
        this.taskForm.get('completed')?.setValue(false, { emitEvent: true });
      }
      statusControl?.setValue('Pendiente');
    } else {
      if (completed) {
        statusControl?.setValue('Completada');
      } else {
        statusControl?.setValue('En Progreso');
      }
    }
  }

  /**
   * Evalúa el estado actual del formulario (`completed`) y la cantidad de empleados asignados
   * para determinar el valor apropiado del campo `status`.
   *
   * - Si el formulario está marcado como completado (`completed = true`) y hay empleados asignados,
   *   se establece el estado como `"Completada"`.
   * - Si no está completado pero hay empleados, se asigna `"En Progreso"`.
   * - Si no hay empleados asignados, se asigna `"Pendiente"` sin importar el estado del toggle.
   *
   * Este método mantiene la coherencia entre el estado de finalización (`completed`)
   * y la asignación efectiva de empleados (`employeesArray.length`).
   */
  validateStatusState() {
    const completed = this.taskForm.get('completed')?.value;
    const numEmployees = this.employeesArray.length;
    const statusControl = this.taskForm.get('status');

    if (completed && numEmployees > 0) {
      statusControl?.setValue('Completada');
    } else if (!completed && numEmployees > 0) {
      statusControl?.setValue('En Progreso');
    } else {
      statusControl?.setValue('Pendiente');
    }
  }

  /**
   * Elimina un empleado tanto de la lista visual `selectedEmployees` como del `FormArray` `employeesArray`
   * en la posición indicada, y luego sincroniza el estado del formulario.
   *
   * - `splice(index, 1)`: Elimina el empleado de la lista de selección visual.
   * - `removeAt(index)`: Elimina el control correspondiente del formulario reactivo.
   * - Llama a `verifyArray()` para actualizar coherentemente los estados `status` y `completed`
   *   en función de la nueva cantidad de empleados asignados.
   *
   * Este método garantiza que la desasignación de un empleado se refleje de forma completa
   * y no deje residuos lógicos ni visuales.
   *
   * @param index - Índice del empleado a eliminar dentro del arreglo de empleados asignados.
   */
  removeEmployee(index: number) {
    // Eliminar del array de seleccionados
    this.selectedEmployees.splice(index, 1);

    // Eliminar del FormArray
    this.employeesArray.removeAt(index);
    this.verifyArray();
  }

  /**
   * Obtiene el `FormGroup` correspondiente a la pestaña `tab2` del formulario `taskForm`.
   *
   * - Si ya existe en el formulario principal, lo reutiliza mediante `get(...)`.
   * - Si no existe, lo crea dinámicamente con campos predeterminados: `labours` como `FormArray` vacío y `total` en 0.
   *
   * - Implementa una bandera `tab2LabourSubscribed` para suscribirse solo una vez a los cambios en `labours`,
   *   previniendo múltiples registros al `valueChanges`.
   *   - Aunque la suscripción actual es vacía, puede ser útil para lógica futura de cálculo o validaciones automáticas.
   *
   * Este método ofrece acceso controlado a `tab2`, asegurando tanto consistencia estructural como seguridad ante
   * múltiples invocaciones.
   *
   * @returns {FormGroup} Instancia del grupo `tab2` ya registrada o recién construida.
   */
  getTab2Form(): FormGroup {
    const form =
      (this.taskForm.get('tab2') as FormGroup) ??
      this.fb.group({
        labours: this.fb.array([]),
        total: [0],
      });

    // Solo suscribirse una vez
    if (!this.tab2LabourSubscribed) {
      form
        .get('labours')
        ?.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe(() => {});
      this.tab2LabourSubscribed = true;
    }

    return form;
  }

  /**
   * Accede de forma tipada al `FormArray` de labores (`labours`) dentro del grupo `tab2` del formulario principal.
   *
   * - Utiliza el método `getTab2Form()` para garantizar acceso seguro al subgrupo correspondiente.
   * - Facilita operaciones como agregar, eliminar, validar o mapear labores asociadas a la tarea.
   *
   * Este getter centraliza el acceso al conjunto de labores y mantiene la lógica clara y reutilizable
   * en todo el componente.
   *
   * @returns {FormArray} Arreglo reactivo de labores dentro del grupo `tab2`.
   */
  get labourArray(): FormArray {
    return this.getTab2Form().get('labours') as FormArray;
  }

  /**
   * Validador personalizado que verifica si el valor ingresado en un control
   * representa un precio válido, incluyendo formato y reglas de negocio específicas.
   *
   * - Retorna `{ required: true }` si el valor está vacío, `null` o `undefined`.
   * - Convierte el valor a `string`, elimina espacios y reemplaza comas por puntos
   *   para manejar formatos decimales comunes.
   * - Intenta parsear el valor como número (`parseFloat`):
   *   - Si es menor a 0 o no es un número válido, retorna `{ invalidNumber: true }`.
   * - Llama a `validateService.validarPrecios(value)`:
   *   - Si la validación personalizada falla, también retorna `{ invalidNumber: true }`.
   *   - Si pasa todas las validaciones, retorna `null`.
   *
   * Este validador asegura integridad numérica y compatibilidad con reglas del dominio
   * antes de permitir que el formulario sea válido.
   *
   * @param control - Control de tipo `AbstractControl` que contiene el valor a evaluar.
   * @returns Objeto de error si el valor no es válido, o `null` si todo es correcto.
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
   * Crea y retorna un `FormGroup` representando una labor individual dentro del formulario de tareas.
   *
   * - Controles incluidos:
   *   - `name`: Campo obligatorio (`Validators.required`), `string` no nulo.
   *   - `cost`: Campo obligatorio con validador personalizado `validateCost`, numérico no nulo.
   *   - `totalIn`: Inicializado en `0`, sincronizado automáticamente con `cost`.
   *   - `isCustom`: Booleano no nulo que indica si la labor fue definida manualmente.
   *
   * - Establece una suscripción reactiva:
   *   - Escucha cambios en `cost` y refleja el nuevo valor en `totalIn`, sin emitir evento
   *     para evitar bucles o efectos secundarios innecesarios.
   *
   * Este método encapsula la lógica base para componer labores dentro de un `FormArray`,
   * manteniendo la integridad reactiva y reglas de negocio asociadas a validación de costos.
   *
   * @returns {FormGroup} Grupo reactivo completo para una labor individual.
   */
  createLabourForm(): FormGroup {
    const form = this.fb.group({
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
    });

    // Vincular cost → totalIn
    form.get('cost')?.valueChanges.subscribe((newCost) => {
      form.get('totalIn')?.setValue(newCost, { emitEvent: false });
    });

    return form;
  }

  /**
   * Agrega una nueva labor al `FormArray` `labourArray` e invalida el estado `Completada`
   * si se detecta un incremento en el número de labores.
   *
   * - Llama a `createLabourForm()` para obtener una instancia limpia de grupo reactivo.
   * - Agrega la nueva labor al arreglo dinámico de labores (`labourArray`).
   *
   * - Si la nueva longitud difiere de `longLabour` **y** la tarea actual tiene estado `"Completada"`:
   *   - Actualiza el toggle `completed` a `false` para reflejar que la tarea ya no está finalizada.
   *   - Cambia el estado `status` a `"En Progreso"` para mantener coherencia lógica.
   *
   * Este método garantiza que al agregar labores nuevas, la tarea no permanezca marcada
   * como completada de forma errónea.
   */
  add() {
    this.labourArray.push(this.createLabourForm());
    if (
      this.longLabour != this.labourArray.length &&
      this.task()?.status === 'Completada'
    ) {
      this.taskForm.get('completed')?.setValue(false);
      this.taskForm.get('status')?.setValue('En Progreso');
    }
  }

  /**
   * Elimina la labor ubicada en la posición indicada dentro del `FormArray` `labourArray`.
   *
   * - Utiliza `removeAt(index)` para quitar el grupo reactivo correspondiente.
   * - No realiza validaciones adicionales, asumiendo que el índice es válido y controlado por la UI.
   *
   * Este método se utiliza comúnmente en flujos de edición donde se permite
   * eliminar labores dinámicamente desde una tabla o sección visual.
   *
   * @param index - Índice de la labor a eliminar del `FormArray`.
   */
  delete(index: number) {
    this.labourArray.removeAt(index);
  }

  /**
   * Actualiza el valor del campo `cost` de una labor específica dentro del `FormArray` `labourArray`.
   *
   * - Extrae `index` y `price` del objeto recibido.
   * - Accede al control correspondiente en la posición indicada y, si existe,
   *   actualiza su valor con el nuevo precio (`price`).
   *
   * Este método permite ajustar de forma programática el costo de una labor,
   * ya sea por selección de catálogo, cálculo automático o edición directa.
   *
   * @param o - Objeto con las propiedades:
   *   - `index`: Índice de la labor en el `FormArray`.
   *   - `price`: Nuevo valor que se asignará al campo `cost`.
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
    const statusArray = this.task()?.order?.status;
    return !statusArray?.includes('Cancelada');
  }

  /**
   * Ciclo de vida de destrucción del componente. Libera observables y recursos suscritos
   * utilizando el patrón `takeUntil(destroy$)` para evitar fugas de memoria.
   *
   * - Emite un valor (`next()`) al `Subject` `destroy$`, notificando a todas las suscripciones activas que se deben cancelar.
   * - Llama a `complete()` sobre `destroy$` para finalizar la secuencia y liberar referencias.
   *
   * Este patrón es fundamental cuando se utilizan suscripciones largas, como `valueChanges`, `intervals` o llamadas HTTP,
   * asegurando que se limpien correctamente al desmontar el componente.
   */

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
