import { Component, OnInit, ViewChild } from '@angular/core';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { Employee } from './employee.model';
import { PaginationEvent } from '../../../shared/ui/pagination/pagination.model';
import { employeeService } from '../../data-access/employee.service';
import { ModalComponent } from '../modal/employee/modal.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { HasRoleDirective } from '../../../core/hasRole.directive';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-employee-list',
  imports: [
    PaginationComponent,
    ModalComponent,
    SpinnerComponent,
    FormsModule,
    ErrorMessageComponent,
    HasRoleDirective,
    CommonModule,
  ],
  templateUrl: './employee-list.component.html',
  styles: ``,
})

/**
 * Componente encargado de gestionar la vista de listado de empleados.
 *
 * - Controla estado visual y lógico: carga (`load`), paginación (`pageEvent`), filtros (`valueFilter`) y errores (`errorMessage`).
 * - Maneja apertura de formularios (`open`) y selección contextual (`selectedEmployee`).
 * - Permite menús dinámicos mediante `isDropdownOpen` mapeado por ID.
 */
export class EmployeeListComponent implements OnInit {
  employee: Employee[] = [];
  totalItems: number = 0;
  pageEvent: PaginationEvent = { pageIndex: 0, pageSize: 10 };
  pageSizeOptions: number[] = [5, 10, 25, 100];

  open: boolean = false;
  selectedEmployee: Employee | null = null;
  isDropdownOpen: { [key: string]: boolean } = {};
  load: boolean = false;
  valueFilter: string = '';
  errorMessage: string = '';
  @ViewChild(ModalComponent) modal!: ModalComponent;
  constructor(private service: employeeService) {}

