import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Role } from '../features/access-system/role/role.model';
import { Observable } from 'rxjs';

/**
 * Servicio encargado de la gestión de roles dentro del sistema de acceso.
 * Extiende `BaseHttpService` para heredar métodos comunes relacionados con headers y configuración HTTP.
 *
 * Proporciona operaciones CRUD, paginación, y obtención de combos para elementos select.
 */
@Injectable({
  providedIn: 'root',
})
export class RoleService extends BaseHttpService {
  /**
   * Endpoint base para operaciones relacionadas a `Role`.
   * @private
   */
  private API_URL = `${environment.API_URL}api/role`;

  /**
   * Recupera una lista paginada de roles. Puede filtrar por nombre si se proporciona.
   *
   * @param {number} page - Página actual solicitada.
   * @param {number} size - Cantidad de resultados por página.
   * @param {string} [name] - Nombre opcional para filtrar roles.
   * @returns {Observable<any>} Observable con la lista de roles resultantes.
   */

  list(page: number, size: number, name?: string) {
    return this.http.post<any>(
      `${this.API_URL}/list?page=${page}&size=${size}`,
      { name },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Crea un nuevo rol en el sistema.
   *
   * @param {Role} Role - Objeto de tipo `Role` con la información a registrar.
   * @returns {Observable<Role>} Observable con el rol creado.
   */

  create(Role: Role): Observable<Role> {
    return this.http.post<Role>(this.API_URL, Role, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Actualiza un rol existente.
   *
   * @param {Role} Role - Objeto `Role` con los cambios a aplicar.
   * @returns {Observable<Role>} Observable con el rol actualizado.
   */

  update(Role: Role): Observable<Role> {
    return this.http.put<Role>(this.API_URL, Role, {
      headers: this.getHeaders(),
    });
  }
  /**
   * Elimina un rol del sistema mediante su ID.
   *
   * @param {string} id - Identificador del rol a eliminar.
   * @returns {Observable<Role>} Observable con la respuesta del backend.
   */

  delete(id: string): Observable<Role> {
    return this.http.delete<Role>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Obtiene un listado simplificado de roles para usar en combos o selectores.
   *
   * @returns {Observable<any>} Observable con los datos para listas desplegables.
   */

  combo() {
    return this.http.get<any>(`${this.API_URL}/combo`, {
      headers: this.getHeaders(),
    });
  }
}
