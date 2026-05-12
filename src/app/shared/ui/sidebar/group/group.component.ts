import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente visual que representa un grupo dentro del menú lateral (`Sidebar`).
 *
 * - Se espera que agrupe uno o varios `ItemComponent` como opciones de navegación.
 * - Puede incluir título, ícono o badges si lo decides en la plantilla.
 * - Permite proyección de contenido mediante `<ng-content>`, si aplica.
 */
@Component({
  selector: 'app-group',
  imports: [CommonModule],
  templateUrl: './group.component.html',
  styles: ``,
})
export class GroupComponent {}
