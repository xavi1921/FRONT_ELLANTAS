/**
 * Transforma los datos crudos del formulario de registro en un objeto estructurado
 * según el modelo esperado por el backend.
 * 
 * - Asigna `username`, `password`, `roles` y `status` directamente.
 * - Encapsula los datos personales dentro de la propiedad `employee`.
 *
 * @param {any} data - Datos crudos del formulario de registro.
 * @returns {any} Objeto transformado con la estructura requerida por el backend.
 */


export function transformationData(data:any){
    return {
        username:data.username,
        password:data.confirmPassword,
        roles:data.roles,
        status:data.status,
        employee:{
            tipoDoc:data.tipoDoc,
            dni:data.dni,
            fullName:data.fullName,
            cellPhone:data.cellPhone,
            email:data.email,
            position:data.position,
            startDate:data.startDate,
            gender:data.gender
        },
    }
}