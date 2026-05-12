import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Task } from '../features/task-list/task.model';
import { Observable } from 'rxjs';

/**
 * Servicio Angular que gestiona operaciones relacionadas con tareas (`Task`) vinculadas a una orden.
 * 
 * - Extiende `BaseHttpService` para aprovechar encabezados y utilidades comunes.
 * - Utiliza el endpoint base `${environment.API_URL}api/order/task`.
 * 
 * Métodos disponibles:
 * - `list(page, size, value?, status?)`: Obtiene una lista paginada y filtrada de tareas.
 * - `create(task)`: Crea una nueva tarea.
 * - `update(task)`: Actualiza una tarea existente.
 * - `delete(id)`: Elimina una tarea por su ID.
 */

@Injectable({
  providedIn: 'root',
})
export class TaskService extends BaseHttpService {
  private API_URL = `${environment.API_URL}api/order/task`;

  list(page: number, size: number, value?: string, status?: any) {
    return this.http.post<any>(
      `${this.API_URL}/list?page=${page}&size=${size}`,
      { value, status },
      { headers: this.getHeaders() }
    );
  }

  create(task: Task): Observable<Task> {
    return this.http.post<Task>(this.API_URL, task, {
      headers: this.getHeaders(),
    });
  }

  update(task: any): Observable<Task> {
    return this.http.put<Task>(this.API_URL, task, {
      headers: this.getHeaders(),
    });
  }

  delete(id: string): Observable<Task> {
    return this.http.delete<Task>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}
