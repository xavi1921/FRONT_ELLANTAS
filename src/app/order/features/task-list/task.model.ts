import { Employee } from '../../../user/features/employee-list/employee.model';
interface labour {
  name: string;
  cost: number;
}

interface order {
  _id: string;
  codigo: string;
  labour: labour;
  spare_parts: any;
  spare_parts_extra: any;
  kmts: string;
  request: string;
  key_veh: string;
  observation:string;
  status: Array<
    | 'Pendiente'
    | 'En progreso'
    | 'Completada'
    | 'Cancelada'
    | 'Por Retirar'
    | 'Retirada'
  >;
}
interface vehicle {
  _id: string;
  plate: string;
}

/**
 * Modelo de datos que representa una Tarea vinculada a una Orden, Vehículo y Empleados.
 *
 * - `order`: Contiene los datos mínimos de la orden relacionada (código, repuestos, km, clave del vehículo...).
 * - `vehicle`: Datos del vehículo asociado a la tarea (como `plate`).
 * - `employee`: Empleado principal asignado (puede ser nulo o ausente).
 * - `assigned`: Lista de empleados adicionales asignados.
 * - `status`: Estado actual de la tarea ('Pendiente', 'En Progreso', etc.).
 * - `completed`: Bandera que indica si la tarea ha sido marcada como completada.
 */
export interface Task {
  _id: string;
  order: order;
  employee?: Employee | null;
  assigned?: Employee[];
  vehicle: vehicle;
  status: string;
  completed: boolean;
}

/**
 * Transforma una instancia de `Task` para su envío al backend.
 *
 * - Conserva `_id`, `order`, `vehicle`, `kmts`, `completed`, `employees`, `status`.
 * - Extrae `tab2.labours` y los mapea a un nuevo arreglo `labour` con:
 *   - `name`: vacío si no está definido.
 *   - `cost`: cero si no está definido.
 *
 * Este método permite desacoplar la estructura visual del formulario de edición del modelo
 * esperado por el backend.
 *
 * @param data - Instancia de `Task` extendida con datos tabulares (`tab2.labours`).
 * @returns Objeto transformado listo para ser enviado al backend.
 */
export function transformationData(data: any) {
  return {
    _id: data._id,
    order: data.order,
    vehicle: data.vehicle,
    kmts: data.kmts,
    completed: data.completed,
    employees: data.employees,
    status: data.status,
    labour: data.tab2.labours.map((item: labour) => ({
      name: item.name || '',
      cost: item.cost || 0,
    })),
    observation: data.observation,
  };
}
