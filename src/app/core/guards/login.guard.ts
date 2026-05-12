import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BaseTokenService } from '../../shared/data-access/token/base-token.service';
import { jwtDecode } from 'jwt-decode';

/**
 * Guard de ruta (`loginGuard`) que controla el acceso a la página de inicio de sesión.
 *
 * - Si no hay token, permite el acceso a `/login`.
 * - Si hay token:
 *    - Intenta decodificarlo usando `jwtDecode`.
 *    - Si el token no ha expirado, redirige al usuario a la raíz (`/`) y deniega el acceso.
 *    - Si ha expirado, elimina el token y permite acceso a `/login`.
 * - Si ocurre un error en la decodificación, elimina el token y permite acceso.
 *
 * @type {CanActivateFn}
 */

export const loginGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(BaseTokenService);
  const router = inject(Router);
  const token = tokenService.getToken();

  if (!token) {
    return true; // No hay token, puede entrar al login
  }

  try {
    const decodedToken = jwtDecode<any>(token);
    const expirationDate = new Date(decodedToken.exp * 1000);
    const now = new Date();

    if (expirationDate > now) {
      // Token válido, redirige a raíz o a alguna ruta por defecto
      router.navigate(['/']);
      return false;
    } else {
      tokenService.deleteToken();
      return true; // Token expirado, puede ir a login
    }
  } catch (err) {
    tokenService.deleteToken();
    return true; // Token inválido, puede ir a login
  }
};
