import { Injectable } from '@angular/core';

/**
 * Servicio para almacenar temporalmente el token decodificado del usuario.
 *
 * - No persiste en `localStorage` ni cookies — solo en memoria (vida útil de la instancia).
 * - Útil para evitar múltiples decodificaciones si ya fue procesado previamente.
 * - Se recomienda usar junto con `BaseTokenService` para gestionar el ciclo completo del token.
 */
@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private decodedToken: any;

  /**
   * Guarda el token decodificado en memoria.
   *
   * @param token - Objeto resultante de `jwtDecode(...)`.
   */
  setDecodedToken(token: any) {
    this.decodedToken = token;
  }

  /**
   * Recupera el token decodificado actualmente almacenado.
   *
   * @returns Objeto JWT decodificado o `undefined` si no se ha almacenado.
   */
  getDecodedToken() {
    return this.decodedToken;
  }

  /**
   * Limpia el token decodificado de la memoria interna.
   */
  clearDecodedToken() {
    this.decodedToken = null;
  }
}
