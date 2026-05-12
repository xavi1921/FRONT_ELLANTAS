import { Component, OnInit, ViewChild } from '@angular/core';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { PaginationEvent } from '../../../shared/ui/pagination/pagination.model';
import Swal from 'sweetalert2';
import { Labour } from './labour.model';
import { LabourService } from '../../data-access/labour.service';
import { ModalComponent } from '../modal/labour/modal.component';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HasRoleDirective } from '../../../core/hasRole.directive';

@Component({
  selector: 'app-labour-list',
  imports: [
    PaginationComponent,
    SpinnerComponent,
    FormsModule,
    ErrorMessageComponent,
    ModalComponent,
    CurrencyPipe,
    HasRoleDirective,
    CommonModule,
  ],
  templateUrl: './labour-list.component.html',
  styles: ``,
})
export class LabourListComponent implements OnInit {
  labour: Labour[] = [];
  totalItems: number = 0;
  pageEvent: PaginationEvent = { pageIndex: 0, pageSize: 10 };

  open: boolean = false;
  selectedLabour: Labour | null = null;
  isDropdownOpen: { [key: string]: boolean } = {};
  load: boolean = false;
  valueFilter: string = '';
  errorMessage: string = '';
  @ViewChild(ModalComponent) modal!: ModalComponent;
  constructor(private service: LabourService) {}
  ngOnInit() {
    this.getLabours(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
  }

  /**
   * Obtiene una lista paginada de actividades (`labours`) desde el backend.
   *
   * - Activa la bandera `load` durante la solicitud.
   * - Invoca `service.list` con los parámetros de paginación y filtro opcional por nombre.
   * - En respuesta exitosa:
   *    - Asigna `labour` y `totalItems` con los datos recibidos.
   * - En caso de error:
   *    - Si es 404, muestra mensaje personalizado y vacía la lista.
   *    - Para otros errores, muestra mensaje genérico.
   * - En todos los casos, desactiva la bandera de carga.
   *
   * @param {number} page - Número de página solicitado.
   * @param {number} size - Cantidad de registros por página.
   * @param {string} [name] - Filtro opcional por nombre.
   */

  getLabours(page: number, size: number, name?: string) {
    this.load = true;
    this.service.list(page, size, name).subscribe(
      (res) => {
        this.labour = res.labours;
        this.totalItems = res.totalItems;
        this.load = false;
      },
      (error) => {
        this.load = false;
        if ((error.status = 404)) {
          this.labour = [];
          this.totalItems = 1;
          this.errorMessage =
            'No se encuentra la actividad con el filtro aplicado';
        } else {
          this.errorMessage =
            'Hubo un error al cargar las actividades . Intente Nuevamente';
        }
      }
    );
  }

  /**
   * Abre el modal de edición o creación de una actividad (`Labour`).
   *
   * - Si se proporciona una instancia de `Labour`, la asigna a `selectedLabour` y alterna su dropdown contextual.
   * - Si no se proporciona, limpia la selección (`null`), lo cual implica creación de nueva entrada.
   * - Activa la visibilidad del modal estableciendo `open = true`.
   *
   * @param {Labour} [Labour] - Objeto de tipo `Labour` para editar; si no se proporciona, se asume creación.
   */

  openModal(Labour?: Labour) {
    this.selectedLabour = Labour || null;
    if (Labour) {
      this.toggleDropdown(Labour._id);
    }
    this.open = true;
  }

  /**
   * Cierra el modal de actividades estableciendo la bandera `open` en `false`.
   *
   * - Utilizado para ocultar el modal luego de crear o editar una actividad.
   */

  closeModal() {
    this.open = false;
  }

  /**
   * Aplica un filtro sobre la lista de actividades (`labours`) según el valor ingresado.
   *
   * - Reinicia la paginación estableciendo `pageIndex = 0`.
   * - Si `valueFilter` contiene texto, realiza la búsqueda con el valor limpiado (`trim()`).
   * - Invoca `getLabours` para actualizar la lista con el nuevo filtro aplicado.
   */

  filter() {
    this.pageEvent.pageIndex = 0;
    if (this.valueFilter) {
      this.getLabours(1, this.pageEvent.pageSize, this.valueFilter.trim());
    }
  }

  /**
   * Restablece la lista de actividades (`labours`) si no hay filtro aplicado.
   *
   * - Verifica si `valueFilter` está vacío o nulo.
   * - Si está vacío, recarga la lista de actividades desde el backend con la paginación actual.
   */

  cleanFilter() {
    if (!this.valueFilter) {
      this.getLabours(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
    }
  }

  //CREAR - MODIFICAR Y ELIMINAR VEHICULO

  /**
   * Crea una nueva actividad (`Labour`) mediante el servicio y actualiza la vista.
   *
   * - Envía la actividad al backend utilizando `service.create()`.
   * - Si la operación es exitosa:
   *    - Cierra el modal activo mediante `modal.onClose()`.
   *    - Muestra una notificación de éxito con `Swal.fire`.
   *    - Luego, recarga la lista de actividades con la paginación actual.
   * - Si ocurre un error:
   *    - Muestra una alerta con el mensaje de error proporcionado desde el backend.
   *
   * @param {Labour} Labour - Objeto con los datos de la nueva actividad.
   */

  create(Labour: Labour) {
    this.service.create(Labour).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Actividad Registrada',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getLabours(
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
   * Edita una actividad (`Labour`) existente a través del servicio y actualiza la vista.
   *
   * - Llama a `service.update()` con el objeto `Labour` modificado.
   * - Si la operación tiene éxito:
   *    - Cierra el modal mediante `modal.onClose()`.
   *    - Muestra una notificación de éxito con `Swal.fire`.
   *    - Refresca la lista de actividades (`getLabours`) manteniendo la paginación actual.
   * - Si ocurre un error:
   *    - Muestra una alerta con el mensaje de error proveniente del backend.
   *
   * @param {Labour} Labour - Objeto con los datos actualizados de la actividad a modificar.
   */

  edit(Labour: Labour) {
    this.service.update(Labour).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Actualización',
          text: 'Los cambios han sido guardados.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getLabours(
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
   * Elimina una actividad (`Labour`) tras confirmación por parte del usuario.
   *
   * - Si se proporciona una instancia de `Labour`, se alterna su dropdown contextual.
   * - Muestra un modal de confirmación utilizando `Swal.fire`.
   * - Si el usuario confirma:
   *    - Llama a `service.delete()` con el ID de la actividad.
   *    - Si es exitoso:
   *       - Muestra una notificación de éxito.
   *       - Recarga la lista de actividades con la paginación actual.
   *    - Si ocurre un error:
   *       - Muestra un mensaje de error con el detalle del backend.
   *
   * @param {Labour} Labour - Actividad a eliminar.
   */

  delete(Labour: Labour) {
    if (Labour) {
      this.toggleDropdown(Labour._id);
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar la actividad ${Labour.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(Labour._id).subscribe(
          (response) => {
            Swal.fire({
              title: 'Actividad Eliminada',
              icon: 'success',
              timer: 1600,
            }).then(() => {
              this.getLabours(
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
              timer: 1700,
            });
          }
        );
      }
    });
  }

  /**
   * Alterna la visibilidad del dropdown asociado a un identificador específico.
   *
   * - Invierte el valor booleano de `isDropdownOpen[_id]`.
   * - Útil para desplegar u ocultar menús contextuales por ítem.
   *
   * @param {string} _id - Identificador único del elemento al que se asocia el dropdown.
   */

  toggleDropdown(_id: string) {
    this.isDropdownOpen[_id] = !this.isDropdownOpen[_id];
  }

  /**
   * Calcula la posición absoluta del dropdown vinculado a un botón por su ID.
   *
   * - Busca el botón en el DOM con `id` en formato `button-{id}`.
   * - Si existe, obtiene su rectángulo delimitador (`getBoundingClientRect()`).
   * - Devuelve un objeto con coordenadas CSS para posicionar el dropdown:
   *    - `top`: justo debajo del botón, ajustado al `scrollY`.
   *    - `left`: desplazado 150px hacia la izquierda desde el borde derecho del botón.
   * - Si el botón no se encuentra, retorna un objeto vacío.
   *
   * @param {string} id - Identificador del elemento asociado al botón.
   * @returns {{ top?: string; left?: string }} Coordenadas absolutas del dropdown.
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

  //FUNCIONES DE PAGINADO

  /**
   * Manejador del evento de paginación que actualiza el estado y solicita las actividades correspondientes.
   *
   * - Guarda el evento recibido en `pageEvent`, manteniendo sincronización con la vista.
   * - Llama a `getLabours()` con el índice de página ajustado a base 1 y el tamaño especificado.
   *
   * @param {PaginationEvent} event - Evento emitido por el componente de paginación.
   */

  onPageChange(event: PaginationEvent) {
    this.pageEvent = event;
    this.getLabours(event.pageIndex + 1, event.pageSize);
  }

  /**
   * Manejador que se ejecuta al cambiar el tamaño de página de la lista de actividades (`labours`).
   *
   * - Actualiza `pageEvent.pageSize` con el nuevo valor recibido.
   * - Llama a `getLabours` para cargar las actividades con el nuevo tamaño, manteniendo el índice actual.
   *
   * @param {number} newPageSize - Nuevo número de elementos por página seleccionados por el usuario.
   */

  onPageSizeChange(newPageSize: number) {
    this.pageEvent.pageSize = newPageSize;
    this.getLabours(this.pageEvent.pageIndex + 1, newPageSize);
  }
}
