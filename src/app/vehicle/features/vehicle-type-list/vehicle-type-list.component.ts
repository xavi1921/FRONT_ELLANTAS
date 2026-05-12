import { Component, OnInit, ViewChild } from '@angular/core';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { Type } from '../../../owner/features/owner-type-list/typeOwner.model';
import { PaginationEvent } from '../../../shared/ui/pagination/pagination.model';
import Swal from 'sweetalert2';
import { ModalComponent } from '../modal/typeVehicle/modal.component';
import { TypeVehicleService } from '../../data-access/typeVehicle.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vehicle-type-list',
  imports: [
    PaginationComponent,
    SpinnerComponent,
    FormsModule,
    ErrorMessageComponent,
    ModalComponent,
    CommonModule,
  ],
  templateUrl: './vehicle-type-list.component.html',
  styles: ``,
})

/**
 * Componente que gestiona el listado y administración de tipos de vehículo.
 *
 * - Controla paginación, filtros y visualización de modales.
 * - Permite crear, editar y eliminar tipos mediante `ModalComponent`.
 */
export class VehicleTypeListComponent {
  types: Type[] = [];
  totalItems: number = 0;
  pageEvent: PaginationEvent = { pageIndex: 0, pageSize: 10 };
  pageSizeOptions: number[] = [5, 10, 25, 100];

  open: boolean = false;
  selectedType: Type | null = null;
  isDropdownOpen: { [key: string]: boolean } = {};
  load: boolean = false;
  valueFilter: string = '';
  errorMessage: string = '';
  @ViewChild(ModalComponent) modal!: ModalComponent;
  constructor(private service: TypeVehicleService) {}

  /**
   * Hook de inicialización del componente.
   *
   * - Carga la primera página de tipos de vehículo al iniciar.
   */
  ngOnInit() {
    this.getTypesList(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
  }

  /**
   * Consulta la lista de tipos de vehículo desde el backend.
   *
   * - Establece el flag `load` mientras se realiza la carga.
   * - Actualiza `types` y `totalItems` si la respuesta es exitosa.
   * - Si la respuesta es 404, limpia la lista y muestra mensaje contextual.
   * - Para otros errores, muestra un mensaje general de error.
   *
   * @param page - Número de página (base 1).
   * @param size - Tamaño de página.
   * @param name - (Opcional) Filtro de búsqueda por nombre.
   */
  getTypesList(page: number, size: number, name?: string) {
    this.load = true;
    this.service.list(page, size, name).subscribe(
      (res) => {
        this.totalItems = res.totalItems;
        this.types = res.types;
        this.load = false;
      },
      (error) => {
        this.load = false;
        if ((error.status = 404)) {
          this.types = [];
          this.totalItems = 1;
          this.errorMessage =
            'No se encuentra al tipo de cliente con el filtro aplicado.';
        } else {
          this.errorMessage =
            'Hubo un error al cargar los tipos de cliente. Intente Nuevamente';
        }
      }
    );
  }

  /**
   * Alterna el menú dropdown asociado al tipo de vehículo dado.
   *
   * @param _id - Identificador del tipo de vehículo.
   */
  toggleDropdown(_id: string) {
    this.isDropdownOpen[_id] = !this.isDropdownOpen[_id];
  }

  /**
   * Maneja el evento de cambio de página.
   *
   * - Actualiza el estado de paginación.
   * - Consulta nuevamente los datos con la nueva página.
   *
   * @param event - Evento de paginación con índice y tamaño.
   */
  onPageChange(event: PaginationEvent) {
    this.pageEvent = event;
    this.getTypesList(event.pageIndex + 1, event.pageSize);
  }

  /**
   * Actualiza el tamaño de página seleccionado por el usuario.
   *
   * - Se mantiene en la misma página actual.
   * - Llama a `getTypesList` con los nuevos parámetros.
   *
   * @param newPageSize - Nuevo número de elementos por página.
   */
  onPgeSizeChange(newPageSize: number) {
    this.pageEvent.pageSize = newPageSize;
    this.getTypesList(this.pageEvent.pageIndex + 1, newPageSize);
  }

  /**
   * Abre el modal de creación o edición de tipo de vehículo.
   *
   * - Si se proporciona un `type`, se asigna como seleccionado para edición.
   * - Cierra el dropdown del tipo si está activo.
   *
   * @param type - (Opcional) Tipo de vehículo seleccionado para edición.
   */
  openModal(type?: Type) {
    this.selectedType = type || null;
    if (type) {
      this.toggleDropdown(type._id);
    }
    this.open = true;
  }

  /**
   * Cierra el modal de tipo de vehículo.
   *
   * - Restablece la bandera `open` a `false`.
   */
  closeModal() {
    this.open = false;
  }

  /**
   * Aplica el filtro de nombre si existe y reinicia paginación.
   *
   * - Llama a `getTypesList` con el filtro actual recortado (`trim()`).
   */
  filter() {
    this.pageEvent.pageIndex = 0;
    if (this.valueFilter) {
      this.getTypesList(1, this.pageEvent.pageSize, this.valueFilter.trim());
    }
  }

  /**
   * Limpia los filtros si el campo `valueFilter` está vacío.
   *
   * - Refresca la lista con la paginación actual sin aplicar filtros.
   */
  cleanFilter() {
    if (!this.valueFilter) {
      this.getTypesList(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
    }
  }

  /**
   * Crea un nuevo tipo de vehículo a través del servicio.
   *
   * - Cierra el modal al completar la operación.
   * - Muestra notificación de éxito si se crea correctamente.
   * - Refresca el listado con la paginación actual.
   * - En caso de error, muestra una alerta contextual.
   *
   * @param type - Objeto `Type` con los datos del nuevo tipo.
   */
  create(type: Type) {
    this.service.create(type).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Tipo de Vehiculo Creado',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getTypesList(
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
   * Edita un tipo de vehículo existente.
   *
   * - Cierra el modal tras recibir confirmación del backend.
   * - Muestra alerta de éxito y recarga el listado.
   * - Captura errores y los presenta con mensaje visual.
   *
   * @param type - Objeto `Type` con los datos actualizados.
   */
  edit(type: Type) {
    this.service.update(type).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Actulización',
          text: 'Los cambios han sido guardados.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getTypesList(
            this.pageEvent.pageIndex + 1,
            this.pageEvent.pageSize
          );
        });
      },
      (error) => {
        console.log(error);
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
   * Elimina un tipo de vehículo previa confirmación del usuario.
   *
   * - Muestra una alerta de confirmación con `Swal`.
   * - Si se acepta, invoca el servicio de eliminación.
   * - Muestra alerta de éxito o error según la respuesta.
   * - Refresca el listado después de eliminar.
   *
   * @param type - Objeto `Type` a eliminar.
   */
  delete(type: Type) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar al tipo de vehiculo ${type.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(type._id).subscribe(
          (response) => {
            Swal.fire({
              title: 'Tipo de Vehiculo eliminado',
              icon: 'success',
              timer: 1600,
            }).then(() => {
              this.getTypesList(
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
   * Calcula la posición absoluta (`top` y `left`) para renderizar un dropdown contextual debajo de un botón.
   *
   * - Usa el ID dinámico del botón (`button-${id}`) para buscar el elemento en el DOM.
   * - Posiciona el dropdown justo debajo del botón (`bottom + scrollY`).
   * - Ajusta la alineación horizontal restando 150px desde el borde derecho del botón.
   *
   * @param id - Identificador del elemento base.
   * @returns Un objeto `{ top, left }` con coordenadas absolutas en `px`, o `{}` si no se encuentra el botón.
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
