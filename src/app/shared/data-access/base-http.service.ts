import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BaseTokenService } from './token/base-token.service';

/**
 * Servicio base para realizar solicitudes HTTP autenticadas.
 *
 * - Inyecta `HttpClient` y `BaseTokenService` de forma declarativa con `inject(...)`.
 * - Expone utilidades comunes como headers autenticados (`getHeaders()`)
 *   y extracción de `userId` decodificado (`getuserId()`).
 * - Puede ser extendido por otros servicios específicos para compartir esta lógica.
 */
@Injectable({
  providedIn: 'root',
})
export class BaseHttpService {
  /** Cliente HTTP inyectado */
  protected http = inject(HttpClient);

  /** Servicio de tokens inyectado */
  private token = inject(BaseTokenService);

  /**
   * Genera encabezados HTTP autenticados con el token actual.
   *
   * - Incluye `'x-access-token'` si está disponible.
   * - Retorna siempre un `HttpHeaders` válido, aunque esté vacío.
   *
   * @returns Objeto `HttpHeaders` con autenticación.
   */
  getHeaders(): HttpHeaders {
    const authToken = this.token.getToken();
    return new HttpHeaders({ 'x-access-token': authToken || '' });
  }
  /**
   * Obtiene el ID del usuario actual desde el token JWT decodificado.
   *
   * - Retorna `user.id` si el token es válido.
   * - Si no hay token o falla la decodificación, puede lanzar error.
   *
   * @returns ID del usuario autenticado.
   */
  getuserId() {
    const user = this.token.decodedToken();
    return user.id;
  }
}
