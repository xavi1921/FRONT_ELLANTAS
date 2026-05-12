import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Appointment } from '../features/appointment-list/appointment.model';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
/**
 * Servicio de acceso HTTP para operaciones relacionadas con citas (`Appointment`).
 * Extiende la funcionalidad base de `BaseHttpService` para realizar operaciones CRUD y consultas especializadas.
 *
 * - `list`: Lista paginada con soporte de búsqueda textual.
 * - `create`: Crea una nueva cita.
 * - `update`: Actualiza una cita existente.
 * - `delete`: Elimina una cita por ID.
 * - `filter`: Filtra citas según texto ingresado.
 * - `getCalendarEvents`: Recupera eventos de cita para visualización en calendario.
 */
export class AppointmentService extends BaseHttpService {
  private API_URL = `${environment.API_URL}api/quotes`;

  list(page: number, size: number, value?: string) {
    return this.http.post<any>(
      `${this.API_URL}/list?page=${page}&size=${size}`,
      { value },
      { headers: this.getHeaders() }
    );
  }

  create(Appointment: Appointment): Observable<Appointment> {
    return this.http.post<Appointment>(this.API_URL, Appointment, {
      headers: this.getHeaders(),
    });
  }

  update(Appointment: Appointment): Observable<Appointment> {
    return this.http.put<Appointment>(this.API_URL, Appointment, {
      headers: this.getHeaders(),
    });
  }

  delete(id: string): Observable<Appointment> {
    return this.http.delete<Appointment>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  filter(value: string) {
    return this.http.post<any>(
      `${this.API_URL}/filter`,
      { value },
      { headers: this.getHeaders() }
    );
  }
  getCalendarEvents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/calendar`, {
      headers: this.getHeaders(),
    });
  }
}
