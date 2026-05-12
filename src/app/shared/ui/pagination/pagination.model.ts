/**
 * Representa el estado actual de la paginación en listas o tablas.
 *
 * - `pageIndex`: índice de la página actual (base 0).
 * - `pageSize`: cantidad de elementos por página.
 *
 * Comúnmente emitido desde un componente de paginación personalizado para comunicar cambios al componente padre.
 */
export interface PaginationEvent {
  /** Índice actual de la página (base cero) */
  pageIndex: number;

  /** Número de elementos por página seleccionados */
  pageSize: number;
}
