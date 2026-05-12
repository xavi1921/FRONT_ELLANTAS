//RUTAS DE ACCESO AL SISTEMA
import { Routes } from "@angular/router";
import { RoleComponent } from "./role/role.component";
import { RegisterComponent } from "./register/register.component";

/**
 * Definición de rutas del módulo principal del sistema.
 * 
 * - `/role`: Muestra el componente de gestión de roles.
 * - `/register`: Muestra el componente de registro de usuarios.
 * - Cualquier otra ruta (`**`) redirige a `/role` como ruta predeterminada.
 *
 * @constant
 * @type {Routes}
 */

export default [
 {path:'role',component:RoleComponent},
 {path:'register',component:RegisterComponent},
 { path: '**', redirectTo: 'role' },
] as Routes