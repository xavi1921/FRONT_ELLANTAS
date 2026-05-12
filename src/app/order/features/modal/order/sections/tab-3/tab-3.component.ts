import {
  Component,
  ElementRef,
  HostListener,
  input,
  OnDestroy,
  OnInit,
  output,
  Renderer2,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ProductService } from '../../../../../../inventory/data-access/product.service';
import { CommonModule } from '@angular/common';
import { ToolTipComponent } from '../../../../../../shared/ui/tool-tip/tool-tip.component';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  of,
  switchMap,
} from 'rxjs';
import { ScrollPositionManager } from '../../../../order-list/ordern.model';

type totals = {
  total_mo: number;
  total_r: number;
  subTotal: number;
  total: number;
};

@Component({
  selector: 'app-tab-3',
  imports: [ReactiveFormsModule, FormsModule, CommonModule, ToolTipComponent],
  templateUrl: './tab-3.component.html',
  styles: `
    .dropdown-portal {
      position: fixed;
      z-index: 9999;
      background: white;
      border-radius: 0.375rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      max-height: 15rem;
      overflow-y: auto;
      width: auto;
      min-width: 10rem;
    }
    
    .dropdown-portal.dark {
      background: #374151;
    }
  `,
})

/**
 * Componente encargado de gestionar productos seleccionables con soporte para búsqueda individual,
 * paginación, control visual de dropdowns y sincronización con un formulario reactivo (`partsArray`).
 *
 * Inputs:
 * - `form`: Formulario principal que contiene los datos de la vista general.
 * - `partsArray`: FormArray reactivo con las filas de productos.
 * - `totals`: Objeto que representa totales globales (repuestos, MO, subtotal, total).
 *
 * Outputs:
 * - `newArray`: Señal para agregar una nueva entrada.
 * - `deleteArray`: Índice del repuesto a eliminar.
 * - `incr` / `decr`: Señales para aumentar o disminuir cantidades, respectivamente.
 * - `price`: Emisión de datos de precio de producto.
 *
 * Lógica visual:
 * - Dropdowns por fila gestionados vía `openDropdownIndex`, `filteredProducts`, y `searchTexts`.
 * - `productCache` para evitar peticiones duplicadas y optimizar experiencia UX.
 * - Manejador de paginado `pageNumbers`, banderas de `isLoading` y `hasMorePages` por fila.
 * - `ScrollPositionManager` para mantener el scroll de sugerencias al buscar más páginas.
 *
 * Integración visual:
 * - Gestión explícita del portal HTML vía `elementRef`, `Renderer2` y referencias internas
 *   (`dropdownPortal`, `activeDropdownIndex`).
 */
export class Tab3Component implements OnInit, OnDestroy {
  form = input<FormGroup | null>(null);
  partsArray = input<FormArray | null>(null);
  totals = input<totals>();
  readonly=input<boolean>(false)
  
  newArray = output<any>();
  deleteArray = output<number>();
  incr = output<number>();
  decr = output<number>();
  price = output<object>({});

  products: any[] = [];

