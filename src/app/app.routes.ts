import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/ui/layout/layout.component';
import { authGuard } from './core/guards/auth.guard';
import { ErrorComponent } from './auth/features/error/error.component';
import { loginGuard } from './core/guards/login.guard';

/**
 * Definición global de rutas de la aplicación.
 *
 * - `'auth'`: módulo autenticación, protegido con `loginGuard`.
 * - Rutas privadas (`''`) protegidas con `authGuard` y renderizadas dentro de `LayoutComponent`.
 * - Cada funcionalidad carga su módulo de rutas lazy (`owner`, `user`, `inventory`, etc.).
 * - Redirección por defecto a `appointments/calendar`.
 * - Ruta de error (`404`) con datos personalizados para el componente.
 * - Cualquier otra ruta (`'**'`) redirige hacia `auth`.
 */
export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [loginGuard],
    loadChildren: () => import('./auth/features/auth.routes'),
  },
  {
    canActivate: [authGuard],
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'appointments/calendar',
        pathMatch: 'full',
      },
      {
        path: 'owner',
        loadChildren: () => import('./owner/features/owner.routes'),
      },
      {
        path: 'user',
        loadChildren: () => import('./user/features/user.routes'),
      },
      {
        path: 'vehicles',
        loadChildren: () => import('./vehicle/features/vehicles.routes'),
      },
      {
        path: 'inventory',
        loadChildren: () => import('./inventory/features/inventory.routes'),
      },
      {
        path: 'order',
        loadChildren: () => import('./order/features/order.routes'),
      },
       {
        path: 'wallet',
        loadChildren: () => import('./paymentWallet/features/wallet.routes'),
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('./appointments/features/appointments.routes'),
      },
      {
        path: 'security',
        loadChildren: () =>
          import('./auth/features/access-system/access.routes'),
      },
    ],
  },
  {
    path: '404',
    component: ErrorComponent,
    data: { title: 'ERROR 404', menssage: 'NOT FOUND PAGE' },
  },
  { path: '**', redirectTo: 'auth' },
];
