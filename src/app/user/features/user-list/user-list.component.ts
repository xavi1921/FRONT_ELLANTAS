import { Component, OnInit, ViewChild } from '@angular/core';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { userService } from '../../data-access/user.service';
import { User } from './user.model';
import { PaginationEvent } from '../../../shared/ui/pagination/pagination.model';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/user/modal.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';

@Component({
  selector: 'app-user-list',
  imports: [
    PaginationComponent,
    CommonModule,
    ModalComponent,
    SpinnerComponent,
    FormsModule,
    ErrorMessageComponent,
  ],
  templateUrl: './user-list.component.html',
  styles: ``,
})

/**
 * Componente que gestiona la vista de listado de usuarios.
 *
 * - Maneja la paginación, carga visual (`spinner`) y filtrado por nombre.
 * - Controla la apertura del modal para creación/edición de usuarios.
 * - Gestiona la selección de usuario y estados visuales como dropdowns o errores.
 */
export class UserListComponent implements OnInit {
  isDropdownOpen: { [key: string]: boolean } = {};
  users: User[] = [];
  totalItems: number = 0;
  pageEvent: PaginationEvent = { pageIndex: 0, pageSize: 10 };
  open: boolean = false;
  selectedUser: User | null = null;
  load: boolean = false;
  valueFilter: string = '';
  errorMessage: string = '';
  @ViewChild(ModalComponent) modal!: ModalComponent;

  constructor(private service: userService) {}

