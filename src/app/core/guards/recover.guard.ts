import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../../shared/data-access/token/token-storage.service';
import { jwtDecode } from 'jwt-decode';

/**
 * Guard de ruta (`recoverGuard`) que valida un token de recuperación extraído desde la URL.
 *
 * - Extrae el `token` desde los parámetros de la ruta (`paramMap.get('token')`).
 * - Intenta decodificar el token usando `jwtDecode`.
 *   - Si contiene un campo `exp`, compara contra la fecha actual:
 *     - Si está expirado, redirige a la página `/404` con mensaje personalizado.
 *     - Si es válido, guarda el token decodificado y permite el acceso.
 *   - Si no tiene campo `exp`, redirige a `/error` con mensaje explicativo.
 * - Si la decodificación falla, redirige a `/error` con mensaje genérico de error.
 * - Si no se encuentra el token en la URL, redirige a `/error` indicando ausencia del token.
 *
 * @param {ActivatedRouteSnapshot} route - Snapshot de la ruta activa para extraer parámetros.
 * @param {RouterStateSnapshot} state - Estado actual de la navegación (no usado directamente).
 * @returns {boolean | UrlTree} `true` si se permite acceso; `UrlTree` de redirección si se deniega.
 */

export const recoverGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state
) => {
  const router = inject(Router);
  const token = inject(TokenStorageService);
  const tokenUrl = route.paramMap.get('token');

  if (tokenUrl) {
    try {
      const decodedToken = jwtDecode(tokenUrl);
      if (decodedToken.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime > decodedToken.exp) {
          return router.createUrlTree(['/404'], {
            queryParams: {
              title: 'TOKEN EXPIRADO',
              message:
                'EL TOKEN HA EXPIRADO. VUELVA A ENVIAR UN ENLACE DE RECUPERACIÓN',
              showLink: true,
            },
          });
        }
        token.setDecodedToken(decodedToken);
        return true;
      } else {
        return router.createUrlTree(['/error'], {
          queryParams: {
            title: 'TOKEN INVÁLIDO',
            message: 'EL TOKEN NO TIENE UNA FECHA DE EXPIRACIÓN VÁLIDA',
          },
        });
      }
    } catch (error) {
      return router.createUrlTree(['/error'], {
        queryParams: {
          title: 'ERROR DE TOKEN',
          message: 'NO SE PUDO DECODIFICAR EL TOKEN',
        },
      });
    }
  } else {
    return router.createUrlTree(['/error'], {
      queryParams: {
        title: 'TOKEN NO ENCONTRADO',
        message: 'NO SE ENCONTRÓ UN TOKEN EN LA URL',
      },
    });
  }
};