  /**
   * Hook de inicialización que carga la primera página de empleados.
   */
  ngOnInit() {
    this.geEmployeeList(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
  }

  /**
   * Alterna el estado visual de un menú contextual de empleado.
   *
   * @param _id - Identificador del empleado.
   */
  toggleDropdown(_id: string) {
    this.isDropdownOpen[_id] = !this.isDropdownOpen[_id];
  }

  /**
   * Consulta la lista paginada de empleados desde el backend.
   *
   * - Muestra el spinner mientras se carga.
   * - Actualiza la lista y total de registros al recibir la respuesta.
   * - Maneja errores, incluyendo filtro sin coincidencias (`404`) o fallos genéricos.
   *
   * @param page - Número de página (1-based).
   * @param size - Cantidad de elementos por página.
   * @param fullName - Filtro opcional por nombre completo.
   */
  geEmployeeList(page: number, size: number, fullName?: string) {
    this.load = true;
    this.service.list(page, size, fullName).subscribe(
      (res) => {
        this.totalItems = res.totalItems;
        this.employee = res.employee;
        this.load = false;
      },
      (error) => {
        this.load = false;
        if ((error.status = 404)) {
          this.employee = [];
          this.totalItems = 1;
          this.errorMessage =
            'No se encuentra al empleado con el filtro aplicado.';
        } else {
          this.errorMessage =
            'Hubo un error al cargar los empleados. Intente Nuevamente';
        }
      }
    );
  }

  /**
   * Se dispara cuando el usuario cambia de página en el componente de paginación.
   *
   * - Actualiza el estado local de la paginación (`pageEvent`).
   * - Invoca la carga de la nueva página de empleados.
   *
   * @param event - Evento con índice y tamaño de página seleccionados.
   */
  onPageChange(event: PaginationEvent) {
    this.pageEvent = event;
    this.geEmployeeList(event.pageIndex + 1, event.pageSize);
  }

  /**
   * Se ejecuta cuando el usuario cambia el tamaño de página.
   *
   * - Actualiza localmente el `pageSize` y vuelve a cargar desde la primera página.
   *
   * @param newPageSize - Nuevo número de elementos por página.
   */
  onPgeSizeChange(newPageSize: number) {
    this.pageEvent.pageSize = newPageSize;
    this.geEmployeeList(this.pageEvent.pageIndex + 1, newPageSize);
  }

  /**
   * Abre el modal de creación o edición de empleado.
   *
   * - Si se pasa un empleado, lo asigna como seleccionado para edición.
   * - Cierra su dropdown contextual si está abierto.
   *
   * @param employee - (Opcional) Empleado seleccionado para editar.
   */
  openModal(employee?: Employee) {
    this.selectedEmployee = employee || null;
    if (employee) {
      this.toggleDropdown(employee._id);
    }
    this.open = true;
  }

  /**
   * Cierra el modal y limpia el estado de selección.
   */
  closeModal() {
    this.selectedEmployee = null;
    this.open = false;
  }

  /**
   * Ejecuta la búsqueda filtrada de empleados.
   *
   * - Reinicia la paginación a la primera página (`pageIndex = 0`).
   * - Aplica el filtro solo si hay texto válido ingresado (`valueFilter`).
   */
  filter() {
    this.pageEvent.pageIndex = 0;
    if (this.valueFilter) {
      this.geEmployeeList(1, this.pageEvent.pageSize, this.valueFilter.trim());
    }
  }

  /**
   * Limpia el filtro si el campo de búsqueda está vacío y recarga la lista sin filtro.
   *
   * - Mantiene la página actual y el tamaño de página.
   */
  cleanFilter() {
    if (!this.valueFilter) {
      this.geEmployeeList(
        this.pageEvent.pageIndex + 1,
        this.pageEvent.pageSize
      );
    }
  }
  //CREACION-ACTUALIZACION-ELIMINACION

  /**
   * Crea un nuevo empleado usando `employeeService`.
   *
   * - Cierra el modal al finalizar.
   * - Muestra una alerta de éxito (`Swal.fire`) y recarga la lista.
   * - En caso de error, muestra un mensaje con la respuesta del backend.
   *
   * @param employee - Objeto `Employee` a crear.
   */
  create(employee: Employee) {
    this.service.create(employee).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Empleado Creado',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.geEmployeeList(
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
          timer: 1500,
        });
      }
    );
  }

  /**
   * Actualiza un empleado existente.
   *
   * - Cierra el modal al guardar.
   * - Muestra una alerta de éxito y recarga la lista.
   * - En caso de error, muestra el mensaje recibido del servidor.
   *
   * @param employee - Objeto `Employee` con los cambios a guardar.
   */
  edit(employee: Employee) {
    this.service.update(employee).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Actulización',
          text: 'Los cambios han sido guardados.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.geEmployeeList(
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
          timer: 1500,
        });
      }
    );
  }

  /**
   * Elimina un empleado tras confirmación con `Swal.fire`.
   *
   * - Cierra el dropdown contextual si está abierto.
   * - Pide confirmación al usuario antes de proceder.
   * - Muestra alertas según el resultado de la operación.
   *
   * @param employee - Objeto `Employee` a eliminar.
   */
  delete(employee: Employee) {
    if (employee) {
      this.toggleDropdown(employee._id);
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar al empleado ${employee.fullName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(employee._id).subscribe(
          (response) => {
            Swal.fire({
              title: 'Empleado eliminado',
              text: response.message,
              icon: 'success',
              timer: 1600,
            }).then(() => {
              this.geEmployeeList(
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
              timer: 1500,
            });
          }
        );
      }
    });
  }

  /**
   * Calcula la posición en pantalla (top y left) de un dropdown relativo a un botón dado.
   *
   * - Usa `getBoundingClientRect()` para obtener la posición del botón en el viewport.
   * - Suma `window.scrollY` para ajustar desplazamiento vertical real.
   * - Aplica un offset izquierdo fijo (150px) para alinear el dropdown respecto al borde derecho.
   *
   * @param id - Identificador del botón (`button-${id}` debe existir en el DOM).
   * @returns Objeto con propiedades `top` y `left` en formato `px`. Si el botón no existe, retorna `{}`.
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
}
