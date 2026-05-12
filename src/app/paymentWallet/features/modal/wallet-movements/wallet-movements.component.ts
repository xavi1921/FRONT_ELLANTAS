import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Wallet } from '../../wallet-list/wallet.model';
interface Payment {
  paymentM: string;
  amount: number;
  methodDetails: any;
  createdAt: Date;
}
@Component({
  selector: 'app-wallet-movements',
  imports: [CommonModule],
  templateUrl: './wallet-movements.component.html',
  styles: ``,
})
export class WalletMovementsComponent {
  @Input() isModalOpen = false;
  @Input() wallet: Wallet | null = null;
  @Output() closeModal = new EventEmitter<void>();

  // Mapeo de métodos de pago para mostrar nombres legibles
  paymentMethodNames = {
    card: 'Tarjeta de Crédito/Débito',
    cash: 'Efectivo',
    transfer: 'Transferencia',
    check: 'Cheque',
  };

  // Mapeo de tipos de tarjeta
  cardTypeNames = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    diners: 'Diners Club',
  };

  // Mapeo de bancos
  bankNames = {
    pichincha: 'Banco Pichincha',
    guayaquil: 'Banco de Guayaquil',
    pacifico: 'Banco del Pacífico',
    produbanco: 'Produbanco',
    internacional: 'Banco Internacional',
    bolivariano: 'Banco Bolivariano',
    other: 'Otro',
  };

  // Mapeo de tipos de cheque
  checkTypeNames = {
    current: 'Al Día',
    postdated: 'Posfechado',
  };

  constructor() {}

  onClose(): void {
    this.closeModal.emit();
  }

  isOpen(): boolean {
    return this.isModalOpen;
  }

  // Obtener el nombre legible del método de pago
  getPaymentMethodName(method: string): string {
    if (method in this.paymentMethodNames) {
      return this.paymentMethodNames[
        method as keyof typeof this.paymentMethodNames
      ];
    }
    return method;
  }

  // Obtener el nombre legible del banco
  getBankName(bankId: string): string {
    if (bankId in this.bankNames) {
      return this.bankNames[bankId as keyof typeof this.bankNames];
    }
    return bankId;
  }

  // Obtener el nombre legible del tipo de tarjeta
  getCardTypeName(cardType: string): string {
    if (cardType in this.cardTypeNames) {
      return this.cardTypeNames[cardType as keyof typeof this.cardTypeNames];
    }
    return cardType;
  }

  // Obtener el nombre legible del tipo de cheque
  getCheckTypeName(checkType: string): string {
    console.log(checkType)
    if (checkType in this.checkTypeNames) {
      return this.checkTypeNames[checkType as keyof typeof this.checkTypeNames];
    }
    return checkType;
  }

  // Calcular el total de pagos realizados
  getTotalPayments(): number {
    console.log(this.wallet);
    if (!this.wallet?.payments) return 0;
    return this.wallet.payments.reduce(
      (total, payment) => total + payment.amount,
      0
    );
  }

  // Obtener los pagos ordenados por fecha (más recientes primero)
  getSortedPayments(): Payment[] {
    if (!this.wallet?.payments) return [];
    return [...this.wallet.payments].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Formatear fecha para mostrar
  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Obtener el ícono según el método de pago
  getPaymentIcon(method: string): string {
    const icons: { [key: string]: string } = {
      card: '💳',
      cash: '💵',
      transfer: '💸',
      check: '📝',
    };
    return icons[method] || '💰';
  }

  // Obtener el color del badge según el método de pago
  getPaymentBadgeColor(method: string): string {
    const colors: { [key: string]: string } = {
      card: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      cash: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      transfer:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      check:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };

    return (
      colors[method] ||
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    );
  }

  // Obtener gradiente según el método de pago
  getPaymentGradient(method: string): string {
    const gradients: { [key: string]: string } = {
      card: 'from-blue-500 to-blue-600',
      cash: 'from-green-500 to-green-600',
      transfer: 'from-purple-500 to-purple-600',
      check: 'from-yellow-500 to-yellow-600',
    };
    return gradients[method] || 'from-gray-500 to-gray-600';
  }

  // Obtener fondo del ícono según el método de pago
  getPaymentIconBg(method: string): string {
    const backgrounds: { [key: string]: string } = {
      card: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      cash: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      transfer:
        'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      check:
        'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    };

    return (
      backgrounds[method] ||
      'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
    );
  }

  get hasPayments(): boolean {
    return (this.wallet?.payments?.length ?? 0) > 0;
  }
}
