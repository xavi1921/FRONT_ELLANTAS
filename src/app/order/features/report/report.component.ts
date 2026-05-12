import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrderService } from '../../data-access/order.service';
import { employeeService } from '../../../user/data-access/employee.service';

interface LabourItem {
  codigo: string;
  nombre: string;
  costo: number;
}

interface EmployeeReport {
  employee: { _id: string; fullName: string; position?: string; initials?: string };
  totalIngresos: number;
  cantidadLabours: number;
  labours: LabourItem[];
  expanded: boolean;
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report.component.html',
})
export class ReportComponent implements OnInit, OnDestroy {
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  report: EmployeeReport[] = [];
  loading = false;
  searched = false;

  // ── Filtro por mecánico ──────────────────────────────────────────────────
  mechanicSearchTerm = '';
  mechanicResults: any[] = [];
  showMechanicDrop = false;
  selectedMechanic: { _id: string; fullName: string } | null = null;
  private mechanicDropTimer: any;
  mechanicDropPos: { top: number; bottom: number | null; left: number; width: number; maxHeight: number } = {
    top: 0, bottom: null, left: 0, width: 0, maxHeight: 200,
  };
  private mechanicInputRef: HTMLInputElement | null = null;
  private scrollHandler: (() => void) | null = null;

  months = [
    { value: 1,  label: 'Enero' },
    { value: 2,  label: 'Febrero' },
    { value: 3,  label: 'Marzo' },
    { value: 4,  label: 'Abril' },
    { value: 5,  label: 'Mayo' },
    { value: 6,  label: 'Junio' },
    { value: 7,  label: 'Julio' },
    { value: 8,  label: 'Agosto' },
    { value: 9,  label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];
  years: number[] = [];

  constructor(
    private orderService: OrderService,
    private empService: employeeService,
  ) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 4; y--) {
      this.years.push(y);
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this._stopScrollListener();
    clearTimeout(this.mechanicDropTimer);
  }

  // ── Búsqueda del reporte ─────────────────────────────────────────────────

