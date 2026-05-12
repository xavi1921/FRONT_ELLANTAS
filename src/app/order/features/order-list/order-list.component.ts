import { Component, HostListener, OnInit } from '@angular/core';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { PaginationEvent } from '../../../shared/ui/pagination/pagination.model';
import Swal from 'sweetalert2';
import { Order, transformationData } from './ordern.model';
import { OrderService } from '../../data-access/order.service';
import { ModalComponent } from '../modal/order/modal.component';
import { AnnexComponent } from '../modal/annex/modal.component';
import { CommonModule } from '@angular/common';
import { NotificationStateService } from '../../../shared/data-access/notification/notification.service';
import { HasRoleDirective } from '../../../core/hasRole.directive';
import { ExportService } from '../../data-access/export.service';
import { BaseTokenService } from '../../../shared/data-access/token/base-token.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-order-list',
  imports: [
    PaginationComponent,
    SpinnerComponent,
    FormsModule,
    CommonModule,
    ErrorMessageComponent,
    ModalComponent,
    AnnexComponent,
    HasRoleDirective,
  ],
  templateUrl: './order-list.component.html',
  styles: ``,
})

/**
 * Componente que gestiona la visualización y filtrado de órdenes de trabajo en una lista paginada.
 *
 * - `orders`: Arreglo principal de órdenes mostradas en la vista.
 * - `totalItems`: Total de ítems disponibles (para paginación).
 * - `pageEvent`: Objeto de configuración para la paginación actual (índice de página y tamaño).
 *
 * - `open` / `openRetiro`: Flags para controlar la visibilidad de distintos modales.
 * - `selectedOrder`: Orden actualmente seleccionada para edición, detalle o retiro.
 * - `isDropdownOpen`: Estado de apertura de dropdowns individuales por orden (clave = ID o índice).
 * - `load`: Flag general de carga para mostrar spinners o bloquear interacción.
 * - `valueFilter`: Texto actual del filtro de búsqueda.
 * - `errorMessage`: Mensaje de error visualizado en caso de fallos durante la carga o filtrado.
 * - `selectedStatus`: Estado actualmente seleccionado de una orden específica.
 * - `pdfUrl`: URL generada o recibida para visualizar o descargar un reporte PDF de orden.
 *
 * - `selectedStatusFilter`: Filtro de estado aplicado globalmente a la lista de órdenes.
 * - `isStatusDropdownOpen`: Controla visibilidad del dropdown de estados.
 * - `statusOptions`: Opciones disponibles para filtrar las órdenes por estado.
 * - `statusDropdownPosition`: Posición dinámica del dropdown de estados en pantalla.
 * - `selectedDate`: Fecha seleccionada para filtrar o contextualizar órdenes (por día).
 */
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  totalItems: number = 0;
  pageEvent: PaginationEvent = { pageIndex: 0, pageSize: 10 };

  open: boolean = false;
  openRetiro: boolean = false;
  selectedOrder: Order | null = null;
  isDropdownOpen: { [key: string]: boolean } = {};
  load: boolean = false;
  valueFilter: string = '';
  errorMessage: string = '';
  selectedStatus = '';
  pdfUrl: string | null = null;
  selectedStatusFilter: string = 'Todos';
  isStatusDropdownOpen: boolean = false;
  statusOptions = [
    { value: 'Todos', label: 'Todos los Estados' },
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'En Progreso', label: 'En Progreso' },
    { value: 'Completada', label: 'Completada' },
    { value: 'Cancelada', label: 'Cancelada' },
    { value: 'Por Retirar', label: 'Por Retirar' },
    { value: 'Retirado', label: 'Retirado' },
  ];
  statusDropdownPosition = { top: '0px', left: '0px' };
  selectedDate = '';
  constructor(
    private notification: NotificationStateService,
    private service: OrderService,
    private token: BaseTokenService,
    private pdf: ExportService,
    private router: Router,
    private orderService: OrderService,
  ) {}

  ngOnInit() {
    this.loadOrdersWithFilters();
  }
  saveFilters() {
    this.orderService.setFilters({
      valueFilter: this.valueFilter,
      selectedStatusFilter: this.selectedStatusFilter,
      selectedDate: this.selectedDate,
      pageIndex: this.pageEvent.pageIndex,
      pageSize: this.pageEvent.pageSize,
    });
  }

  loadOrdersWithFilters(): void {
    const savedFilters = this.orderService.getFilters();

    if (
      savedFilters &&
      (savedFilters.valueFilter ||
        savedFilters.selectedStatusFilter !== 'Todos' ||
        savedFilters.selectedDate)
    ) {
      this.valueFilter = savedFilters.valueFilter || '';
      this.selectedStatusFilter = savedFilters.selectedStatusFilter || 'Todos';
      this.selectedDate = savedFilters.selectedDate || '';
      this.pageEvent.pageIndex = savedFilters.pageIndex || 0;
      this.pageEvent.pageSize = savedFilters.pageSize || 10;

      const currentPage = this.pageEvent.pageIndex + 1;
      // Dependiendo del tipo de filtro activo, aplicamos el método correcto
      if (this.selectedDate) {
        this.getOrders(
          currentPage,
          this.pageEvent.pageSize,
          undefined,
          undefined,
          this.selectedDate,
        );
      } else if (
        this.selectedStatusFilter &&
        this.selectedStatusFilter !== 'Todos'
      ) {
        this.getOrders(
          currentPage,
          this.pageEvent.pageSize,
          this.valueFilter?.trim(),
          this.selectedStatusFilter,
        );
      } else if (this.valueFilter) {
        this.getOrders(
          currentPage,
          this.pageEvent.pageSize,
          this.valueFilter?.trim(),
        );
      } else {
        this.getOrders(currentPage, this.pageEvent.pageSize);
      }
    } else {
      this.getOrders(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
    }
  }

  /**
   * Carga la lista de órdenes desde el backend aplicando paginación, búsqueda, estado y fecha.
   *
   * - Activa `load` para mostrar el estado de carga visual.
   * - Llama a `this.service.list(...)` pasando parámetros de paginación y filtro.
   * - En respuesta exitosa:
   *   - Asigna `orders` y `totalItems` desde el backend.
   *   - Desactiva el spinner (`load = false`).
   * - En error:
   *   - Muestra mensaje personalizado si `status === 404`.
   *   - En otros casos, asigna mensaje genérico de fallo.
   *
   * @param page - Número de página (1-based).
   * @param size - Tamaño de página.
   * @param value - Filtro de búsqueda textual (cliente, código, etc.).
   * @param filter - Estado seleccionado para filtrar (Pendiente, En Progreso, etc.).
   * @param exitDate - Fecha de retiro para filtrar órdenes por salida.
   */
  getOrders(
    page: number,
    size: number,
    value?: string,
    filter?: string,
    exitDate?: string,
  ) {
    this.load = true;
    this.service.list(page, size, value, filter, exitDate).subscribe(
      (res) => {
        this.orders = res.orders;
        this.totalItems = res.totalItems;
        this.load = false;
      },
      (error) => {
        this.load = false;
        if ((error.status = 404)) {
          this.orders = [];
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
   * Alterna el estado de apertura de un dropdown individual por ID.
   * Ideal para acciones contextuales en filas de la tabla de órdenes.
   *
   * @param _id - Identificador único de la orden.
   */
  toggleDropdown(_id: string) {
    this.isDropdownOpen[_id] = !this.isDropdownOpen[_id];
  }

  /**
   * Maneja el evento de cambio de página en el componente de paginación.
   * Recalcula filtros actuales y solicita la nueva página con `getOrders(...)`.
   *
   * @param event - Objeto con nuevo `pageIndex` y `pageSize`.
   */
  onPageChange(event: PaginationEvent) {
    this.pageEvent = event;

    const value = this.valueFilter?.trim() || undefined;
    const filter =
      this.selectedStatusFilter !== 'Todos'
        ? this.selectedStatusFilter.trim()
        : undefined;
    this.saveFilters();
    this.getOrders(event.pageIndex + 1, event.pageSize, value, filter);
  }

  /**
   * Ajusta el número de elementos por página y recarga órdenes con filtros actuales.
   *
   * @param newPageSize - Nuevo tamaño seleccionado para la paginación.
   */
  onPageSizeChange(newPageSize: number) {
    this.pageEvent.pageSize = newPageSize;
    const value = this.valueFilter?.trim() || undefined;
    const filter =
      this.selectedStatusFilter !== 'Todos'
        ? this.selectedStatusFilter.trim()
        : undefined;
    this.saveFilters();
    this.getOrders(this.pageEvent.pageIndex + 1, newPageSize, value, filter);
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
   * Redirige al formulario principal de edición o creación de órdenes.
   *
   * - Si se pasa una orden, alterna su dropdown contextual para cerrarlo visualmente.
   * - Si la orden ya está retirada y el usuario no tiene permisos especiales,
   *   muestra una alerta e impide la navegación.
   * - En caso válido, navega a la ruta de edición correspondiente (`/order/Edit/:id`)
   *   o a la ruta de nueva orden (`/order/New`).
   *
   * @param order - Orden a editar o, si no se pasa, indica creación de una nueva orden.
   */

  goForm(order?: Order) {
    const canOverride = this.hasAnyRole(['Super Admin', 'Supervisor']);

    if (order) {
      this.toggleDropdown(order._id);

      if (order.retiro && !canOverride) {
        Swal.fire({
          icon: 'info',
          title: 'Vehículo ya retirado',
          text: 'Orden no editable: vehículo retirado.',
          confirmButtonText: 'Aceptar',
          timer: 2300,
        });
        return;
      }

      this.router.navigate(['/order/Edit', order._id]);
    } else {
      this.router.navigate(['/order/New']);
    }
  }

  /**
   * Cambia el estado de la orden a "Por Retirar", notificando visualmente
   * y recargando la lista de órdenes en pantalla.
   *
   * - Activa la bandera `load` mientras la petición se procesa.
   * - Llama a `porRetirar(order._id)` en el servicio.
   * - En caso de éxito:
   *   - Muestra notificación SweetAlert de éxito.
   *   - Recarga la página actual de órdenes.
   * - En caso de error:
   *   - Muestra alerta con el mensaje recibido desde el backend.
   *
   * @param order - Orden a actualizar.
   */
  changeStatusRetiro(order: Order) {
    this.load = true;
    this.service.porRetirar(order._id).subscribe(
      (response) => {
        this.load = false;
        Swal.fire({
          title: 'Orden Actualizada',
          icon: 'success',
          timer: 1600,
        }).then(() => {
          this.getOrders(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
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

  /**
   * Ejecuta el flujo completo para marcar una orden como "Por Retirar", validando su estado.
   *
   * - Asigna `selectedOrder`.
   * - Si no hay orden, cancela ejecución.
   * - Cierra el dropdown asociado mediante `toggleDropdown(...)`.
   * - Verifica que la orden esté en estado `"Completada"`:
   *   - Si no lo está, muestra una alerta y detiene el flujo.
   *   - Si lo está, procede a llamar a `changeStatusRetiro(...)`.
   *
   * @param order - Orden objetivo (opcional).
   */
  statusRetiro(order?: Order) {
    this.selectedOrder = order || null;
    // Si no hay orden, no hacemos nada
    if (!order) return;
    this.toggleDropdown(order._id);
    // Validar que la orden esté completada antes de continuar
    if (this.getLastStatus(order) !== 'Completada') {
      Swal.fire({
        icon: 'info',
        title: 'Debe completar la orden',
        text: 'La orden no está completada',
        confirmButtonText: 'Aceptar',
        timer: 2500,
      });
      return;
    }
    // Procede con las acciones si la orden está completada
    this.changeStatusRetiro(order);
  }

  /**
   * Abre el modal de retiro de vehículo asociado a una orden, con múltiples validaciones previas.
   *
   * - Asigna la orden seleccionada (`selectedOrder`) si se pasa una orden.
   * - Cierra el dropdown contextual con `toggleDropdown(...)`.
   * - Si la orden ya tiene marcado `retiro`, muestra alerta informativa y **evita continuar**.
   * - Si la orden **no** está completada (`status.includes('Completada')`), bloquea el flujo con mensaje claro.
   * - Si pasa las validaciones, habilita el modal de retiro (`openRetiro = true`).
   *
   * @param order - Orden a validar y, si aplica, usar para retirar el vehículo.
   */
  openModalRetiro(order?: Order) {
    this.selectedOrder = order || null;
    if (order) {
      // Verificamos si el vehículo ya fue retirado
      this.toggleDropdown(order._id);
      if (order.retiro) {
        Swal.fire({
          icon: 'info',
          title: 'Vehículo ya retirado',
          text: 'Este vehículo ya fue retirado anteriormente.',
          confirmButtonText: 'Aceptar',
          timer: 2300,
        });
        return; // Evita que continúe abriendo el modal
      }
      if (!order.status.includes('Completada')) {
        Swal.fire({
          icon: 'info',
          title: 'No se puede retirar el vehiculo',
          text: 'El estado del vehiculo debe ser completado.',
          confirmButtonText: 'Aceptar',
          timer: 2000,
        });
        return; // Evita que continúe abriendo el modal
      }
    }

    this.openRetiro = true;
  }

  /**
   * Cierra el modal principal de órdenes (`open = false`).
   */
  closeModal() {
    this.open = false;
  }

  /**
   * Cierra el modal de retiro de vehículos (`openRetiro = false`).
   */
  closeModalRetiro() {
    this.openRetiro = false;
  }

  /**
   * Ejecuta la lógica de filtrado textual para órdenes.
   *
   * - Reinicia `pageIndex`, `selectedDate` y `selectedStatusFilter`.
   * - Si hay un valor de filtro (`valueFilter`), lo limpia y llama a `getOrders(...)` con ese valor.
   */
  filter() {
    this.pageEvent.pageIndex = 0;
    this.selectedDate = '';
    this.selectedStatusFilter = 'Todos';
    // Guarda los filtros antes de aplicar
    this.saveFilters();
    if (this.valueFilter) {
      this.getOrders(1, this.pageEvent.pageSize, this.valueFilter.trim());
    }
  }

  /**
   * Restaura el estado por defecto del filtro textual si no hay entrada activa.
   *
   * - Si `valueFilter` está vacío, recarga la página actual.
   * - Restablece el estado a `'Todos'`.
   */
  cleanFilter() {
    if (!this.valueFilter) {
      this.pageEvent.pageIndex = 0;
      this.getOrders(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
      this.selectedStatusFilter = 'Todos';
      this.orderService.clearFilters();
    }
  }

  /**
   * Crea una notificación basada en la cantidad de labores asociadas a una orden.
   *
   * - Construye un mensaje dinámico en función de si hay una o múltiples actividades.
   * - Llama al servicio `notification.create(...)` para registrar o mostrar la notificación.
   * - No maneja la respuesta explícitamente, dejando libertad al servicio para gestionarla.
   *
   * @param numberOfLabours - Cantidad de labores creadas en la orden.
   * @param order - Código de la orden asociada.
   */
  createNotification(numberOfLabours: number, order: string) {
    this.notification
      .create(
        `Se ha creado ${numberOfLabours} actividad${
          numberOfLabours > 1 ? 'es' : ''
        } pendiente${numberOfLabours > 1 ? 's' : ''} para la orden ${order}`,
      )
      .subscribe((res) => {});
  }

  /**
   * Procesa la creación de una nueva orden, transformando los datos y actualizando la interfaz.
   *
   * - Transforma el modelo `Order` mediante `transformationData(order)` para adaptarlo al backend.
   * - Verifica si hay labores (`labour.length > 0`) para notificaciones posteriores.
   * - Activa el `spinner` mediante `load = true`.
   * - Llama a `service.create(data)` para enviar la orden al backend.
   *
   *   - En caso de éxito:
   *     - Muestra alerta de éxito con SweetAlert.
   *     - Si hay labores, llama a `createNotification(...)`.
   *     - Recarga la lista de órdenes actuales (`getOrders(...)`).
   *
   *   - En caso de error:
   *     - Muestra alerta de error con el mensaje del backend.
   *     - Desactiva el estado de carga (`load = false`).
   *
   * @param order - Orden a ser procesada y enviada.
   */
  create(order: Order) {
    const data = transformationData(order);
    const hasLabours = data.labour && data.labour.length > 0;
    this.load = true;
    this.service.create(data).subscribe(
      (res) => {
        this.load = false;
        Swal.fire({
          title: 'Orden Creada',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          if (hasLabours) {
            this.createNotification(data.labour.length, res.codigo);
          }
          this.getOrders(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
        });
      },
      (error) => {
        this.load = false;
        Swal.fire({
          title: 'Error',
          text: error.error.message,
          icon: 'error',
          timer: 1790,
        });
      },
    );
  }

  /**
   * Registra el retiro de un vehículo en una orden existente.
   *
   * - Activa `load` para mostrar el estado de carga.
   * - Llama al servicio `retiro(...)` con los datos proporcionados.
   * - Al completarse:
   *   - Muestra alerta de éxito con SweetAlert.
   *   - Recarga la página actual de órdenes.
   * - En error:
   *   - Muestra alerta con el mensaje específico del backend.
   *
   * @param data - Datos requeridos para registrar el retiro del vehículo.
   */
  retiro(data: any) {
    this.load = true;
    this.service.retiro(data).subscribe(
      (res) => {
        this.load = false;
        Swal.fire({
          title: 'Retiro de Vehiculo',
          text: 'Anexado correctamente a la orden.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getOrders(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
        });
      },
      (error) => {
        this.load = false;
        Swal.fire({
          title: 'Error',
          text: error.error.message,
          icon: 'error',
          timer: 1790,
        });
      },
    );
  }

  /**
   * Envía la orden editada al backend y actualiza la lista tras confirmación.
   *
   * - Transforma la orden con `transformationData(order)` para ajustar el payload.
   * - Muestra estado de carga mientras se realiza la solicitud.
   * - En éxito:
   *   - Muestra confirmación con SweetAlert.
   *   - Recarga la lista de órdenes actual.
   * - En error:
   *   - Muestra notificación con el mensaje de error del backend.
   *
   * @param order - Objeto de orden editado que se actualizará.
   */
  edit(order: Order) {
    const data = transformationData(order);
    this.load = true;
    this.service.update(data).subscribe(
      (res) => {
        this.load = false;
        Swal.fire({
          title: 'Actualización',
          text: 'Los cambios han sido guardados.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getOrders(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
        });
      },
      (error) => {
        this.load = false;
        Swal.fire({
          title: 'Error',
          text: error.error.message,
          icon: 'error',
          timer: 1790,
        });
      },
    );
  }

  /**
   * Inicia la eliminación de una orden seleccionada, solicitando confirmación previa.
   *
   * - Cierra su dropdown contextual si la orden está presente.
   * - Muestra un diálogo de confirmación con SweetAlert.
   * - Si el usuario confirma:
   *   - Llama a `delete(order._id)` y muestra alerta de éxito.
   *   - Recarga la lista de órdenes activas.
   * - En caso de error:
   *   - Muestra notificación visual con el detalle del fallo.
   *
   * @param order - Orden a eliminar del sistema.
   */
  delete(order: Order) {
    if (order) {
      this.toggleDropdown(order._id);
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar la orden ${order.codigo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.load = true;
        this.service.delete(order._id).subscribe(
          (response) => {
            this.load = false;
            Swal.fire({
              title: 'Orden eliminada',
              icon: 'success',
              timer: 1600,
            }).then(() => {
              this.getOrders(
                this.pageEvent.pageIndex + 1,
                this.pageEvent.pageSize,
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
          },
        );
      }
    });
  }

  /**
   * Cancela una orden específica tras confirmación del usuario.
   *
   * - Si hay orden, cierra su dropdown contextual (`toggleDropdown`).
   * - Muestra diálogo de confirmación con SweetAlert.
   * - Si el usuario confirma:
   *   - Llama al servicio `cancelar(...)` con el ID de la orden.
   *   - Muestra notificación de éxito.
   *   - Refresca la página de órdenes.
   * - En caso de error, muestra alerta con el mensaje proporcionado.
   *
   * @param order - Orden que se desea cancelar.
   */
  cancelar(order: Order) {
    if (order) {
      this.toggleDropdown(order._id);
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres cancelar la orden ${order.codigo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.cancelar(order._id).subscribe(
          (response) => {
            Swal.fire({
              title: 'Orden Cancelada',
              icon: 'success',
              timer: 1600,
            }).then(() => {
              this.getOrders(
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
   * Genera uno o más PDFs para una orden, según la cantidad de labores y repuestos.
   *
   * - Si hay más de 12 labores o repuestos combinados:
   *   - Genera PDF separado para actividades y repuestos.
   * - Si hay 12 o menos ítems, genera un solo PDF compacto.
   *
   * @param order - Orden para la cual se generará el/los PDF.
   */
  async exportPdf(order: Order) {
    if (order) {
      this.toggleDropdown(order._id);
    }
    const labourLength = order.labour?.length || 0;
    const totalRepuestos =
      (order.spare_parts?.length || 0) + (order.spare_parts_extra?.length || 0);

    if (labourLength > 12 || totalRepuestos > 12) {
      this.pdf.generatePdfActividades(order);
      this.pdf.generatePdfRepuestos(order);
    } else {
      await this.pdf.generatePdf(order);
    }
  }

  /**
   * Genera y abre una vista previa en PDF para la orden, según su complejidad.
   *
   * - Cierra dropdown visual si aplica.
   * - Si hay más de 12 ítems (labores + repuestos):
   *   - Genera vista previa con múltiples páginas (`generatePdfPreviewAPages`).
   * - Si hay 12 o menos:
   *   - Genera vista previa simple (`generatePdfPreview`) y abre en nueva ventana.
   *
   * @param order - Orden a previsualizar en PDF.
   */
  async previewPdf(order: Order) {
    if (order) {
      this.toggleDropdown(order._id);
    }
    const labourLength = order.labour?.length || 0;
    const totalRepuestos =
      (order.spare_parts?.length || 0) + (order.spare_parts_extra?.length || 0);

    let pdfUrl: string;

    if (labourLength > 12 || totalRepuestos > 12) {
      const pdf = await this.pdf.generatePdfPreviewAPages(order);
      window.open(pdf, '_blank');
    } else {
      pdfUrl = await this.pdf.generatePdfPreview(order);
      window.open(pdfUrl, '_blank');
    }
  }

  /**
   * Cierra la vista previa de PDF estableciendo la URL como `null`.
   * Utilizado generalmente tras cerrar un modal o sección de previsualización.
   */
  closePreview(): void {
    this.pdfUrl = null;
  }

  /**
   * Retorna el último estado registrado de una orden.
   *
   * - Si `order.status` es un arreglo, devuelve el último valor.
   * - Si no existe o está vacío, devuelve `"Pendiente"` como valor por defecto.
   *
   * @param order - Orden desde la que se extraerá el estado.
   * @returns Último estado conocido o `"Pendiente"`.
   */
  getLastStatus(order: any): string {
    return order.status?.[order.status.length - 1] || 'Pendiente';
  }

  /**
   * Asocia un estado textual de la orden con una clase de estilos visuales.
   *
   * - `"Pendiente"` → Amarillo claro.
   * - `"En Progreso"` → Azul claro.
   * - `"Completada"` → Verde claro.
   * - `"Cancelada"` → Rojo claro.
   * - `"Por Retirar"` → Púrpura intenso.
   * - `"Retirado"` → Gris neutro.
   *
   * @param status - Estado textual de la orden.
   * @returns Clases CSS correspondientes para aplicar estilo visual.
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-200 text-yellow-800';
      case 'En Progreso':
        return 'bg-blue-200 text-blue-800';
      case 'Completada':
        return 'bg-green-200 text-green-800';
      case 'Cancelada':
        return 'bg-red-200 text-red-800';
      case 'Por Retirar':
        return 'bg-purple-500 text-gray-800';
      case 'Retirado':
        return 'bg-gray-200 text-gray-800';

      default:
        return '';
    }
  }

  /**
   * Calcula dinámicamente la posición absoluta para mostrar el dropdown de acciones
   * asociado a un botón identificado por su ID (`button-${id}`).
   *
   * - Si el dropdown se desbordaría del viewport inferior, lo posiciona hacia arriba.
   *
   * @param id - Identificador único de la orden/botón.
   * @returns Objeto `{ top, left }` con coordenadas CSS para posicionar el dropdown.
   */
  dropdownPosition(id: string) {
    const button = document.getElementById(`button-${id}`);
    if (!button) return {};

    const rect = button.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 235;

    let topPosition = rect.bottom + window.scrollY;

    // Si el dropdown se abriría fuera del viewport, lo ajustamos hacia arriba
    if (rect.bottom + dropdownHeight > viewportHeight) {
      topPosition = rect.top + window.scrollY - dropdownHeight;
    }

    return {
      top: `${topPosition}px`,
      left: `${rect.left - 110}px`,
    };
  }

  //FILTRO

  /**
   * Alterna la visibilidad del dropdown de estados (`isStatusDropdownOpen`) y ajusta
   * dinámicamente su posición con respecto al botón activador (`[data-status-dropdown]`).
   *
   * - Si se activa el dropdown, espera un ciclo para calcular su ubicación:
   *   - Usa `getBoundingClientRect()` para posicionarlo con 4px de separación vertical.
   *   - Ajusta hacia la izquierda considerando un ancho de dropdown (`w-56 = 224px`).
   */
  toggleStatusDropdown() {
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;

    if (this.isStatusDropdownOpen) {
      setTimeout(() => {
        const button = document.querySelector(
          '[data-status-dropdown]',
        ) as HTMLElement;
        if (button) {
          const rect = button.getBoundingClientRect();
          this.statusDropdownPosition = {
            top: rect.bottom + 4 + 'px',
            left: rect.right - 224 + 'px', // 224px = w-56
          };
        }
      }, 0);
    }
  }

  /**
   * Aplica un filtro de estado a la lista de órdenes, reiniciando la página,
   * la fecha seleccionada y cerrando el dropdown visual.
   *
   * - Actualiza `selectedStatusFilter` con el estado recibido.
   * - Si el estado no es `'Todos'`, se pasa como filtro a `getOrders(...)`.
   * - Reinicia el `pageIndex` a 0 para empezar desde la primera página.
   *
   * @param status - Estado seleccionado del filtro global (ej. 'Pendiente', 'Completada').
   */
  selectStatusFilter(status: string) {
    this.selectedDate = '';
    this.selectedStatusFilter = status;
    this.isStatusDropdownOpen = false;
    this.pageEvent.pageIndex = 0;

    this.saveFilters();
    const value = this.valueFilter?.trim() || undefined;
    const filter = status !== 'Todos' ? status.trim() : undefined;
    this.getOrders(1, this.pageEvent.pageSize, value, filter);
  }

  /**
   * Limpia completamente todos los filtros activos:
   * - Borra el texto de búsqueda.
   * - Restaura el estado a `'Todos'`.
   * - Llama al método `filter()` para aplicar los cambios.
   */
  clearAllFilters() {
    this.valueFilter = '';
    this.selectedStatusFilter = 'Todos';
    this.filter();
  }

  /**
   * Aplica un filtro por fecha, ajustando automáticamente el estado a `'Retirado'`
   * y recargando la primera página con la fecha activa como parámetro.
   */
  onDateChange() {
    this.selectedStatusFilter = 'Retirado';
    this.pageEvent.pageIndex = 0;

    this.saveFilters();

    this.getOrders(
      1,
      this.pageEvent.pageSize,
      undefined,
      undefined,
      this.selectedDate,
    );
  }

  /**
   * Limpia el filtro de fecha (`selectedDate`) y luego invoca `cleanFilter()` para
   * restaurar el estado visual si el campo de búsqueda está vacío.
   */
  clearDate() {
    this.selectedDate = '';
    this.cleanFilter();
  }

  /**
   * Genera un PDF con todas las órdenes que coinciden con el filtro activo actual.
   * Si no hay filtro de estado, exporta todas las órdenes.
   */
  exportReport() {
    const value = this.valueFilter?.trim() || undefined;
    const filter = this.selectedStatusFilter !== 'Todos' ? this.selectedStatusFilter : undefined;
    const exitDate = this.selectedDate || undefined;
    const statusLabel = this.selectedStatusFilter === 'Todos' ? 'Todos los Estados' : this.selectedStatusFilter;

    this.load = true;
    this.service.listAll(value, filter, exitDate).subscribe(
      (orders) => {
        this.load = false;
        if (!orders || orders.length === 0) {
          Swal.fire({ icon: 'info', title: 'Sin resultados', text: 'No hay órdenes para exportar con el filtro actual.', timer: 2000 });
          return;
        }
        this.pdf.generateOrderReport(orders, statusLabel);
      },
      () => {
        this.load = false;
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el reporte.', timer: 1800 });
      }
    );
  }

  /**
   * Listener global de clics en el documento para manejar el cierre automático del dropdown de estados.
   *
   * - Escucha cualquier clic (`document:click`) en la aplicación.
   * - Verifica si el clic ocurrió *fuera* de un contenedor `.relative`:
   *   - Si es así, cierra el dropdown de filtros de estado (`isStatusDropdownOpen = false`).
   *
   * Este método asegura que el dropdown se cierre automáticamente cuando el usuario
   * interactúa fuera de su área, mejorando la experiencia visual y previniendo
   * estados visuales colgantes.
   *
   * @param event - Evento de clic capturado globalmente.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.isStatusDropdownOpen = false;
    }
  }
  hasMechanicsAssigned(order: any): boolean {

   return order.mechanics && order.mechanics.length > 0;
  }
}
