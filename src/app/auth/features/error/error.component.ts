import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
@Component({
  selector: 'app-error',
  imports: [],
  templateUrl: './error.component.html',
  styles: ``,
})
export class ErrorComponent implements OnInit {
  title: string = 'ERROR';
  message: string = 'Ha ocurrido un error';
  showLink: boolean = false;
  linkText: string = 'Enviar enlace de recuperación';

  constructor(private route: ActivatedRoute, private r: Router) {}

  /**
   * Método del ciclo de vida `OnInit` que inicializa las propiedades del componente
   * a partir de los datos y parámetros de la ruta actual.
   *
   * - Suscribe a `route.data` para obtener `title` y `message` definidos en la configuración de rutas.
   * - Suscribe a `route.queryParams` para sobrescribir `title`, `message` y controlar visibilidad (`showLink`).
   */

  ngOnInit() {
    this.route.data.subscribe((data) => {
      if (data && data['title']) {
        this.title = data['title'];
      }
      if (data && data['message']) {
        this.message = data['message'];
      }
    });

    this.route.queryParams.subscribe((params) => {
      this.title = params['title'] || this.title;
      this.message = params['message'] || this.message;
      this.showLink = params['showLink'] === 'true';
    });
  }

  /**
   * Navega a la página de recuperación de contraseña (`auth/recover`).
   *
   * - Utiliza el servicio de enrutamiento (`r.navigate`) para redirigir al usuario.
   */

  recoveryPage() {
    this.r.navigate(['auth/recover']);
  }
}
