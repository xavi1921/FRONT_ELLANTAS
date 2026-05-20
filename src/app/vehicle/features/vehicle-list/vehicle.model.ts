import { Type } from '../../../owner/features/owner-type-list/typeOwner.model';

/**
 * Representa un propietario de vehículo.
 */
interface Owner {
  _id: string;
  fullName: string;
}

/**
 * Representa un vehículo registrado en el sistema.
 *
 * - Relacionado a un tipo (`type_veh`) y un propietario (`owner`).
 * - Incluye detalles técnicos y administrativos como placa, modelo y chasis.
 */
export interface Vehicle {
  _id: string;
  type_veh: Type;
  owner?: Owner;
  plate: string;
  brand: string;
  model: string;
  year_vehicle: Number;
  chassis_series: string;
}
