import { Component, OnInit, ViewChild } from '@angular/core';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { Owner } from './owner.model';
import { PaginationEvent } from '../../../shared/ui/pagination/pagination.model';
import { OwnerService } from '../../data-access/owner.service';
import Swal from 'sweetalert2';
import { ModalComponent } from '../modal/owner/modal.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owner-list',
  imports: [
    PaginationComponent,
    SpinnerComponent,
    FormsModule,
    ErrorMessageComponent,
    ModalComponent,
    CommonModule,
  ],
  templateUrl: './owner-list.component.html',
  styles: ``,
})

/**
 * Componente encargado de listar, filtrar y gestionar propietarios (`Owner`) dentro del sistema.
 *
 * - Utiliza paginación (`pageEvent`) y filtrado textual (`valueFilter`).
 * - Controla la visibilidad de modales (`open`) y dropdowns individuales por propietario.
 * - Gestiona el estado de carga (`load`) y errores de backend (`errorMessage`).
 * - Almacena propietarios cargados en `owners` y el total para paginación en `totalItems`.
 * - `selectedOwner` mantiene contexto para edición o visualización desde el modal.
 */
export class OwnerListComponent implements OnInit {
  owners: Owner[] = [];
  totalItems: number = 0;
  pageEvent: PaginationEvent = { pageIndex: 0, pageSize: 10 };

  open: boolean = false;
  selectedOwner: Owner | null = null;
  isDropdownOpen: { [key: string]: boolean } = {};
  load: boolean = false;
  valueFilter: string = '';
  errorMessage: string = '';
  @ViewChild(ModalComponent) modal!: ModalComponent;
  constructor(private service: OwnerService) {}