  search() {
    this.loading = true;
    this.searched = false;
    this.orderService.getLabourReport(this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        this.report = (res.data as any[]).map((item) => ({ ...item, expanded: false }));
        this.loading = false;
        this.searched = true;
      },
      error: () => {
        this.loading = false;
        this.searched = true;
      },
    });
  }

  toggleExpand(item: EmployeeReport) {
    item.expanded = !item.expanded;
  }

  // ── Filtro cliente por mecánico ──────────────────────────────────────────

  get filteredReport(): EmployeeReport[] {
    if (!this.selectedMechanic) return this.report;
    return this.report.filter((r) => r.employee._id === this.selectedMechanic!._id);
  }

  onMechanicInput(input: HTMLInputElement): void {
    this.mechanicInputRef = input;
    this._recalcDropPos();
    this._startScrollListener();

    clearTimeout(this.mechanicDropTimer);
    this.mechanicResults = [];
    this.showMechanicDrop = false;

    const term = this.mechanicSearchTerm.trim();

    if (!term) {
      this.selectedMechanic = null;
      return;
    }
    if (term.length < 2) return;

    this.mechanicDropTimer = setTimeout(() => {
      this.empService.filterMechanics(term).subscribe({
        next: (res: any) => {
          const list = res.employees || res.data || res || [];
          this.mechanicResults = list;
          this.showMechanicDrop = list.length > 0;
          this._recalcDropPos();
        },
        error: () => {
          this.mechanicResults = [];
        },
      });
    }, 300);
  }

  selectMechanic(m: any): void {
    this.selectedMechanic = { _id: m._id, fullName: m.fullName };
    this.mechanicSearchTerm = m.fullName;
    this.mechanicResults = [];
    this.showMechanicDrop = false;
    this.mechanicInputRef = null;
    this._stopScrollListener();
  }

  clearMechanicFilter(): void {
    this.selectedMechanic = null;
    this.mechanicSearchTerm = '';
    this.mechanicResults = [];
    this.showMechanicDrop = false;
    this.mechanicInputRef = null;
    this._stopScrollListener();
  }

  hideMechanicDrop(): void {
    setTimeout(() => {
      this.showMechanicDrop = false;
      this.mechanicInputRef = null;
      this._stopScrollListener();
    }, 200);
  }

  private _recalcDropPos(): void {
    const input = this.mechanicInputRef;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 4;
    const spaceAbove = rect.top - 4;
    const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
    this.mechanicDropPos = {
      top: openAbove ? 0 : rect.bottom + 2,
      bottom: openAbove ? window.innerHeight - rect.top + 2 : null,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(220, openAbove ? spaceAbove : spaceBelow),
    };
  }

  private _startScrollListener(): void {
    if (this.scrollHandler) return;
    this.scrollHandler = () => this._recalcDropPos();
    window.addEventListener('scroll', this.scrollHandler, true);
    window.addEventListener('resize', this.scrollHandler);
  }

  private _stopScrollListener(): void {
    if (!this.scrollHandler) return;
    window.removeEventListener('scroll', this.scrollHandler, true);
    window.removeEventListener('resize', this.scrollHandler);
    this.scrollHandler = null;
  }

  // ── Getters de resumen (usan filteredReport) ─────────────────────────────

  get topEmployee(): EmployeeReport | null {
    return this.filteredReport.length > 0 ? this.filteredReport[0] : null;
  }

  get totalGeneral(): number {
    return this.filteredReport.reduce((sum, r) => sum + r.totalIngresos, 0);
  }

  get selectedMonthLabel(): string {
    return this.months.find((m) => m.value === this.selectedMonth)?.label ?? '';
  }

  getInitials(fullName: string): string {
    return fullName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }

  // ── Exportar PDF ─────────────────────────────────────────────────────────

  exportPdf(): void {
    const data = this.filteredReport;
    if (!data.length) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;

    // ── Encabezado ──
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Mano de Obra por Mecánico', pageW / 2, 12, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const subtitle = this.selectedMechanic
      ? `${this.selectedMonthLabel} ${this.selectedYear}  •  Mecánico: ${this.selectedMechanic.fullName}`
      : `${this.selectedMonthLabel} ${this.selectedYear}  •  Todos los mecánicos`;
    doc.text(subtitle, pageW / 2, 21, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(200, 220, 255);
    doc.text(
      `Generado el ${new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      pageW / 2, 27, { align: 'center' },
    );

    doc.setTextColor(0, 0, 0);

    let yPos = 38;

    // ── Resumen (solo si hay más de un mecánico) ──
    if (data.length > 1) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen del período', margin, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Mecánico', 'Cargo', 'Actividades', 'Total Ingresos']],
        body: data.map((item, idx) => [
          `${idx + 1}`,
          item.employee.fullName,
          item.employee.position || 'Mecánico',
          `${item.cantidadLabours}`,
          `$ ${item.totalIngresos.toFixed(2)}`,
        ]),
        foot: [[
          { content: '', colSpan: 3 },
          { content: `${data.reduce((s, r) => s + r.cantidadLabours, 0)}`, styles: { fontStyle: 'bold' } },
          { content: `$ ${this.totalGeneral.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        ]],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        footStyles: { fillColor: [240, 245, 255], textColor: [30, 64, 175], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          2: { cellWidth: 30 },
          3: { cellWidth: 24, halign: 'center' },
          4: { cellWidth: 32, halign: 'right' },
        },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: margin, right: margin },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // ── Detalle por mecánico ──
    for (const item of data) {
      // Verificar espacio; si queda menos de 40mm, nueva página
      if (yPos > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPos = 15;
      }

      // Nombre del mecánico
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(margin, yPos, pageW - margin * 2, 12, 2, 2, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(item.employee.fullName, margin + 4, yPos + 7);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `${item.employee.position || 'Mecánico'}  •  ${item.cantidadLabours} actividad${item.cantidadLabours !== 1 ? 'es' : ''}`,
        margin + 4, yPos + 11.5,
      );

      doc.setTextColor(0, 0, 0);
      yPos += 15;

      // Tabla de labours
      autoTable(doc, {
        startY: yPos,
        head: [['Orden', 'Actividad', 'Costo']],
        body: item.labours.map((l) => [
          `#${l.codigo}`,
          l.nombre,
          `$ ${l.costo.toFixed(2)}`,
        ]),
        foot: [[
          { content: 'Total', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
          { content: `$ ${item.totalIngresos.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [22, 163, 74] } },
        ]],
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9 },
        footStyles: { fillColor: [240, 253, 244], fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 22, halign: 'center' },
          2: { cellWidth: 28, halign: 'right' },
        },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: margin, right: margin },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── Pie de página ──
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' },
      );
    }

    const filename = this.selectedMechanic
      ? `reporte_${this.selectedMechanic.fullName.replace(/\s+/g, '_')}_${this.selectedMonth}_${this.selectedYear}.pdf`
      : `reporte_mano_obra_${this.selectedMonth}_${this.selectedYear}.pdf`;

    doc.save(filename);
  }
}
