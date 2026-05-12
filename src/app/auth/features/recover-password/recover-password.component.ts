import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ValidateService } from '../../../core/validation/validation.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TokenStorageService } from '../../../shared/data-access/token/token-storage.service';
import { RecoverService } from '../../data-access/recover.service';

@Component({
  selector: 'app-recover-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './recover-password.component.html',
  styles: ``,
})
export class RecoverPasswordComponent {
  newPassword: string = '';
  confirmPassword: string = '';
  isShowingNewPassword: boolean = false;
  isShowingConfirmPassword: boolean = false;
  constructor(
    private service: RecoverService,
    private storage: TokenStorageService,
    private validateService: ValidateService,
    private router: Router
  ) {}

  /**
   * Valida si las contraseñas ingresadas no coinciden.
   *
   * - Retorna `true` si ambos campos (`newPassword` y `confirmPassword`) tienen valor
   *   y son diferentes entre sí.
   * - Retorna `false` si alguno está vacío o si ambos coinciden.
   *
   * @returns {boolean} `true` si las contraseñas no coinciden; de lo contrario, `false`.
   */

  get passwordsDoNotMatch(): boolean {
    return (
      !!this.newPassword &&
      !!this.confirmPassword &&
      this.newPassword !== this.confirmPassword
    );
  }

  /**
   * Verifica si la nueva contraseña cumple con los criterios de validación definidos.
   *
   * - Utiliza `validatePassword` del `validateService` para validar el valor de `newPassword`.
   *
   * @returns {boolean} `true` si la contraseña es válida según las reglas establecidas; de lo contrario, `false`.
   */

  get isPasswordValid(): boolean {
    return this.validateService.validatePassword(this.newPassword);
  }

  /**
   * Alterna la visibilidad del campo de nueva contraseña en el formulario.
   *
   * - Invierte el valor de `isShowingNewPassword` para mostrar u ocultar el contenido del campo.
   */

  toggleNewPassword() {
    this.isShowingNewPassword = !this.isShowingNewPassword;
  }

  /**
   * Alterna la visibilidad del campo de confirmación de contraseña.
   *
   * - Invierte el valor booleano de `isShowingConfirmPassword` para mostrar u ocultar dinámicamente el contenido del campo.
   */

  toggleConfirmPassword() {
    this.isShowingConfirmPassword = !this.isShowingConfirmPassword;
  }

  /**
   * Limpia los campos del formulario relacionados con la creación o cambio de contraseña.
   *
   * - Restablece los valores de `newPassword` y `confirmPassword` a cadenas vacías.
   * - Útil para reiniciar el formulario tras envíos exitosos o errores de validación.
   */
  cleanInputs() {
    this.newPassword = '';
    this.confirmPassword = '';
  }

  /**
   * Envía el formulario de restablecimiento de contraseña si las validaciones son correctas.
   *
   * - Verifica que las contraseñas coincidan (`!passwordsDoNotMatch`) y que sean válidas (`isPasswordValid`).
   * - Obtiene el `id` del usuario desde el token decodificado (`storage.getDecodedToken()`).
   * - Llama al servicio `resetPassword` con el `id` y la nueva contraseña:
   *    - En caso de éxito (`next`): muestra alerta de éxito y redirige al login.
   *    - En caso de error (`error`): muestra alerta con el mensaje de error o mensaje genérico si no hay respuesta del servidor.
   * - Finalmente, limpia los campos de contraseña llamando a `cleanInputs()`.
   */

  onSubmit() {
    if (!this.passwordsDoNotMatch && this.isPasswordValid) {
      const data = this.storage.getDecodedToken();
      this.service.resetPassword(data.id, this.newPassword).subscribe({
        next: (response) => {
          Swal.fire({
            title: 'Cambio de Contraseña realizado correctamente',
            icon: 'success',
            timer: 1500,
          }).then(() => {
            this.router.navigate(['/login']);
          });
        },
        error: (error) => {
          if (error.error) {
            const errorMessage =
              error.error.message || 'Ocurrió un error inesperado';
            Swal.fire({
              title: 'Error',
              text: errorMessage,
              icon: 'error',
              timer: 2500,
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo conectar con el servidor',
              icon: 'error',
              timer: 2500,
            });
          }
        },
      });
    }
    this.cleanInputs();
  }
}
