import { Component, input, OnDestroy, OnInit, output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToolTipComponent } from '../../../../../../shared/ui/tool-tip/tool-tip.component';
import { LabourService } from '../../../../../../inventory/data-access/labour.service';
import { employeeService } from '../../../../../../user/data-access/employee.service';
@Component({
  selector: 'app-tab-2',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ToolTipComponent],
  templateUrl: './tab-2.component.html',
})
/**
 * Componente encargado de gestionar el segundo tab relacionado con actividades de mano de obra.
 *
 * Inputs:
 * - `form`: Formulario principal (`FormGroup`) para validaciones o enlace con el padre.
 * - `labourArray`: Arreglo reactivo (`FormArray`) con las actividades individuales.
 * - `total`: Monto total acumulado de actividades.
 *
 * Outputs:
 * - `newArray`: Emite el conjunto actualizado de actividades (por ejemplo, al agregar o editar).
 * - `deleteArray`: Emite el índice de una fila eliminada.
 * - `price`: Emite detalles de precio cuando cambia una actividad.
 *
 * Variables internas:
 * - `labour`: Catálogo de actividades disponibles desde el servicio (`LabourService`).
 * - `customModeRows`: Rastrea explícitamente qué filas están en modo de entrada personalizada.
 */
export class Tab2Component implements OnInit, OnDestroy {
  form = input<FormGroup | null>(null);
  labourArray = input<FormArray | null>(null);
  total = input<number>(0);
  readonly = input<boolean>(false);
  mechanics = input<{ _id: string; fullName: string; position?: string }[]>([]);
  newArray = output<any>();
  deleteArray = output<number>();
  price = output<object>({});
  mechanicAdded = output<{ _id: string; fullName: string; position?: string }>();
  labour: any[] = [];
  customModeRows: boolean[] = [];

  labourMechanicTerms: { [key: number]: string } = {};
  labourMechanicResults: { [key: number]: any[] } = {};
  showLabourMechanicDrop: { [key: number]: boolean } = {};
  dropdownPositions: {
    [key: number]: { top: number | null; bottom: number | null; left: number; width: number; maxHeight: number };
  } = {};
  private labourMechanicTimers: { [key: number]: any } = {};
  private dropdownInputRefs: { [key: number]: HTMLInputElement } = {};
  private scrollResizeHandler: (() => void) | null = null;

  constructor(private service: LabourService, private empService: employeeService) {}

  /**
   * Lógica de inicialización del componente.
   *
   * - Llama a `getItemsCombo()` para cargar el catálogo de actividades disponibles.
   * - Recorre el `FormArray` (`labourArray`) y garantiza que cada `FormGroup` tenga el campo `isCustom`.
   *   Si no lo tiene, lo añade dinámicamente con valor inicial `false`.
   *
   * Esto asegura que todas las filas estén alineadas con la lógica condicional del UI
   * (por ejemplo: campos visibles solo cuando `isCustom` está activo).
   */

  ngOnInit(): void {
    this.getItemsCombo();
    if (this.labourArray()?.length) {
      this.labourArray()?.controls.forEach((control, index) => {
        if (!control.get('isCustom')) {
          (control as any).addControl('isCustom', new FormControl(false));
        }
        const employeeName = control.get('employeeName')?.value;
        if (employeeName) {
          this.labourMechanicTerms[index] = employeeName;
        }
      });
    }
  }

  /**
   * Emite un evento `newArray` para notificar al componente padre que se debe agregar una nueva actividad.
   *
   * - El valor emitido es una cadena vacía (`''`), lo cual puede actuar como señal para inicializar
   *   una nueva fila en el `FormArray` del padre.
   */

  add() {
    this.newArray.emit('');
  }

  /**
   * Elimina una actividad del `FormArray` de mano de obra (`labourArray`) si está presente.
   *
   * - Verifica que `labourArray` exista y contenga el control especificado.
   * - Determina el índice del `AbstractControl` en el array y, si lo encuentra, emite ese índice mediante `deleteArray`.
   *
   * @param {AbstractControl} item - Control de actividad a eliminar.
   */

  delete(item: AbstractControl) {
    const labour = this.labourArray();
    if (!labour) return;

    const index = labour.controls.indexOf(item);
    if (index !== -1) {
      this.deleteArray.emit(index);
    }
  }

