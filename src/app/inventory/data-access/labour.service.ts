import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Labour } from '../features/labour-list/labour.model';
import { Observable } from 'rxjs';

/**
 * Servicio encargado de gestionar operaciones relacionadas con entidades `Labour`.
 *
 * - Extiende de `BaseHttpService` para heredar lógica común de peticiones (headers, manejo de errores, etc.).
 * - Utiliza la URL base del entorno para apuntar a `api/labour`.
 *
 * Métodos disponibles:
 * - `list(page, size, name?)`: Obtiene una lista paginada de labores, opcionalmente filtrada por nombre.
 * - `create(Labour)`: Crea una nueva entrada de `Labour`.
 * - `update(Labour)`: Actualiza una entrada existente de `Labour`.
 * - `delete(id)`: Elimina una entrada por ID.
 * - `combo()`: Recupera datos formateados para un dropdown o selector de labores.
 *
 * @see BaseHttpService para lógica compartida de headers y configuración base.
 */

@Injectable({
  providedIn: 'root',
})
export class LabourService extends BaseHttpService {
  private API_URL = `${environment.API_URL}api/labour`;

  list(page: number, size: number, name?: string) {
    return this.http.post<any>(
      `${this.API_URL}/list?page=${page}&size=${size}`,
      { name },
      { headers: this.getHeaders() }
    );
  }

  create(Labour: Labour): Observable<Labour> {
    return this.http.post<Labour>(this.API_URL, Labour, {
      headers: this.getHeaders(),
    });
  }

  update(Labour: Labour): Observable<Labour> {
    return this.http.put<Labour>(this.API_URL, Labour, {
      headers: this.getHeaders(),
    });
  }

  delete(id: string): Observable<Labour> {
    return this.http.delete<Labour>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  combo() {
    return this.http.get<any>(`${this.API_URL}/combo`, {
      headers: this.getHeaders(),
    });
  }
  filterLabours(value: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/filter`, {value}, {
      headers: this.getHeaders(),
    });
  }
}
