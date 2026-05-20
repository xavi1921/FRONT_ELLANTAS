/**
 * Variables de entorno para la configuración del sistema.
 *
 * - `API_URL`: URL base del backend para solicitudes HTTP.
 *   Actualmente apunta a la versión en producción: `'https://appfsa.com/api/'`.
 *
 * Comentarios opcionales permiten cambiar a entornos alternativos como `localhost` durante desarrollo.
 *
 * @constant
 */

const URL_LOCAL = 'http://131.196.12.248:4000/';
const URL_PROD = 'https://ellantas.emitexapi.com/';
const API_URL_IDENTITY='http://72.62.82.169:8000/'
//Cambiar la variable dependiendo del ambiente que se encuentre
export const environment = {
  API_URL: URL_PROD,
  API_URL_IDENTITY:API_URL_IDENTITY
};
