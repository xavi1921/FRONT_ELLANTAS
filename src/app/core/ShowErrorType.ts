/**
 * Representa un objeto indexado que asocia claves de campos con su respectivo estado de error y mensaje.
 *
 * - Cada clave corresponde a un identificador de campo (por ejemplo: `'email'`, `'password'`).
 * - Cada valor contiene:
 *    - `show`: Bandera que indica si el tooltip de error debe mostrarse.
 *    - `message`: Texto del error a mostrar relacionado con ese campo.
 *
 * @example
 * const showError: ShowErrorType = {
 *   email: { show: true, message: 'El correo es inválido' },
 *   password: { show: false, message: '' }
 * };
 */

export type ShowErrorType = {
  [key: string]: {
    show: boolean; // Determina si el tooltip debe ser visible
    message: string; // Mensaje del tooltip
  };
};
