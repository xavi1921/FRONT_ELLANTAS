import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { GroupComponent } from '../sidebar/group/group.component';
import { ItemComponent } from '../sidebar/item/item.component';
import { modules } from '../../../core/modules/modules';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { BaseTokenService } from '../../data-access/token/base-token.service';

/**
 * Componente de layout principal que estructura la interfaz general de la aplicación.
 *
 * - Orquesta visualmente los bloques clave de navegación:
 *   - `HeaderComponent`: cabecera con perfil, notificaciones y toggles.
 *   - `SidebarComponent` + `GroupComponent` + `ItemComponent`: navegación modular basada en permisos.
 *   - `BreadcrumbComponent`: rastro de navegación contextual.
 *   - `RouterOutlet`: punto de montaje para las vistas de módulo.
 *
 * - Filtra los módulos visibles según los roles del usuario actual.
 * - Extrae `roles` desde el token decodificado por `BaseTokenService`.
 * - Define `filteredModules`, que alimenta la lógica visual del sidebar.
 */
@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    GroupComponent,
    ItemComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './layout.component.html',
  styles: ``,
})
export class LayoutComponent implements OnInit {
  /** Módulos completos definidos en el core */
  modules = modules;
  /** Módulos filtrados según roles del usuario */
  filteredModules: any[] = [];
  /** Lista de roles del usuario autenticado */
  userRoles: string[] = [];
  constructor(private auth: BaseTokenService) {}

  /**
   * Verifica si el usuario tiene al menos uno de los roles permitidos.
   *
   * @param allowedRoles - Lista de roles autorizados.
   * @returns `true` si hay intersección con `userRoles`.
   */
  hasRole(allowedRoles: string[]): boolean {
    return this.userRoles.some((role) => allowedRoles.includes(role));
  }
  /**
   * Inicializa la vista:
   * - Decodifica token para obtener roles de usuario.
   * - Filtra módulos y submódulos según permisos.
   * - Asigna `href` del padre al primer hijo autorizado.
   */
  ngOnInit() {
    const decoded = this.auth.decodedToken();
    this.userRoles = decoded?.roles ?? [];
    this.filteredModules = this.modules
      .map((module) => {
        const filteredChildren =
          module.children?.filter((child) => this.hasRole(child.roles ?? [])) ??
          [];

        return {
          ...module,
          children: filteredChildren,
          // Usamos el primer hijo permitido como `href` del padre
          href: filteredChildren.length > 0 ? filteredChildren[0].href : null,
        };
      })
      .filter((module) => module.children.length > 0);
  }
}
