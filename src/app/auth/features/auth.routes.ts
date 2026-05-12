//RUTAS DE AUTH
import { Routes } from '@angular/router';
import { LogInComponent } from './log-in/log-in.component';
import { RecoverComponent } from './recover/recover.component';
import { recoverGuard } from '../../core/guards/recover.guard';
import { RecoverPasswordComponent } from './recover-password/recover-password.component';

/**
 * Definición de rutas del módulo de autenticación.
 *
 * - `/logIn`: Carga el componente de inicio de sesión (`LogInComponent`).
 * - `/recover`: Página de recuperación para solicitar enlace vía correo (`RecoverComponent`).
 * - `/recover/:token`: Página para restablecer contraseña con token validado (`RecoverPasswordComponent`),
 *   protegida por el guard `recoverGuard` para evitar accesos no autorizados.
 * - Cualquier otra ruta (`**`) redirige por defecto a `/logIn`.
 *
 * @constant
 * @type {Routes}
 */

export default [
  { path: 'logIn', component: LogInComponent },
  { path: 'recover', component: RecoverComponent },
  {
    path: 'recover/:token',
    component: RecoverPasswordComponent,
    canActivate: [recoverGuard],
  },
  { path: '**', redirectTo: 'logIn' },
] as Routes;
