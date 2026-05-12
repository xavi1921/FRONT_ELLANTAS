import { Component, effect, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../../../data-access/order.service';

const SKIP_FIELDS = new Set([
  '_id', '__v', 'updatedAt', 'createdAt',
  'labour', 'spare_parts', 'spare_parts_extra',
  'preInvoice', 'vehicleCondition', 'mechanics',
]);

const FIELD_LABELS: Record<string, string> = {
  status:         'Estado',
  kmts:           'Kilometraje',
  request:        'Solicitud del cliente',
  start_date:     'Fecha de ingreso',
  start_time:     'Hora de ingreso',
  observation:    'Observación',
  key_veh:        'Llave del vehículo',
  contact_client: 'Contacto del cliente',
  codigo:         'Código',
  created_by:     'Creado por',
  total:          'Total',
};

interface FieldDiff { label: string; before: string; after: string; }

@Component({
  selector: 'app-tab-log',
  imports: [CommonModule],
  templateUrl: './tab-log.component.html',
})
export class TabLogComponent {
  orderId = input<string | null>(null);
  logs    = signal<any[]>([]);
  loading = signal(false);
  expandedIndex = signal<number | null>(null);

  constructor(private service: OrderService) {
    effect(() => {
      const id = this.orderId();
      if (id) this.fetchLogs(id);
    });
  }

  fetchLogs(id: string) {
    this.loading.set(true);
    this.expandedIndex.set(null);
    this.service.getLogs(id).subscribe({
      next: (data: any[]) => { this.logs.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleExpand(i: number) {
    this.expandedIndex.set(this.expandedIndex() === i ? null : i);
  }

  actionBadgeClass(action: string): string {
    const map: Record<string, string> = {
      CREATED:   'bg-green-100 text-green-800',
      UPDATED:   'bg-blue-100 text-blue-800',
      DELETED:   'bg-red-100 text-red-800',
      CANCELLED: 'bg-orange-100 text-orange-800',
      WITHDRAWN: 'bg-purple-100 text-purple-800',
      ERROR:     'bg-red-100 text-red-700',
      INFO:      'bg-gray-100 text-gray-600',
    };
    return map[action] ?? 'bg-gray-100 text-gray-600';
  }

  // ── Campos generales ────────────────────────────────────────────────────────

  visibleFieldUpdates(fields: any): FieldDiff[] {
    if (!fields?.updated) return [];
    return Object.keys(fields.updated)
      .filter(k => !SKIP_FIELDS.has(k) && this.isScalar(fields.updated[k].before) && this.isScalar(fields.updated[k].after))
      .map(k => ({
        label:  FIELD_LABELS[k] ?? k,
        before: this.fmt(fields.updated[k].before),
        after:  this.fmt(fields.updated[k].after),
      }));
  }

  // ── Diff de mano de obra ────────────────────────────────────────────────────

  labourDiff(item: any): FieldDiff[] {
    const diffs: FieldDiff[] = [];
    const b = item.before;
    const a = item.after;
    if (b.name      !== a.name)      diffs.push({ label: 'Actividad', before: b.name ?? '—', after: a.name ?? '—' });
    if (b.cost      !== a.cost)      diffs.push({ label: 'Costo',     before: `S/ ${b.cost ?? 0}`, after: `S/ ${a.cost ?? 0}` });
    if (b.date      !== a.date)      diffs.push({ label: 'Fecha',     before: this.fmtDate(b.date), after: this.fmtDate(a.date) });
    if (b.employee  !== a.employee)  diffs.push({ label: 'Mecánico',  before: '(anterior)', after: '(nuevo)' });
    return diffs;
  }

  // ── Diff de repuestos ───────────────────────────────────────────────────────

  sparePartDiff(item: any): FieldDiff[] {
    const diffs: FieldDiff[] = [];
    const b = item.before;
    const a = item.after;
    if (b.name       !== a.name)       diffs.push({ label: 'Nombre',   before: b.name ?? '—',          after: a.name ?? '—' });
    if (b.amount     !== a.amount)     diffs.push({ label: 'Cantidad',  before: String(b.amount ?? 0),  after: String(a.amount ?? 0) });
    if (b.sale_price !== a.sale_price) diffs.push({ label: 'Precio',   before: `S/ ${b.sale_price ?? 0}`, after: `S/ ${a.sale_price ?? 0}` });
    return diffs;
  }

  // ── Visibilidad del panel de detalles ───────────────────────────────────────

  hasDetails(log: any): boolean {
    const d = log.details;
    if (!d) return false;
    return (
      this.visibleFieldUpdates(d.fields).length > 0 ||
      this.hasArrayChanges(d.spare_parts) ||
      this.hasArrayChanges(d.labour)
    );
  }

  hasArrayChanges(obj: any): boolean {
    if (!obj) return false;
    return (obj.added?.length ?? 0) > 0 || (obj.removed?.length ?? 0) > 0 || (obj.updated?.length ?? 0) > 0;
  }

  // ── Utilidades ──────────────────────────────────────────────────────────────

  private isScalar(v: any): boolean {
    return v === null || v === undefined || typeof v !== 'object';
  }

  fmt(v: any): string {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return this.fmtDate(v);
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  }

  fmtDate(v: any): string {
    if (!v) return '—';
    try {
      return new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return String(v); }
  }
}
