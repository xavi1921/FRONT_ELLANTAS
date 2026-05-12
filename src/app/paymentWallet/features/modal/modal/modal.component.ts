import { CommonModule } from '@angular/common';
import { Component, effect, input, OnDestroy, output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Wallet } from '../../wallet-list/wallet.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal.component.html',
})

/**
 * Componente modal encargado de registrar pagos en una billetera (`Wallet`).
 *
 * - Soporta múltiples métodos de pago: tarjeta, efectivo, transferencia.
 * - Permite seleccionar tipo de tarjeta y banco.
 * - Maneja estado de apertura (`isOpen`) y contexto de edición (`wallet`).
 * - Expone un formulario `paymentForm` con los campos necesarios para procesar el pago.
 * - Emite evento `edit` con los datos procesados y notifica cierre con `closeModal`.
 * - Gestiona suscripciones reactivas para mantener sincronía.
 */
export class ModalComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private subscriptionsInitialized = false;
  isOpen = input<boolean>(false);
  wallet = input<Wallet | null>();
  pendingAmount: number | undefined;
  originalPendingAmount: number | undefined;
  remainingAmount: number | null = null;
  closeModal = output<void>();
  edit = output<Wallet>();
  paymentForm: FormGroup;
  paymentMethods = [
    { id: 'card', name: 'Tarjeta de Crédito / Débito' },
    { id: 'cash', name: 'Efectivo' },
    { id: 'transfer', name: 'Transferencia' },
    { id: 'check', name: 'Cheque' },
  ];

  cardTypes = [
    { id: 'visa', name: 'Visa' },
    { id: 'mastercard', name: 'Mastercard' },
    { id: 'amex', name: 'American Express' },
    { id: 'diners', name: 'Diners Club' },
  ];

  banks = [
    { id: 'pichincha', name: 'Banco Pichincha' },
    { id: 'guayaquil', name: 'Banco de Guayaquil' },
    { id: 'pacifico', name: 'Banco del Pacífico' },
    { id: 'produbanco', name: 'Produbanco' },
    { id: 'internacional', name: 'Banco Internacional' },
    { id: 'bolivariano', name: 'Banco Bolivariano' },
    { id: 'other', name: 'Otro' },
  ];

  checkTypes = [
    { id: 'current', name: 'Al Día' },
    { id: 'postdated', name: 'Posfechado' },
  ];
  /**
   * Constructor del `ModalComponent` encargado de inicializar el formulario de pago (`paymentForm`)
   * con todos los campos relevantes para tarjeta, efectivo o transferencia.
   *
   * - Inyecta `FormBuilder` para construir el formulario con validaciones iniciales.
   * - Define campos:
   *   - `paymentMethod`: requerido, por defecto `'card'`.
   *   - `amount`: obligatorio y mayor a cero.
   *   - Otros campos opcionales según el método seleccionado (`cardBank`, `voucherCode`, etc.).
   *
   * - Ejecuta:
   *   - `effect(...)`: llama a `updateForm()` reactivamente al montar el componente o cambiar `wallet()`.
   *   - `listenEvents()`: enlaza escuchas a cambios dinámicos en `paymentMethod`.
   *   - `updateValidators(...)`: aplica las validaciones condicionales iniciales según el método seleccionado.
   */
  constructor(private fb: FormBuilder) {
    this.paymentForm = this.fb.group({
      _id: [''],
      paymentMethod: ['card', Validators.required],
      amount: ['', [Validators.required, this.amountValidator]],
      cardBank: [''],
      cardType: [''],
      voucherCode: [''],

      transferBank: [''],
      confirmationNumber: [''],
      transferDate: [''],

      checkType: [''],
      checkNumber: [''],
      checkBank: [''],
      checkDate: [''],
      checkHolder: [''], // Nombre del titular del cheque

      notes: [''],
      status: [''],
    });
    effect(() => {
      this.updateForm();
    });

    this.listenEvents();

    this.updateValidators(this.paymentForm.get('paymentMethod')?.value);
  }

  /**
   * Suscribe a cambios reactivos en el formulario `paymentForm`.
   *
   * - Escucha `paymentMethod.valueChanges`:
   *   - Limpia los campos no pertinentes según el método seleccionado.
   *   - Aplica validaciones condicionales a los campos relevantes.
   *
   * - Escucha `amount.valueChanges`:
   *   - Llama a `calculateAmount()` con el nuevo valor para recalcular montos o saldos.
   *
   * - Protege contra doble suscripción con `subscriptionsInitialized`.
   * - Finaliza automáticamente las suscripciones usando `destroy$`.
   */
  listenEvents() {
    if (this.subscriptionsInitialized) return;

    this.paymentForm
      .get('paymentMethod')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((method) => {
        this.cleanForm(method);
        this.updateValidators(method);
      });

    this.paymentForm
      .get('amount')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.calculateAmount(value);
      });
    this.subscriptionsInitialized = true;
  }

  /**
   * Actualiza dinámicamente las validaciones del formulario según el método de pago seleccionado.
   *
   * - Limpia previamente los validadores de todos los campos dependientes (`clearValidators`).
   * - Si `method === 'card'`, activa validación en `cardBank`, `cardType`, `voucherCode`.
   * - Si `method === 'transfer'`, activa validación en `transferBank`, `confirmationNumber`, `transferDate`.
   * - Siempre actualiza manualmente la validez de cada campo con `updateValueAndValidity()`.
   *
   * @param method - Método de pago seleccionado ('card', 'transfer', 'cash').
   */
  updateValidators(method: string): void {
    this.paymentForm.get('cardBank')?.clearValidators();
    this.paymentForm.get('cardType')?.clearValidators();
    this.paymentForm.get('voucherCode')?.clearValidators();
    this.paymentForm.get('transferBank')?.clearValidators();
    this.paymentForm.get('confirmationNumber')?.clearValidators();
    this.paymentForm.get('transferDate')?.clearValidators();

    this.paymentForm.get('checkType')?.clearValidators();
    this.paymentForm.get('checkNumber')?.clearValidators();
    this.paymentForm.get('checkBank')?.clearValidators();
    this.paymentForm.get('checkDate')?.clearValidators();
    this.paymentForm.get('checkHolder')?.clearValidators();

    if (method === 'card') {
      this.paymentForm.get('cardBank')?.setValidators([Validators.required]);
      this.paymentForm.get('cardType')?.setValidators([Validators.required]);
      this.paymentForm.get('voucherCode')?.setValidators([Validators.required]);
    } else if (method === 'transfer') {
      this.paymentForm
        .get('transferBank')
        ?.setValidators([Validators.required]);
      this.paymentForm
        .get('confirmationNumber')
        ?.setValidators([Validators.required]);
      this.paymentForm
        .get('transferDate')
        ?.setValidators([Validators.required]);
    } else if (method === 'check') {
      this.paymentForm.get('checkType')?.setValidators([Validators.required]);
      this.paymentForm.get('checkNumber')?.setValidators([Validators.required]);
      this.paymentForm.get('checkBank')?.setValidators([Validators.required]);
      this.paymentForm.get('checkDate')?.setValidators([Validators.required]);
      this.paymentForm.get('checkHolder')?.setValidators([Validators.required]);
    }

    this.paymentForm.get('cardBank')?.updateValueAndValidity();
    this.paymentForm.get('cardType')?.updateValueAndValidity();
    this.paymentForm.get('voucherCode')?.updateValueAndValidity();
    this.paymentForm.get('transferBank')?.updateValueAndValidity();
    this.paymentForm.get('confirmationNumber')?.updateValueAndValidity();
    this.paymentForm.get('transferDate')?.updateValueAndValidity();

    this.paymentForm.get('checkType')?.updateValueAndValidity();
    this.paymentForm.get('checkNumber')?.updateValueAndValidity();
    this.paymentForm.get('checkBank')?.updateValueAndValidity();
    this.paymentForm.get('checkDate')?.updateValueAndValidity();
    this.paymentForm.get('checkHolder')?.updateValueAndValidity();
  }

  /**
   * Calcula y actualiza el estado del pago en función del monto ingresado.
   *
   * - Si `pendingAmount` no está definido o el valor es `null`, no se realiza ninguna acción.
   * - Si el valor ingresado es mayor o igual al monto pendiente:
   *   - Marca el estado como `'Pagado'`.
   *   - Establece `pendingAmount = 0`.
   * - Si el valor es positivo pero menor al pendiente:
   *   - Marca el estado como `'Parcialmente Pagado'`.
   *   - Actualiza el `pendingAmount` restando el valor pagado.
   * - Si es cero o inválido:
   *   - Limpia el estado (`status = ''`) y restaura el valor original pendiente.
   *
   * @param value - Monto ingresado por el usuario.
   */
  calculateAmount(value: string | number): void {
    // Si el campo está vacío, restaurar estado inicial
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      this.paymentForm.patchValue({ status: '' }, { emitEvent: false });
      this.remainingAmount = null;
      return;
    }

    // Normalizar el valor de entrada (convertir comas a puntos)
    const normalizedValue =
      typeof value === 'string' ? value.replace(',', '.') : value.toString();

    const numericValue = Number.parseFloat(normalizedValue);

    // Si el valor no es un número válido, no hacer cálculos
    if (isNaN(numericValue) || numericValue < 0) {
      this.paymentForm.patchValue({ status: '' }, { emitEvent: false });
      this.remainingAmount = null;
      return;
    }

    //  USAR SIEMPRE EL VALOR ORIGINAL para los cálculos
    const originalPending = this.originalPendingAmount || 0;

    // Realizar cálculos basados en el valor original
    if (numericValue >= originalPending) {
      this.paymentForm.patchValue({ status: 'Pagado' }, { emitEvent: false });
      this.remainingAmount = 0;
    } else if (numericValue > 0) {
      this.paymentForm.patchValue(
        { status: 'Parcialmente Pagado' },
        { emitEvent: false }
      );
      this.remainingAmount = originalPending - numericValue;
    } else {
      this.paymentForm.patchValue({ status: '' }, { emitEvent: false });
      this.remainingAmount = null;
    }
  }
  /**
   * Envía los datos del formulario de pago si son válidos.
   *
   * - Clona el objeto `paymentForm.value` para evitar mutaciones directas.
   * - Si existe una billetera activa (`wallet()`), emite `edit` con los datos.
   * - Cierra el modal tras emitir.
   */
  onSubmit() {
    if (this.paymentForm.valid) {
      const inputAmount = this.paymentForm.value.amount || 0;
      const previousAmount = this.wallet()?.amount || 0;

      const data = {
        ...this.paymentForm.value,
        amount: previousAmount + inputAmount,
        currentAmount: inputAmount,
      };

      if (this.wallet()) {
        this.edit.emit(data);
      }
      this.onClose();
    }
  }

  /**
   * Hidrata el formulario `paymentForm` con los datos actuales de la billetera seleccionada.
   *
   * - Establece valores por defecto para `paymentMethod` (`'card'`) y limpia campos vacíos con `|| ''`.
   * - Si `amount` existe:
   *   - Si también hay `amountPending`, calcula la diferencia y la asigna a `pendingAmount`.
   * - Si no hay `amount`, simplemente asigna `amountPending`.
   * - Nota: `transferDate` está siendo asignado con `transferBank` — ¿quieres revisar si era `data.transferDate`?
   */
  updateForm() {
    if (this.wallet()) {
      const data = this.wallet();
      this.paymentForm.patchValue({
        _id: data?._id,
        paymentMethod: data?.paymentM || 'card',
        cardBank: data?.cardBank || '',
        cardType: data?.cardType || '',
        voucherCode: data?.voucherCode,
        transferBank: data?.transferBank || '',
        confirmationNumber: data?.confirmationNumber,
        transferDate: data?.transferDate,
        checkType: data?.checkType || '',
        checkNumber: data?.checkNumber || '',
        checkBank: data?.checkBank || '',
        checkDate: data?.checkDate || '',
        checkHolder: data?.checkHolder || '',
        notes: data?.notes,
      });

      //  GUARDAR EL VALOR ORIGINAL y establecer el pendiente actual
      if (data?.amount) {
        if (data.amountPending) {
          this.pendingAmount = data.amountPending - data.amount;
          this.originalPendingAmount = this.pendingAmount;
        }
      } else {
        this.pendingAmount = data?.amountPending;
        this.originalPendingAmount = this.pendingAmount;
      }
    }
  }

  /**
   * Cierra el modal de pagos de billetera.
   *
   * - Llama a `cleanForm()` para limpiar el formulario sin emitir eventos.
   * - Emite `closeModal` para notificar al componente padre del cierre.
   */
  onClose() {
    this.remainingAmount = null;
    this.cleanForm();
    this.closeModal.emit();
  }

  /**
   * Limpia los campos del formulario `paymentForm` sin disparar `valueChanges`.
   *
   * - Restaura campos clave con valores vacíos o por defecto.
   * - Mantiene `_id` (si `wallet()` existe) para conservar el contexto.
   * - Puede recibir un método explícito (`method`) para establecer como valor por defecto.
   *
   * @param method - Método de pago opcional (por defecto 'card').
   */
  cleanForm(method?: string) {
    this.paymentForm.reset(
      {
        _id: this.wallet()?._id,
        paymentMethod: method || 'card',

        cardBank: '',
        cardType: '',
        voucherCode: '',

        transferBank: '',
        confirmationNumber: '',
        transferDate: '',

        checkType: '',
        checkNumber: '',
        checkBank: '',
        checkDate: '',
        checkHolder: '',
      },
      { emitEvent: false } // evita que se dispare valueChanges
    );
  }

  // Validador personalizado para el formato de números
  private amountValidator = (control: any) => {
    if (!control.value) {
      return null; // El required validator se encarga de esto
    }

    const normalizedValue =
      typeof control.value === 'string'
        ? control.value.replace(',', '.')
        : control.value.toString();

    const numericValue = Number.parseFloat(normalizedValue);

    if (isNaN(numericValue)) {
      return { invalidFormat: true };
    }

    if (numericValue <= 0) {
      return { min: true };
    }

    return null;
  };
  /**
   * Libera recursos observables y evita fugas de memoria al destruir el componente.
   *
   * - Emite `next()` al `destroy$` y lo completa.
   * - Usado en conjunto con `takeUntil(...)` en suscripciones reactivas.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
