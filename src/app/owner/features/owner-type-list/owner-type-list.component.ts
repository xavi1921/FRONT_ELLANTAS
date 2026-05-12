import { Component, OnInit, ViewChild } from '@angular/core';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { Type } from './typeOwner.model';
import { PaginationEvent } from '../../../shared/ui/pagination/pagination.model';
import { TypeOwnerService } from '../../data-access/typeOwner.service';
import Swal from 'sweetalert2';
import { ModalComponent } from '../modal/typeOwner/modal.component';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-owner-type-list',
  imports: [
    PaginationComponent,
    SpinnerComponent,
    FormsModule,
    ErrorMessageComponent,
    ModalComponent,
    CommonModule,
  ],
  templateUrl: './owner-type-list.component.html',
  styles: ``,
})

/**
 * Componente encargado de listar, paginar, filtrar y gestionar tipos de propietarios (`Type`).
 *
 * - Controla la lista cargada en `types` y el total de resultados en `totalItems`.
 * - Administra la configuración y estado del paginador a través de `pageEvent` y `pageSizeOptions`.
 * - Usa `open` y `selectedType` para gestionar la apertura del modal y el tipo seleccionado.
 * - Controla la apertura de dropdowns contextuales por ID en `isDropdownOpen`.
 * - Maneja el estado visual de carga (`load`) y mensajes de error (`errorMessage`).
 * - Permite filtrado textual con `valueFilter`.
 */
export class OwnerTypeListComponent implements OnInit {
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
  constructor(private service: TypeOwnerService) {}

  /**
   * Hook de inicialización del componente.
   *
   * - Invoca la primera carga de tipos de propietario desde la API con los parámetros actuales de paginación.
   */
  ngOnInit() {
    this.getTypesList(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
  }

  /**
   * Obtiene la lista de tipos de propietario desde el backend, con soporte de paginación y filtro opcional.
   *
   * - Activa el estado de carga (`load = true`) durante la solicitud.
   * - En caso exitoso:
   *   - Asigna `res.types` a `types` y `res.totalItems` a `totalItems`.
   *   - Apaga el indicador de carga.
   * - En caso de error:
   *   - Si es 404: limpia la lista, asigna mensaje personalizado y mantiene paginador visible.
   *   - Otro error: asigna mensaje genérico de error.
   *
   * @param page - Número de página (base 1).
   * @param size - Cantidad de elementos por página.
   * @param name - Filtro por nombre (opcional).
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
   * Alterna la visibilidad del dropdown contextual para un tipo de propietario.
   *
   * - Usa el `_id` como clave para determinar qué dropdown está abierto.
   *
   * @param _id - Identificador único del tipo de propietario.
   */
  toggleDropdown(_id: string) {
    this.isDropdownOpen[_id] = !this.isDropdownOpen[_id];
  }

  /**
   * Maneja el evento de cambio de página en la paginación.
   *
   * - Actualiza el estado local `pageEvent` con los nuevos valores.
   * - Llama a `getTypesList(...)` con el nuevo índice de página (base 1) y el tamaño actual.
   *
   * @param event - Evento con información de la nueva página.
   */
  onPageChange(event: PaginationEvent) {
    this.pageEvent = event;
    this.getTypesList(event.pageIndex + 1, event.pageSize);
  }

  /**
   * Cambia el tamaño de página del paginador y recarga los datos actuales.
   *
   * - Actualiza `pageEvent.pageSize`.
   * - Vuelve a solicitar los datos con el nuevo tamaño desde la misma página.
   *
   * @param newPageSize - Tamaño de página elegido.
   */
  onPgeSizeChange(newPageSize: number) {
    this.pageEvent.pageSize = newPageSize;
    this.getTypesList(this.pageEvent.pageIndex + 1, newPageSize);
  }

  /**
   * Abre el modal para crear o editar un tipo de propietario (`Type`).
   *
   * - Asigna el tipo seleccionado (si lo hay) a `selectedType`.
   * - Si se pasa un tipo, también cierra su dropdown contextual.
   * - Activa la bandera `open = true` para mostrar el modal.
   *
   * @param type - Tipo de propietario a editar (opcional).
   */
  openModal(type?: Type) {
    this.selectedType = type || null;
    if (type) {
      this.toggleDropdown(type._id);
    }
    this.open = true;
  }

  /**
   * Cierra el modal actual.
   */
  closeModal() {
    this.open = false;
  }

  /**
   * Aplica un filtro por nombre en la lista de tipos de propietario.
   *
   * - Reinicia el índice de página (`pageIndex = 0`) para mostrar resultados desde el inicio.
   * - Si hay texto en `valueFilter`, se recorta (`trim()`) y se utiliza como parámetro en la solicitud.
   */
  filter() {
    this.pageEvent.pageIndex = 0;
    if (this.valueFilter) {
      this.getTypesList(1, this.pageEvent.pageSize, this.valueFilter.trim());
    }
  }

  /**
   * Limpia la búsqueda actual y recarga la lista completa, solo si no hay texto en `valueFilter`.
   *
   * - Ideal para evitar llamadas innecesarias al backend si el campo ya está vacío.
   */
  cleanFilter() {
    if (!this.valueFilter) {
      this.getTypesList(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
    }
  }

  /**
   * Crea un nuevo tipo de propietario (`Type`) mediante el servicio correspondiente.
   *
   * - Cierra el modal (`this.modal.onClose()`).
   * - Muestra una notificación de éxito (`Swal.fire`).
   * - Actualiza la lista actual de tipos en la misma página.
   *
   * @param type - Objeto con los datos del nuevo tipo.
   */
  create(type: Type) {
    this.service.create(type).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Tipo de cliente Creado',
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
          timer: 1700,
        });
      }
    );
  }

  /**
   * Actualiza un tipo de propietario existente.
   *
   * - Cierra el modal y muestra mensaje de éxito.
   * - Refresca la lista para mostrar los cambios aplicados.
   *
   * @param type - Objeto con los datos actualizados.
   */
  edit(type: Type) {
    this.service.update(type).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Actulización',
          text: 'Los cambios han sido guardados.',
          icon: 'success',
          timer: 1750,
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
   * Elimina un tipo de propietario tras confirmación del usuario.
   *
   * - Cierra su dropdown contextual.
   * - Muestra mensaje de confirmación con SweetAlert.
   * - Si el usuario acepta:
   *   - Elimina el tipo desde el backend.
   *   - Muestra notificación de éxito.
   *   - Recarga la lista actual.
   *
   * @param type - Tipo de propietario a eliminar.
   */
  delete(type: Type) {
    if (type) {
      this.toggleDropdown(type._id);
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar al empleado ${type.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(type._id).subscribe(
          (response) => {
            Swal.fire({
              title: 'Tipo de cliente eliminado',
              text: response.message,
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
   * Calcula la posición absoluta de un dropdown contextual asociado a un botón específico.
   *
   * - Busca el elemento por ID (`button-${id}`).
   * - Si no existe, retorna `{}` para evitar errores visuales.
   * - Si existe:
   *   - Obtiene su posición en pantalla con `getBoundingClientRect()`.
   *   - Ajusta:
   *     - `top`: añade el desplazamiento vertical para anclar justo debajo del botón.
   *     - `left`: alinea el borde derecho restando 150px (ancho fijo estimado del dropdown).
   *
   * @param id - Identificador único del botón.
   * @returns Objeto con propiedades `top` y `left` en `px`, o `{}` si el elemento no fue encontrado.
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
