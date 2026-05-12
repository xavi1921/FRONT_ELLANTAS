import { Component, OnInit } from '@angular/core';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { CommonModule } from '@angular/common';
import { PaginationEvent } from '../../../shared/ui/pagination/pagination.model';
import { ModalComponent } from '../../../paymentWallet/features/modal/modal/modal.component';
import { WalletService } from '../../data-access/wallet.service';
import { Wallet } from './wallet.model';
import { HasRoleDirective } from '../../../core/hasRole.directive';
import Swal from 'sweetalert2';
import { BaseTokenService } from '../../../shared/data-access/token/base-token.service';
import { WalletMovementsComponent } from '../modal/wallet-movements/wallet-movements.component';
@Component({
  selector: 'app-wallet-list',
  imports: [
    PaginationComponent,
    SpinnerComponent,
    FormsModule,
    ErrorMessageComponent,
    CommonModule,
    ModalComponent,
    HasRoleDirective,
    WalletMovementsComponent,
  ],
  templateUrl: './wallet-list.component.html',
})

/**
 * Componente encargado de listar, filtrar y gestionar el estado de las billeteras (`Wallet`) del sistema.
 *
 * - Soporta paginación, búsqueda textual (`valueFilter`) y filtrado por estado (`selectedStatusFilter`).
 * - Administra la lista actual de billeteras cargadas en `wallet`.
 * - Controla interacciones de UI como:
 *   - Dropdowns individuales (`isDropdownOpen`)
 *   - Modal de edición/registro (`open`)
 *   - Dropdown general de estado (`isStatusDropdownOpen`)
 * - Gestiona el estado de carga visual (`load`) y errores (`errorMessage`).
 */
