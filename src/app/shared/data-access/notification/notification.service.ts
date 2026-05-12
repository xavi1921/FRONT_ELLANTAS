import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Notification } from './notification.model';
import { BaseHttpService } from '../base-http.service';
import { environment } from '../../../environments/environment.dev';
import { io } from 'socket.io-client';

/**
 * Servicio encargado de gestionar el estado y operaciones de notificaciones en tiempo real.
 *
 * - Escucha eventos `Socket.IO` para reactividad inmediata (`newNotification`).
 * - Expone un `Subject<number>` con el conteo de notificaciones no leídas.
 * - Permite CRUD de notificaciones y marcarlas como leídas.
 * - Se extiende de `BaseHttpService` para heredar headers y lógica común.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationStateService extends BaseHttpService {
  private readonly API_URL = `${environment.API_URL}api/notification`;
  private socket: any;
  private unreadCountSubject: Subject<number> = new Subject<number>(); // Nuevo Subject para el conteo

  /**
   * Constructor del servicio.
   *
   * - Inicializa la conexión por socket al backend.
   */
  constructor() {
    super();
    this.initializeSocket();
  }

  /**
   * Inicializa el socket y escucha nuevos eventos de notificación.
   *
   * - Al recibir `newNotification`, actualiza el conteo consultando la API.
   */
  private initializeSocket(): void {
    this.socket = io(environment.API_URL);

    this.socket.on('newNotification', () => {
      this.getUnreadCount(); // Llamar para actualizar el conteo de notificaciones
    });
  }

  /**
   * Consulta la API para obtener el conteo de notificaciones no leídas.
   *
   * - Emite el valor actualizado a través del `Subject`.
   * - Maneja errores mediante `console.error`.
   */
  getUnreadCount(): void {
    this.http
      .get<any>(`${this.API_URL}/count/${this.getuserId()}`, {
        headers: this.getHeaders(),
      })
      .subscribe(
        (res) => {
          this.unreadCountSubject.next(res.unreadCount); // Emitir el nuevo conteo de notificaciones
        },
        (error) => {
          console.error(
            'Error al obtener el conteo de notificaciones no leídas:',
            error
          );
        }
      );
  }

  /**
   * Devuelve un `Observable` con el conteo reactivo de notificaciones no leídas.
   */
  getUnreadCountObservable(): Observable<number> {
    return this.unreadCountSubject.asObservable();
  }

  /**
   * Obtiene todas las notificaciones del usuario autenticado.
   *
   * @returns Observable con el arreglo de notificaciones.
   */
  getNotifications(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${this.getuserId()}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Consulta el conteo de notificaciones no leídas (mismo endpoint usado internamente).
   */
  countNotifications(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/count/${this.getuserId()}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Crea una notificación global visible para todos los usuarios.
   *
   * @param message - Mensaje de la notificación.
   * @returns Observable con la notificación creada.
   */
  create(message: string): Observable<Notification> {
    return this.http.post<Notification>(
      this.API_URL,
      { message, forAllUsers: true },
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Marca todas las notificaciones del usuario como leídas.
   *
   * @returns Observable con la respuesta del backend.
   */
  markNotifications(): Observable<Notification> {
    return this.http.put<Notification>(`${this.API_URL}/${this.getuserId()}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Elimina una notificación específica del usuario.
   *
   * @param notificationId - ID de la notificación a eliminar.
   * @returns Observable con la respuesta del backend.
   */
  delete(notificationId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.API_URL}/${notificationId}/${this.getuserId()}`,
      { headers: this.getHeaders() }
    );
  }
}