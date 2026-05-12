import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';

interface LoginResponse {
  token: string;
}
/**
 * Servicio responsable de manejar la autenticación del usuario.
 * Realiza una solicitud `POST` al endpoint de inicio de sesión y espera un objeto con el token de respuesta.
 * Extiende `BaseHttpService` para reutilizar lógica común de headers y manejo HTTP.
 *
 * @method login Envía las credenciales del usuario al backend para autenticarse.
 *
 * @param {string} username - Nombre de usuario del cliente.
 * @param {string} password - Contraseña correspondiente al usuario.
 * @returns {Observable<LoginResponse>} Observable que emite el token si la autenticación es exitosa.
 */

@Injectable({
  providedIn: 'root',
})

export class LogInService extends BaseHttpService {
  protected API_URL = `${environment.API_URL}api/auth/signin`;

  login(username: string, password: string) {
    const body = { username, password };
    const headers = this.getHeaders();
    return this.http.post<LoginResponse>(this.API_URL, body, { headers });
  }
}