  /**
   * Hook de inicialización del componente.
   *
   * - Carga la lista de usuarios con la configuración inicial de paginación.
   */
  ngOnInit() {
    this.getUserList(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
  }

  /**
   * Alterna visualmente la visibilidad del dropdown de acciones por usuario.
   *
   * @param _id - Identificador único del usuario.
   */
  toggleDropdown(_id: string) {
    this.isDropdownOpen[_id] = !this.isDropdownOpen[_id];
  }

  /**
   * Consulta la lista de usuarios paginada desde el backend.
   *
   * - Muestra un spinner mientras se realiza la operación.
   * - En caso de éxito, actualiza `users` y `totalItems` con la respuesta.
   * - Si se recibe un `404`, muestra mensaje personalizado y vacía la lista.
   * - Si ocurre otro error, notifica con mensaje genérico.
   *
   * @param page - Número de página (base 1).
   * @param size - Cantidad de elementos por página.
   * @param fullName - (Opcional) Filtro por nombre completo.
   */
  getUserList(page: number, size: number, fullName?: string) {
    this.load = true;
    this.service.list(page, size, fullName).subscribe(
      (res) => {
        this.totalItems = res.totalItems;
        this.users = res.users;
        this.load = false;
      },
      (error) => {
        this.load = false;
        if ((error.status = 404)) {
          this.users = [];
          this.totalItems = 1;
          this.errorMessage =
            'No se encuentra al usuario con el filtro aplicado.';
        } else {
          this.errorMessage =
            'Hubo un error al cargar los usuarios. Intente Nuevamente';
        }
      }
    );
  }

  /**
   * Se ejecuta cuando el usuario cambia de página en el componente de paginación.
   *
   * - Actualiza el estado local (`pageEvent`) con el nuevo índice y tamaño.
   * - Solicita los datos de la nueva página desde el backend.
   *
   * @param event - Evento de paginación con `pageIndex` y `pageSize`.
   */
  onPageChange(event: PaginationEvent) {
    this.pageEvent = event;
    this.getUserList(event.pageIndex + 1, event.pageSize);
  }

  /**
   * Se ejecuta cuando el usuario cambia el tamaño de página.
   *
   * - Actualiza la propiedad `pageSize` localmente.
   * - Recarga los usuarios manteniendo el índice de página actual.
   *
   * @param newPageSize - Nuevo número de elementos por página.
   */
  onPgeSizeChange(newPageSize: number) {
    this.pageEvent.pageSize = newPageSize;
    this.getUserList(this.pageEvent.pageIndex + 1, newPageSize);
  }

  /**
   * Abre el modal de creación o edición de usuarios.
   *
   * - Si se proporciona un `User`, lo asigna como seleccionado para edición.
   * - Cierra el dropdown contextual del usuario antes de abrir el modal.
   *
   * @param user - (Opcional) Usuario seleccionado para editar.
   */
  openModal(user?: User) {
    this.selectedUser = user || null;
    if (user) {
      this.toggleDropdown(user._id);
    }
    this.open = true;
  }

  /**
   * Cierra el modal y limpia la selección actual.
   *
   * - Resetea `selectedUser` a `null`.
   * - Cambia la bandera `open` a `false` para cerrar el modal.
   */
  closeModal() {
    this.selectedUser = null;
    this.open = false;
  }

  /**
   * Ejecuta la búsqueda filtrada de usuarios.
   *
   * - Reinicia la paginación a la primera página (`pageIndex = 0`).
   * - Llama a `getUserList` con el filtro ingresado si no está vacío.
   */
  filter() {
    this.pageEvent.pageIndex = 0;
    if (this.valueFilter) {
      this.getUserList(1, this.pageEvent.pageSize, this.valueFilter.trim());
    }
  }

  /**
   * Limpia la búsqueda si el filtro está vacío.
   *
   * - Vuelve a cargar la lista de usuarios con la paginación actual y sin aplicar filtro.
   */
  cleanFilter() {
    if (!this.valueFilter) {
      this.getUserList(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
    }
  }

  /**
   * Crea un nuevo usuario a través del servicio.
   *
   * - Cierra el modal al completar.
   * - Muestra una alerta de éxito (`Swal`) si la operación es exitosa.
   * - Recarga la lista de usuarios después de confirmar.
   * - Muestra mensaje contextual si ocurre un error.
   *
   * @param data - Objeto `User` con los datos del nuevo usuario.
   */
  create(data: User) {
    this.service.create(data).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Usuario',
          text: 'Creado Correctamente.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getUserList(
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
   * Actualiza un usuario existente.
   *
   * - Cierra el modal tras aplicar los cambios.
   * - Muestra confirmación visual con `Swal`.
   * - Recarga la lista de usuarios después de confirmar.
   * - Muestra mensaje de error si ocurre un fallo en la solicitud.
   *
   * @param data - Objeto `User` con los cambios realizados.
   */
  edit(data: User) {
    this.service.update(data).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Actulización',
          text: 'Los cambios han sido guardados.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getUserList(
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
   * Elimina un usuario luego de confirmación visual.
   *
   * - Cierra el dropdown de acciones si estaba abierto.
   * - Usa `Swal` para pedir confirmación y mostrar el resultado.
   * - Recarga la lista si la operación fue exitosa.
   *
   * @param data - Objeto `User` a eliminar.
   */
  delete(data: User) {
    if (data) {
      this.toggleDropdown(data._id);
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar la cuenta de usuario ${data.username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(data._id).subscribe(
          (response) => {
            Swal.fire({
              title: 'Cuenta de usuario eliminado',
              text: response.message,
              icon: 'success',
              timer: 1600,
            }).then(() => {
              this.getUserList(
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
   * Calcula la posición absoluta (top y left) para ubicar un dropdown anclado a un botón.
   *
   * - Usa `getBoundingClientRect()` para obtener coordenadas del botón en pantalla.
   * - Ajusta `top` sumando `scrollY` para compensar el desplazamiento.
   * - Aplica un desplazamiento horizontal negativo de 150px desde el borde derecho del botón.
   *
   * @param id - Identificador del botón (`button-${id}`).
   * @returns Objeto `{ top, left }` con valores en `px`. Si el botón no se encuentra, retorna un objeto vacío (`{}`).
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
