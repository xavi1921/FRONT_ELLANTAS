import { Component, OnInit, ViewChild } from '@angular/core';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { PaginationEvent } from '../../../shared/ui/pagination/pagination.model';
import Swal from 'sweetalert2';
import { ModalComponent } from '../modal/vehicle/modal.component';
import { Vehicle } from './vehicle.model';
import { VehicleService } from '../../data-access/vehicle.service';
import { HasRoleDirective } from '../../../core/hasRole.directive';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-vehicle-list',
  imports: [
    PaginationComponent,
    SpinnerComponent,
    FormsModule,
    ErrorMessageComponent,
    ModalComponent,
    HasRoleDirective,
    CommonModule,
  ],
  templateUrl: './vehicle-list.component.html',
  styles: ``,
})

/**
 * Componente que gestiona la vista de listado de vehículos.
 *
 * - Controla paginación, carga visual (`load`) y filtrado por valor.
 * - Permite apertura de modal para creación/edición de vehículos.
 * - Maneja selección y estado visual de dropdowns por registro.
 */
export class VehicleListComponent implements OnInit {
  vehicles: Vehicle[] = [];
  totalItems: number = 0;
  pageEvent: PaginationEvent = { pageIndex: 0, pageSize: 10 };

  open: boolean = false;
  selectedVehicle: Vehicle | null = null;
  isDropdownOpen: { [key: string]: boolean } = {};
  load: boolean = false;
  valueFilter: string = '';
  errorMessage: string = '';
  @ViewChild(ModalComponent) modal!: ModalComponent;
  constructor(private service: VehicleService) {}

