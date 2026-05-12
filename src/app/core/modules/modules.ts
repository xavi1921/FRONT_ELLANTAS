/**
 * Representa las propiedades de una ruta o elemento de navegación dentro del sistema.
 *
 * - `title`: Etiqueta visible del ítem de navegación.
 * - `icon`: Nombre del ícono asociado (compatible con librerías como Material o FontAwesome).
 * - `href`: Ruta o enlace relativo al que debe navegar.
 * - `group`: Indica si el ítem actúa como agrupador de subrutas (`true`) o es una ruta directa (`false`).
 * - `children` (opcional): Lista de subrutas o ítems anidados, también del tipo `RouteProps`.
 * - `roles` (opcional): Lista de roles autorizados para visualizar esta ruta; útil para navegación dinámica según permisos.
 */

export type RouteProps = {
  title: string;
  icon: string;
  href: string;
  group: boolean;
  children?: RouteProps[];
  roles?: any[];
};

/**
 * Arreglo de módulos que representa el menú lateral del sistema.
 *
 * - Cada objeto define un grupo de navegación con sus propiedades:
 *   - `title`: Título visible del módulo o submódulo.
 *   - `icon`: SVG como cadena para representar el ícono correspondiente.
 *   - `href`: Ruta base del módulo o subruta del hijo.
 *   - `group`: Indica si el elemento contiene subrutas agrupadas.
 *   - `children`: (Opcional) Submódulos anidados, cada uno con su propia configuración.
 *   - `roles`: (Opcional) Lista de roles autorizados para visualizar el módulo o submódulo.
 *
 * Se utiliza para construir dinámicamente la UI de navegación, controlando visibilidad y acceso
 * según los permisos del usuario autenticado.
 *
 * @constant
 * @type {RouteProps[]}
 */

