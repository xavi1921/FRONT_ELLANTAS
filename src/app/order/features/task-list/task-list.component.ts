import { Component, HostListener, OnInit } from '@angular/core';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { PaginationEvent } from '../../../shared/ui/pagination/pagination.model';
import Swal from 'sweetalert2';
import { Task, transformationData } from './task.model';
import { TaskService } from '../../data-access/task.service';
import { ModalComponent } from '../modal/task/modal.component';
import { HasRoleDirective } from '../../../core/hasRole.directive';
import { CommonModule } from '@angular/common';
import { BaseTokenService } from '../../../shared/data-access/token/base-token.service';

@Component({
  selector: 'app-task-list',
  imports: [
    PaginationComponent,
    SpinnerComponent,
    FormsModule,
    CommonModule,
    ErrorMessageComponent,
    ModalComponent,
    HasRoleDirective,
  ],
  templateUrl: './task-list.component.html',
  styles: ``,
})

/**
 * Componente encargado de gestionar la visualización, filtrado y paginación de tareas.
 *
 * Propiedades clave:
 * - `tasks`: Arreglo de tareas actualmente mostradas en la vista.
 * - `totalItems`: Total de tareas disponibles, útil para la paginación.
 * - `pageEvent`: Estado actual de la paginación (índice y tamaño de página).
 *
 * - `open`: Bandera para controlar la visibilidad del modal de tarea activa.
 * - `selectedTask`: Tarea actualmente seleccionada para edición o detalle.
 * - `isDropdownOpen`: Estado de apertura por ID de los dropdowns de acciones por tarea.
 * - `load`: Indica si hay una operación en curso (carga, actualización, etc.).
 *
 * - `valueFilter`: Cadena usada para filtrar tareas por nombre, código, etc.
 * - `errorMessage`: Mensaje de error en la operación actual (si existe).
 * - `selectedStatusFilter`: Filtro aplicado por estado ('Todos', 'Pendiente', etc.).
 * - `isStatusDropdownOpen`: Controla visibilidad del dropdown de filtros por estado.
 *
 * - `statusOptions`: Opciones disponibles para el filtrado por estado, mapeadas
 *   como pares `{ value, label }` para facilitar despliegue visual.
 */
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  totalItems: number = 0;
  pageEvent: PaginationEvent = { pageIndex: 0, pageSize: 10 };

  open: boolean = false;
  selectedTask: Task | null = null;
  isDropdownOpen: { [key: string]: boolean } = {};
  load: boolean = false;
  valueFilter: string = '';
  errorMessage: string = '';
  selectedStatusFilter: string = 'Todos';
  isStatusDropdownOpen: boolean = false;
  statusOptions = [
    { value: 'Todos', label: 'Todos los Estados' },
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'En Progreso', label: 'En Progreso' },
    { value: 'Completada', label: 'Completada' },
  ];
  constructor(private service: TaskService, private token: BaseTokenService) {}

  /**
   * Hook del ciclo de vida Angular que se ejecuta al inicializar el componente.
   *
   * - Dispara la carga inicial de tareas utilizando los parámetros actuales de paginación.
   * - Utiliza `pageIndex + 1` para ajustar a base 1 en la solicitud al backend.
   */
  ngOnInit() {
    this.gettasks(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
  }

  /**
   * Realiza la solicitud al backend para obtener la lista de tareas con paginación y filtros opcionales.
   *
   * - Activa la bandera `load` para mostrar el estado de carga.
   * - Llama a `service.list(...)` con los filtros activos (nombre y estado, si están definidos).
   *
   * - En éxito:
   *   - Asigna `tasks` y `totalItems` con la respuesta.
   *   - Desactiva la carga.
   *
   * - En error:
   *   - Si `status === 404`, limpia `tasks`, fuerza `totalItems` a 1 (para mantener el paginador visible)
   *     y muestra mensaje personalizado.
   *   - En cualquier otro caso, muestra mensaje genérico y desactiva la carga.
   *
   * @param page - Página actual (base 1).
   * @param size - Tamaño de página.
   * @param fullName - Filtro por nombre completo del responsable (opcional).
   * @param status - Estado de la tarea (Pendiente, En Progreso, etc., opcional).
   */
  gettasks(page: number, size: number, fullName?: string, status?: string) {
    this.load = true;
    this.service.list(page, size, fullName, status).subscribe(
      (res) => {
        this.tasks = res.tasks;
        this.totalItems = res.totalItems;
        this.load = false;
      },
      (error) => {
        this.load = false;
        if ((error.status = 404)) {
          this.tasks = [];
          this.totalItems = 1;
          this.errorMessage = 'No se encuentra la tarea con el filtro aplicado';
        } else {
          this.errorMessage =
            'Hubo un error al cargar los clientes . Intente Nuevamente';
        }
      }
    );
  }

  /**
   * Alterna visualmente el estado de apertura del dropdown de acciones asociado a una tarea específica.
   *
   * @param _id - Identificador único de la tarea.
   */
  toggleDropdown(_id: string) {
    this.isDropdownOpen[_id] = !this.isDropdownOpen[_id];
  }

  /**
   * Maneja el evento de cambio de página en el paginador.
   *
   * - Actualiza el estado interno de `pageEvent`.
   * - Normaliza el filtro de búsqueda (`valueFilter`) y estado (`selectedStatusFilter`).
   * - Invoca `gettasks(...)` para cargar los datos de la nueva página con los filtros actuales.
   *
   * @param event - Objeto con el nuevo índice y tamaño de página.
   */
  onPageChange(event: PaginationEvent) {
    this.pageEvent = event;
    const value = this.valueFilter?.trim() || undefined;
    const filter =
      this.selectedStatusFilter !== 'Todos'
        ? this.selectedStatusFilter.trim()
        : undefined;
    this.gettasks(event.pageIndex + 1, event.pageSize, value, filter);
  }

  /**
   * Actualiza el tamaño de página y recarga la lista de tareas con los filtros actuales.
   *
   * - Modifica `pageSize` dentro de `pageEvent`.
   * - Reutiliza los filtros activos (`valueFilter`, `selectedStatusFilter`).
   * - Invoca `gettasks(...)` para reflejar el nuevo tamaño de página desde la posición actual.
   *
   * @param newPageSize - Tamaño de página seleccionado por el usuario.
   */
  onPageSizeChange(newPageSize: number) {
    this.pageEvent.pageSize = newPageSize;
    const value = this.valueFilter?.trim() || undefined;
    const filter =
      this.selectedStatusFilter !== 'Todos'
        ? this.selectedStatusFilter.trim()
        : undefined;
    this.gettasks(this.pageEvent.pageIndex + 1, newPageSize, value, filter);
  }
  /**
   * Verifica si el usuario autenticado posee al menos uno de los roles proporcionados.
   *
   * @param roles - Lista de roles requeridos para autorizar una acción.
   * @returns `true` si el usuario tiene alguno de los roles; `false` en caso contrario.
   */
  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.token.decodedToken()?.roles || [];
    return roles.some((role) => userRoles.includes(role));
  }
  /**
   * Abre el modal asociado a una tarea específica o inicia uno vacío.
   *
   * - Si se proporciona una tarea (`task`), la asigna a `selectedTask`.
   * - También cierra su dropdown contextual (`toggleDropdown`).
   * - Habilita la visibilidad del modal principal (`open = true`).
   *
   * @param task - Tarea seleccionada para edición o visualización (opcional).
   */
  openModal(task?: Task) {
    this.selectedTask = task || null;
    const canOverride = this.hasAnyRole(['Super Admin', 'Supervisor']);
    if (task) {
      this.toggleDropdown(task._id);
      if (this.getLastStatus(task.order) === 'Retirado' && !canOverride) {
        Swal.fire({
          icon: 'info',
          title: 'Vehículo ya retirado',
          text: 'Orden no editable: vehículo retirado.',
          confirmButtonText: 'Aceptar',
          timer: 2300,
        });
        return; // Evita que continúe abriendo el modal
      }
    }
    this.open = true;
  }

  /**
   * Cierra el modal principal de tareas estableciendo `open = false`.
   */
  closeModal() {
    this.open = false;
  }

  /**
   * Ejecuta el filtro textual sobre la lista de tareas.
   *
   * - Reinicia la paginación (`pageIndex = 0`) y el estado a `'Todos'`.
   * - Si `valueFilter` está definido:
   *   - Lo recorta (`trim`) y lo pasa como parámetro al servicio `gettasks(...)`.
   */
  filter() {
    this.pageEvent.pageIndex = 0;
    this.selectedStatusFilter = 'Todos';
    if (this.valueFilter) {
      this.gettasks(1, this.pageEvent.pageSize, this.valueFilter.trim());
    }
  }

  /**
   * Limpia el filtro solo si `valueFilter` está vacío.
   *
   * - Si no hay texto de búsqueda activo:
   *   - Vuelve a cargar las tareas según el `pageEvent` actual sin filtro.
   *   - Restaura el estado visual de filtro a `'Todos'`.
   */
  cleanFilter() {
    if (!this.valueFilter) {
      this.gettasks(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
      this.selectedStatusFilter = 'Todos';
    }
  }

  /**
   * Envía los cambios de una tarea editada al backend y recarga la lista en pantalla.
   *
   * - Transforma el objeto `task` con `transformationData(...)` para estructurar el payload.
   * - Activa `load` mientras se realiza la operación.
   * - Muestra alerta visual de éxito con SweetAlert tras confirmación.
   * - Recarga la lista de tareas actual con `gettasks(...)`.
   * - En caso de error, muestra alerta con el mensaje recibido.
   *
   * @param task - Tarea a editar.
   */
  edit(task: Task) {
    const body = transformationData(task);
    this.load = true;
    this.service.update(body).subscribe(
      (res) => {
        this.load = false;
        Swal.fire({
          title: 'Actualización',
          text: 'Los cambios han sido guardados.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.gettasks(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
        });
      },
      (error) => {
        Swal.fire({
          title: 'Error',
          text: error.error.message,
          icon: 'error',
          timer: 1700,
        });
      }
    );
  }

  /**
   * Elimina una tarea tras confirmación del usuario.
   *
   * - Cierra su dropdown contextual si está abierto (`toggleDropdown(...)`).
   * - Solicita confirmación con SweetAlert.
   * - Si el usuario confirma:
   *   - Llama al servicio `delete(...)` con el ID de la tarea.
   *   - Muestra alerta de éxito tras la eliminación.
   *   - Recarga la lista de tareas actuales.
   * - En error, muestra alerta con el mensaje recibido.
   *
   * @param task - Tarea que se desea eliminar.
   */
  delete(task: Task) {
    if (task) {
      this.toggleDropdown(task._id);
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar la tarea de la orden ${task.order}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(task._id).subscribe(
          (response) => {
            Swal.fire({
              title: 'Tarea eliminada',
              icon: 'success',
              timer: 1600,
            }).then(() => {
              this.gettasks(
                this.pageEvent.pageIndex + 1,
                this.pageEvent.pageSize
              );
            });
          },
          (error) => {
            Swal.fire({
              title: 'Error',
              text: error.error.message,
              icon: 'error',
              timer: 1800,
            });
          }
        );
      }
    });
  }
  /**
   * Retorna el último estado registrado de una orden.
   *
   * - Si `order.status` es un arreglo, devuelve el último valor.
   * - Si no existe o está vacío, devuelve `"Pendiente"` como valor por defecto.
   *
   * @param order - Orden desde la que se extraerá el estado.
   * @returns Último estado conocido o `"Pendiente"`.
   */
  getLastStatus(order: any): string {
    return order.status?.[order.status.length - 1] || 'Pendiente';
  }
  /**
   * Retorna las clases de estilo CSS correspondientes a un estado de tarea específico.
   *
   * - `"Pendiente"` → Amarillo claro.
   * - `"En Progreso"` → Azul claro.
   * - `"Completada"` → Verde claro.
   * - `"Cancelada"` → Rojo claro.
   * - `"Retirado"` → Gris neutro.
   *    * - `"Por Retirar"` → Púrpura intenso.
   * - Otros estados → cadena vacía.
   *
   * @param status - Estado textual de la tarea.
   * @returns Clases CSS para aplicar en la interfaz visual.
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-200 text-yellow-800';
      case 'En Progreso':
        return 'bg-blue-200 text-blue-800';
      case 'Completada':
        return 'bg-green-200 text-green-800';
      case 'Cancelada':
        return 'bg-red-200 text-red-800';
      case 'Por Retirar':
        return 'bg-purple-500 text-gray-800';
      case 'Retirado':
        return 'bg-gray-200 text-gray-800';
      default:
        return '';
    }
  }

  /**
   * Determina si una tarea tiene uno o más empleados asignados.
   *
   * - Si `task.employee` es un arreglo:
   *   - Retorna `'Asignado'` si tiene al menos un elemento.
   *   - Si está vacío, retorna `'Sin Asignar'`.
   * - Si `employee` no es arreglo:
   *   - Retorna `'Asignado'` si tiene valor; de lo contrario, `'Sin Asignar'`.
   *
   * Esto es útil para mostrar el estado de asignación en la interfaz
   * sin acoplarse a una única estructura de datos.
   *
   * @param task - Tarea a evaluar.
   * @returns `'Asignado'` o `'Sin Asignar'`.
   */
  isTaskAssigned(task: Task): string {
    if (Array.isArray(task.employee)) {
      return task.employee.length > 0 ? 'Asignado' : 'Sin Asignar';
    }

    return task.employee ? 'Asignado' : 'Sin Asignar';
  }

  /**
   * Calcula la posición absoluta para mostrar el dropdown de acciones vinculado al botón correspondiente.
   *
   * - Usa `getBoundingClientRect()` sobre el botón con ID `button-${id}`.
   * - Retorna coordenadas `{ top, left }` ajustadas con desplazamiento vertical del scroll.
   * - Posiciona el dropdown 150px hacia la izquierda desde el borde derecho del botón.
   *
   * @param id - Identificador único relacionado con el botón de acción.
   * @returns Posición `{ top, left }` para aplicar al dropdown o `{}` si el botón no se encuentra.
   */
  dropdownPosition(id: string) {
    const button = document.getElementById(`button-${id}`);
    if (!button) return {};

    const rect = button.getBoundingClientRect();
    return {
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.right - 150}px`,
    };
  }

  //FILTRO

  /**
   * Alterna la visibilidad del dropdown de estado de tareas.
   *
   * - Cambia el valor booleano de `isStatusDropdownOpen`.
   */
  toggleStatusDropdown() {
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
  }

  /**
   * Aplica un nuevo filtro de estado a la lista de tareas y recarga desde la primera página.
   *
   * - Actualiza `selectedStatusFilter` con el estado seleccionado.
   * - Cierra el dropdown (`isStatusDropdownOpen = false`).
   * - Reinicia el índice de paginación (`pageIndex = 0`).
   * - Normaliza y aplica los filtros activos (`valueFilter`, `status`) para solicitar la lista actualizada.
   *
   * @param status - Nuevo estado a aplicar como filtro (ej. 'Pendiente', 'Completada').
   */
  selectStatusFilter(status: string) {
    this.selectedStatusFilter = status;
    this.isStatusDropdownOpen = false;
    this.pageEvent.pageIndex = 0;
    const value = this.valueFilter?.trim() || undefined;
    const filter = status !== 'Todos' ? status.trim() : undefined;
    this.gettasks(1, this.pageEvent.pageSize, value, filter);
  }

  /**
   * Limpia todos los filtros activos y aplica el filtro por texto si corresponde.
   *
   * - Restablece `valueFilter` a una cadena vacía y `selectedStatusFilter` a `'Todos'`.
   * - Llama al método `filter()` para aplicar estos cambios.
   */
  clearAllFilters() {
    this.valueFilter = '';
    this.selectedStatusFilter = 'Todos';
    this.filter();
  }

  /**
   * Listener global que se activa ante cualquier clic en el documento para manejar
   * el cierre automático del dropdown de estado.
   *
   * - Si el clic ocurre *fuera* de un contenedor `.relative`, se asume
   *   que el usuario ha hecho clic fuera del dropdown.
   *   - Se cierra el dropdown (`isStatusDropdownOpen = false`) para evitar que permanezca abierto.
   *
   * Esta lógica asegura una experiencia fluida y consistente, especialmente en dispositivos
   * móviles o cuando hay múltiples áreas interactivas.
   *
   * @param event - Evento global de clic capturado desde el documento.
   */

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.isStatusDropdownOpen = false;
    }
  }
}
