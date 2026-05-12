import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { BaseTokenService } from '../shared/data-access/token/base-token.service';

/**
 * Directiva estructural que permite mostrar u ocultar elementos en función de los roles del usuario autenticado.
 *
 * - Se utiliza como atributo estructural `[hasRole]="['admin', 'editor']"` en plantillas.
 * - Inyecta dinámicamente referencias de plantilla y contenedor (`TemplateRef` y `ViewContainerRef`) para renderizar o limpiar el DOM.
 * - Obtiene el token decodificado del usuario desde `BaseTokenService` para acceder a sus roles.
 * - Reacciona a cambios mediante `effect()`, permitiendo respuesta reactiva en entornos `standalone`.
 * - Muestra la vista solo si el usuario tiene al menos uno de los roles especificados en `hasRole`.
 *
 * @example
 * ```html
 * <div *hasRole="['admin']">Solo visible para administradores</div>
 * ```
 */

@Directive({
  selector: '[hasRole]',
})
export class HasRoleDirective {
  private templateRef = inject(TemplateRef);
  private viewContainerRef = inject(ViewContainerRef);
  private token = inject(BaseTokenService).decodedToken();
  roles = input.required<any>({
    alias: 'hasRole',
  });

  constructor() {
    effect(() => {
      const user = this.token;
      const roles = this.roles();
      this.viewContainerRef.clear();
      if (user && roles.length > 0 && this.hasRole(user, roles)) {
        this.viewContainerRef.createEmbeddedView(this.templateRef);
      }
    });
  }

  hasRole(useRole: any, roles: any[]) {
    return useRole.roles.some((role: any) => roles.includes(role));
  }
}