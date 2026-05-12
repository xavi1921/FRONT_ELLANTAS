import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidateService {

  constructor() { }

  /**
   * Verifica si la contraseña cumple con los requisitos de al menos 8 caracteres y al menos un carácter especial.
   * @param {string} password - La contraseña a verificar.
   * @returns {boolean} Un valor booleano que indica si la contraseña cumple con los requisitos.
   */
  validatePassword(password: string): boolean {
    const specialChars = /[!@#$%^&*()_+\.,;:\-]/g;
    const hasEnoughSpecialChars = (password.match(specialChars) || []).length >= 1;
    const hasEnoughLength = password.length >= 8;
    return hasEnoughLength && hasEnoughSpecialChars;
  }

  /**
   * Valida si el correo electrónico tiene un formato correcto.
   * @param {string} email - La dirección de correo electrónico a validar.
   * @returns {boolean} Un valor booleano.
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(email);
  }

  /**
   * Valida el número de cédula ecuatoriana.
   * @param {string} cedula - El número de cédula a verificar.
   * @returns {boolean} Un valor booleano que indica si la cédula es válida.
   */
  validateCedula(cedula: string): boolean {
    if (cedula.length !== 10) {
      return false;
    }

    const provincia = parseInt(cedula.substring(0, 2));
    const tercerDigito = parseInt(cedula[2]);

    if (provincia < 0 || provincia > 24 || tercerDigito > 5) {
      return false;
    }

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < coeficientes.length; i++) {
      let resultado = parseInt(cedula[i]) * coeficientes[i];
      if (resultado > 9) {
        resultado -= 9;
      }
      suma += resultado;
    }

    const digitoVerificador = (10 - (suma % 10)) % 10;
    const digitoCedula = parseInt(cedula[9]);

    return digitoVerificador === digitoCedula;
  }

  /**
   * Valida si el RUC corresponde a una persona jurídica.
   * @param {string} ruc - El número de RUC a verificar.
   * @returns {boolean} Un valor booleano que indica si el RUC es válido.
   */
validateRUCJuridico(ruc: string): boolean {
  if (ruc.length !== 13) {
    return false;
  }

  const tercerDigito = parseInt(ruc[2]);
  const establecimiento = ruc.slice(-3);

  if (tercerDigito >= 0 && tercerDigito <= 5) {
    const cedula = ruc.substring(0, 10);
    return this.validateCedula(cedula) && establecimiento === '001';
  } else if (tercerDigito === 6) {
    return this.validateEntidadPublica(ruc);
  } else if (tercerDigito === 9) {
    return this.validateSociedadPrivada(ruc);
  }

  return false;
}
  validateEntidadPublica(ruc: string): boolean {
  if (ruc.length !== 13 || ruc.slice(-4) !== '0001') {
    return false;
  }

  const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
  const digitos = ruc.split('').map(d => parseInt(d));
  let suma = 0;

  for (let i = 0; i < coeficientes.length; i++) {
    suma += coeficientes[i] * digitos[i];
  }

  const residuo = suma % 11;
  const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;

  return digitoVerificador === digitos[8];
}

validateSociedadPrivada(ruc: string): boolean {
  const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digitos = ruc.split('').map(d => parseInt(d));
  let suma = 0;

  for (let i = 0; i < coeficientes.length; i++) {
    suma += coeficientes[i] * digitos[i];
  }

  const residuo = suma % 11;
  const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;

  if (digitoVerificador !== digitos[9]) {
    return false;
  }

  return ruc.slice(-3) === '001';
}

  /**
   * Verifica si un texto contiene solo letras y espacios.
   * @param {string} texto - El texto a validar.
   * @returns {boolean} Un valor booleano.
   */
  validarLetras(texto: string): boolean {
    const letrasPattern = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]*$/;
    return letrasPattern.test(texto);
  }

  /**
   * Verifica si una cadena contiene solo números.
   * @param {string} numeros - La cadena de números a validar.
   * @returns {boolean} Un valor booleano.
   */
  validarNumeros(numeros: string): boolean {
    const numerosPattern = /^[0-9]*$/;
    return numerosPattern.test(numeros);
  }

  validarPrecios(value: string): boolean {
    return /^[0-9]+(\.[0-9]+)?$/.test(value); // Acepta enteros y decimales con punto
  }
  
  validatePorcentaje(discapacidad: boolean, porcentaje: any): boolean {
    if (!discapacidad) {
      return true; 
    }
    return porcentaje !== null && porcentaje !== '' && porcentaje >= 0 && porcentaje <= 100;
  }

  validateAge(birthdate: string): boolean {
    if (!birthdate) {
      return false; 
    }
  
    const today = new Date();
    const birthDate = new Date(birthdate);

    const diffYears = today.getFullYear() - birthDate.getFullYear();
    const isBirthdayPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
    
    return diffYears > 18 || (diffYears === 18 && isBirthdayPassed);
  }

  validateIngreso(fechaIngreso: string): boolean {
    if (!fechaIngreso) {
      return false; 
    }
  
    const today = new Date();
    const ingresoDate = new Date(fechaIngreso);
  
    today.setHours(0, 0, 0, 0); 
    ingresoDate.setHours(0, 0, 0, 0);
  
    return ingresoDate <= today; 
  }
  
  
}
