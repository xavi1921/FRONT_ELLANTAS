/**
 * Representa un rol simplificado para usar en combos o listas desplegables.
 *
 * - `_id`: Identificador único del rol.
 * - `name`: Nombre legible del rol.
 */
export interface RoleCombo {
  _id: string;
  name: string;
}

/**
 * Representa un rol completo dentro del sistema.
 *
 * - `_id`: Identificador único del rol.
 * - `name`: Nombre del rol (por ejemplo, "Administrador").
 * - `description`: Breve descripción del propósito del rol.
 * - `status`: Estado actual del rol (por ejemplo, "Activo" o "Inactivo").
 */
export interface Role {
  _id: string;
  name: string;
  description: string;
  status: string;
}
