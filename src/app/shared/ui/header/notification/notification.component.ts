import { Component, OnInit } from '@angular/core';
import { NotificationStateService } from '../../../data-access/notification/notification.service';
import { Notification } from '../../../data-access/notification/notification.model';

/**
 * Componente encargado de mostrar y gestionar notificaciones del usuario.
 *
 * - Consulta notificaciones y conteo no leído desde `NotificationStateService`.
 * - Se mantiene reactivo gracias a la suscripción a `getUnreadCountObservable()`.
 * - Permite eliminar, marcar como leídas y visualizar notificaciones con formato visual.
 * - Controla la visibilidad del dropdown (`isDropdownOpen`).
 */
@Component({
  selector: 'app-notification',
  imports: [],
  templateUrl: './notification.component.html',
  styles: ``,
})
export class NotificationComponent implements OnInit {
  /** Controla visibilidad del menú de notificaciones */
  isDropdownOpen = false;
  /** Lista actual de notificaciones del usuario */
  notifications: any[] = [];
  /** Cantidad de notificaciones no leídas */
  count: number = 0;
  constructor(private service: NotificationStateService) {}

  /**
   * Hook de inicialización.
   *
   * - Carga notificaciones y conteo inicial.
   * - Se suscribe al observable reactivo de conteo para actualizaciones automáticas.
   */
  ngOnInit() {
    this.getCountNoti();
    this.getNotifications();
    this.service.getUnreadCountObservable().subscribe((count) => {
      this.count = count; // Actualizar el conteo de notificaciones cuando se reciba
      this.getNotifications();
    });
  }

  /**
   * Consulta el conteo de notificaciones no leídas desde el backend.
   */
  getCountNoti() {
    this.service.countNotifications().subscribe(
      (res) => {
        this.count = res.unreadCount;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  /**
   * Recupera la lista completa de notificaciones del usuario.
   */
  getNotifications() {
    this.service.getNotifications().subscribe(
      (res) => {
        this.notifications = res.notifications;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  /**
   * Elimina una notificación específica.
   *
   * - Tras eliminar, recarga notificaciones y conteo.
   *
   * @param noti - Objeto `Notification` a eliminar.
   */
  delete(noti: Notification) {
    this.service.delete(noti._id).subscribe(
      (res) => {
        this.getCountNoti();
        this.getNotifications();
      },
      (error) => {
        console.log(error);
      }
    );
  }

  /**
   * Marca todas las notificaciones del usuario como leídas.
   *
   * - Refresca lista y contador después de marcar.
   */
  markNoti() {
    this.service.markNotifications().subscribe(
      (res) => {
        this.getCountNoti();
        this.getNotifications();
      },
      (error) => {
        console.log(error);
      }
    );
  }

  /**
   * Formatea un valor `Date` o `datetime` a string legible con formato `YYYY-MM-DD hh:mm AM/PM`.
   *
   * @param datetime - Fecha u objeto compatible.
   * @returns Cadena formateada.
   */
  formatDateTime(datetime: any) {
    const date = new Date(datetime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // la hora '0' debe ser '12'

    const formattedDate = `${year}-${month}-${day}`;
    const formattedTime = `${hours}:${minutes} ${ampm}`;

    return `${formattedDate} ${formattedTime}`;
  }

  /**
   * Alterna la visibilidad del dropdown de notificaciones.
   */
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
}
