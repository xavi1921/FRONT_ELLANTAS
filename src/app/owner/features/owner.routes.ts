//RUTAS DE CLIENTE
import { Routes } from '@angular/router';
import { OwnerListComponent } from './owner-list/owner-list.component';
import { OwnerTypeListComponent } from './owner-type-list/owner-type-list.component';

/**
 * Definición de rutas del módulo de clientes.
 *
 * - `''`: Ruta base que carga el componente `OwnerListComponent`, mostrando la lista principal de propietarios.
 * - `'Type'`: Ruta que carga el componente `OwnerTypeListComponent`, donde se gestionan los tipos de propietario.
 * - `'**'`: Ruta comodín para redirigir a la raíz en caso de acceder a una ruta inválida.
 *
 * Este arreglo puede usarse dentro de un `RouterModule.forChild(...)` en el módulo de cliente
 * para mantener la modularidad de navegación y escalar con claridad.
 */
export default [
  { path: '', component: OwnerListComponent },
  { path: 'Type', component: OwnerTypeListComponent },
  { path: '**', redirectTo: '' },
] as Routes;