  // Propiedades para el combobox filtrable
  openDropdownIndex = signal<number | null>(null);
  searchTexts: { [key: number]: string } = {};
  filteredProducts: { [key: number]: any[] } = {};
  pageNumbers: { [key: number]: number } = {};
  isLoading: { [key: number]: boolean } = {};
  hasMorePages: { [key: number]: boolean } = {};
  private productCache = new Map<string, any>();
  private searchSubjects: { [key: number]: BehaviorSubject<string> } = {};
  private scrollThrottleTimeout: any = null;
  scrollPositionManager = new ScrollPositionManager();
  // Propiedades para el portal del dropdown
  private dropdownPortal: HTMLElement | null = null;
  private activeDropdownIndex: number | null = null;
  constructor(
    private service: ProductService,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  /**
   * Método del ciclo de vida `OnDestroy` que se ejecuta al destruir el componente.
   *
   * - Llama a `removeDropdownPortal()` para limpiar referencias visuales asociadas al portal del dropdown.
   * - Completa todos los `BehaviorSubject` utilizados para búsquedas individuales por fila (`searchSubjects`)
   *   evitando fugas de memoria o emisiones posteriores.
   * - Limpia el `timeout` asociado a la aceleración de scroll (`scrollThrottleTimeout`) si existe,
   *   previniendo efectos pendientes al desmontar el componente.
   *
   * Esta limpieza garantiza que no queden referencias activas, listeners o timers cuando el componente se destruye.
   */

  ngOnDestroy() {
    this.removeDropdownPortal();
    Object.values(this.searchSubjects).forEach((subject) => subject.complete());
    if (this.scrollThrottleTimeout) {
      clearTimeout(this.scrollThrottleTimeout);
    }
  }

  /**
   * Captura clics en todo el documento (`document:click`) para gestionar acciones contextuales
   * dentro del componente (por ejemplo, cerrar dropdowns abiertos o manejar clicks fuera de un panel).
   *
   * Este `HostListener` es útil para detectar clicks fuera de elementos específicos,
   * permitiendo cerrar menús flotantes, tooltips, o dropdowns de autocompletado.
   *
   * @param {MouseEvent} event - Evento de clic global en el documento.
   */

  @HostListener('document:click', ['$event'])

  /**
   * Maneja clics fuera del portal del dropdown para cerrarlo si el usuario hace clic fuera del área visible.
   *
   * - Verifica si el clic no ocurrió dentro del `dropdownPortal`.
   * - Si tampoco fue dentro del `input` asociado al `activeDropdownIndex`, ejecuta `removeDropdownPortal()` para cerrarlo.
   *
   * Esta función es llamada desde el `@HostListener('document:click')` para manejar eventos globales.
   *
   * @param {Event} event - Evento global de clic del documento.
   */
  clickOutside(event: Event) {
    // Si el clic no fue dentro del dropdown o del input, cerrar el dropdown
    if (
      this.dropdownPortal &&
      !this.dropdownPortal.contains(event.target as Node)
    ) {
      const inputElement = this.elementRef.nativeElement.querySelector(
        `#combobox-input-${this.activeDropdownIndex}`
      );
      if (!inputElement || !inputElement.contains(event.target as Node)) {
        this.removeDropdownPortal();
      }
    }
  }

  /**
   * Método del ciclo de vida `OnInit` que se ejecuta al inicializar el componente.
   *
   * - Llama al método `getItemsCombo()` para cargar el catálogo de productos u opciones iniciales necesarias
   *   para el funcionamiento del componente (por ejemplo: repuestos disponibles).
   */

  ngOnInit() {
    this.getItemsCombo();
  }

  /**
   * Carga el catálogo inicial de productos según si ya hay productos seleccionados.
   *
   * - Obtiene los `selectedIds` desde `getSelectedProductIds()`.
   * - Si existen identificadores seleccionados, invoca `loadInitialDataWithSelected()` para cargarlos en lote.
   * - Si no hay selecciones previas, llama a `loadInitialData()` para obtener los primeros productos paginados.
   *
   * Este método permite optimizar la experiencia inicial cargando solo lo necesario,
   * ya sea productos seleccionados explícitamente o un set inicial para autocompletado.
   */

  getItemsCombo() {
    const selectedIds = this.getSelectedProductIds();

    // Si hay productos seleccionados, cargar todos de una vez
    if (selectedIds.length > 0) {
      this.loadInitialDataWithSelected(selectedIds);
    } else {
      this.loadInitialData();
    }
  }

  /**
   * Emite un evento `newArray` al componente padre con el valor `'add'` como señal para crear una nueva entrada.
   *
   * - La lógica de creación (estructura del nuevo elemento, validaciones, etc.) se delega completamente al componente contenedor.
   * - Este patrón favorece un diseño desacoplado y reutilizable.
   */

  add() {
    this.newArray.emit('add');
  }

  /**
   * Elimina un repuesto del `FormArray` (`partsArray`) si se encuentra presente.
   *
   * - Verifica si `partsArray` está definido.
   * - Obtiene el índice del control especificado dentro de `partsArray.controls`.
   * - Si el índice es válido, emite el evento `deleteArray` con ese índice.
   *
   * @param {AbstractControl} item - Control que representa la entrada a eliminar.
   */

  delete(item: AbstractControl) {
    const parts = this.partsArray();
    if (!parts) return;

    const index = parts.controls.indexOf(item);
    if (index !== -1) {
      this.deleteArray.emit(index);
    }
  }

  /**
   * Emite un evento `incr` con el índice de una entrada en el `FormArray` que debe incrementarse.
   *
   * - Permite que el componente padre maneje la lógica asociada al aumento de cantidad o unidades.
   *
   * @param {number} index - Índice del repuesto cuya cantidad debe incrementarse.
   */

  increment(index: number) {
    this.incr.emit(index);
  }

  /**
   * Emite un evento `decr` con el índice de una entrada del `FormArray` cuya cantidad debe disminuirse.
   *
   * - Permite que el componente padre administre la lógica del decremento (por ejemplo, restar unidades, validar mínimo).
   *
   * @param {number} index - Índice del repuesto cuya cantidad debe disminuirse.
   */

  decrement(index: number) {
    this.decr.emit(index);
  }

  /**
   * Emite un evento `price` con el índice y el nuevo precio asignado a un producto.
   *
   * - Permite que el componente padre actualice el precio en el `FormArray` o recalcule totales reactivos.
   *
   * @param {number} index - Índice del producto dentro del arreglo reactivo.
   * @param {number} price - Nuevo precio que se desea establecer.
   */

  priceProduct(index: number, price: number) {
    this.price.emit({ index, price });
  }

  /**
   * Cambia el precio de un producto seleccionado en una fila del `FormArray`.
   *
   * - Obtiene el `_id` del producto desde el evento del `<select>` asociado.
   * - Busca en el array `products` el objeto que coincida con ese `_id`.
   * - Si encuentra el producto, emite su `sale_price` a través de `priceProduct()`.
   *
   * Este método mantiene la sincronización visual entre el `select` de productos y el precio correspondiente.
   *
   * @param {number} index - Índice de la fila activa dentro del formulario.
   * @param {Event} event - Evento de cambio disparado por el `<select>` de producto.
   */

  changePrice(index: number, event: Event) {
    const target = event.target as HTMLSelectElement;
    const _id = target.value;
    const selectedProduct = this.products.find((p) => p._id === _id);
    if (selectedProduct) {
      this.priceProduct(index, selectedProduct.sale_price);
    }
  }

  /**
   * Verifica si la cantidad seleccionada para un producto ha alcanzado su stock máximo disponible.
   *
   * - Obtiene la entrada (`item`) desde el `FormArray` según el índice.
   * - Busca en el array `products` el producto con `_id` coincidente.
   * - Compara la cantidad actual (`item.amount`) con el stock (`product.stock`).
   *
   * Devuelve `true` si se alcanzó o superó el stock permitido; `false` en caso contrario.
   *
   * @param {number} index - Índice de la fila dentro del `FormArray` `partsArray`.
   * @returns {boolean} `true` si la cantidad ya no puede incrementarse, `false` si aún hay stock disponible.
   */

  isMaxStockReached(index: number): boolean {
    const item = this.partsArray()?.at(index).value;

    const product = this.products.find((p) => p._id === item._id);
    return product ? item.amount >= product.stock : false;
  }

  /**
   * Verifica si un producto (por su `id`) ya ha sido seleccionado en otro control distinto al actual.
   *
   * - Itera sobre los controles de `partsArray`.
   * - Compara el valor de `_id` de cada control con el `id` recibido.
   * - Omite el control del `currentIndex` actual para permitir su propia selección.
   *
   * Retorna `true` si el `id` ya está asignado en otra entrada; `false` si aún está disponible.
   *
   * @param {string} id - Identificador único del producto que se desea evaluar.
   * @param {number} currentIndex - Índice del control actual que solicita validación.
   * @returns {boolean} `true` si el producto ya ha sido seleccionado en otra fila, `false` si está disponible.
   */

  isOptionSelected(id: string, currentIndex: number): boolean {
    return (
      this.partsArray()?.controls.some((control, index) => {
        const selectedId = control.get('_id')?.value;
        return index !== currentIndex && selectedId === id;
      }) ?? false
    );
  }

  /**
   * Retorna una lista de IDs de productos que ya han sido seleccionados,
   * excluyendo el índice actual, para deshabilitar dichas opciones en el dropdown.
   *
   * - Itera sobre los controles de `partsArray`.
   * - Agrega a `disabledOptions` los `_id` que estén definidos y no correspondan al `currentIndex`.
   *
   * Este método permite condicionar visualmente cada `<option>` del combobox
   * para evitar seleccionar el mismo producto más de una vez.
   *
   * @param {number} currentIndex - Índice de la fila activa en el `FormArray`.
   * @returns {string[]} Array con los IDs de productos que deben estar deshabilitados.
   */

  getDisabledOptions(currentIndex: number): string[] {
    const disabledOptions: string[] = [];

    // Obtén todos los IDs seleccionados excepto el del índice actual
    const formArray = this.partsArray();
    if (formArray) {
      formArray.controls.forEach((control, index) => {
        if (index !== currentIndex) {
          const selectedId = control.get('_id')?.value;
          if (selectedId) {
            disabledOptions.push(selectedId);
          }
        }
      });
    }

    return disabledOptions;
  }

  /**
   * Alterna la visibilidad del dropdown para una fila específica del `FormArray`.
   *
   * - Usa `event.stopPropagation()` para evitar que el clic se propague al documento y cierre el dropdown inmediatamente.
   * - Si el dropdown ya está activo para este índice (`activeDropdownIndex`), lo cierra llamando a `removeDropdownPortal()`.
   * - Si no está activo:
   *    - Actualiza `activeDropdownIndex` y `openDropdownIndex` con el nuevo índice.
   *    - Llama a `filterOptions(index)` para preparar las opciones visibles.
   *    - Crea visualmente el portal de dropdown posicionándolo con `event.target` como referencia.
   *
   * Este método mantiene un control explícito sobre el estado visual y lógico del dropdown dinámico.
   *
   * @param {number} index - Índice de la fila cuya lista desplegable debe abrirse o cerrarse.
   * @param {any} event - Evento de clic del input o botón que activa el dropdown.
   */

  toggleDropdown(index: number, event: any) {
    event.stopPropagation();

    if (this.activeDropdownIndex === index) {
      this.removeDropdownPortal();
    } else {
      this.activeDropdownIndex = index;
      this.openDropdownIndex.set(index);
      this.filterOptions(index);
      this.createDropdownPortal(index, event.target);
    }
  }

  /**
   * Cierra todos los dropdowns activos estableciendo el índice abierto a `null`.
   *
   * - Se utiliza comúnmente cuando el usuario hace clic fuera de un combo o cambia de contexto.
   * - Resetea `openDropdownIndex`, lo que desactiva visualmente cualquier lista desplegable activa.
   *
   * Este método es ideal para ser llamado desde eventos globales (`document:click`) o flujos UX que requieran limpieza de UI.
   */

  closeAllDropdowns() {
    this.openDropdownIndex.set(null);
  }

  /**
   * Obtiene el texto a mostrar en el campo de búsqueda (combobox) para una fila específica.
   *
   * - Recupera el `_id` seleccionado desde el `FormArray` en la posición indicada.
   * - Busca el producto correspondiente en el array local `products`.
   * - Si lo encuentra, retorna una cadena con su `series` y `name` concatenados.
   * - Si no hay selección o el producto no está disponible, retorna una cadena vacía.
   *
   * Este texto suele usarse como representación visual en el input del combobox.
   *
   * @param {number} index - Índice del control dentro del `FormArray`.
   * @returns {string} Texto formateado con la descripción del producto seleccionado o vacío si no hay selección.
   */

  getSearchText(index: number): string {
    const control = this.partsArray()?.at(index);
    const selectedId = control?.get('_id')?.value;

    if (selectedId) {
      const selectedProduct = this.products.find((p) => p._id === selectedId);
      if (selectedProduct) {
        return `${selectedProduct.series} - ${selectedProduct.name}`;
      }
    }

    return ''; // Si no hay selección, retorna vacío
  }

  /**
   * Establece el texto de búsqueda para una fila específica del `FormArray` y
   * actualiza las opciones del combobox dinámico asociado.
   *
   * - Extrae el texto desde el evento (`event` puede ser un string directo o un evento DOM).
   * - Si el texto es vacío:
   *    - Limpia la selección previa del producto (`_id`) y su `sale_price` en el formulario reactivo.
   * - Si el texto no está vacío:
   *    - Activa la bandera `hasMorePages` para permitir scroll infinito.
   *    - Llama al servicio `combo()` para obtener productos que coincidan con el texto buscado.
   *    - Actualiza `filteredProducts` con los resultados.
   *    - Agrega productos nuevos al arreglo principal `products`, evitando duplicados por `_id`.
   *    - Ejecuta `manageDropdown(index)` para actualizar la posición o visibilidad del dropdown.
   *
   * @param {number} index - Índice de la fila activa en el `FormArray`.
   * @param {any} event - Evento de entrada de texto (`string` o `InputEvent`) desde el input del combobox.
   */

  setSearchText(index: number, event: any) {
    const text = typeof event === 'string' ? event : event.target.value;
    this.searchTexts[index] = text;

    if (!text) {
      this.partsArray()?.at(index)?.get('_id')?.setValue('');
      this.partsArray()?.at(index)?.get('sale_price')?.setValue('');
    } else {
      this.hasMorePages[index] = true;
      this.service.combo(1, 50, text).subscribe(
        ({ data: { products } }) => {
          this.filteredProducts[index] = products;

          products.forEach((product: any) => {
            if (!this.products.some((p) => p._id === product._id)) {
              this.products.push(product);
            }
          });

          this.manageDropdown(index);
        },
        (error) => console.log('Error al buscar productos:', error)
      );
    }
  }

  /**
   * Gestiona la apertura o actualización del dropdown visual en una fila específica.
   *
   * - Obtiene el `inputElement` del DOM para posicionar correctamente el portal.
   * - Si el `activeDropdownIndex` es diferente al actual, lo actualiza junto con `openDropdownIndex`.
   * - Si existe un `inputElement` o ya hay un `dropdownPortal`, invoca `createDropdownPortal(...)`
   *   para renderizar o reposicionar el contenedor visual.
   *
   * Esta función permite sincronizar el estado lógico y visual del dropdown,
   * incluso cuando ya está abierto y se requiere solo reposicionamiento.
   *
   * @param {number} index - Índice de la fila activa en el combobox.
   */

  private manageDropdown(index: number) {
    const inputElement = this.elementRef.nativeElement.querySelector(
      `#combobox-input-${index}`
    );

    if (this.activeDropdownIndex !== index) {
      this.activeDropdownIndex = index;
      this.openDropdownIndex.set(index);
    }

    if (inputElement || this.dropdownPortal) {
      this.createDropdownPortal(index, inputElement);
    }
  }

  /**
   * Filtra el arreglo de productos disponibles en el combobox para una fila específica,
   * basado en el texto de búsqueda proporcionado por el usuario.
   *
   * - Normaliza el `searchText` a minúsculas.
   * - Si no hay texto de búsqueda, muestra todos los productos disponibles.
   * - Divide el texto por guiones (`-`) para permitir búsqueda combinada por `series` y `name`.
   * - Actualiza `filteredProducts[index]` con los productos que cumplan con alguna coincidencia parcial.
   *
   * Este método permite búsquedas intuitivas y tolerantes, mejorando la experiencia del usuario en cada fila.
   *
   * @param {number} index - Índice de la fila activa en el combobox.
   */

  filterOptions(index: number) {
    const searchText = this.searchTexts[index]?.toLowerCase() || '';

    // Inicializar el array de productos filtrados si no existe
    if (!this.filteredProducts[index]) {
      this.filteredProducts[index] = [];
    }

    // Si no hay texto de búsqueda, mostrar todos los productos
    if (!searchText) {
      this.filteredProducts[index] = [...this.products];
      return;
    }

    // Dividir el texto de búsqueda en serie y nombre
    const searchParts = searchText.split('-').map((part) => part.trim());

    // Filtrar los productos asegurando que coincidan con nombre o serie
    this.filteredProducts[index] = this.products.filter((product) => {
      return (
        searchParts.some((part) => product.name.toLowerCase().includes(part)) ||
        searchParts.some((part) => product.series.toLowerCase().includes(part))
      );
    });
  }

  /**
   * Maneja la selección de un producto en el dropdown de una fila específica.
   *
   * - Verifica si el producto ya ha sido seleccionado en otra fila usando `isOptionSelected()`.
   * - Si el producto no existe aún en `filteredProducts`, lo agrega para mantener consistencia visual.
   * - Actualiza el control reactivo `_id` de la fila con el `product._id`.
   * - Actualiza visualmente `searchTexts` para reflejar la selección (`serie - nombre`).
   * - Simula un `change` programático creando un `Event` ficticio y lo pasa a `changePrice()` para emitir el nuevo precio.
   * - Cierra el dropdown usando `removeDropdownPortal()`.
   *
   * Este método garantiza consistencia entre visualización, datos reactivos y emisiones al componente padre.
   *
   * @param {number} index - Índice de la fila donde se seleccionó el producto.
   * @param {any} product - Producto seleccionado desde el combobox.
   */

  selectOption(index: number, product: any) {
    if (this.isOptionSelected(product._id, index)) {
      return; // No hacer nada si la opción está deshabilitada
    }
    if (!this.filteredProducts[index].some((p) => p._id === product._id)) {
      this.filteredProducts[index].push(product);
    }
    const control = this.partsArray()?.at(index);
    control?.get('_id')?.setValue(product._id);
    // Asegurar que el input muestre "serie - nombre"
    this.searchTexts[index] = `${product.series} - ${product.name}`;

    // Simular el evento change para actualizar el precio
    const event = { target: { value: product._id } } as unknown as Event;
    this.changePrice(index, event);

    this.removeDropdownPortal();
  }

  /**
   * Verifica si un producto está actualmente seleccionado en una fila específica del `FormArray`.
   *
   * - Recupera el control correspondiente al índice indicado.
   * - Compara el valor de `_id` del control con el `productId` proporcionado.
   *
   * Devuelve `true` si el producto coincide con el seleccionado en esa fila; `false` en caso contrario.
   *
   * @param {number} index - Índice de la fila activa dentro del `FormArray`.
   * @param {string} productId - ID del producto que se desea comparar.
   * @returns {boolean} `true` si es el producto actualmente seleccionado, `false` si no lo es.
   */

  isSelected(index: number, productId: string): boolean {
    const control = this.partsArray()?.at(index);
    return control?.get('_id')?.value === productId;
  }

  /**
   * Crea y posiciona dinámicamente un portal visual (`dropdown-portal`) para mostrar
   * sugerencias de productos filtrados junto al input correspondiente.
   *
   * - Si ya hay un portal abierto, lo elimina limpiamente del `document.body`.
   * - Crea un nuevo `div` con clases de estilo para dropdown, incluyendo soporte para modo oscuro.
   * - Calcula la posición del portal en base a las coordenadas del input (`getBoundingClientRect`)
   *   y ajusta `top`, `left` y `width` usando `Renderer2` para evitar saltos visuales.
   * - Si no existen productos filtrados para el índice actual, llama a `filterOptions()` para inicializar.
   * - Si no hay resultados: muestra un mensaje `"No hay resultados"`.
   * - Si hay productos:
   *    - Crea dinámicamente un `div` por opción, aplicando estilos según:
   *        - Seleccionado (`bg-blue-600`, `text-white`)
   *        - Disponible (`hover`, `cursor-pointer`)
   *        - Ya usado en otra fila (`opacity-50`, `cursor-not-allowed`)
   *    - Inserta un texto visible con `series - name`.
   *    - Añade un `checkmark` SVG si el producto está seleccionado.
   *    - Asocia evento `click` condicional con `selectOption(...)` si está habilitado.
   * - Finalmente, lo monta en el `document.body` y suscribe al evento `scroll`.
   *
   * Este método encapsula el renderizado, posicionamiento y comportamiento del dropdown visual
   * de forma programática, brindando control total para casos complejos.
   *
   * @param {number} index - Índice de la fila activa que invoca el combobox.
   * @param {HTMLElement} inputElement - Referencia al input de activación, para anclar el portal.
   */

  createDropdownPortal(index: number, inputElement: HTMLElement) {
    // Primero eliminar cualquier portal existente
    if (this.dropdownPortal) {
      this.renderer.removeChild(document.body, this.dropdownPortal);
      this.dropdownPortal = null;
    }

    // Crear el elemento del portal
    this.dropdownPortal = this.renderer.createElement('div');
    this.renderer.addClass(this.dropdownPortal, 'dropdown-portal');

    // Añadir clase dark si estamos en modo oscuro
    if (document.documentElement.classList.contains('dark')) {
      this.renderer.addClass(this.dropdownPortal, 'dark');
    }

    // Obtener la posición del input
    const rect = inputElement.getBoundingClientRect();

    // Posicionar el dropdown
    this.renderer.setStyle(
      this.dropdownPortal,
      'top',
      `${rect.bottom + window.scrollY}px`
    );
    this.renderer.setStyle(
      this.dropdownPortal,
      'left',
      `${rect.left + window.scrollX}px`
    );
    this.renderer.setStyle(this.dropdownPortal, 'width', `${rect.width}px`);

    // Asegurarse de que filteredProducts[index] esté inicializado
    if (!this.filteredProducts[index]) {
      this.filterOptions(index);
    }

    // Crear el contenido del dropdown
    const products = this.filteredProducts[index] || [];

    if (products.length === 0) {
      const noResults = this.renderer.createElement('div');
      this.renderer.addClass(noResults, 'px-4');
      this.renderer.addClass(noResults, 'py-2');
      this.renderer.addClass(noResults, 'text-gray-500');
      this.renderer.addClass(noResults, 'dark:text-gray-400');
      this.renderer.setProperty(noResults, 'textContent', 'No hay resultados');
      this.renderer.appendChild(this.dropdownPortal, noResults);
    } else {
      products.forEach((product) => {
        const option = this.renderer.createElement('div');
        this.renderer.addClass(option, 'cursor-pointer');
        this.renderer.addClass(option, 'select-none');
        this.renderer.addClass(option, 'relative');
        this.renderer.addClass(option, 'py-2');
        this.renderer.addClass(option, 'pl-3');
        this.renderer.addClass(option, 'pr-9');

        // Aplicar clases condicionales
        if (this.isSelected(index, product._id)) {
          this.renderer.addClass(option, 'text-white');
          this.renderer.addClass(option, 'bg-blue-600');
        } else {
          this.renderer.addClass(option, 'text-gray-900');
          this.renderer.addClass(option, 'dark:text-white');
          this.renderer.addClass(option, 'hover:bg-gray-100');
          this.renderer.addClass(option, 'dark:hover:bg-gray-600');
        }

        if (this.isOptionSelected(product._id, index)) {
          this.renderer.addClass(option, 'opacity-50');
          this.renderer.addClass(option, 'cursor-not-allowed');
        } else {
          // Añadir evento de clic solo si la opción no está deshabilitada
          this.renderer.listen(option, 'click', () => {
            this.selectOption(index, product);
          });
        }

        // Crear el texto de la opción
        const textSpan = this.renderer.createElement('span');
        this.renderer.addClass(textSpan, 'block');
        this.renderer.addClass(textSpan, 'truncate');
        this.renderer.setProperty(
          textSpan,
          'textContent',
          `${product.series} - ${product.name}`
        );
        this.renderer.appendChild(option, textSpan);

        // Añadir checkmark si está seleccionado
        if (this.isSelected(index, product._id)) {
          const checkSpan = this.renderer.createElement('span');
          this.renderer.addClass(checkSpan, 'absolute');
          this.renderer.addClass(checkSpan, 'inset-y-0');
          this.renderer.addClass(checkSpan, 'right-0');
          this.renderer.addClass(checkSpan, 'flex');
          this.renderer.addClass(checkSpan, 'items-center');
          this.renderer.addClass(checkSpan, 'pr-4');
          this.renderer.addClass(checkSpan, 'text-white');

          checkSpan.innerHTML = `
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        `;

          this.renderer.appendChild(option, checkSpan);
        }

        this.renderer.appendChild(this.dropdownPortal, option);
      });
    }
    this.renderer.listen(this.dropdownPortal, 'scroll', (event) => {
      this.onScroll(event, index);
    });
    // Añadir el portal al body
    this.renderer.appendChild(document.body, this.dropdownPortal);
  }

  /**
   * Elimina el portal visual del dropdown (`dropdownPortal`) si existe actualmente.
   *
   * - Remueve el elemento del DOM (`document.body`) utilizando `Renderer2` para compatibilidad Angular.
   * - Resetea la referencia `dropdownPortal` a `null` para evitar referencias residuales.
   * - Reinicia el índice activo de dropdown (`activeDropdownIndex`) y la señal observable `openDropdownIndex`.
   *
   * Este método garantiza que no quede ningún dropdown visible ni su estado lógico activo,
   * ideal para cierres al hacer clic fuera, cambiar de selección o destruir el componente.
   */

  removeDropdownPortal() {
    if (this.dropdownPortal) {
      this.renderer.removeChild(document.body, this.dropdownPortal);
      this.dropdownPortal = null;
      this.activeDropdownIndex = null;
      this.openDropdownIndex.set(null);
    }
  }

  /**
   * Carga productos adicionales para el combobox de una fila específica, ya sea hacia adelante o atrás.
   *
   * - Determina la nueva página (`pageNumbers[index]`) según la dirección (`next` o `previous`).
   * - Guarda la posición actual de scroll mediante `scrollPositionManager` antes de recargar.
   * - Llama al servicio `combo(...)` con la nueva página y texto de búsqueda.
   * - Si hay menos de 10 productos devueltos, marca `hasMorePages[index] = false`.
   * - Actualiza el caché de productos con `updateProductCache(...)` y evita duplicados.
   * - Inserta los nuevos productos al principio o final de `filteredProducts[index]` según la dirección.
   * - Actualiza la página actual en `pageNumbers[index]`.
   * - Recrea visualmente el dropdown con `createDropdownPortal(...)`.
   * - Restaura la posición de scroll con `restoreScrollPosition(...)` una vez que el dropdown fue reinsertado.
   *
   * Este método permite un scroll visual infinito paginado por fila con una UX suave y controlada.
   *
   * @param {number} index - Índice de la fila activa en el `FormArray`.
   * @param {'next' | 'previous'} direction - Dirección del scroll visual (paginado hacia adelante o atrás).
   */

  loadMoreProducts(index: number, direction: 'next' | 'previous') {
    let currentPage = this.pageNumbers[index] || 1;

    if (direction === 'next') {
      currentPage++;
    } else if (direction === 'previous' && currentPage > 1) {
      currentPage--;
    }
    // Guardar posición del scroll antes de cargar nuevos elementos
    if (this.dropdownPortal) {
      this.scrollPositionManager.saveScrollPosition(index, this.dropdownPortal);
    }

    this.service.combo(currentPage, 10, this.searchTexts[index]).subscribe({
      next: (res) => {
        const newProducts = res.data.products;
        if (newProducts.length < 10) {
          this.hasMorePages[index] = false;
        } else {
          this.hasMorePages[index] = true;
        }
        this.updateProductCache(newProducts);

        newProducts.forEach((product: any) => {
          if (!this.products.some((p) => p._id === product._id)) {
            this.products.push(product);
          }
        });
        if (direction === 'next') {
          this.filteredProducts[index] = [
            ...this.filteredProducts[index],
            ...newProducts,
          ];
        } else {
          this.filteredProducts[index] = [
            ...newProducts,
            ...this.filteredProducts[index],
          ];
        }

        this.pageNumbers[index] = currentPage;

        this.createDropdownPortal(
          index,
          this.elementRef.nativeElement.querySelector(
            `#combobox-input-${index}`
          )
        );
        // Restaurar posición del scroll después de recrear el dropdown
        setTimeout(() => {
          if (this.dropdownPortal) {
            this.scrollPositionManager.restoreScrollPosition(
              index,
              this.dropdownPortal,
              direction
            );
          }
        }, 0);
      },
      error: (error) => {
        console.error('Error loading more products:', error);
      },
    });
  }

  /**
   * Maneja eventos de scroll dentro del dropdown para cargar más productos
   * cuando el usuario se aproxima al inicio o final del contenedor.
   *
   * - Usa `setTimeout` con 200ms como estrategia de `throttling` manual para evitar múltiples disparos en scroll rápido.
   * - Si el scroll está cerca del final (`bottom - 50px`) y aún hay más páginas, llama a `loadMoreProducts(..., 'next')`.
   * - Si el scroll está cerca del inicio (`top <= 50px`), intenta precargar la página anterior con `loadMoreProducts(..., 'previous')`.
   * - Almacena y cancela el `timeout` en `scrollThrottleTimeout` para evitar llamadas en paralelo.
   *
   * @param {any} event - Evento de scroll disparado desde el contenedor visual del dropdown.
   * @param {number} index - Índice del combobox activo asociado al scroll.
   */

  onScroll(event: any, index: number) {
    // Cancelar cualquier timeout pendiente
    if (this.scrollThrottleTimeout) {
      clearTimeout(this.scrollThrottleTimeout);
    }

    // Esperar 200ms antes de procesar el evento de scroll
    this.scrollThrottleTimeout = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = event.target;

      // Cargar más productos solo si estamos cerca del final (dentro de 50px)
      if (
        scrollTop + clientHeight >= scrollHeight - 50 &&
        this.hasMorePages[index] !== false
      ) {
        this.loadMoreProducts(index, 'next');
      }
      // Cargar productos anteriores solo si estamos cerca del inicio
      if (scrollTop <= 50) {
        this.loadMoreProducts(index, 'previous');
      }

      this.scrollThrottleTimeout = null;
    }, 200);
  }

  //OPTIMIZACION

  /**
   * Carga datos iniciales para el combobox incluyendo:
   * - Productos de la primera página (`page 1, size 10`) para visualización inicial.
   * - Productos previamente seleccionados por el usuario (`selectedIds`) para garantizar su disponibilidad.
   *
   * - Usa `forkJoin` para combinar ambas fuentes en paralelo.
   * - Une los productos sin duplicados (verifica por `_id`).
   * - Actualiza `this.products`, el caché (`updateProductCache`) y
   *   `filteredProducts` (`initializeFilteredProducts`) tras la carga.
   * - En caso de error, utiliza `loadInitialData()` como plan de contingencia.
   *
   * Este método asegura que los productos seleccionados no desaparezcan del combobox,
   * incluso si no están incluidos en la primera página paginada del backend.
   *
   * @param {string[]} selectedIds - Arreglo de identificadores de productos ya seleccionados por el usuario.
   */

  private loadInitialDataWithSelected(selectedIds: string[]) {
    const initialLoad$ = this.service.combo(1, 10);
    const selectedLoad$ = this.service.getProductsByIds(selectedIds);

    forkJoin({
      initial: initialLoad$,
      selected: selectedLoad$,
    }).subscribe({
      next: (results) => {
        // Combinar productos evitando duplicados
        const allProducts = [...results.initial.data.products];

        results.selected.items.forEach((selectedProduct: any) => {
          if (!allProducts.some((p) => p._id === selectedProduct._id)) {
            allProducts.push(selectedProduct);
          }
        });

        this.products = allProducts;
        this.updateProductCache(allProducts);
        this.initializeFilteredProducts();
      },
      error: (error) => {
        console.error('Error loading initial data:', error);
        this.loadInitialData(); // Fallback
      },
    });
  }

  /**
   * Obtiene un arreglo de todos los IDs (`_id`) de productos actualmente seleccionados
   * en el `FormArray` (`partsArray`).
   *
   * - Itera sobre los controles del formulario.
   * - Extrae el valor del campo `_id` si está definido.
   * - Devuelve un array de strings con los `_id` válidos.
   *
   * Esta función es útil para:
   * - Evitar duplicaciones en la selección de productos.
   * - Cargar productos previamente seleccionados.
   * - Mostrar visualmente qué productos están ya en uso.
   *
   * @returns {string[]} Array de identificadores únicos de productos seleccionados.
   */

  private getSelectedProductIds(): string[] {
    const ids: string[] = [];
    if (this.partsArray()) {
      this.partsArray()?.controls.forEach((control) => {
        const selectedId = control.get('_id')?.value;
        if (selectedId) {
          ids.push(selectedId);
        }
      });
    }
    return ids;
  }

  /**
   * Realiza una carga inicial de productos desde el backend para llenar el combobox.
   *
   * - Solicita la primera página de resultados (`page 1, size 10`) desde el servicio `combo(...)`.
   * - Actualiza `this.products` con los resultados devueltos.
   * - Refresca el caché local usando `updateProductCache(...)`.
   * - Inicializa los filtros visuales por fila con `initializeFilteredProducts()`.
   *
   * Este método se emplea cuando no hay productos previamente seleccionados y se requiere
   * una carga básica para comenzar la interacción del usuario.
   */
  private loadInitialData() {
    this.service.combo(1, 10).subscribe({
      next: (res) => {
        this.products = res.data.products;
        this.updateProductCache(res.data.products);
        this.initializeFilteredProducts();
      },
      error: (error) => {
        console.error('Error loading products:', error);
      },
    });
  }

  /**
   * Inicializa el arreglo de productos filtrados (`filteredProducts`) por fila,
   * asignando a cada índice una copia de `this.products`.
   *
   * - Itera sobre los controles actuales del `FormArray` (`partsArray`).
   * - Clona los productos en `filteredProducts[index]` para garantizar independencia visual.
   * - Establece la página actual de cada índice en `1` (base para paginación individual).
   * - Llama a `setupSearchDebounce(index)` para configurar la lógica reactiva por fila.
   *
   * Este método se emplea al cargar productos por primera vez,
   * ya sea con o sin elementos previamente seleccionados.
   */
  private initializeFilteredProducts() {
    if (this.partsArray()) {
      this.partsArray()?.controls.forEach((_, index) => {
        this.filteredProducts[index] = [...this.products];
        this.pageNumbers[index] = 1;
        this.setupSearchDebounce(index);
      });
    }
  }

  /**
   * Configura la lógica de búsqueda con `debounce` por fila usando `BehaviorSubject<string>`.
   *
   * - Si aún no existe `searchSubjects[index]`, se instancia con un valor inicial vacío.
   * - Aplica `debounceTime(300ms)` y `distinctUntilChanged()` para evitar peticiones innecesarias.
   * - Al escribir, si el texto está vacío, muestra todos los productos (`this.products`).
   * - Si hay texto válido, activa `isLoading[index]` y consulta al backend con `service.combo(...)`.
   * - Al recibir resultados:
   *    - Desactiva `isLoading[index]`
   *    - Actualiza `filteredProducts[index]` y el caché con `updateProductCache(...)`.
   *    - Si el dropdown está abierto, recrea visualmente el portal con `createDropdownPortal(...)`.
   * - En caso de error, muestra log en consola y desactiva el indicador de carga.
   *
   * Este método proporciona una experiencia de búsqueda eficiente, desacoplada y controlada por fila.
   *
   * @param {number} index - Índice del campo de búsqueda individual dentro del `FormArray`.
   */
  private setupSearchDebounce(index: number) {
    if (!this.searchSubjects[index]) {
      this.searchSubjects[index] = new BehaviorSubject<string>('');

      this.searchSubjects[index]
        .pipe(
          debounceTime(300), // Esperar 300ms después del último cambio
          distinctUntilChanged(),
          switchMap((searchText) => {
            if (!searchText.trim()) {
              return of({ data: { products: this.products } });
            }
            this.isLoading[index] = true;
            return this.service.combo(1, 10, searchText);
          })
        )
        .subscribe({
          next: (res) => {
            this.isLoading[index] = false;
            this.filteredProducts[index] = res.data.products;

            // Actualizar cache con nuevos productos
            this.updateProductCache(res.data.products);

            // Actualizar dropdown si está abierto
            if (this.activeDropdownIndex === index) {
              this.createDropdownPortal(
                index,
                this.elementRef.nativeElement.querySelector(
                  `#combobox-input-${index}`
                )
              );
            }
          },
          error: (error) => {
            this.isLoading[index] = false;
            console.error('Error searching products:', error);
          },
        });
    }
  }

  /**
   * Actualiza el caché local de productos (`productCache`) insertando o sobrescribiendo
   * cada entrada usando su `_id` como clave.
   *
   * - Itera sobre el arreglo recibido (`products`).
   * - Inserta cada producto en `productCache`, asegurando acceso rápido por `_id`.
   *
   * Este método mantiene un mapa consistente que permite:
   * - Recuperar productos sin repetir llamadas al backend.
   * - Resolver datos de producto rápidamente por `_id`.
   * - Facilitar sincronización visual o lógica basada en referencia.
   *
   * @param {any[]} products - Arreglo de productos a insertar o actualizar en el caché.
   */

  private updateProductCache(products: any[]) {
    products.forEach((product) => {
      this.productCache.set(product._id, product);
    });
  }
}
