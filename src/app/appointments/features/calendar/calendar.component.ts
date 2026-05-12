import { Component, OnInit } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import { CalendarOptions } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { AppointmentService } from '../../data-access/appointment.service';
import { EventsComponent } from '../modal/events/events.component';
import { transformationData } from './calendar.model';
@Component({
  selector: 'app-calendar',
  imports: [FullCalendarModule, EventsComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit {
  isOpen = false;
  events: any;
  selectedEvent: any;
  constructor(private service: AppointmentService) {}
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    selectable: true,
    editable: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,listWeek',
    },
    locale: esLocale,
    eventClick: (arg: any) => {
      const selected = transformationData(arg.event._def);
      if (selected) {
        this.selectedEvent = selected;
        this.isOpen = true;
      }
    },
    eventDidMount: (info) => {
      const eventDate = new Date(info.event.startStr);
      const today = new Date();

      // Normaliza ambas fechas al formato YYYY-MM-DD (sin hora)
      const eventDay = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate()
      );
      const currentDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      if (eventDay < currentDay) {
        // Evento pasado
        info.el.style.backgroundColor = '#d06b56';
      } else if (eventDay.getTime() === currentDay.getTime()) {
        // Evento del día actual
        info.el.style.backgroundColor = '#6477f1';
      } else {
        // Evento futuro
        info.el.style.backgroundColor = '#e5ea68';
      }
    },
    events: [],
  };

  ngOnInit(): void {
    this.getEvents();
  }

  getEvents() {
    this.service.getCalendarEvents().subscribe((events) => {
      this.events = events;
      this.calendarOptions.events = events;
    });
  }
  closeModal() {
    this.isOpen = false;
  }
}
