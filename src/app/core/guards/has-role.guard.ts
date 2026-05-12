import { CanActivateFn } from '@angular/router';
import { BaseTokenService } from '../../shared/data-access/token/base-token.service';
import { inject, Injector, runInInjectionContext } from '@angular/core';

/**
 * Guard de ruta que verifica si el usuario autenticado posee alguno de los roles requeridos.
 *
 * - Recibe un arreglo de roles válidos para una ruta determinada.
 * - Inyecta dinámicamente el `BaseTokenService` dentro de un contexto de inyección explícito (`runInInjectionContext`).
 * - Obtiene el token decodificado y verifica que contenga al menos uno de los roles requeridos.
 *
 * @param {any[]} roles - Lista de roles permitidos para acceder a la ruta protegida.
 * @returns {CanActivateFn} Función que determina si se permite el acceso (`true`) o se bloquea (`false`).
 */

export const hasRoleGuard = (roles: any[]): CanActivateFn => {
  return () => {
    const injector = inject(Injector);
    return runInInjectionContext(injector, () => {
      const token = inject(BaseTokenService).decodedToken();
      if (!token) return false;
      return token.roles.some((role: any) => roles.includes(role));
    });
  };
};
