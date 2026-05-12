import { Component, OnInit, ViewChild } from '@angular/core';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { PaginationEvent } from '../../../shared/ui/pagination/pagination.model';
import Swal from 'sweetalert2';
import { Product } from './products.model';
import { ProductService } from '../../data-access/product.service';
import { ModalComponent } from '../modal/product/modal.component';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HasRoleDirective } from '../../../core/hasRole.directive';
import { StockComponent } from '../modal/stock/stock.component';

@Component({
  selector: 'app-inventory-list',
  imports: [
    PaginationComponent,
    SpinnerComponent,
    FormsModule,
    ErrorMessageComponent,
    ModalComponent,
    CurrencyPipe,
    HasRoleDirective,
    StockComponent,
    CommonModule,
  ],
  templateUrl: './inventory-list.component.html',
  styles: ``,
})
export class InventoryListComponent implements OnInit {
  products: Product[] = [];
  totalItems: number = 0;
  pageEvent: PaginationEvent = { pageIndex: 0, pageSize: 10 };

  open: boolean = false;
  modalStock: boolean = false;
  selectedProduct: Product | null = null;
  isDropdownOpen: { [key: string]: boolean } = {};
  load: boolean = false;
  valueFilter: string = '';
  errorMessage: string = '';
  @ViewChild(ModalComponent) modal!: ModalComponent;
  constructor(private service: ProductService) {}