  /**
   * Hook que se ejecuta al inicializar el componente.
   *
   * - Realiza la primera carga de propietarios utilizando los parámetros de paginación iniciales (`pageIndex + 1`, `pageSize`).
   */
  ngOnInit() {
    this.getOwners(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
  }

  /**
   * Obtiene la lista de propietarios desde el backend con soporte de paginación y filtrado opcional.
   *
   * - Activa `load = true` mientras se realiza la solicitud.
   * - En éxito:
   *   - Asigna la respuesta a `owners` y `totalItems`.
   *   - Desactiva la carga (`load = false`).
   * - En error:
   *   - Si `status === 404`: limpia la lista, mantiene visible el paginador (`totalItems = 1`)
   *     y muestra un mensaje personalizado.
   *   - En cualquier otro error: muestra mensaje genérico.
   *
   * @param page - Página actual (base 1).
   * @param size - Tamaño de página.
   * @param filterValue- Filtro de busqueda.
   */
  getOwners(page: number, size: number, filterValue?: string) {
    this.load = true;
    this.service.list(page, size, filterValue).subscribe(
      (res) => {
        this.owners = res.owners;
        this.totalItems = res.totalItems;
        this.load = false;
      },
      (error) => {
        this.load = false;
        if (error.status === 404) {
          this.owners = [];
          this.totalItems = 1;
          this.errorMessage =
            'No se encuentra al cliente con el filtro aplicado';
        } else {
          this.errorMessage =
            'Hubo un error al cargar los clientes . Intente Nuevamente';
        }
      },
    );
  }

  /**
   * Alterna la visibilidad del dropdown de acciones asociado a un propietario específico.
   *
   * - Usa el ID del propietario como clave en el objeto `isDropdownOpen`.
   *
   * @param _id - Identificador único del propietario.
   */
  toggleDropdown(_id: string) {
    this.isDropdownOpen[_id] = !this.isDropdownOpen[_id];
  }

  /**
   * Maneja el evento de cambio de página en el paginador.
   *
   * - Actualiza `pageEvent` con los nuevos parámetros.
   * - Invoca `getOwners(...)` con la nueva página (`pageIndex + 1`) y tamaño de página.
   *
   * @param event - Evento con la nueva página y tamaño desde el paginador.
   */
  onPageChange(event: PaginationEvent) {
    this.pageEvent = event;
    this.getOwners(
      event.pageIndex + 1,
      event.pageSize,
      this.valueFilter.trim(),
    );
  }

  /**
   * Cambia el tamaño de página del paginador y recarga los datos manteniendo la página actual.
   *
   * - Actualiza `pageEvent.pageSize`.
   * - Solicita los datos nuevamente con el nuevo tamaño.
   *
   * @param newPageSize - Tamaño de página seleccionado.
   */
  onPageSizeChange(newPageSize: number) {
    this.pageEvent.pageSize = newPageSize;
    this.getOwners(
      this.pageEvent.pageIndex + 1,
      newPageSize,
      this.valueFilter.trim(),
    );
  }

  /**
   * Abre el modal de propietarios para crear o editar un registro.
   *
   * - Si se pasa un propietario, lo asigna a `selectedOwner`.
   * - Cierra su dropdown contextual si está abierto.
   * - Establece `open = true` para mostrar el modal.
   *
   * @param owner - Propietario seleccionado (opcional).
   */
  openModal(owner?: Owner) {
    this.selectedOwner = owner || null;
    if (owner) {
      this.toggleDropdown(owner._id);
    }
    this.open = true;
  }

  /**
   * Cierra el modal de propietarios estableciendo el estado `open` en `false`.
   *
   * - Se invoca tras guardar, cancelar o cerrar visualmente el modal.
   */
  closeModal() {
    this.open = false;
  }

  /**
   * Ejecuta el filtro por nombre sobre la lista de propietarios.
   *
   * - Reinicia la paginación (`pageIndex = 0`) para mostrar desde la primera página.
   * - Si hay valor en `valueFilter`, lo recorta (`trim()`) y lo pasa al servicio como filtro.
   */
  filter() {
    this.pageEvent.pageIndex = 0;
    if (this.valueFilter) {
      this.getOwners(1, this.pageEvent.pageSize, this.valueFilter.trim());
    }
  }

  /**
   * Limpia el filtro y recarga los datos solo si `valueFilter` ya está vacío.
   *
   * - Si no hay texto de búsqueda activo:
   *   - Solicita al backend la lista actual sin filtro.
   */
  cleanFilter() {
    if (!this.valueFilter) {
      this.getOwners(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
    }
  }

  /**
   * Crea un nuevo propietario (`Owner`) mediante el servicio y actualiza la lista.
   *
   * - Cierra el modal tras éxito.
   * - Muestra alerta de éxito con SweetAlert.
   * - Refresca la lista actual desde la misma página.
   *
   * @param Owner - Objeto con los datos del nuevo propietario.
   */
  create(Owner: Owner) {
    this.service.create(Owner).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Cliente Creado',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getOwners(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
        });
      },
      (error) => {
        Swal.fire({
          title: 'Error',
          text: error.error.message,
          icon: 'error',
          timer: 1750,
        });
      },
    );
  }

  /**
   * Actualiza un propietario existente (`Owner`) mediante el servicio.
   *
   * - Cierra el modal tras éxito.
   * - Muestra alerta de confirmación.
   * - Refresca la lista para mostrar los cambios aplicados.
   *
   * @param Owner - Objeto con los datos actualizados del propietario.
   */
  edit(Owner: Owner) {
    this.service.update(Owner).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Actualización',
          text: 'Los cambios han sido guardados.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getOwners(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
        });
      },
      (error) => {
        Swal.fire({
          title: 'Error',
          text: error.error.message,
          icon: 'error',
          timer: 1750,
        });
      },
    );
  }

  /**
   * Elimina un propietario tras confirmación del usuario.
   *
   * - Cierra el dropdown de acciones si está abierto.
   * - Solicita confirmación mediante SweetAlert.
   * - Si se confirma:
   *   - Llama al servicio `delete(...)`.
   *   - Muestra alerta de éxito.
   *   - Recarga la lista en la misma página.
   *
   * @param Owner - Propietario a eliminar.
   */
  delete(Owner: Owner) {
    if (Owner) {
      this.toggleDropdown(Owner._id);
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar al cliente ${Owner.fullName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(Owner._id).subscribe(
          (response) => {
            Swal.fire({
              title: 'Cliente eliminado',
              icon: 'success',
              timer: 1600,
            }).then(() => {
              this.getOwners(
                this.pageEvent.pageIndex + 1,
                this.pageEvent.pageSize,
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
          },
        );
      }
    });
  }

  /**
   * Calcula la posición absoluta para mostrar un dropdown asociado a un botón específico.
   *
   * - Busca el elemento HTML con ID `button-${id}`.
   * - Si no se encuentra, retorna `{}` para prevenir errores.
   * - Si existe:
   *   - Usa `getBoundingClientRect()` para obtener la posición relativa del botón.
   *   - Ajusta `top` sumando el desplazamiento vertical (`window.scrollY`) al borde inferior del botón.
   *   - Ajusta `left` restando 150px desde el borde derecho del botón (posición fija lateral).
   *
   * @param id - Identificador único del botón.
   * @returns Coordenadas `{ top, left }` como cadenas con unidades `px`, o `{}` si el botón no existe.
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
