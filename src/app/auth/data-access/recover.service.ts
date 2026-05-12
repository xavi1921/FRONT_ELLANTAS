import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Observable } from 'rxjs';
export interface RecoveryResponse {
  message: string;
}
/**
 * Servicio encargado de gestionar la recuperación y restablecimiento de contraseñas.
 * Extiende de `BaseHttpService` para reutilizar lógica HTTP común como headers.
 *
 * - `recover(email)`: Envía una solicitud para iniciar el proceso de recuperación de contraseña.
 * - `resetPassword(_id, newPassword)`: Realiza la solicitud para actualizar la contraseña del usuario.
 */

@Injectable({
  providedIn: 'root',
})

export class RecoverService extends BaseHttpService {
  /**
   * Endpoint para solicitar recuperación de contraseña por correo.
   * @protected
   */
  protected API_URL = `${environment.API_URL}api/auth/recovery`;
  /**
   * Endpoint para restablecer la contraseña directamente.
   * @private
   */
  private API_RESET = `${environment.API_URL}api/auth/reset-password`;

  /**
   * Envía la dirección de correo electrónico para iniciar el proceso de recuperación.
   *
   * @param {string} email - Correo electrónico del usuario que solicita la recuperación.
   * @returns {Observable<RecoveryResponse>} Observable con un mensaje de confirmación del backend.
   */
  recover(email: string): Observable<RecoveryResponse> {
    return this.http.post<RecoveryResponse>(
      this.API_URL,
      { email },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Restablece la contraseña del usuario en base al ID y la nueva clave proporcionada.
   *
   * @param {number} _id - Identificador único del usuario.
   * @param {string} newPassword - Nueva contraseña a establecer.
   * @returns {Observable<any>} Observable que emite el resultado del backend.
   */
  resetPassword(_id: number, newPassword: string): Observable<any> {
    const body = { _id, newPassword };

    return this.http.put<any>(this.API_RESET, body, {
      headers: this.getHeaders(),
    });
  }
}