  /**
   * Hook de inicialización del componente.
   *
   * - Carga la primera página de vehículos al iniciar la vista.
   */
  ngOnInit() {
    this.getVehicles(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
  }

  /**
   * Consulta la lista de vehículos desde el backend.
   *
   * - Activa `load` mientras se realiza la solicitud.
   * - Si la respuesta es exitosa, actualiza la lista y el total.
   * - Si devuelve `404`, muestra mensaje contextual sin vehículos.
   * - Si ocurre otro error, muestra mensaje genérico.
   *
   * @param page - Página actual (base 1).
   * @param size - Tamaño de página.
   * @param value - (Opcional) Filtro por texto (placa, marca, etc.).
   */
  getVehicles(page: number, size: number, value?: string) {
    this.load = true;

    this.service.list(page, size, value).subscribe(
      (res) => {
        this.vehicles = res.vehicles;
        this.totalItems = res.totalItems;
        this.load = false;
      },
      (error) => {
        this.load = false;
        if ((error.status = 404)) {
          this.vehicles = [];
          this.totalItems = 1;
          this.errorMessage =
            'No se encuentra al vehiculo con el filtro aplicado';
        } else {
          this.errorMessage =
            'Hubo un error al cargar los vehiculos . Intente Nuevamente';
        }
      }
    );
  }

  /**
   * Alterna la visibilidad del dropdown de acciones para el vehículo dado.
   *
   * @param _id - Identificador del vehículo.
   */
  toggleDropdown(_id: string) {
    this.isDropdownOpen[_id] = !this.isDropdownOpen[_id];
  }

  /**
   * Maneja el evento de cambio de página.
   *
   * - Actualiza `pageEvent` con los nuevos valores.
   * - Vuelve a solicitar la lista de vehículos.
   *
   * @param event - Evento de paginación (índice y tamaño).
   */
  onPageChange(event: PaginationEvent) {
    this.pageEvent = event;
    this.getVehicles(event.pageIndex + 1, event.pageSize);
  }

  /**
   * Maneja el cambio en el tamaño de página.
   *
   * - Actualiza `pageSize` en `pageEvent`.
   * - Mantiene el `pageIndex` actual.
   * - Vuelve a cargar los vehículos.
   *
   * @param newPageSize - Nuevo número de elementos por página.
   */
  onPageSizeChange(newPageSize: number) {
    this.pageEvent.pageSize = newPageSize;
    this.getVehicles(this.pageEvent.pageIndex + 1, newPageSize);
  }

  /**
   * Abre el modal de creación o edición de vehículos.
   *
   * - Si se proporciona un `vehicle`, lo asigna como seleccionado para edición.
   * - Cierra el dropdown asociado al vehículo antes de abrir el modal.
   *
   * @param vehicle - (Opcional) Vehículo seleccionado para editar.
   */
  openModal(vehicle?: Vehicle) {
    this.selectedVehicle = vehicle || null;
    if (vehicle) {
      this.toggleDropdown(vehicle._id);
    }
    this.open = true;
  }

  /**
   * Cierra el modal de vehículos.
   *
   * - Restablece la bandera `open` a `false`.
   */
  closeModal() {
    this.open = false;
  }

  /**
   * Aplica el filtro ingresado en el input `valueFilter`.
   *
   * - Reinicia la paginación a la primera página.
   * - Llama a `getVehicles()` con el texto del filtro si está presente.
   */
  filter() {
    this.pageEvent.pageIndex = 0;
    if (this.valueFilter) {
      this.getVehicles(1, this.pageEvent.pageSize, this.valueFilter.trim());
    }
  }

  /**
   * Limpia el filtro si no hay valor escrito.
   *
   * - Recarga la lista de vehículos con los parámetros actuales de paginación.
   */
  cleanFilter() {
    if (!this.valueFilter) {
      this.getVehicles(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
    }
  }

  //CREAR - MODIFICAR Y ELIMINAR VEHICULO

  /**
   * Crea un nuevo vehículo usando el servicio correspondiente.
   *
   * - Cierra el modal tras recibir confirmación del backend.
   * - Muestra alerta de éxito (`Swal`) si la operación es exitosa.
   * - Refresca la lista de vehículos tras la notificación.
   * - Si ocurre un error, muestra mensaje contextual con alerta de error.
   *
   * @param vehicle - Objeto `Vehicle` a registrar.
   */
  create(vehicle: Vehicle) {
    this.service.create(vehicle).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Vehiculo Registrado',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getVehicles(
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
          timer: 1790,
        });
      }
    );
  }

  /**
   * Actualiza los datos de un vehículo existente.
   *
   * - Cierra el modal una vez aplicada la edición.
   * - Notifica visualmente con `Swal` si se guarda correctamente.
   * - Refresca la lista tras la confirmación visual.
   * - Muestra alerta de error en caso de fallo en la solicitud.
   *
   * @param vehicle - Objeto `Vehicle` actualizado.
   */
  edit(vehicle: Vehicle) {
    this.service.update(vehicle).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Actualización',
          text: 'Los cambios han sido guardados.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getVehicles(
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
          timer: 1790,
        });
      }
    );
  }

  /**
   * Elimina un vehículo previa confirmación del usuario.
   *
   * - Cierra el menú contextual si estaba abierto (`toggleDropdown`).
   * - Muestra cuadro de confirmación (`Swal`) antes de proceder.
   * - Si se confirma:
   *   - Llama al backend para eliminar.
   *   - Muestra notificación de éxito.
   *   - Refresca la lista de vehículos.
   * - En caso de error, muestra alerta contextual con mensaje específico.
   *
   * @param vehicle - Objeto `Vehicle` a eliminar.
   */
  delete(vehicle: Vehicle) {
    if (vehicle) {
      this.toggleDropdown(vehicle._id);
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar al vehicle ${vehicle.plate}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(vehicle._id).subscribe(
          (response) => {
            Swal.fire({
              title: 'Vehiculo eliminado',
              icon: 'success',
              timer: 1600,
            }).then(() => {
              this.getVehicles(
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
              timer: 1790,
            });
          }
        );
      }
    });
  }

  /**
   * Calcula la posición absoluta (top y left) para posicionar un dropdown relativo a un botón.
   *
   * - Usa `getBoundingClientRect()` para obtener la posición del botón en la pantalla.
   * - Ajusta la coordenada vertical (`top`) sumando el desplazamiento del scroll.
   * - Ajusta la coordenada horizontal (`left`) con un desplazamiento de -150px desde el borde derecho del botón.
   *
   * @param id - Identificador único del botón (se espera que su `id` sea `button-${id}`).
   * @returns Un objeto con propiedades `top` y `left` en formato `px`, o `{}` si el botón no se encuentra.
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