export const modules: RouteProps[] = [
  {
    title: 'Dashboard',
    href: '',
    group: false,
    icon: `<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"> <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.143 4H4.857A.857.857 0 0 0 4 4.857v4.286c0 .473.384.857.857.857h4.286A.857.857 0 0 0 10 9.143V4.857A.857.857 0 0 0 9.143 4Zm10 0h-4.286a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286A.857.857 0 0 0 20 9.143V4.857A.857.857 0 0 0 19.143 4Zm-10 10H4.857a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286a.857.857 0 0 0 .857-.857v-4.286A.857.857 0 0 0 9.143 14Zm10 0h-4.286a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286a.857.857 0 0 0 .857-.857v-4.286a.857.857 0 0 0-.857-.857Z"/></svg>`,
  },
  {
    title: 'Gestión de Usuarios',
    icon: '<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M16 19h4a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-2m-2.236-4a3 3 0 1 0 0-4M3 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>',
    href: 'user',
    group: true,
    children: [
      {
        title: 'Usuarios',
        icon: '',
        href: 'user/',
        group: false,
        roles: ['Admin', 'Super Admin'],
      },
      {
        title: 'Empleados',
        icon: '',
        href: 'user/employee',
        group: false,
        roles: ['Admin', 'Super Admin'],
      },
    ],
  },
  {
    title: 'Gestión de Clientes',
    icon: '<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"> <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M4.5 17H4a1 1 0 0 1-1-1 3 3 0 0 1 3-3h1m0-3.05A2.5 2.5 0 1 1 9 5.5M19.5 17h.5a1 1 0 0 0 1-1 3 3 0 0 0-3-3h-1m0-3.05a2.5 2.5 0 1 0-2-4.45m.5 13.5h-7a1 1 0 0 1-1-1 3 3 0 0 1 3-3h3a3 3 0 0 1 3 3 1 1 0 0 1-1 1Zm-1-9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"/</svg>',
    href: 'owner',
    group: true,
    children: [
      {
        title: 'Tipos de Clientes',
        icon: '',
        href: 'owner/Type',
        group: false,
        roles: ['Super Admin'],
      },
      {
        title: 'Cliente',
        icon: '',
        href: 'owner/',
        group: false,
        roles: ['Admin', 'Super Admin'],
      },
    ],
  },
  {
    title: 'Gestión de Vehículos',
    icon: '<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h6l2 4m-8-4v8H9m4-8V6c0-.26522-.1054-.51957-.2929-.70711C12.5196 5.10536 12.2652 5 12 5H4c-.26522 0-.51957.10536-.70711.29289C3.10536 5.48043 3 5.73478 3 6v9h2m14 0h2v-4m0 0h-5M8 8.66669V10l1.5 1.5m10 5c0 1.3807-1.1193 2.5-2.5 2.5s-2.5-1.1193-2.5-2.5S15.6193 14 17 14s2.5 1.1193 2.5 2.5Zm-10 0C9.5 17.8807 8.38071 19 7 19s-2.5-1.1193-2.5-2.5S5.61929 14 7 14s2.5 1.1193 2.5 2.5Z"/></svg>',
    href: 'vehicles',
    group: true,
    children: [
      {
        title: 'Tipos de Vehiculos',
        icon: '',
        href: 'vehicles/Type',
        group: false,
        roles: ['Super Admin'],
      },
      {
        title: 'Vehiculos',
        icon: '',
        href: 'vehicles/',
        group: false,
        roles: ['Admin', 'Super Admin'],
      },
    ],
  },
  {
    title: 'Gestión de Inventario',
    icon: '<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 9h6m-6 3h6m-6 3h6M6.996 9h.01m-.01 3h.01m-.01 3h.01M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/></svg>',
    href: 'inventory',
    group: true,
    children: [
      {
        title: 'Repuestos',
        icon: '',
        href: 'inventory/',
        group: false,
        roles: ['Admin', 'Super Admin'],
      },
      {
        title: 'Actividades',
        icon: '',
        href: 'inventory/labour/',
        group: false,
        roles: ['Admin', 'Super Admin'],
      },
    ],
  },
  {
    title: 'Servicios y Órdenes',
    icon: '<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 18h2M5.875 3h12.25c.483 0 .875.448.875 1v16c0 .552-.392 1-.875 1H5.875C5.392 21 5 20.552 5 20V4c0-.552.392-1 .875-1Z"/></svg>',
    href: 'order',
    group: true,
    children: [
      {
        title: 'Órdenes',
        icon: '',
        href: 'order/',
        group: false,
        roles: ['Admin', 'Super Admin', 'Operador'],
      },
      {
        title: 'Reporte Mecánicos',
        icon: '',
        href: 'order/Reporte',
        group: false,
        roles: ['Admin', 'Super Admin'],
      },
      /*
      {
        title: 'Tareas Pendientes',
        icon: '',
        href: 'order/Task',
        group: false,
        roles: ['Operador', 'Admin', 'Super Admin'],
      },
      */
    ],
  },
  {
    title: 'Gestión de Citas',
    icon: '<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 6H5m2 3H5m2 3H5m2 3H5m2 3H5m11-1a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2M7 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm8 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>',
    href: 'appointments',
    group: true,
    children: [
      {
        title: 'Citas',
        icon: '',
        href: 'appointments/',
        group: false,
        roles: ['Admin', 'Super Admin'],
      },
      {
        title: 'Calendario',
        icon: '',
        href: 'appointments/calendar',
        group: false,
        roles: ['Operador', 'Admin', 'Super Admin'],
      },
    ],
  },
  {
    title: 'Gestión de Créditos',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" /></svg>',
    href: 'wallet',
    group: true,
    children: [
      {
        title: 'Cartera',
        icon: '',
        href: 'wallet/',
        group: false,
        roles: ['Super Admin'],
      },
    ],
  },
  {
    title: 'Gestión de Acceso',
    icon: '<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M6.94318 11h-.85227l.96023-2.90909h1.07954L9.09091 11h-.85227l-.63637-2.10795h-.02272L6.94318 11Zm-.15909-1.14773h1.60227v.59093H6.78409v-.59093ZM9.37109 11V8.09091h1.25571c.2159 0 .4048.04261.5667.12784.162.08523.2879.20502.3779.35937.0899.15436.1349.33476.1349.5412 0 .20833-.0464.38873-.1392.54119-.0918.15246-.2211.26989-.3878.35229-.1657.0824-.3593.1236-.5809.1236h-.75003v-.61367h.59093c.0928 0 .1719-.0161.2372-.0483.0663-.03314.1169-.08002.152-.14062.036-.06061.054-.13211.054-.21449 0-.08334-.018-.15436-.054-.21307-.0351-.05966-.0857-.10511-.152-.13636-.0653-.0322-.1444-.0483-.2372-.0483h-.2784V11h-.78981Zm3.41481-2.90909V11h-.7898V8.09091h.7898Z"/><path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M8.31818 2c-.55228 0-1 .44772-1 1v.72878c-.06079.0236-.12113.04809-.18098.07346l-.55228-.53789c-.38828-.37817-1.00715-.37817-1.39543 0L3.30923 5.09564c-.19327.18824-.30229.44659-.30229.71638 0 .26979.10902.52813.30229.71637l.52844.51468c-.01982.04526-.03911.0908-.05785.13662H3c-.55228 0-1 .44771-1 1v2.58981c0 .5523.44772 1 1 1h.77982c.01873.0458.03802.0914.05783.1366l-.52847.5147c-.19327.1883-.30228.4466-.30228.7164 0 .2698.10901.5281.30228.7164l1.88026 1.8313c.38828.3781 1.00715.3781 1.39544 0l.55228-.5379c.05987.0253.12021.0498.18102.0734v.7288c0 .5523.44772 1 1 1h2.65912c.5523 0 1-.4477 1-1v-.7288c.1316-.0511.2612-.1064.3883-.1657l.5435.2614v.4339c0 .5523.4477 1 1 1H14v.0625c0 .5523.4477 1 1 1h.0909v.0625c0 .5523.4477 1 1 1h.6844l.4952.4823c1.1648 1.1345 3.0214 1.1345 4.1863 0l.2409-.2347c.1961-.191.3053-.454.3022-.7277-.0031-.2737-.1183-.5342-.3187-.7207l-6.2162-5.7847c.0173-.0398.0342-.0798.0506-.12h.7799c.5522 0 1-.4477 1-1V8.17969c0-.55229-.4478-1-1-1h-.7799c-.0187-.04583-.038-.09139-.0578-.13666l.5284-.51464c.1933-.18824.3023-.44659.3023-.71638 0-.26979-.109-.52813-.3023-.71637l-1.8803-1.8313c-.3883-.37816-1.0071-.37816-1.3954 0l-.5523.53788c-.0598-.02536-.1201-.04985-.1809-.07344V3c0-.55228-.4477-1-1-1H8.31818Z"/></svg>',
    href: 'security',
    group: true,
    children: [
      {
        title: 'Roles',
        icon: '',
        href: 'security/role',
        group: false,
        roles: ['Super Admin'],
      },
      {
        title: 'Registro de Cuentas',
        icon: '',
        href: 'security/register',
        group: false,
        roles: ['Super Admin'],
      },
    ],
  },
];
