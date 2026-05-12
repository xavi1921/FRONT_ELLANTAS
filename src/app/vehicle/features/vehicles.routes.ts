import { Routes } from '@angular/router';
import { VehicleListComponent } from './vehicle-list/vehicle-list.component';
import { VehicleTypeListComponent } from './vehicle-type-list/vehicle-type-list.component';

/**
 * Rutas del módulo de vehículos.
 *
 * - `'/'` carga el listado general de vehículos (`VehicleListComponent`).
 * - `'/Type'` navega al listado de tipos de vehículo (`VehicleTypeListComponent`).
 * - Cualquier otra ruta redirige al path raíz (`''`).
 */
export default [
  { path: '', component: VehicleListComponent },
  { path: 'Type', component: VehicleTypeListComponent },
  { path: '**', redirectTo: '' },
] as Routes;
