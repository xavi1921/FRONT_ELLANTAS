import { CommonModule } from '@angular/common';
import { Component, effect, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Appointment } from '../../appointment-list/appointment.model';

@Component({
  selector: 'app-events',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './events.component.html',
  styles: ``
})
export class EventsComponent {
  isOpen = input<boolean>(false);
  appointment = input<any | null>();
  closeModal = output<void>();

  form:FormGroup;
  constructor(private fb:FormBuilder){
    this.form = this.fb.group({
      _id: [''],
      subscriber: [''],
      vehicle: [''],
      appointment_date: ['' ],
      appointment_time: ['' ],
      description: [''],
      notes: [''],
      notification_status: ['NO'],
      isConfirmed: ['NO'],
      valueFilter: [''],
    });
    effect(() => {
      this.updateForm();
    });
  }
  
  updateForm() {
    if (this.appointment()) {
      const appointment_date = this.appointment()?.appointment_date
        ? new Date(this.appointment()!.appointment_date)
            .toISOString()
            .split('T')[0]
        : '';
      this.form.patchValue({
        _id: this.appointment()?._id,
        subscriber: this.appointment()?.subscriber,
        vehicle: this.appointment()?.vehicle,
        appointment_date: appointment_date,
        appointment_time: this.appointment()?.appointment_time,
        description: this.appointment()?.description,
        notes: this.appointment()?.notes,
        notification_status: this.appointment()?.notification_status,
        isConfirmed: this.appointment()?.isConfirmed,
      });
    } else {
      const today = new Date();
      const localDate = today.toLocaleDateString('en-CA');
      const localTime = today.toTimeString().slice(0, 5);
      this.form.reset({
        appointment_date: localDate,
        appointment_time: localTime,
        isConfirmed: 'NO',
        notification_status: 'NO',
      });
    }
  }
  formReset() {
    this.form.reset();
  }
  onClose() {
    this.formReset();
    this.updateForm();
    this.closeModal.emit();
  }
}
