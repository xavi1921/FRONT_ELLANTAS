import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BaseTokenService } from '../../shared/data-access/token/base-token.service';
import { jwtDecode } from 'jwt-decode';

/**
 * Guard de ruta (`authGuard`) que verifica si el usuario tiene un token de autenticación válido.
 *
 * - Inyecta el servicio de tokens (`BaseTokenService`) y el router para navegación.
 * - Si no existe token, redirige a `/login` y bloquea el acceso.
 * - Si hay token:
 *    - Intenta decodificarlo con `jwtDecode`.
 *    - Comprueba si ha expirado comparando `exp` con la fecha actual.
 *    - Si ha expirado: elimina el token, redirige a `/login` y bloquea el acceso.
 * - En caso de error al decodificar, bloquea el acceso.
 * - Si el token es válido y no ha expirado, permite el acceso (`true`).
 *
 * @type {CanActivateFn}
 */

export const authGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(BaseTokenService);
  const router = inject(Router);
  const token = tokenService.getToken();
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decodedToken = jwtDecode<any>(token);
    const expirationDate = new Date(decodedToken.exp * 1000);
    if (expirationDate < new Date()) {
      tokenService.deleteToken();
      router.navigate(['/login']);
      return false;
    }
  } catch (error) {
    return false;
  }

  return true;
};