  /**
   * Verifica si el nombre proporcionado ya ha sido seleccionado en alguna otra fila del `labourArray`.
   *
   * - Excluye el índice actual (`currentIndex`) para permitir que la fila actual mantenga su propio valor.
   * - Devuelve `true` si encuentra otro control con el mismo nombre, `false` en caso contrario.
   *
   * Útil para validar unicidad en listas dinámicas de selección, evitando duplicaciones en formularios editables.
   *
   * @param {string} name - Nombre de la actividad a verificar.
   * @param {number} currentIndex - Índice de la fila actual desde la que se realiza la verificación.
   * @returns {boolean} `true` si el nombre ya está seleccionado en otra fila, `false` si es único.
   */

  isOptionSelected(name: string, currentIndex: number): boolean {
    return (
      this.labourArray()?.controls.some((control, index) => {
        const selectedName = control.get('name')?.value;
        return index !== currentIndex && selectedName === name;
      }) ?? false
    );
  }

  /**
   * Obtiene las actividades disponibles desde el backend y actualiza el estado interno.
   *
   * - Al recibir los datos (`res.data`), los asigna a `this.labour`.
   * - Si `labourArray` tiene controles, recorre cada uno y evalúa su campo `name`.
   *   - Si el nombre no figura entre las actividades del catálogo, marca el control como personalizado (`isCustom = true`).
   *
   * Esto permite distinguir visualmente entre actividades estándar y aquellas ingresadas manualmente por el usuario.
   */

