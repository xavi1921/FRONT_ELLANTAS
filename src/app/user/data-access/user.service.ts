import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { User } from '../features/user-list/user.model';
import { Observable } from 'rxjs';

/**
 * Servicio encargado de gestionar operaciones relacionadas con usuarios del sistema.
 *
 * - Extiende `BaseHttpService` para incorporar encabezados de autorización.
 * - Define métodos CRUD para manipular usuarios vía API RESTful.
 * - Utiliza endpoints definidos dinámicamente según el entorno activo.
 */
@Injectable({
  providedIn: 'root',
})
export class userService extends BaseHttpService {
  private API_URL = `${environment.API_URL}api/user`;

  /**
   * Lista usuarios de forma paginada y opcionalmente filtrada por nombre.
   *
   * @param page - Índice de página actual (base 0).
   * @param size - Número de elementos por página.
   * @param fullName - (Opcional) Filtro de búsqueda por nombre completo.
   * @returns Observable con los resultados paginados.
   */
  list(page: number, size: number, fullName?: string) {
    return this.http.post<any>(
      `${this.API_URL}/list?page=${page}&size=${size}`,
      { fullName },
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Crea un nuevo usuario.
   *
   * @param User - Objeto `User` con los datos a registrar.
   * @returns Observable con el usuario creado.
   */
  create(User: User): Observable<User> {
    const body = { ...User };
    return this.http.post<User>(this.API_URL, body, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Actualiza los datos de un usuario existente.
   *
   * @param User - Objeto `User` con la información modificada.
   * @returns Observable con el usuario actualizado.
   */
  update(User: User): Observable<User> {
    return this.http.put<User>(this.API_URL, User, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Elimina un usuario a partir de su ID.
   *
   * @param id - Identificador del usuario.
   * @returns Observable con la respuesta del backend.
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}