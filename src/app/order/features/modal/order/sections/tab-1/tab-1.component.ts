import { Component, effect, input, output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { VehicleService } from '../../../../../../vehicle/data-access/vehicle.service';
import { ToolTipComponent } from '../../../../../../shared/ui/tool-tip/tool-tip.component';
import { dataVehicle } from './dataVehicle.model';
import { SpinnerComponent } from '../../../../../../shared/ui/spinner/spinner.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tab-1',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ToolTipComponent,
    SpinnerComponent,
  ],
  templateUrl: './tab-1.component.html',
  styles: ``,
})

/**
 * Componente encargado de gestionar la selección y filtrado de vehículos, con soporte para modo edición.
 *
 * Inputs:
 * - `form`: Formulario reactivo asociado (`FormGroup`) o `null`.
 * - `valueVehicle`: Valor actual del campo de entrada (por ejemplo, texto de búsqueda).
 * - `isEdit`: Bandera que indica si el componente está en modo edición.
 *
 * Outputs:
 * - `vehicle`: Emite el vehículo seleccionado (`{ _id, value, model, owner }`).
 * - `cleanModel`: Señal para reiniciar el modelo seleccionado (`true`).
 * - `statusSel`: Emisión del estado de servicio seleccionado.
 *
 * Variables internas:
 * - `filteredVechicle`: Arreglo con resultados filtrados desde el backend.
 * - `status`: Lista de estados posibles para el selector (por ejemplo, en un `mat-select`).
 * - `notFound` y `errorMessage`: Controlan errores o ausencia de resultados al filtrar vehículos.
 */
export class Tab1Component {
  form = input<FormGroup | null>(null);
  valueVehicle = input<string | null>('');
  isEdit = input<boolean>(false);
  readonly = input<boolean>(false);
  vehicle = output<dataVehicle>();
  cleanModel = output<boolean>();
  statusSel = output<any>();

  filteredVechicle: any[] = [];
  status = ['Pendiente', 'En Progreso', 'Completada', 'Por Retirar','Cancelada'];
  notFound = false;
  errorMessage = '';
  load: boolean = false;
  /**
   * Constructor del componente que inicializa la lógica de filtrado reactivo.
   *
   * - Inyecta el servicio `VehicleService` como dependencia.
   * - Usa `effect()` para observar cambios en `this.valueVehicle()` y ejecutar `filterVehicle()` automáticamente.
   *   Esto permite que el filtrado se dispare de forma reactiva cuando cambia el valor del input observado.
   *
   * Este enfoque es ideal en entornos modernos de Angular con Signals.
   * Asegúrate de que `valueVehicle()` sea un `computed()` o `signal()` para que el `effect()` pueda rastrear sus cambios.
   */

  constructor(
    private service: VehicleService,
    private vehicleService: VehicleService
  ) {
    effect(() => {
      this.filterVehicle(this.valueVehicle());
    });
  }

  /**
   * Filtra vehículos según el valor ingresado, consumiendo un servicio asíncrono.
   *
   * - Si `value` no es vacío ni espacios en blanco, llama a `this.service.filter()`.
   * - Al recibir resultados exitosamente, asigna la respuesta a `filteredVechicle`.
   * - Si ocurre un error, marca `notFound` como `true` y almacena el mensaje en `errorMessage`.
   *
   * @param {string | null} value - Cadena de búsqueda ingresada por el usuario.
   */

  filterVehicle(value: string | null) {
    if (value && value.trim()) {
      this.load = true;
      this.service.filter(value.trim()).subscribe(
        (res) => {
          this.load = false;
          this.filteredVechicle = res;
        },
        (error) => {
          this.load = false;
          this.notFound = true;
          this.errorMessage = error.error.message;
        }
      );
    }
  }
  /**
   * Verifica si el vehículo está disponible consultando el backend.
   * Si está disponible, continúa con la selección. Si no, muestra una alerta.
   *
   * @param {string} id - ID del vehículo a verificar.
   */
  async veifyVehicle(id: string) {
    try {
      this.load = true;
      const res = await this.vehicleService.verifyVehicle(id).toPromise();

      if (res && !res.available) {
        this.load = false;
        await Swal.fire({
          icon: 'warning',
          timer: 1500,
          title: 'Vehículo no disponible',
          text: res.message,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#dc3545',
        });

        return false;
      }
      this.load = false;
      return true;
    } catch (error) {
      this.load = false;
      await Swal.fire({
        icon: 'error',
        timer: 1500,
        title: 'Error de servidor',
        text: 'No se pudo verificar el estado del vehículo.',
        confirmButtonText: 'Cerrar',
      });

      return false;
    }
  }
  /**
   * Maneja la selección de un vehículo desde la lista filtrada.
   *
   * - Emite un objeto con los datos seleccionados (`_id`, `value`, `model`, `owner`) a través del `EventEmitter` `vehicle`.
   * - Limpia el arreglo `filteredVechicle` para ocultar los resultados tras la selección.
   *
   * @param {string} _id - Identificador único del vehículo.
   * @param {string} value - Descripción o nombre del vehículo.
   * @param {string} model - Modelo del vehículo seleccionado.
   * @param {any} owner - Objeto que representa al propietario del vehículo.
   */

  async selectedVehicle(_id: string, value: string, model: string, owner: any) {
    const isAvailable = await this.veifyVehicle(_id);
    if (!isAvailable) return;
    this.vehicle.emit({ _id, value, model, owner });
    this.filteredVechicle = [];
  }

  /**
   * Limpia el filtro de búsqueda de vehículos y reinicia el estado visual del componente.
   *
   * - Restablece `notFound` a `false` para ocultar mensajes de error.
   * - Borra el contenido de `errorMessage` y del arreglo `filteredVechicle`.
   * - Emite un evento `cleanModel` con valor `true` para notificar al componente padre u observadores.
   */

  cleanFilter() {
    this.notFound = false;
    this.errorMessage = '';
    this.filteredVechicle = [];
    this.cleanModel.emit(true);
  }

  /**
   * Manejador de cambio para un control de selección (como `checkbox` o `toggle`).
   *
   * - Emite el valor actualizado mediante el `EventEmitter` `statusSel`.
   * - Útil para notificar al componente padre de un cambio en el estado seleccionado.
   *
   * @param {any} value - Valor asociado al cambio de estado del componente.
   */

  onCheckChange(value: any) {
    this.statusSel.emit(value);
  }
}
