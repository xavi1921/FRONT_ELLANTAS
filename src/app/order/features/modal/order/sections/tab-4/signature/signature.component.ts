import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  output,
  ViewChild,
} from '@angular/core';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-signature',
  imports: [],
  templateUrl: './signature.component.html',
  styles: ``
})

/**
 * Componente de firma digital que permite al usuario dibujar sobre un `<canvas>` 
 * y emitir el resultado como una imagen en base64.
 *
 * - Escucha el resize de ventana para redimensionar el canvas con soporte de DPI.
 * - Usa `SignaturePad` como motor principal de dibujo.
 * - Emite un evento cuando se completa una firma (`signatureCompleted`).
 * - Permite limpiar o precargar una firma con `clear()` y `redrawSignature(...)`.
 */
export class SignatureComponent implements AfterViewInit, OnDestroy{
  signatureCompleted = output<string>();
  @ViewChild('signatureDiv') signatureDiv!: ElementRef;
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;

  private signaturePad!: SignaturePad;
  @HostListener('window:resize', ['$event'])

 
  resizeCanvas() {
    const canvas = this.signatureCanvas.nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    const width = this.signatureDiv.nativeElement.clientWidth;
    const height = this.signatureDiv.nativeElement.clientHeight;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    this.signaturePad.clear();
  }

  onResize() {
    this.resizeCanvas();
  }

  ngAfterViewInit() {
    this.signaturePad = new SignaturePad(this.signatureCanvas.nativeElement, {
      minWidth: 0.8,
      maxWidth: 0.8,
      velocityFilterWeight: 0.1,
      throttle: 0,
      minDistance: 0,
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: 'rgb(0, 0, 0)',
    });

    this.signaturePad.addEventListener('endStroke', () => {
      this.drawComplete();
    });

    this.resizeCanvas();
  }

  ngOnDestroy() {
    this.signaturePad.off();
  }

  handleSignatureCanvasSize() {
    const canvas = document.querySelector('canvas');
    const tempWidth = String(this.signatureDiv.nativeElement.clientWidth);
    const widthCanvas = tempWidth.concat('px');
    canvas?.setAttribute('width', widthCanvas);
  }

  drawComplete() {
    this.signatureCompleted.emit(this.signaturePad.toDataURL());
  }

  clear() {
      this.signaturePad.clear();
  }

  redrawSignature(firma: string) {
    this.signaturePad.clear();
    this.signaturePad.fromDataURL(firma);
  }
}
