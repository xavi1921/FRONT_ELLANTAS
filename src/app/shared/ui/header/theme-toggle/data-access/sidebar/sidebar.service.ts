import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Servicio global encargado de gestionar el estado visual del sidebar lateral.
 *
 * - Expone un `BehaviorSubject<boolean>` (`collapsed`) que refleja si el menú está colapsado.
 * - Ofrece métodos para actualizar (`setCollapsed`) o alternar (`toggleCollapsed`) su estado.
 * - Este servicio puede ser inyectado en cualquier componente que necesite sincronizar su layout con el sidebar.
 */
@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  /** Estado colapsado del sidebar (true = oculto, false = expandido) */
  collapsed = new BehaviorSubject<boolean>(false);

  /**
   * Establece de forma explícita si el sidebar está colapsado.
   *
   * @param collapsed - Estado deseado (`true` = colapsado, `false` = expandido)
   */
  setCollapsed(collapsed: boolean) {
    this.collapsed.next(collapsed);
  }

  /**
   * Alterna el estado actual del sidebar entre colapsado y expandido.
   */
  toggleCollapsed() {
    const collapsed = this.collapsed.getValue();
    this.setCollapsed(!collapsed);
  }
}