  ngOnInit() {
    this.getProducts(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
  }

  /**
   * Obtiene una lista de productos desde el servicio y actualiza el estado local del componente.
   *
   * - Activa la bandera `load` para indicar proceso de carga.
   * - Llama a `service.list` con paginación y filtro opcional por nombre.
   * - Si la respuesta es exitosa, actualiza `products` y `totalItems`.
   * - Si ocurre un error:
   *    - Si es 404, muestra mensaje de “no encontrado” y vacía el arreglo.
   *    - Para otros errores, muestra mensaje genérico de falla.
   * - En todos los casos, desactiva el indicador de carga (`load = false`).
   *
   * @param {number} page - Página actual a consultar.
   * @param {number} size - Cantidad de elementos por página.
   * @param {string} [name] - Filtro opcional por nombre.
   */

  getProducts(page: number, size: number, name?: string) {
    this.load = true;
    this.service.list(page, size, name).subscribe(
      (res) => {
        this.products = res.products;
        this.totalItems = res.totalItems;
        this.load = false;
      },
      (error) => {
        this.load = false;
        if ((error.status = 404)) {
          this.products = [];
          this.totalItems = 1;
          this.errorMessage =
            'No se encuentra al producto con el filtro aplicado';
        } else {
          this.errorMessage =
            'Hubo un error al cargar los productos . Intente Nuevamente';
        }
      }
    );
  }

  /**
   * Alterna la visibilidad del dropdown asociado a un identificador específico.
   *
   * - Invierte el valor booleano de `isDropdownOpen[_id]`, activando o desactivando la sección vinculada.
   *
   * @param {string} _id - Identificador único del elemento de dropdown a alternar.
   */

  toggleDropdown(_id: string) {
    this.isDropdownOpen[_id] = !this.isDropdownOpen[_id];
  }

  /**
   * Abre el modal de producto, configurando el producto seleccionado si se proporciona.
   *
   * - Si se pasa un `product`, lo asigna a `selectedProduct` y alterna el dropdown correspondiente (`toggleDropdown`).
   * - Si no se pasa producto, limpia la selección (`null`).
   * - Establece la bandera `open` en `true` para activar la visibilidad del modal.
   *
   * @param {Product} [product] - Producto opcional a editar; si no se proporciona, se asume creación.
   */

  openModal(product?: Product) {
    this.selectedProduct = product || null;
    if (product) {
      this.toggleDropdown(product._id);
    }
    this.open = true;
  }

  /**
   * Cierra el modal estableciendo el flag `open` en `false`.
   *
   * - Útil para controlar la visibilidad de componentes modales desde la lógica del componente.
   */

  closeModal() {
    this.open = false;
  }

  /**
   * Abre el modal de gestión de stock para un producto específico.
   *
   * - Asigna el producto recibido a `selectedProduct`; si no hay, lo establece como `null`.
   * - Si se proporciona un producto, alterna su dropdown contextual usando `toggleDropdown`.
   * - Activa el modal de stock (`modalStock = true`).
   *
   * @param {Product} product - Producto sobre el cual se gestionará el stock.
   */

  openStock(product: Product) {
    this.selectedProduct = product || null;
    if (product) {
      this.toggleDropdown(product._id);
    }
    this.modalStock = true;
  }

  /**
   * Cierra el modal de gestión de stock de productos.
   *
   * - Establece `modalStock` en `false`, ocultando el modal correspondiente.
   */

  closeModalStock() {
    this.modalStock = false;
  }

  /**
   * Actualiza el stock de un producto mediante el servicio y refleja los cambios visualmente.
   *
   * - Llama a `service.updateStock()` con los datos del producto.
   * - En caso de éxito:
   *    - Muestra un mensaje de confirmación con `Swal.fire`.
   *    - Refresca la lista de productos llamando a `getProducts()` con la paginación actual.
   * - En caso de error, muestra una alerta con el mensaje recibido del backend.
   *
   * @param {any} product - Objeto que contiene los datos del producto con stock actualizado.
   */

  editStock(product: any) {
    this.service.updateStock(product).subscribe(
      (res) => {
        Swal.fire({
          title: 'Actualización',
          text: 'Los cambios han sido guardados.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getProducts(
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
   * Aplica un filtro sobre la lista de productos según el valor ingresado.
   *
   * - Reinicia el índice de paginación a la primera página (`pageIndex = 0`).
   * - Si existe un valor de filtro (`valueFilter`), invoca `getProducts` con:
   *    - Página 1.
   *    - Tamaño de página actual.
   *    - El texto filtrado sin espacios en blanco (`trim()`).
   */

  filter() {
    this.pageEvent.pageIndex = 0;
    if (this.valueFilter) {
      this.getProducts(1, this.pageEvent.pageSize, this.valueFilter.trim());
    }
  }

  /**
   * Restablece los filtros si el valor del filtro actual está vacío.
   *
   * - Si `valueFilter` no tiene contenido, vuelve a cargar los productos con la página y tamaño actuales.
   * - Ideal para limpiar el estado de filtrado y refrescar la lista completa desde la fuente.
   */

  cleanFilter() {
    if (!this.valueFilter) {
      this.getProducts(this.pageEvent.pageIndex + 1, this.pageEvent.pageSize);
    }
  }

  //CREAR - MODIFICAR Y ELIMINAR VEHICULO

  /**
   * Crea un nuevo producto utilizando el servicio y gestiona la respuesta visual al usuario.
   *
   * - Envía el producto al backend mediante `service.create()`.
   * - En caso de éxito:
   *    - Cierra el modal mediante `modal.onClose()`.
   *    - Muestra una notificación de éxito con `Swal.fire`.
   *    - Luego, refresca la lista de productos llamando a `getProducts` con el estado de paginación actual.
   * - En caso de error, muestra una alerta con el mensaje de error proporcionado.
   *
   * @param {Product} product - Objeto con los datos del producto a registrar.
   */

  create(product: Product) {
    this.service.create(product).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Producto Registrado',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getProducts(
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
   * Edita un producto existente y actualiza la vista si la operación es exitosa.
   *
   * - Llama al servicio `update(product)` para enviar los cambios al backend.
   * - Si la respuesta es exitosa (`res`):
   *   - Cierra el modal (`this.modal.onClose()`).
   *   - Muestra una notificación de éxito mediante `Swal.fire`.
   *   - Vuelve a cargar los productos actuales para reflejar los cambios.
   * - En caso de error (`error`):
   *   - Muestra un mensaje de error utilizando `Swal.fire` con el mensaje recibido del backend.
   *
   * @param {Product} product - Producto con los datos modificados que se desea actualizar.
   */

  edit(product: Product) {
    this.service.update(product).subscribe(
      (res) => {
        this.modal.onClose();
        Swal.fire({
          title: 'Actualización',
          text: 'Los cambios han sido guardados.',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.getProducts(
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
   * Elimina un producto tras confirmar la acción con el usuario mediante un modal.
   *
   * - Si se proporciona el producto, se alterna su dropdown con `toggleDropdown`.
   * - Muestra un `Swal.fire` para confirmar la eliminación con el usuario.
   * - Si el usuario confirma:
   *    - Llama a `service.delete()` con el ID del producto.
   *    - Si es exitoso:
   *      - Muestra mensaje de éxito.
   *      - Recarga la lista de productos para reflejar los cambios.
   *    - Si ocurre un error:
   *      - Muestra mensaje de error detallado desde el backend.
   *
   * @param {Product} product - Producto a eliminar.
   */

  delete(product: Product) {
    if (product) {
      this.toggleDropdown(product._id);
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar al Producto ${product.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(product._id).subscribe(
          (response) => {
            Swal.fire({
              title: 'Producto eliminado',
              icon: 'success',
              timer: 1600,
            }).then(() => {
              this.getProducts(
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
   * Calcula la posición absoluta (top y left) de un dropdown asociado a un botón específico.
   *
   * - Busca un botón en el DOM con `id` en formato `button-{id}`.
   * - Si el botón existe, obtiene su posición mediante `getBoundingClientRect()`.
   * - Retorna las coordenadas:
   *   - `top`: base inferior del botón ajustada al scroll vertical (`scrollY`).
   *   - `left`: alineada 150px antes del borde derecho del botón.
   * - Si no se encuentra el botón, retorna un objeto vacío.
   *
   * @param {string} id - Identificador único del botón asociado al dropdown.
   * @returns {{ top?: string; left?: string }} Coordenadas CSS del dropdown o `{}` si no se puede calcular.
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
   * Manejador del evento de paginación que actualiza el estado de la página actual
   * y solicita la nueva lista de productos desde el servicio.
   *
   * - Guarda el evento de paginación (`pageIndex`, `pageSize`) en `pageEvent`.
   * - Llama a `getProducts` usando el índice de página incrementado en 1 (paginación 1-based).
   *
   * @param {PaginationEvent} event - Evento emitido al cambiar la página o el tamaño.
   */

  onPageChange(event: PaginationEvent) {
    this.pageEvent = event;
    this.getProducts(event.pageIndex + 1, event.pageSize);
  }

  /**
   * Manejador que se activa al cambiar el tamaño de página en la paginación.
   *
   * - Actualiza `pageEvent.pageSize` con el nuevo valor recibido.
   * - Llama a `getProducts` con el índice de página actual (ajustado a base 1) y el nuevo tamaño.
   *
   * @param {number} newPageSize - Nuevo tamaño de página seleccionado por el usuario.
   */

  onPageSizeChange(newPageSize: number) {
    this.pageEvent.pageSize = newPageSize;
    this.getProducts(this.pageEvent.pageIndex + 1, newPageSize);
  }
}
