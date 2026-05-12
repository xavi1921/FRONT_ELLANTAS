/**
 * Reexporta los servicios globales de UI desde sus módulos correspondientes.
 *
 * - `./sidebar`: expone `SidebarService`.
 * - `./theme`: expone `ThemeService`.
 *
 * Permite importar desde una única ruta agrupada:
 * `import { SidebarService, ThemeService } from '.../application/ui';`
 */
export * from './sidebar';
export * from './theme';
