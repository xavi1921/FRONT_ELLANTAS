import { Component } from '@angular/core';
import { BaseTokenService } from '../../../data-access/token/base-token.service';
import { Router } from '@angular/router';

type User = {
  initials: string;
  username: string;
};

/**
 * Componente de perfil de usuario que muestra información básica y permite cerrar sesión.
 *
 * - Recupera los datos del usuario desde el token (`BaseTokenService`).
 * - Controla la visibilidad de un dropdown de perfil (`isDropdownOpen`).
 * - Permite terminar la sesión eliminando el token y redirigiendo al login.
 */
@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.component.html',
  styles: ``,
})
export class ProfileComponent {
  /** Controla la visibilidad del menú de perfil */
  isDropdownOpen = false;
  /** Datos del usuario autenticado */
  dataUser!: User;
  constructor(private router: Router, private token: BaseTokenService) {
    this.loadDataUser();
  }

  /**
   * Alterna la visibilidad del dropdown de perfil.
   */
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /**
   * Termina la sesión del usuario actual.
   *
   * - Elimina el token JWT del almacenamiento.
   * - Redirige al usuario a la vista de login.
   */
  endSession() {
    this.token.deleteToken();
    this.router.navigate(['/login']);
  }

  /**
   * Carga los datos del usuario decodificando el token.
   *
   * - Asigna las propiedades esperadas de `User`: `initials`, `username`.
   * - Se espera que estas propiedades estén presentes en el payload JWT.
   */
  loadDataUser() {
    const user = this.token.decodedToken();
    this.dataUser = user;
  }
}
