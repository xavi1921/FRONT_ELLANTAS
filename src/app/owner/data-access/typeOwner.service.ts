import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Type } from '../features/owner-type-list/typeOwner.model';
import { Observable } from 'rxjs';

/**
 * Servicio encargado de gestionar operaciones relacionadas con los tipos de propietarios (`Type`).
 *
 * Extiende de `BaseHttpService` para reutilizar lógica común (headers, interceptores, etc.).
 * Interactúa con la API `api/subscriber/type`.
 */
@Injectable({
  providedIn: 'root',
})
export class TypeOwnerService extends BaseHttpService {
  private API_URL = `${environment.API_URL}api/subscriber/type`;

  /**
   * Obtiene una lista paginada de tipos de propietario, con opción de filtrar por nombre.
   *
   * @param page - Número de página actual.
   * @param size - Cantidad de elementos por página.
   * @param name - Filtro por nombre (opcional).
   * @returns Observable con los resultados paginados.
   */
  list(page: number, size: number, name?: string) {
    return this.http.post<any>(
      `${this.API_URL}/list?page=${page}&size=${size}`,
      { name },
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Obtiene un arreglo con las opciones disponibles de tipos de propietario (para dropdowns).
   *
   * @returns Observable con lista simple de tipos.
   */
  combo() {
    return this.http.get<any>(`${this.API_URL}/combo`, {
      headers: this.getHeaders(),
    });
  }
  /**
   * Crea un nuevo tipo de propietario.
   *
   * @param type - Objeto `Type` con los datos del nuevo tipo.
   * @returns Observable con la instancia creada.
   */
  create(type: Type): Observable<Type> {
    return this.http.post<Type>(this.API_URL, type, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Actualiza un tipo de propietario existente.
   *
   * @param type - Objeto `Type` con datos actualizados.
   * @returns Observable con la entidad modificada.
   */
  update(type: Type): Observable<Type> {
    console.log(type);
    return this.http.put<Type>(`${this.API_URL}/update`, type, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Elimina un tipo de propietario según su identificador.
   *
   * @param id - ID del tipo a eliminar.
   * @returns Observable con la respuesta del backend.
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}
