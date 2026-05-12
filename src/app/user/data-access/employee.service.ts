import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Employee } from '../features/employee-list/employee.model';
import { Observable } from 'rxjs';

/**
 * Servicio para gestionar operaciones CRUD y filtrado sobre empleados.
 *
 * - Extiende `BaseHttpService` para heredar headers autenticados.
 * - Usa el `API_URL` definido en los entornos (`environment.dev`, etc.).
 * - Expone métodos para listar, crear, actualizar, eliminar y buscar empleados.
 */
@Injectable({
  providedIn: 'root',
})
export class employeeService extends BaseHttpService {
  private API_URL = `${environment.API_URL}api/employee`;

  /**
   * Obtiene una lista paginada de empleados con opción de filtro por nombre.
   *
   * @param page - Número de página (base 0).
   * @param size - Tamaño de página.
   * @param fullName - Nombre completo opcional para filtrar resultados.
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
   * Crea un nuevo empleado.
   *
   * @param employee - Objeto `Employee` a crear.
   * @returns Observable con el empleado creado.
   */
  create(employee: Employee): Observable<Employee> {
    const body = { ...employee };
    return this.http.post<Employee>(this.API_URL, body, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Actualiza un empleado existente.
   *
   * @param employee - Objeto `Employee` con cambios.
   * @returns Observable con el empleado actualizado.
   */
  update(employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(this.API_URL, employee, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Elimina un empleado por ID.
   *
   * @param id - Identificador del empleado.
   * @returns Observable con la respuesta del backend.
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Filtra empleados por valor textual.
   *
   * @param value - Texto a buscar.
   * @returns Observable con resultados coincidentes.
   */
  filter(value: string) {
    return this.http.post<any>(
      `${this.API_URL}/filter`,
      { value },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Filtra empleados que cumplen el rol de mecánicos.
   *
   * @param value - Texto de búsqueda.
   * @returns Observable con mecánicos coincidentes.
   */
  filterMechanics(value: string) {
    return this.http.post<any>(
      `${this.API_URL}/filterM`,
      { value },
      { headers: this.getHeaders() }
    );
  }
}
