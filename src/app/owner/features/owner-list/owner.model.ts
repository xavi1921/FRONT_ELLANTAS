import { Type } from "../owner-type-list/typeOwner.model";

export interface Owner{
  _id:string;
  fullName?:string;
  type_sus:Type;
  identification_number:string;
  address:string;
  cell_phone:string;
  cell_phone_2:string;
  email:string;
}