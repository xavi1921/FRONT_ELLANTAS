interface LabourMechanic {
  employee?: string;
  employeeName?: string;
  amount: number;
}
interface labour {
  name: string;
  cost: number;
  mechanics?: LabourMechanic[];
}
interface spare_parts {
  _id: string;
  amount: number;
  sale_price: number;
}
interface spare_parts_ex {
  product: string;
  amount: number;
  sale_price: number;
  applyIncrease: boolean;
}
interface subscriber {
  _id: string;
  fullName: string;
  cell_phone: string;
  cell_phone_2: string;
}
interface vehicle {
  _id: string;
  plate: string;
  model: string;
}
interface Image {
  id: string;
  url: string;
  name: string;
}

interface VehicleCondition {
  _id: string;
  images: Image[];
}

interface preInvoice {
  _id: string;
  subscriber: subscriber;
  vehicle: vehicle;
  total_inventory: number;
  total_labour: number;
  sub_total: number;
  abono: number;
  paymentM: string;
  total: number;
}

export interface Annex {
  delegate: string;
  number_identification: string;
  exit_date:Date;
}
export interface Mechanic {
  _id: string;
  fullName: string;
  position?: string;
}

export interface Order {
  _id: string;
  codigo: string;
  kmts: string;
  key_veh: string;
  status: Array<'Pendiente' | 'En progreso' | 'Completada' | 'Cancelada'>;
  start_date: Date;
  start_time: string;
  request: string;
  mechanics?: Mechanic[];
  labour: labour[];
  spare_parts: spare_parts[];
  spare_parts_extra: spare_parts_ex[];
  preInvoice: preInvoice;
  vehicleCondition?: VehicleCondition;
  observation?: string;
  contact_client: boolean;
  retiro?: Annex;
  created_by: string;
  updatedAt:Date
}

export function transformationData(data: any) {
  return {
    _id: data.tab1._id,
    codigo: data.tab1.codigo,
    kmts: data.tab1.kmts,
    key_veh: data.tab1.key_veh,
    status: data.tab1.status,
    start_date: data.tab1.start_date,
    start_time: data.tab1.start_time,
    request: data.tab1.request,
    labour: data.tab2.labours.map((item: any) => ({
      name: item.name || '',
      cost: item.cost || 0,
      date: item.date ?? new Date(),
      mechanics: (item.mechanics || [])
        .filter((m: any) => m.employee)
        .map((m: any) => ({ employee: m.employee, amount: m.amount || 0 })),
    })),
    spare_parts: data.tab3.spare_parts.map((item: spare_parts) => ({
      product: item._id,
      amount: item.amount,
      sale_price: item.sale_price,
    })),
    spare_parts_extra: data.tab3_extra.spare_parts.map((item: any) => ({
      product: item.product,
      amount: item.amount,
      sale_price: item.sale_price,
      applyIncrease: item.applyIncrease,
    })),
    preInvoice: {
      _id: data.tab3._id,
      subscriber: data.tab1.ownerId,
      vehicle: data.tab1.vehicleId,
      total_inventory: data.tab3.total_r,
      total_labour: data.tab3.total_mo || 0,
      sub_total: data.tab3.subTotal,
      abono: data.tab3.abono ?? 0,
      paymentM: data.tab3.paymentM,
      total: data.tab3.total,
    },
    vehicleCondition: {
      _id: data.tab5._idVehicleCondition,
      vehicle: data.tab1.vehicleId,
      images: data.images,
    },
    observation: data.tab1.observation,
    contact_client: !!data.tab1.client_contact,
  };
}

export function transformPreInvoice(data: any) {
  return {
    _id: data.tab3._id,
    subscriber: data.tab1.ownerId,
    vehicle: data.tab1.vehicleId,
    total_inventory: data.tab3.total_r,
    total_labour: data.tab3.total_mo || 0,
    sub_total: data.tab3.subTotal,
    abono: data.tab3.abono ?? 0,
    paymentM: data.tab3.paymentM,
    total: data.tab3.total,
  };
}

export class ScrollPositionManager {
  private savedScrollPositions: Map<number, number> = new Map();
  private savedScrollHeights: Map<number, number> = new Map();

  saveScrollPosition(index: number, element: HTMLElement) {
    this.savedScrollPositions.set(index, element.scrollTop);
    this.savedScrollHeights.set(index, element.scrollHeight);
  }

  restoreScrollPosition(
    index: number,
    element: HTMLElement,
    direction: 'next' | 'previous'
  ) {
    const savedPosition = this.savedScrollPositions.get(index);
    const savedHeight = this.savedScrollHeights.get(index);

    if (savedPosition !== undefined && savedHeight !== undefined) {
      if (direction === 'previous') {
        // Para elementos agregados al inicio, ajustar la posición
        const heightDifference = element.scrollHeight - savedHeight;
        element.scrollTop = savedPosition + heightDifference;
      } else {
        // Para elementos agregados al final, mantener la posición
        element.scrollTop = savedPosition;
      }
    }

    // Limpiar valores guardados
    this.savedScrollPositions.delete(index);
    this.savedScrollHeights.delete(index);
  }
}
