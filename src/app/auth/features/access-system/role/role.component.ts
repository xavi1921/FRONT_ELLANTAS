import { Component, OnInit } from '@angular/core';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { PaginationEvent } from '../../../../shared/ui/pagination/pagination.model';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { ErrorMessageComponent } from '../../../../shared/ui/error-message/error-message.component';
import { Role } from './role.model';
import { RoleService } from '../../../data-access/role.service';
import { ModalComponent } from '../modal/modal.component';
@Component({
  selector: 'app-role',
  imports: [
    PaginationComponent,
    SpinnerComponent,
    FormsModule,
    ErrorMessageComponent,
    ModalComponent,
  ],
  templateUrl: './role.component.html',
  styles: ``,
})
export class RoleComponent implements OnInit {
  roles: Role[] = [];
  totalItems: number = 0;
  pageEvent: PaginationEvent = { pageIndex: 0, pageSize: 10 };
  pageSizeOptions: number[] = [5, 10, 25, 100];

  open: boolean = false;
  selectedRole: Role | null = null;
  isDropdownOpen: { [key: string]: boolean } = {};
  load: boolean = false;
  valueFilter: string = '';
  errorMessage: string = '';

  constructor(private service: RoleService) {}

  /**
   * Método del ciclo de vida de Angular que se ejecuta al inicializar el componente.
   *
   * - Llama a `getRoleList` pasando la página y tamaño actuales del paginador (`pageEvent`).
   * - Asegura que la lista de roles se cargue desde el inicio con los parámetros correctos.
   */

