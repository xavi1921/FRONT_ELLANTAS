import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Owner } from '../features/owner-list/owner.model';
import { Observable } from 'rxjs';

/**
 * Servicio centralizado para gestionar operaciones relacionadas con `Owner` (suscriptores).
 *
 * Extiende de `BaseHttpService` para reutilizar encabezados, configuración base y lógica común de HTTP.
 * Interactúa con la API en la ruta base `api/subscriber`.
 */
@Injectable({
  providedIn: 'root',
})
export class OwnerService extends BaseHttpService {
  private API_URL = `${environment.API_URL}api/subscriber`;

  /**
   * Obtiene una lista paginada de propietarios (owners) filtrada opcionalmente por nombre.
   *
   * @param page - Número de página (base 1).
   * @param size - Tamaño de página.
   * @param fullName - Filtro por nombre del propietario (opcional).
   * @returns Observable con los datos de paginación y lista de owners.
   */
list(page: number, size: number, value?: string) {
  return this.http.post<any>(
    `${this.API_URL}/list?page=${page}&size=${size}`,
    { value }, 
    { headers: this.getHeaders() }
  );
}

  /**
   * Crea un nuevo propietario en la base de datos.
   *
   * @param owner - Objeto `Owner` con los datos del nuevo suscriptor.
   * @returns Observable con la instancia creada.
   */
  create(owner: Owner): Observable<Owner> {
    return this.http.post<Owner>(this.API_URL, owner, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Actualiza los datos de un propietario existente.
   *
   * @param owner - Objeto `Owner` modificado.
   * @returns Observable con la instancia actualizada.
   */
  update(owner: Owner): Observable<Owner> {
    return this.http.put<Owner>(this.API_URL, owner, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Elimina un propietario según su ID.
   *
   * @param id - Identificador único del suscriptor.
   * @returns Observable con la entidad eliminada o confirmación.
   */
  delete(id: string): Observable<Owner> {
    return this.http.delete<Owner>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Realiza un filtrado más flexible por valor general (`value`).
   * Ideal para búsquedas contextuales o por múltiples campos del backend.
   *
   * @param value - Valor de búsqueda (texto libre).
   * @returns Observable con los resultados filtrados.
   */
  filter(value: string) {
    return this.http.post<any>(
      `${this.API_URL}/filter`,
      { value },
      { headers: this.getHeaders() }
    );
  }
}
