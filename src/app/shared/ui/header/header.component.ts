import { Component } from '@angular/core';
import { MenuComponent } from './menu/menu.component';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';
import { ProfileComponent } from './profile/profile.component';
import { SidebarService } from './theme-toggle/data-access';
import { NotificationComponent } from './notification/notification.component';

/**
 * Componente de cabecera principal de la aplicación.
 *
 * - Orquesta visualmente los elementos clave del layout superior:
 *   - `MenuComponent`: para navegación principal o contextual.
 *   - `ThemeToggleComponent`: alternador de tema visual (`light` / `dark`).
 *   - `ProfileComponent`: identidad del usuario y control de sesión.
 *   - `NotificationComponent`: alertas del sistema y mensajes pendientes.
 *
 * - Inyecta `SidebarService` para permitir interacción con el menú lateral.
 */
@Component({
  selector: 'app-header',
  imports: [
    MenuComponent,
    ThemeToggleComponent,
    ProfileComponent,
    NotificationComponent,
  ],
  templateUrl: './header.component.html',
  styles: ``,
})
export class HeaderComponent {
  constructor(readonly sidebarService: SidebarService) {}
}
