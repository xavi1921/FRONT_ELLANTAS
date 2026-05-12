import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ValidateService } from '../../../core/validation/validation.service';
import Swal from 'sweetalert2';
import { RecoverService } from '../../data-access/recover.service';
@Component({
  selector: 'app-recover',
  imports: [CommonModule, FormsModule],
  templateUrl: './recover.component.html',
  styles: ``,
})
export class RecoverComponent {
  email: string = '';
  invalidEmail: boolean = false;
  loading: boolean = false;
  constructor(
    private validateService: ValidateService,
    private service: RecoverService,
    private router: Router
  ) {}

  /**
   * Limpia el campo de correo electrónico (`email`) del formulario.
   *
   * - Restablece su valor a una cadena vacía.
   * - Útil después de envíos o errores para reiniciar el estado del formulario.
   */

  cleanInput() {
    this.email = '';
  }

  /**
   * Maneja el envío del formulario de recuperación de contraseña.
   *
   * - Valida el formato del correo electrónico (`validateEmail`). Si es inválido, marca `invalidEmail` y detiene la operación.
   * - Si es válido:
   *    - Activa la bandera de carga (`loading = true`).
   *    - Llama al servicio `recover` con el correo proporcionado.
   *      - En caso exitoso (`next`): muestra una alerta con `Swal` y redirige al login.
   *      - En caso de error (`error`): muestra una advertencia y limpia el campo.
   *      - En cualquier caso (`complete`): limpia el input y desactiva la carga.
   */

  onSubmit() {
    this.invalidEmail = false;
    if (!this.validateService.validateEmail(this.email)) {
      this.invalidEmail = true;
      return;
    }
    this.loading = true;
    this.service.recover(this.email).subscribe({
      next: (response) => {
        Swal.fire({
          title: 'Enlace de recuperación',
          text: response.message,
          icon: 'success',
          timer: 1800,
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (error) => {
        Swal.fire({
          title: 'Verifique el correo ingresado',
          text:
            error?.error?.message ||
            'Ocurrió un error al procesar la solicitud.',
          icon: 'warning',
          timer: 1800,
        }).then(() => {
          this.cleanInput();
          this.loading = false;
        });
      },
      complete: () => {
        this.cleanInput();
        this.loading = false;
      },
    });
  }
}
