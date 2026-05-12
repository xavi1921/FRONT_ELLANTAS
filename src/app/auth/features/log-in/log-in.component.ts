import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogInService } from '../../data-access/log-in.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseTokenService } from '../../../shared/data-access/token/base-token.service';

@Component({
  selector: 'app-log-in',
  imports: [CommonModule, FormsModule],
  templateUrl: './log-in.component.html',
  styles: ``,
})
export class LogInComponent {
  username: string = '';
  password: string = '';
  isShowingPassword: boolean = false;
  attempts: number = 0;
  secondsRemaining: number = 0;
  interval: any;
  isButtonDisabled: boolean = false;
  logoPath: string = 'ELLANTAS_LOGO.png';

  /**
   * Constructor del componente que inyecta los servicios necesarios para autenticación, navegación y manejo de tokens.
   *
   * - Recupera el número de intentos de inicio de sesión desde `localStorage` si está disponible.
   * - Inicializa la propiedad `attempts` para llevar un control del número de intentos previos.
   *
   * @param {LogInService} loginService - Servicio encargado de la autenticación de usuarios.
   * @param {Router} router - Servicio de enrutamiento para redirigir a otras rutas.
   * @param {BaseTokenService} storage - Servicio encargado del almacenamiento de tokens o datos persistentes.
   */

  constructor(
    private loginService: LogInService,
    private router: Router,
    private storage: BaseTokenService
  ) {}

  /**
   * Alterna la visibilidad del campo de contraseña en el formulario.
   *
   * - Cambia el valor booleano de `isShowingPassword` entre `true` y `false`.
   * - Permite mostrar u ocultar dinámicamente el contenido del input de contraseña.
   */

  togglePassword() {
    this.isShowingPassword = !this.isShowingPassword;
  }

  /**
   * Limpia los campos de entrada del formulario de inicio de sesión.
   *
   * - Restablece los valores de `username` y `password` a cadenas vacías.
   * - Útil para reiniciar el formulario tras intentos fallidos o acciones específicas del usuario.
   */

  cleanInput() {
    this.username = '';
    this.password = '';
  }

  /**
   * Reinicia el contador de intentos de inicio de sesión y restablece el temporizador de espera.
   *
   * - Establece `attempts` en 0 y lo guarda en `localStorage` bajo la clave `'loginAttempts'`.
   * - Limpia el intervalo activo (`clearInterval`) para detener el conteo regresivo.
   * - Reinicia `secondsRemaining` a 60 segundos.
   * - Habilita nuevamente el botón de envío (`isButtonDisabled = false`).
   */

  resetCounter() {
    this.attempts = 0;
    localStorage.setItem('loginAttempts', this.attempts.toString());
    clearInterval(this.interval); // Limpiar el intervalo
    this.secondsRemaining = 60; // Reiniciar el contador
    this.isButtonDisabled = false;
  }

  /**
   * Inicia un contador regresivo que actualiza `secondsRemaining` cada segundo.
   *
   * - Establece el tiempo inicial con el valor recibido en `seconds`.
   * - Crea un `setInterval` que decrementa el contador cada segundo.
   * - Si el tiempo llega a cero, limpia el intervalo y llama a `resetCounter()` para restablecer el estado.
   *
   * @param {number} seconds - Cantidad de segundos con los que inicia el contador.
   */

  startCounter(seconds: number) {
    this.secondsRemaining = seconds; // Establecer tiempo restante
    this.interval = setInterval(() => {
      if (this.secondsRemaining <= 0) {
        // Si el tiempo se acabó
        clearInterval(this.interval); // Limpiar el intervalo
        this.resetCounter(); // Reiniciar contador y habilitar botón
      } else {
        this.secondsRemaining--; // Decrementar tiempo restante
      }
    }, 1000); // Disminuir cada segundo
  }

  /**
   * Maneja el intento de inicio de sesión del usuario.
   *
   * - Verifica si ambos campos (`username`, `password`) están completos; si no, muestra una advertencia.
   * - Si los intentos superan el umbral (≥3), desactiva el botón, limpia los campos y lanza una alerta de espera.
   * - Si se permite el intento, se llama al servicio `loginService.login()`:
   *    - En caso de éxito: limpia los campos, reinicia el contador, almacena el token y redirige a `appointments/calendar`.
   *    - En caso de error: incrementa el contador, limpia los campos, guarda los intentos en `localStorage`, y lanza una alerta con los intentos restantes.
   *    - Si se alcanza el límite tras el error, inicia el temporizador de bloqueo (`startCounter(60)`).
   */

  onSubmit() {
    if (!this.username || !this.password) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor, llene todos los campos',
        icon: 'warning',
        timer: 1500,
      });
      return;
    }

    this.loginService.login(this.username, this.password).subscribe({
      next: (response) => {
        this.storage.setToken(response.token);
        Swal.fire({
          title: 'Inicio de sesión exitoso',
          text: 'Bienvenido',
          icon: 'success',
          timer: 1500,
        }).then(() => {
          this.router.navigate(['/appointments/calendar']);
        });
      },
      error: (error: HttpErrorResponse) => {
        this.cleanInput();
        const errorMessage =
          error.error && error.error.message
            ? error.error.message
            : 'Error en el inicio de sesión.';

        Swal.fire({
          title: 'Error',
          text: errorMessage, // El mensaje ya no incluye los intentos restantes
          icon: 'error',
          timer: 1500,
        });
      },
    });
  }
}
