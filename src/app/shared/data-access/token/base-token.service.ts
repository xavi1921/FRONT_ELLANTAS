import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

/**
 * Servicio base para gestión de tokens JWT en el cliente.
 *
 * - Guarda, recupera y elimina el token JWT desde `localStorage`.
 * - Decodifica el token para acceder a sus claims.
 * - Expone métodos como `getRole()` para obtener el rol principal del usuario.
 *
 */
@Injectable({
  providedIn: 'root',
})
export class BaseTokenService {
  constructor() {}
  private readonly TOKEN_KEY = 'authToken';

  /**
   * Recupera el token actual almacenado en `localStorage`.
   *
   * @returns Token como string o `null` si no está presente.
   */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Almacena el token JWT en `localStorage`.
   *
   * @param token - JWT a guardar.
   */
  setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Elimina el token almacenado.
   */
  deleteToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Decodifica el token JWT si está presente.
   *
   * @returns Objeto decodificado o `null` si no hay token.
   */
  decodedToken() {
    const token = this.getToken();
    // Verifica si el token es válido antes de intentar decodificarlo
    if (!token) {
      // Si no hay token, retorna null
      return null;
    }
    // Si el token es válido, lo decodificamos
    return jwtDecode<any>(token);
  }

  /**
   * Extrae el primer rol del token decodificado.
   *
   * @returns Rol como string si está presente, `undefined` en caso contrario.
   */
  getRole() {
    const token = this.decodedToken();
    return token.roles[0];
  }
}
