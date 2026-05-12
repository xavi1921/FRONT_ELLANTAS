import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Observable } from 'rxjs';
import { Vehicle } from '../features/vehicle-list/vehicle.model';

/**
 * Servicio HTTP para gestionar vehículos en el sistema.
 *
 * - Hereda de `BaseHttpService` para obtener headers configurados y lógica común.
 * - Expone métodos CRUD y filtros para consumo del backend.
 */
@Injectable({
  providedIn: 'root',
})
export class VehicleService extends BaseHttpService {
  private API_URL = `${environment.API_URL}api/vehicle`;

  /**
   * Consulta paginada de vehículos desde el backend.
   *
   * @param page - Número de página (base 1).
   * @param size - Cantidad de elementos por página.
   * @param value - (Opcional) Filtro textual (placa, marca, etc.).
   * @returns Observable con `{ totalItems, vehicles: Vehicle[] }`.
   */
  list(page: number, size: number, value?: string) {
    return this.http.post<any>(
      `${this.API_URL}/list?page=${page}&size=${size}`,
      { value },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Crea un nuevo vehículo.
   *
   * @param vehicle - Objeto `Vehicle` con los datos del nuevo vehículo.
   * @returns Observable con el vehículo creado.
   */
  create(vehicle: Vehicle): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.API_URL}/`, vehicle, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Actualiza un vehículo existente.
   *
   * @param Vehicle - Objeto `Vehicle` con datos modificados.
   * @returns Observable con el vehículo actualizado.
   */
  update(Vehicle: Vehicle): Observable<Vehicle> {
    return this.http.put<Vehicle>(this.API_URL, Vehicle, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Elimina un vehículo por su ID.
   *
   * @param id - Identificador del vehículo.
   * @returns Observable con confirmación del backend.
   */
  delete(id: string): Observable<Vehicle> {
    return this.http.delete<Vehicle>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Filtra vehículos según valor ingresado.
   *
   * @param value - Texto a buscar (placa, marca, etc.).
   * @returns Observable con coincidencias.
   */
  filter(value: string) {
    return this.http.post<any>(
      `${this.API_URL}/filter`,
      { value },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Verifica si un vehículo está disponible para selección según su asociación a una pre-factura activa.
   *
   * @param {string} vehicleId - ID del vehículo a verificar.
   * @returns {Observable<{ available: boolean; message: string }>} Resultado de disponibilidad.
   */
  verifyVehicle(vehicleId: string) {
    return this.http.get<{ available: boolean; message: string }>(
      `${this.API_URL}/${vehicleId}/verify`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Consulta de vehículos para dropdowns o combos.
   *
   * @param value - Texto a buscar (para autocompletado).
   * @returns Observable con subconjunto de datos.
   */
  filterCombo(value: string) {
    return this.http.post<any>(
      `${this.API_URL}/combo`,
      { value },
      { headers: this.getHeaders() }
    );
  }
}
