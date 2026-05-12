import { Routes } from '@angular/router';
import { WalletListComponent } from './wallet-list/wallet-list.component';

/**
 * Definición de rutas para el módulo de billeteras (`Wallet`).
 *
 * - `path: ''`: Ruta raíz que carga el componente principal `WalletListComponent`.
 * - `path: '**'`: Redirección por defecto para rutas desconocidas hacia la raíz.
 */
export default [
  { path: '', component: WalletListComponent },
  { path: '**', redirectTo: '' },
] as Routes;