export class WalletListComponent implements OnInit {
  wallet: Wallet[] = [];
  selectedWallet: Wallet | null = null;
  valueFilter: string = '';
  errorMessage: string = '';
  isDropdownOpen: { [key: string]: boolean } = {};
  totalItems: number = 0;
  pageEvent: PaginationEvent = { pageIndex: 0, pageSize: 10 };
  load: boolean = false;
  open: boolean = false;
  openModalMovements: boolean = false;
  isStatusDropdownOpen: boolean = false;
  statusOptions = [
    { value: 'Todos', label: 'Todos los Estados' },
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'En Progreso', label: 'En Progreso' },
    { value: 'Completada', label: 'Completada' },
  ];
  selectedStatusFilter: string = 'Todos';
  constructor(
    private service: WalletService,
    private token: BaseTokenService
  ) {}

  /**
   * Hook de inicialización del componente `WalletListComponent`.
   *
   * - Realiza la primera carga de billeteras con los parámetros iniciales de paginación.
   */
  ngOnInit() {
    this.getWallets(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
  }

  /**
   * Obtiene la lista de billeteras desde el backend.
   *
   * - Activa el indicador visual `load = true`.
   * - En éxito:
   *   - Asigna la respuesta (`wallets`) a `this.wallet`.
   *   - Asigna `totalItems` para paginación.
   *   - Desactiva el indicador de carga.
   * - En error:
   *   - Si `status === 404`: limpia la lista y muestra mensaje personalizado.
   *   - Otro error: muestra mensaje genérico.
   *
   * @param page - Número de página base 1.
   * @param size - Tamaño de página.
   * @param fullName - Filtro opcional por nombre completo.
   */
  getWallets(page: number, size: number, fullName?: string) {
    this.load = true;
    this.service.list(page, size, fullName).subscribe(
      (res) => {
        this.wallet = res.wallets;
        this.totalItems = res.totalItems;
        this.load = false;
      },
      (error) => {
        this.load = false;
        if ((error.status = 404)) {
          this.wallet = [];
          this.totalItems = 1;
          this.errorMessage =
            'No se encuentra resultado con el filtro aplicado';
        } else {
          this.errorMessage =
            'Hubo un error al cargar los Pagos Pendientes . Intente Nuevamente';
        }
      }
    );
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
   * Abre el modal de edición para la billetera seleccionada.
   *
   * - Si se proporciona una billetera, la asigna a `selectedWallet`.
   * - Si hay dropdown contextual abierto, lo cierra.
   * - Establece `open = true` para mostrar el modal.
   *
   * @param wallet - Instancia seleccionada de `Wallet` (opcional).
   */
  openModal(wallet?: Wallet) {
    this.selectedWallet = wallet || null;
    const canOverride = this.hasAnyRole(['Super Admin', 'Supervisor']);
    if (wallet) {
      this.toggleDropdown(wallet._id);
         if (wallet.amountPending===0) {
        Swal.fire({
          icon: 'info',
          title: 'Monto no asignado',
          text: 'Aún no se ha asignado un monto pendiente para esta cuenta. Por favor, verifique antes de continuar.',
          confirmButtonText: 'Aceptar',
          timer: 2800,
        });
        return; // Evita que continúe abriendo el modal
      }
      if (wallet.status === 'Pagado' && !canOverride) {
        Swal.fire({
          icon: 'info',
          title: 'Pago completado',
          text: 'Esta cuenta ya ha sido pagada por completo.',
          confirmButtonText: 'Aceptar',
          timer: 2000,
        });
        return; // Evita que continúe abriendo el modal
      }
    }
    this.open = true;
  }
  filter() {}
  cleanFilter() {}

  /**
   * Alterna la visibilidad del dropdown contextual asociado a una billetera específica.
   *
   * - Utiliza el `_id` del `Wallet` como clave en el objeto `isDropdownOpen`.
   *
   * @param _id - Identificador único de la billetera.
   */
  toggleDropdown(_id: string) {
    this.isDropdownOpen[_id] = !this.isDropdownOpen[_id];
  }

  /**
   * Alterna la visibilidad del dropdown de filtro por estado (`statusOptions`).
   */
  toggleStatusDropdown() {
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
  }

  /**
   * Calcula la posición visual del dropdown de acciones de una billetera.
   *
   * - Busca el botón usando `document.getElementById('button-${id}')`.
   * - Si existe:
   *   - Usa `getBoundingClientRect()` para obtener la posición relativa.
   *   - Ajusta:
   *     - `top`: justo debajo del botón, considerando `scrollY`.
   *     - `left`: alineado desde el borde derecho restando 150px (ancho fijo estimado).
   * - Si no existe, retorna un objeto vacío (`{}`).
   *
   * @param id - Identificador único del botón.
   * @returns Coordenadas `top` y `left` en `px`, o `{}` si no se encuentra el botón.
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

  /**
   * Maneja el cambio de página desde el paginador.
   *
   * - Actualiza el estado local `pageEvent`.
   * - No dispara la carga inmediatamente — útil si se combina con filtros antes de llamar a `getWallets(...)`.
   *
   * @param event - Objeto con `pageIndex` y `pageSize`.
   */
  onPageChange(event: PaginationEvent) {
    this.pageEvent = event;
  }

  /**
   * Cambia el tamaño de página visible en el paginador.
   *
   * - Solo actualiza `pageEvent.pageSize`; la carga debe hacerse luego manualmente.
   *
   * @param newPageSize - Tamaño de página seleccionado.
   */
  onPageSizeChange(newPageSize: number) {
    this.pageEvent.pageSize = newPageSize;
  }

  /**
   * Edita los datos de una billetera (`Wallet`), marcando como pagado o actualizando su estado.
   *
   * - Activa el indicador de carga.
   * - Llama al servicio `update(...)` con el objeto `wallet`.
   * - En éxito:
   *   - Desactiva la carga.
   *   - Muestra notificación `Swal.fire` de éxito.
   *   - Recarga la lista actual de billeteras en la página visible.
   * - En error:
   *   - Muestra mensaje de error con información proveniente del backend.
   *
   * @param wallet - Objeto con los datos actualizados de la billetera.
   */
  edit(wallet: Wallet) {
    this.load = true;
    this.service.update(wallet).subscribe(
      (res) => {
        this.load = false;

        Swal.fire({
          title: 'Pago',
          text: 'Pago Realizado con Exito',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getWallets(
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

  delete(wallet: Wallet) {
    if (wallet) {
      this.toggleDropdown(wallet._id);
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar la cuenta de la orden ${wallet.order?.codigo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.load = true;
        this.service.delete(wallet._id).subscribe(
          (response) => {
            this.load = false;
            Swal.fire({
              title: 'Cuenta eliminada',
              icon: 'success',
              timer: 1600,
            }).then(() => {
              this.getWallets(
                this.pageEvent.pageIndex + 1,
                this.pageEvent.pageSize
              );
            });
          },
          (error) => {
            this.load = false;
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
   * Cierra el modal de gestión de billeteras.
   *
   * - Establece `open = false` para ocultar el modal visualmente.
   */
  closeModal() {
    this.open = false;
  }

  /**
   * Aplica un filtro por estado (`selectedStatusFilter`) y reinicia la paginación.
   *
   * - Cierra el dropdown de estado (`isStatusDropdownOpen = false`).
   * - Resetea el índice de página para que inicie desde la primera.
   * - Prepara valores normalizados (`value`, `filter`) para una futura consulta.
   *
   * @param status - Estado seleccionado desde el filtro de estado.
   */
  selectStatusFilter(status: string) {
    this.selectedStatusFilter = status;
    this.isStatusDropdownOpen = false;
    this.pageEvent.pageIndex = 0;
    const value = this.valueFilter?.trim() || undefined;
    const filter = status !== 'Todos' ? status.trim() : undefined;
  }

  /**
   * Limpia todos los filtros visuales (`valueFilter`, `selectedStatusFilter`) y recarga la lista.
   *
   * - Restaura `valueFilter = ''` y `selectedStatusFilter = 'Todos'`.
   * - Invoca `filter()` para recargar sin restricciones.
   */
  clearAllFilters() {
    this.valueFilter = '';
    this.selectedStatusFilter = 'Todos';
    this.filter();
  }

  /**
   * Retorna clases de estilo CSS asociadas al estado visual de la billetera.
   *
   * - Mapea un valor de estado a clases TailwindCSS para colorear badges.
   * - Si el estado no es reconocido, retorna una cadena vacía.
   *
   * @param status - Estado actual de la billetera.
   * @returns Clases de estilo CSS como cadena.
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-200 text-yellow-800';
      case 'Parcialmente Pagado':
        return 'bg-blue-200 text-blue-800';
      case 'Pagado':
        return 'bg-green-200 text-green-800';
      case 'Cancelada':
        return 'bg-red-200 text-red-800';
      default:
        return '';
    }
  }
  openPaymentsModal(wallet: Wallet) {
    this.selectedWallet = wallet || null;
    this.openModalMovements = true;
  }
  closePaymentsModal() {
    this.selectedWallet = null;
    this.openModalMovements = false;
  }
}
