/**
 * Re-exporta todas las entidades públicas desde `./sidebar.service`.
 *
 * - Permite importar `SidebarService` desde un índice centralizado:
 *   `import { SidebarService } from '.../application/ui';`
 * - Útil para mantener consistencia y facilitar el consumo modular.
 */
export * from './sidebar.service';
