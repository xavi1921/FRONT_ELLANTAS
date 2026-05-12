import { FormControl, FormGroup } from "@angular/forms";
/**
 * Representa una labor dentro del formulario de tareas, con nombre y costo requeridos.
 *
 * - `name`: Nombre de la labor (tipo string, obligatorio).
 * - `cost`: Costo asociado a la labor (tipo number, obligatorio).
 */
export type Labour=FormGroup<{
    name:FormControl<string>
    cost:FormControl<number>
    employee:FormControl<string>
    employeeName:FormControl<string>
    date:FormControl<Date | null>
}>

/**
 * Representa una entrada de repuesto dentro del formulario, incluyendo nombre, cantidad y precio de venta.
 *
 * - `name`: Nombre del repuesto.
 * - `amount`: Cantidad ingresada o solicitada.
 * - `sale_price`: Precio unitario de venta asociado.
 */
export type SpareParts=FormGroup<{
    name:FormControl<string>
    amount:FormControl<number>
    sale_price:FormControl<number>
}>