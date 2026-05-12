import { Component, OnInit, ViewChild } from '@angular/core';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { PaginationEvent } from '../../../shared/ui/pagination/pagination.model';
import { Appointment } from './appointment.model';
import { AppointmentService } from '../../data-access/appointment.service';
import Swal from 'sweetalert2';
import { AppointmentComponent } from '../modal/appointment.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-Appointment-list',
  imports: [
    PaginationComponent,
    SpinnerComponent,
    FormsModule,
    ErrorMessageComponent,
    AppointmentComponent,
    CommonModule,
  ],
  templateUrl: './appointment-list.component.html',
  styles: ``,
})
export class AppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  totalItems: number = 0;
  pageEvent: PaginationEvent = { pageIndex: 0, pageSize: 10 };

  open: boolean = false;
  selectedAppointment: Appointment | null = null;
  isDropdownOpen: { [key: string]: boolean } = {};
  load: boolean = false;
  valueFilter: string = '';
  errorMessage: string = '';
  @ViewChild(AppointmentComponent) modal!: AppointmentComponent;
  constructor(private service: AppointmentService) {}

  /**
   * Método del ciclo de vida `ngOnInit` que se ejecuta al inicializar el componente.
   * Invoca la función `getAppointment` pasando los parámetros actuales de paginación
   * (`pageIndex + 1` y `pageSize`) para cargar las citas iniciales.
   */

  ngOnInit() {
    this.getAppointment(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
  }

  /**
   * Recupera una lista de citas desde el servicio, aplicando paginación y filtro opcional.
   * Actualiza los estados locales: `appointments`, `totalItems`, `errorMessage` y `load` según el resultado.
   *
   * @param {number} page - Número de página actual para la consulta.
   * @param {number} size - Cantidad de elementos por página.
   * @param {string} [value] - Texto de búsqueda opcional para filtrar citas.
   */

  getAppointment(page: number, size: number, value?: string) {
    this.load = true;
    this.service.list(page, size, value).subscribe(
      (res) => {
        this.appointments = res.quotes;
        this.totalItems = res.totalItems;
        this.load = false;
      },
      (error) => {
        this.load = false;
        if ((error.status = 404)) {
          this.appointments = [];
          this.totalItems = 1;
          this.errorMessage = 'No se encuentra la cita con el filtro aplicado';
        } else {
          this.errorMessage =
            'Hubo un error al cargar las citas . Intente Nuevamente';
        }
      }
    );
  }

  /**
   * Aplica un filtro de búsqueda a la lista de citas.
   * Reinicia la paginación a la primera página y ejecuta una nueva consulta si el valor de filtro es válido.
   */

  filter() {
    this.pageEvent.pageIndex = 0;
    if (this.valueFilter) {
      this.getAppointment(1, this.pageEvent.pageSize, this.valueFilter.trim());
    }
  }

  /**
   * Restablece el filtro de búsqueda si `valueFilter` está vacío.
   * Ejecuta una nueva consulta manteniendo la página actual y el tamaño configurado.
   */

  cleanFilter() {
    if (!this.valueFilter) {
      this.getAppointment(
        this.pageEvent.pageIndex + 1,
        this.pageEvent.pageSize
      );
    }
  }

  /**
   * Abre el modal de edición o creación de una cita (`Appointment`).
   * Si se proporciona una cita, la asigna como seleccionada y despliega su menú contextual.
   * @param {Appointment} [a] - Cita a editar (opcional). Si no se proporciona, se interpreta como nueva.
   */

  openModal(a?: Appointment) {
    this.selectedAppointment = a || null;
    if (a) {
      this.toggleDropdown(a._id);
    }
    this.open = true;
  }

  /**
   * Cierra el modal activo de creación o edición de cita.
   * Establece la propiedad `open` como `false` para ocultar el componente del formulario.
   */

  closeModal() {
    this.open = false;
  }

  //FUNCIONES CRUD DE CITAS

  /**
   * Envía una solicitud para crear una nueva cita (`Appointment`) usando el servicio.
   * Al completarse exitosamente, cierra el modal, muestra una notificación de éxito
   * y recarga la lista de citas. Si ocurre un error, muestra una alerta con el mensaje correspondiente.
   * @param {Appointment} a - Objeto que representa la cita a crear.
   */

  create(a: Appointment) {
    this.service.create(a).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Cita Creada',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getAppointment(
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
          timer: 1750,
        });
      }
    );
  }

  /**
   * Actualiza una cita (`Appointment`) existente utilizando el servicio.
   * Al completarse, cierra el modal, muestra una notificación de éxito y recarga la lista de citas.
   * Si ocurre un error, despliega una alerta con el mensaje correspondiente.
   * @param {Appointment} a - Cita que será actualizada.
   */

  edit(a: Appointment) {
    this.service.update(a).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Actualización',
          text: 'Los cambios han sido guardados.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getAppointment(
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
          timer: 1750,
        });
      }
    );
  }

  /**
   * Elimina una cita (`Appointment`) tras la confirmación del usuario mediante `SweetAlert2`.
   * Si la eliminación es exitosa, muestra una notificación y recarga la lista de citas.
   * Si ocurre un error, muestra un mensaje de alerta con la descripción del fallo.
   *
   * @param {Appointment} a - Cita a eliminar, utilizada también para acceder al nombre del cliente.
   */
  delete(a: Appointment) {
    if (a) {
      this.toggleDropdown(a._id);
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar la cita para el cliente ${a.subscriber.fullName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(a._id).subscribe(
          (response) => {
            Swal.fire({
              title: 'Cita eliminada',
              icon: 'success',
              timer: 1600,
            }).then(() => {
              this.getAppointment(
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
   * Alterna el estado de visibilidad del menú desplegable (dropdown) para un elemento específico.
   * Cambia entre abierto y cerrado según su identificador único.
   * @param {string} _id - Identificador del elemento cuya visibilidad se desea alternar.
   */

  toggleDropdown(_id: string) {
    this.isDropdownOpen[_id] = !this.isDropdownOpen[_id];
  }

  /**
   * Calcula la posición vertical (`top`) y horizontal (`left`) para posicionar un dropdown
   * asociado a un botón identificado dinámicamente.
   * Considera el desplazamiento del scroll (`window.scrollY`) para ubicarlo correctamente en la vista.
   * @param {string} id - Identificador único del botón asociado al dropdown (se espera que el ID sea `button-${id}`).
   * @returns {Object} Un objeto con propiedades `top` y `left` en formato `px`, o un objeto vacío si no se encuentra el botón.
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

  //FUNCIONES DE PAGICACIÓN
  /**
   * Maneja el evento de cambio de página del paginador (`MatPaginator`).
   * Actualiza el objeto `pageEvent` y realiza una nueva consulta de citas con los valores de la nueva página.
   * @param {PaginationEvent} event - Objeto que contiene el índice de página y el tamaño seleccionado.
   */

  onPageChange(event: PaginationEvent) {
    this.pageEvent = event;
    this.getAppointment(event.pageIndex + 1, event.pageSize);
  }

  /**
   * Actualiza el tamaño de página utilizado en la paginación.
   * Llama a `getAppointment` con el nuevo tamaño manteniendo el índice de página actual.
   * @param {number} newPageSize - Nuevo número de elementos a mostrar por página.
   */

  onPageSizeChange(newPageSize: number) {
    this.pageEvent.pageSize = newPageSize;
    this.getAppointment(this.pageEvent.pageIndex + 1, newPageSize);
  }
}
