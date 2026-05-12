import {
  AfterViewInit,
  Component,
  input,
  ViewChild,
} from '@angular/core';
import { SignatureComponent } from './signature/signature.component';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-tab-4',
  imports: [SignatureComponent, ReactiveFormsModule, FormsModule],
  templateUrl: './tab-4.component.html',
  styles: ``,
})

/**
 * Componente visual que encapsula la lógica del tab de firma digital.
 *
 * - Recibe un `FormGroup` como `input` para manipular el control reactivo `signature`.
 * - Integra el componente `SignatureComponent` para gestionar el canvas de dibujo.
 * - Si ya existe una firma (`signature` como input), la renderiza al iniciar.
 * - Permite limpiar, cargar y registrar firmas desde el canvas.
 */
export class Tab4Component implements AfterViewInit {
  form = input<FormGroup | null>(null);
  signature = input<string>('');
  clear: boolean = false;

  @ViewChild(SignatureComponent) signatureComponent!: SignatureComponent;

  /**
   * Angular lifecycle hook que se dispara después de renderizar la vista.
   *
   * - Si existe una firma previa (`signature`), la vuelve a renderizar en el canvas.
   */
  ngAfterViewInit() {
    if (this.signature()) {
      this.redrawSignature(this.signature());
    }
  }

  /**
   * Guarda el valor de la firma capturada en el formulario reactivo.
   *
   * @param {string} signature - Firma codificada en base64.
   */
  isSignatured(signature: string) {
    this.form()?.get('signature')?.setValue(signature);
  }

  /**
   * Limpia el campo de firma del formulario y borra el canvas visual.
   *
   * @param {Event} event - Evento de clic que debe ser cancelado para evitar burbujas.
   */
  clearSignature(event: Event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.form()?.get('signature')?.setValue('');
    this.signatureComponent.clear();
  }

  /**
   * Reproduce visualmente una firma previa en el canvas, si el componente está inicializado.
   *
   * @param {string} signature - Cadena en base64 de la firma a reproducir.
   */
  redrawSignature(signature: string) {
    if (this.signatureComponent) {
      this.signatureComponent.redrawSignature(signature);
    }
  }
}
