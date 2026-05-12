/**
 * Representa un empleado del sistema, utilizado como propietario de usuarios.
 */
interface Employee {
  _id: string;
  fullName: string;
}

/**
 * Representa un rol asignado a un usuario (ej. ADMIN, MECÁNICO, etc.).
 */
interface Role {
  _id: string;
  name: string;
}

/**
 * Representa un usuario del sistema con su relación hacia empleados y roles.
 */
export interface User {
  _id: string;
  username: string;
  password?: string;
  employee: Employee;
  roles: Role[];
  status: string;
}
