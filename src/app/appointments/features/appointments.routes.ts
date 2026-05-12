//RUTAS DE CITAS

import { Routes } from '@angular/router';
import { AppointmentListComponent } from './appointment-list/appointment-list.component';
import { CalendarComponent } from './calendar/calendar.component';

/**
 * Configuración de rutas para el módulo de citas (`Appointments`).
 *
 * - `''`: Ruta por defecto que carga la lista de citas.
 * - `'calendar'`: Ruta que muestra la vista de calendario de citas.
 * - `'**'`: Ruta comodín que redirige a la ruta raíz en caso de ruta no válida.
 *
 * @type {Routes}
 */

export default [
  { path: '', component: AppointmentListComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: '**', redirectTo: '' },
] as Routes;
