import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Type } from '../../owner/features/owner-type-list/typeOwner.model';
import { Observable } from 'rxjs';

/**
 * Servicio para gestionar operaciones relacionadas con los tipos de vehículos.
 *
 * - Hereda de `BaseHttpService` para reutilizar lógica de headers y configuración.
 * - Expone métodos para listar, crear, editar y eliminar tipos de vehículos.
 * - Utiliza `environment` para mantener la URL desacoplada del entorno.
 */
@Injectable({
  providedIn: 'root',
})
export class TypeVehicleService extends BaseHttpService {
  private API_URL = `${environment.API_URL}api/vechicle/type`;

  /**
   * Obtiene una lista paginada de tipos de vehículos.
   *
   * @param page - Número de página (base 1).
   * @param size - Cantidad de elementos por página.
   * @param name - (Opcional) Filtro por nombre.
   * @returns Observable con la respuesta del backend (`{ totalItems, content: Type[] }`).
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
   * Obtiene un listado compacto de tipos de vehículos para dropdowns.
   *
   * @returns Observable con arreglo de objetos `{ _id, name }`.
   */
  combo() {
    return this.http.get<any>(`${this.API_URL}/combo`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Crea un nuevo tipo de vehículo.
   *
   * @param type - Objeto `Type` con los datos del nuevo tipo.
   * @returns Observable con la entidad creada.
   */
  create(type: Type): Observable<Type> {
    return this.http.post<Type>(this.API_URL, type, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Actualiza un tipo de vehículo existente.
   *
   * @param type - Objeto `Type` con los datos actualizados.
   * @returns Observable con la entidad modificada.
   */
  update(type: Type): Observable<Type> {
    return this.http.put<Type>(`${this.API_URL}/update`, type, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Elimina un tipo de vehículo por su identificador.
   *
   * @param id - ID del tipo a eliminar.
   * @returns Observable con el mensaje de éxito del backend.
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}
