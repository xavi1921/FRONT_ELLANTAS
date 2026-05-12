import { Component, input, output } from '@angular/core';
import { Task } from '../../../../task-list/task.model';
import {
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ToolTipComponent } from '../../../../../../shared/ui/tool-tip/tool-tip.component';

@Component({
  selector: 'app-tab-7',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './tab-7.component.html',
})
export class Tab7Component {
  form = input<FormGroup | null>(null);
  selectedEmployees = input<any[]>([]);
  filteredEmployee = input<any[]>([]);
  notFoundOwner = input<boolean>(false);
  errorMessage = input<string>('');
  selectE = output<any>();
  remove = output<number>();

  removeEmployee(index: number) {
    this.remove.emit(index);
  }
  select(employee: any) {
    this.selectE.emit(employee);
  }
  isEmployeeSelected(employeeId: string): boolean {
    return this.selectedEmployees().some((emp) => emp._id === employeeId);
  }
}
