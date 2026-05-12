//RUTAS DE INVENTARIO
import { Routes } from '@angular/router';
import { InventoryListComponent } from './inventory-list/inventory-list.component';
import { LabourListComponent } from './labour-list/labour-list.component';

/**
 * Definición de rutas para el módulo de inventario.
 *
 * - '' (ruta base): Muestra `InventoryListComponent`.
 * - 'labour': Muestra `LabourListComponent`, listado de actividades.
 * - '**': Cualquier otra ruta se redirige a la ruta base.
 *
 * Se exporta el arreglo tipado como `Routes` para ser utilizado en el sistema de enrutamiento de Angular.
 */

export default [
  { path: '', component: InventoryListComponent },
  { path: 'labour', component: LabourListComponent },
  { path: '**', redirectTo: '' },
] as Routes;