  ngOnInit(): void {
    this.getRoleList(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
  }

  /**
   * Alterna la visibilidad de un menú desplegable asociado a un identificador específico.
   *
   * - Invierte el estado booleano del objeto `isDropdownOpen` para el `_id` proporcionado.
   * - Permite mostrar u ocultar dinámicamente el contenido vinculado a ese `_id`.
   *
   * @param {string} _id - Identificador único del elemento cuyo dropdown se desea alternar.
   */

  toggleDropdown(_id: string) {
    this.isDropdownOpen[_id] = !this.isDropdownOpen[_id];
  }

  /**
   * Carga la lista de roles desde el backend aplicando paginación y filtro opcional por nombre.
   *
   * - Establece el flag `load` en `true` mientras se realiza la solicitud.
   * - Al recibir respuesta exitosa, actualiza `roles` y `totalItems` y limpia el flag.
   * - Si ocurre un error 404, limpia la lista e informa que no se encontraron roles según el filtro.
   * - Para otros errores, muestra un mensaje genérico de fallo en la carga.
   *
   * @param {number} page - Número de página actual solicitada.
   * @param {number} size - Número de elementos por página.
   * @param {string} [name] - Filtro opcional para buscar roles por nombre.
   */

  getRoleList(page: number, size: number, name?: string) {
    this.load = true;
    this.service.list(page, size, name).subscribe(
      (res) => {
        this.totalItems = res.totalItems;
        this.roles = res.roles;
        this.load = false;
      },
      (error) => {
        this.load = false;
        if ((error.status = 404)) {
          this.roles = [];
          this.totalItems = 1;
          this.errorMessage = 'No se encuentra al rol con el filtro aplicado.';
        } else {
          this.errorMessage =
            'Hubo un error al cargar los roles. Intente Nuevamente';
        }
      }
    );
  }

  /**
   * Abre el modal de edición o creación de roles.
   *
   * - Si se proporciona un `role`, lo asigna a `selectedRole` y abre su dropdown asociado.
   * - Si no se pasa un rol, limpia la selección (modo creación).
   * - Finalmente, establece la propiedad `open` en `true` para mostrar el modal.
   *
   * @param {Role} [role] - Objeto opcional que representa el rol a editar.
   */

  openModal(role?: Role) {
    this.selectedRole = role || null;
    if (role) {
      this.toggleDropdown(role._id);
    }
    this.open = true;
  }

  /**
   * Cierra el modal actual del componente.
   *
   * - Establece la propiedad `open` en `false` para ocultar la interfaz modal.
   */

  closeModal() {
    this.open = false;
  }

  /**
   * Aplica un filtro por nombre al listado de roles.
   *
   * - Reinicia el índice de página a 0 (primera página).
   * - Si `valueFilter` tiene contenido, lo recorta (`trim`) y lo envía como parámetro a `getRoleList`.
   */

  filter() {
    this.pageEvent.pageIndex = 0;
    if (this.valueFilter) {
      this.getRoleList(1, this.pageEvent.pageSize, this.valueFilter.trim());
    }
  }

  /**
   * Limpia el filtro de búsqueda si no hay valor ingresado (`valueFilter` vacío o nulo).
   *
   * - En ese caso, vuelve a cargar la lista de roles con los parámetros actuales de paginación.
   */

  cleanFilter() {
    if (!this.valueFilter) {
      this.getRoleList(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
    }
  }

  //CREACION-ACTUALIZACION-ELIMINACION

  /**
   * Crea un nuevo rol mediante el servicio backend.
   *
   * - Llama a `service.create()` con el objeto `role` proporcionado.
   * - Si la creación es exitosa, muestra una alerta de éxito con `Swal.fire` y recarga la lista de roles.
   * - Si ocurre un error, muestra una alerta de error con el mensaje recibido del backend.
   *
   * @param {Role} role - Objeto que representa el nuevo rol a crear.
   */

  create(role: Role) {
    this.service.create(role).subscribe(
      (res) => {
        Swal.fire({
          title: 'Role Creado',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getRoleList(
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
   * Actualiza un rol existente mediante el servicio correspondiente.
   *
   * - Llama a `service.update()` con el objeto `role` a editar.
   * - Si la operación es exitosa, muestra una alerta de confirmación (`Swal.fire`)
   *   y recarga el listado de roles con los parámetros actuales de paginación.
   * - Si ocurre un error, muestra una alerta con el mensaje devuelto por el backend.
   *
   * @param {Role} role - Objeto que representa el rol modificado a enviar al backend.
   */

  edit(role: Role) {
    this.service.update(role).subscribe(
      (res) => {
        Swal.fire({
          title: 'Actulización',
          text: 'Los cambios han sido guardados.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getRoleList(
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
   * Elimina un rol específico previa confirmación del usuario.
   *
   * - Si se recibe un rol, primero alterna el estado de su dropdown asociado.
   * - Muestra una alerta de confirmación (`Swal.fire`) para confirmar la eliminación.
   * - Si el usuario confirma, llama al servicio `delete` con el `_id` del rol.
   *   - En caso de éxito, muestra una alerta de éxito y recarga la lista de roles.
   *   - En caso de error, muestra una alerta con el mensaje recibido del backend.
   *
   * @param {Role} role - Objeto del rol que se desea eliminar.
   */

  delete(role: Role) {
    if (role) {
      this.toggleDropdown(role._id);
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar al rol ${role.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(role._id).subscribe(
          (response) => {
            Swal.fire({
              title: 'Role eliminado',
              text: 'Role eliminado con exito',
              icon: 'success',
              timer: 1600,
            }).then(() => {
              this.getRoleList(
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

  //FUNCIONES DE PAGINADO

  /**
   * Maneja el evento de cambio de página del componente de paginación.
   *
   * - Actualiza la variable `pageEvent` con el nuevo evento.
   * - Llama a `getRoleList` con los parámetros actualizados (página y tamaño).
   *
   * @param {PaginationEvent} event - Objeto que contiene la nueva información de paginación (`pageIndex` y `pageSize`).
   */

  onPageChange(event: PaginationEvent) {
    this.pageEvent = event;
    this.getRoleList(event.pageIndex + 1, event.pageSize);
  }

  /**
   * Maneja el cambio en el tamaño de página del paginador.
   *
   * - Actualiza `pageEvent.pageSize` con el nuevo valor seleccionado.
   * - Llama a `getRoleList` para recargar los datos con el nuevo tamaño de página,
   *   manteniendo el índice de página actual.
   *
   * @param {number} newPageSize - Nuevo número de elementos por página seleccionado.
   */

  onPgeSizeChange(newPageSize: number) {
    this.pageEvent.pageSize = newPageSize;
    this.getRoleList(this.pageEvent.pageIndex + 1, newPageSize);
  }
}
