export type dataVehicle = {
  _id: string;
  value: string;
  model: string;
  owner: {
    _id: string;
    fullName: string;
    cell_phone: string;
    cell_phone_2: string;
  };
};
