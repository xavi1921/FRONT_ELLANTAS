import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
interface Service {
  _id: string;
  name: string;
  series: string;
  price: number;
  sale_price: number;
  observation?: string;
  description?: string;
}

interface ServiceSelection {
  service: Service;
  tabName: string;
  rowIndex: number;
}
@Component({
  selector: 'app-modal-service',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './modal-service.component.html',
})
export class ModalServiceComponent implements OnInit, OnChanges, OnDestroy {
  @Input() title = '';
  @Input() isVisible = false;
  @Input() services: Service[] = [];
  @Input() searchTerm = '';
  @Input() isLoading = false;
  @Input() tabName = '';
  @Input() rowIndex = -1;

  @Output() serviceSelected = new EventEmitter<ServiceSelection>();
  @Output() modalClosed = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  selectedService: Service | null = null;

  currentPage = 1;
  servicesPerPage = 8;

  serviceFilter = '';
  filteredServices: Service[] = [];
  constructor() {}

  ngOnInit() {
    this.filteredServices = [...this.services];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['services']) {
      this.filteredServices = [...this.services];
    }
    if (this.isVisible) {
      this.resetModal();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetModal() {
    this.selectedService = null;
    this.currentPage = 1;
  }

  selectService(service: Service) {
    this.selectedService = service;
  }

  confirmSelection() {
    if (!this.selectedService) return;

    const selection: ServiceSelection = {
      service: this.selectedService,
      tabName: this.tabName,
      rowIndex: this.rowIndex,
    };

    this.serviceSelected.emit(selection);
    this.closeModal();
  }

  closeModal() {
    this.resetModal();
    this.modalClosed.emit();
  }

  trackByServiceId(index: number, service: Service): string {
    return service._id;
  }

  get paginatedServices(): Service[] {
    const start = (this.currentPage - 1) * this.servicesPerPage;
    const end = start + this.servicesPerPage;
    return this.filteredServices.slice(start, end);
  }

  getPaginationStart(): number {
    if (this.filteredServices.length === 0) return 0;
    return (this.currentPage - 1) * this.servicesPerPage + 1;
  }

  getPaginationEnd(): number {
    if (this.filteredServices.length === 0) return 0;
    const end = this.currentPage * this.servicesPerPage;
    return Math.min(end, this.filteredServices.length);
  }

  getTotalPages(): number {
    if (this.filteredServices.length === 0) return 1;
    return Math.ceil(this.filteredServices.length / this.servicesPerPage);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }
  filterServices() {
    const filter = this.serviceFilter.toLowerCase().trim();
    this.filteredServices = this.services.filter(
      (s) =>
        s.name.toLowerCase().includes(filter) ||
        s.series?.toLowerCase().includes(filter)
    );
    this.currentPage = 1;
  }
}
