import { Routes } from '@angular/router';
import { OrderListComponent } from './order-list/order-list.component';
import { TaskListComponent } from './task-list/task-list.component';
import { FormComponent } from './form/form.component';
import { ReportComponent } from './report/report.component';

export default [
  { path: '', component: OrderListComponent },
  { path: 'New', component: FormComponent },
  { path: 'Edit/:id', component: FormComponent },
  { path: 'Task', component: TaskListComponent },
  { path: 'Reporte', component: ReportComponent },
  { path: '**', redirectTo: '' },
] as Routes;
