import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaginationEvent } from './pagination.model';
import { CommonModule } from '@angular/common';

/**
 * Componente reutilizable para paginación de datos tabulares o listas.
 *
 * - Controla el número de elementos por página y la navegación entre páginas.
 * - Expone eventos `pageChange` y `pageSizeChange` para comunicar cambios al componente padre.
 * - Soporta personalización visual y lógica por módulo si se requiere (`module`).
 */
@Component({
  selector: 'app-pagination',
  imports: [FormsModule, CommonModule],
  templateUrl: './pagination.component.html',
  styles: ``,
})
export class PaginationComponent {
  /** Total de elementos disponibles para paginar */
  totalItems = input<number>(0);
  /** Opciones disponibles de tamaño de página */
  pageSizeOptions = input<number[]>([5, 10, 25, 100]);
  /** Estado actual de la paginación */
  pageEvent = input<PaginationEvent>({ pageIndex: 0, pageSize: 10 });
  /** Evento emitido cuando cambia la página */
  pageChange = output<PaginationEvent>();
  /** Evento emitido cuando se cambia el tamaño de página */
  pageSizeChange = output<number>();
  /** Identificador opcional del módulo que usa la paginación */
  module = input<string>('');

  /**
   * Calcula el número total de páginas según los elementos y tamaño seleccionado.
   *
   * @returns Número total de páginas, mínimo 1.
   */
  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.totalItems() / this.pageEvent().pageSize)
    );
  }

  /**
   * Cambia la página actual y emite el nuevo `PaginationEvent`.
   *
   * @param pageIndex - Índice de la nueva página (base 0).
   */
  onPageChange(pageIndex: number) {
    this.pageEvent().pageIndex = pageIndex;
    this.pageChange.emit(this.pageEvent());
  }

  /**
   * Cambia el tamaño de página y reinicia la paginación a la primera página.
   *
   * @param pageSize - Nuevo tamaño de página seleccionado.
   */
  onPageSizeChange(pageSize: number) {
    this.pageEvent().pageSize = pageSize;
    this.pageSizeChange.emit(pageSize);
    this.pageEvent().pageIndex = 0;
  }
}
