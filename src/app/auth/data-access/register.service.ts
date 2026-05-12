import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Observable } from 'rxjs';

/**
 * Servicio encargado del registro de nuevos usuarios.
 * Extiende `BaseHttpService` para reutilizar configuración común de headers y solicitudes HTTP.
 *
 * - `create(data)`: Envía los datos de un nuevo usuario al backend para completar el proceso de registro.
 */

@Injectable({
  providedIn: 'root',
})
export class RegisterService extends BaseHttpService {
  /**
   * URL del endpoint para registrar nuevos usuarios.
   * @protected
   */
  protected API_URL = `${environment.API_URL}api/auth/signUp`;

  /**
   * Envía los datos del usuario al servidor para registrar una nueva cuenta.
   *
   * @param {any} data - Objeto con la información del nuevo usuario (nombre, correo, contraseña, etc.).
   * @returns {Observable<any>} Observable que emite la respuesta del backend tras el registro.
   */
  create(data: any): Observable<any> {
    return this.http.post<any>(this.API_URL, data, {
      headers: this.getHeaders(),
    });
  }
}
