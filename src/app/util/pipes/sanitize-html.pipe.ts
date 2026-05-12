import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Pipe de transformación que sanitiza contenido HTML para renderizado seguro.
 *
 * - Usa `DomSanitizer.bypassSecurityTrustHtml()` para marcar contenido como seguro explícitamente.
 * - Ideal para mostrar fragmentos HTML generados dinámicamente o provenientes de fuentes externas controladas.
 *
 *  Este pipe desactiva la protección de Angular contra XSS.
 *
 * @example
 *   {{ htmlContent | sanitizeHtml }}
 */
@Pipe({
  name: 'sanitizeHtml',
  standalone: true,
})
export class SanitizeHtmlPipe implements PipeTransform {
  constructor(private _sanitizer: DomSanitizer) {}

  /**
   * Transforma una cadena de texto HTML en contenido seguro (`SafeHtml`) para su renderización.
   *
   * - Usa `DomSanitizer.bypassSecurityTrustHtml()` para marcar explícitamente el HTML como confiable.
   * - Ideal cuando se necesita insertar HTML dinámico en la plantilla sin que Angular lo bloquee.
   *
   * Sólo debe utilizarse con contenido **100% confiable**.
   * Desactiva las protecciones contra XSS que ofrece Angular por defecto.
   *
   * @param v - Cadena de texto HTML a sanitizar.
   * @returns Contenido HTML marcado como seguro (`SafeHtml`).
   */
  transform(v: string): SafeHtml {
    return this._sanitizer.bypassSecurityTrustHtml(v);
  }
}