  getItemsCombo() {
    this.service.combo().subscribe(
      (res) => {
        this.labour = res.data;
        if (this.labourArray()?.length) {
          this.labourArray()?.controls.forEach((control) => {
            const name = control.get('name')?.value;
            // Si el nombre no está en la lista de actividades predefinidas, marcar como personalizado
            if (name && !this.labour.some((item) => item.name === name)) {
              control.get('isCustom')?.setValue(true);
            }
          });
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }

  /**
   * Actualiza el precio de la actividad seleccionada en el índice indicado.
   *
   * - Obtiene el nombre seleccionado desde el evento (`<select>`).
   * - Busca en `labour` el objeto que coincide con dicho nombre.
   * - Si lo encuentra, llama a `priceLabour()` con el `index` y el `precio` correspondiente.
   *
   * Este método permite mantener sincronizado el valor visual del selector con los datos reales del catálogo.
   *
   * @param {number} index - Índice de la fila en el `FormArray` de actividades.
   * @param {Event} event - Evento de cambio del elemento select con el nuevo nombre de la actividad.
   */

  changePrice(index: number, event: Event) {
    const target = event.target as HTMLSelectElement;
    const name = target.value;
    const selectedProduct = this.labour.find((p) => p.name === name);
    if (selectedProduct) {
      this.priceLabour(index, selectedProduct.price);
    }
  }

  /**
   * Emite un evento con el nuevo precio asignado a una actividad en el índice indicado.
   *
   * - El evento `price` transporta un objeto con `index` y `price`, permitiendo al componente padre
   *   actualizar el `FormArray` o recalcular totales en función de ese cambio.
   *
   * @param {number} index - Índice de la actividad dentro del arreglo.
   * @param {number} price - Nuevo valor de precio a aplicar.
   */

  priceLabour(index: number, price: number) {
    this.price.emit({ index, price });
  }

  /**
   * Determina si una fila específica en el `FormArray` está en modo personalizado (`isCustom = true`).
   *
   * - Accede al control en el índice proporcionado de `labourArray`.
   * - Verifica si existe el campo `isCustom` y si su valor es `true`.
   *
   * Útil para condicionar visibilidad de inputs, desactivar selects o mostrar tooltips específicos por fila.
   *
   * @param {number} index - Índice de la fila dentro del arreglo `labourArray`.
   * @returns {boolean} `true` si la fila está marcada como personalizada, `false` en caso contrario.
   */

  isCustomMode(index: number): boolean {
    const control = this.labourArray()?.at(index);
    return control?.get('isCustom')?.value === true;
  }

  /**
   * Activa o desactiva el modo personalizado para una fila en el `FormArray` de mano de obra.
   *
   * - Actualiza el campo `isCustom` en el control del índice especificado.
   * - Al activar el modo personalizado (`true`), borra `name` y pone `cost` en `0` para entrada manual.
   * - Al desactivarlo (`false`), también resetea ambos campos para reactivar selección predefinida.
   *
   * Este método mantiene sincronizado el estado visual y lógico del componente de forma explícita.
   *
   * @param {number} index - Índice del control dentro de `labourArray`.
   * @param {boolean} isCustom - Indica si se debe activar (`true`) o desactivar (`false`) el modo personalizado.
   */

  toggleCustomMode(index: number, isCustom: boolean): void {
    const control = this.labourArray()?.at(index);

    control?.get('isCustom')?.setValue(isCustom);

    if (isCustom) {
      control?.get('name')?.setValue('');
      control?.get('cost')?.setValue(0);
    } else {
      control?.get('name')?.setValue('');
      control?.get('cost')?.setValue(0);
    }
  }

  onLabourMechanicInput(index: number): void {
    const term = this.labourMechanicTerms[index] || '';
    clearTimeout(this.labourMechanicTimers[index]);
    this.labourMechanicResults[index] = [];
    this.showLabourMechanicDrop[index] = false;

    if (!term) {
      const control = this.labourArray()?.at(index);
      control?.get('employee')?.setValue('');
      control?.get('employeeName')?.setValue('');
      return;
    }

    if (term.length < 2) return;

    this.labourMechanicTimers[index] = setTimeout(() => {
      this.empService.filterMechanics(term).subscribe({
        next: (res: any) => {
          const list = res.employees || res.data || res || [];
          this.labourMechanicResults[index] = list;
          this.showLabourMechanicDrop[index] = list.length > 0;
        },
        error: () => {
          this.labourMechanicResults[index] = [];
        },
      });
    }, 300);
  }

  selectLabourMechanic(index: number, mechanic: any): void {
    const control = this.labourArray()?.at(index);
    control?.get('employee')?.setValue(mechanic._id);
    control?.get('employeeName')?.setValue(mechanic.fullName);
    this.labourMechanicTerms[index] = mechanic.fullName;
    this.labourMechanicResults[index] = [];
    this.showLabourMechanicDrop[index] = false;

    this.mechanicAdded.emit({
      _id: mechanic._id,
      fullName: mechanic.fullName,
      position: mechanic.position,
    });
  }

  hideLabourMechanicDrop(index: number): void {
    setTimeout(() => {
      this.showLabourMechanicDrop[index] = false;
      delete this.dropdownInputRefs[index];
      if (Object.keys(this.dropdownInputRefs).length === 0) {
        this._stopScrollListener();
      }
    }, 200);
  }

  updateDropdownPosition(index: number, input: HTMLInputElement): void {
    this.dropdownInputRefs[index] = input;
    this._recalcPosition(index);
    this._startScrollListener();
  }

  private _recalcPosition(index: number): void {
    const input = this.dropdownInputRefs[index];
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 4;
    const spaceAbove = rect.top - 4;
    const openAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
    this.dropdownPositions[index] = {
      top: openAbove ? null : rect.bottom + 2,
      bottom: openAbove ? window.innerHeight - rect.top + 2 : null,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(192, openAbove ? spaceAbove : spaceBelow),
    };
  }

  private _startScrollListener(): void {
    if (this.scrollResizeHandler) return;
    this.scrollResizeHandler = () => {
      Object.keys(this.dropdownInputRefs).forEach((k) => {
        this._recalcPosition(Number(k));
      });
    };
    window.addEventListener('scroll', this.scrollResizeHandler, true);
    window.addEventListener('resize', this.scrollResizeHandler);
  }

  private _stopScrollListener(): void {
    if (!this.scrollResizeHandler) return;
    window.removeEventListener('scroll', this.scrollResizeHandler, true);
    window.removeEventListener('resize', this.scrollResizeHandler);
    this.scrollResizeHandler = null;
  }

  ngOnDestroy(): void {
    this._stopScrollListener();
    Object.values(this.labourMechanicTimers).forEach((t) => clearTimeout(t));
  }
}
