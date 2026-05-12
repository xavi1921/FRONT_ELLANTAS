import { Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list.component';
import { EmployeeListComponent } from './employee-list/employee-list.component';

/**
 * Definición de rutas para el módulo actual.
 *
 * - `'/'` carga `UserListComponent` por defecto.
 * - `'/employee'` carga `EmployeeListComponent`.
 * - Cualquier otra ruta (`'**'`) redirige a `'/'`.
 */
export default [
  { path: '', component: UserListComponent },
  { path: 'employee', component: EmployeeListComponent },
  { path: '**', redirectTo: '' },
] as Routes;
