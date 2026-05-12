/**
 * Modelo que representa una billetera o transacción de pago dentro del sistema.
 *
 * - Relaciona entidades clave como `order`, `subscriber` y `vehicle`.
 * - Incluye detalles del método y medio de pago utilizado.
 * - Controla el estado de la transacción (`status`, `amountPending`, etc).
 * - Registra metainformación relevante como la fecha de actualización (`updatedAt`).
 */
interface order {
  _id: string;
  codigo: string;
}
interface subscriber {
  _id: string;
  fullName: string;
}
interface vehicle {
  _id: string;
  plate: string;
}
interface payments{
  paymentM:string;
  amount:number;
  methodDetails:any;
  createdAt:Date;
}
export interface Wallet {
  _id: string;
  order?: order;
  subscriber?: subscriber;
  vehicle?: vehicle;
  paymentM: string;
  amount?: number;
  amountPending?: number;
  cardBank?: string;
  cardType?: string;
  voucherCode?: string;
  transferBank?: string;
  confirmationNumber?: string;
  transferDate?: Date;

  checkType?: string;
  checkNumber?: string;
  checkBank?: string;
  checkDate?: string;
  checkHolder?: string;

  notes?: string;

  payments?:payments[]
  status: string;
  updatedAt: Date;
}
