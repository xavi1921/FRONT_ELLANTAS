import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SidebarService } from '../../header/theme-toggle/data-access';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SanitizeHtmlPipe } from '../../../../util/pipes';
import { BadgeComponent } from '../badge/badge.component';
import { RouterLink } from '@angular/router';
import { HasRoleDirective } from '../../../../core/hasRole.directive';
import { Subscription } from 'rxjs';

/**
 * Componente visual de ítem dentro del `Sidebar`, con soporte para subniveles y expansión colapsable.
 *
 * - Puede representar una ruta directa (`link`) o un grupo expandible si tiene `children`.
 * - Sincroniza su estado con `SidebarService` para colapsar automáticamente cuando el sidebar se contrae.
 * - Permite proyección visual con íconos, etiquetas (`label`) y badges (`BadgeComponent`).
 */
@Component({
  selector: 'app-item',
  imports: [
    CommonModule,
    RouterModule,
    SanitizeHtmlPipe,
    BadgeComponent,
    RouterLink,
    HasRoleDirective,
  ],
  templateUrl: './item.component.html',
  styles: ``,
})
export class ItemComponent implements OnInit, OnDestroy {
  /** Ícono representativo del ítem (HTML SVG o clase CSS) */
  @Input() icon: string = '';
  /** Ruta a la que debe navegar este ítem */
  @Input() link: string = '';
  /** Texto que se mostrará como etiqueta del ítem */
  @Input() label: string = '';
  /** Subítems anidados dentro de este ítem (si aplica) */
  @Input() children?: any[];

  /** Controla si el grupo expandible está abierto */
  expanded = false;

  /** Suscripción al estado colapsado del sidebar */
  private sidebarSubscription!: Subscription;
  constructor(readonly sidebarService: SidebarService) {}

  /**
   * Inicializa la suscripción al estado del sidebar.
   *
   * - Si el sidebar se colapsa, fuerza este ítem a cerrarse (`expanded = false`).
   */
  ngOnInit() {
    this.sidebarSubscription = this.sidebarService.collapsed.subscribe(
      (collapsed) => {
        if (collapsed) {
          this.expanded = false;
        }
      }
    );
  }

  /**
   * Alterna visualmente el grupo expandible.
   *
   * - Si el sidebar está colapsado, lo expande automáticamente para poder mostrar el grupo.
   */
  toggleExpand() {
    this.expanded = !this.expanded;
    if (this.sidebarService.collapsed.getValue()) {
      this.sidebarService.toggleCollapsed();
    }
  }

  /**
   * Limpia la suscripción al destruir el componente.
   */
  ngOnDestroy() {
    this.sidebarSubscription?.unsubscribe();
  }
}
