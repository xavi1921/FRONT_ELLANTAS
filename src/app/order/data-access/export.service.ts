import { Injectable } from '@angular/core';
import jsPdf from 'jspdf';
type PaymentMethod = 'tarjeta' | 'efectivo' | 'Transferencia' | 'Credito';
@Injectable({
  providedIn: 'root',
})
export class ExportService {
  constructor() {}
  /**
   * Coordenadas absolutas (X, Y) utilizadas para posicionar dinámicamente contenido en un documento (por ejemplo, PDF).
   *
   * - Organizado por secciones visuales del documento: datos del cliente, vehículo, mano de obra, repuestos, observaciones y totales.
   * - Cada clave representa un campo específico y su ubicación exacta medida en puntos.
   * - Ideal para herramientas de manipulación de documentos que requieren posicionamiento manual.
   *
   * Ejemplo de uso:
   * `pdf.drawText(data.codigo, { x: COORDINATES.codigo.x, y: COORDINATES.codigo.y });`
   */

  private readonly COORDINATES = {
    //PAGE 1
    codigo: { x: 410, y: 223 },
    fecha_ingreso: { x: 227, y: 262 },
    hora_ingreso: { x: 450, y: 262 },
    fecha_entrega: { x: 641, y: 262 },
    hora_entrega: { x: 842, y: 262 },
    razon_social: { x: 210, y: 322 },
    dni: { x: 908, y: 322 },
    direccion: { x: 185, y: 356 },
    telefono: { x: 889, y: 356 },

    //DATOS DEL VEHICULO
    placa: { x: 145, y: 419 },
    marca: { x: 295, y: 419 },
    modelo: { x: 540, y: 415 },
    color: { x: 859, y: 419 },
    año: { x: 1056, y: 419 },
    serie_chasis: { x: 206, y: 456 },
    kmts: { x: 559, y: 456 },
    forma_pago: { x: 958, y: 454 },
    //MANO DE OBRA
    primera_fila_detalle: { x: 100, y: 576 },
    primera_fila_valor: { x: 1000, y: 576 },
    total_mano_obra: { x: 1000, y: 928 },
    //REPUESTOS
    primera_fila_codigo: { x: 135, y: 1082 },
    primera_fila_producto: { x: 270, y: 1082 },
    primera_fila_precioUnitario: { x: 749, y: 1082 },
    primera_fila_cantidad: { x: 917, y: 1082 },
    primera_fila_valor_total: { x: 1020, y: 1082 },
    total_repuesto: { x: 1020, y: 1447 },

    //OBSERVACIONES
    observaciones: { x: 99, y: 1546 },
    //VALOR TOTAL
    abono: { x: 1040, y: 1602 },
    valor_pendiente: { x: 1040, y: 1627 },
    valor_total: { x: 1040, y: 1655 },
    //PROPIETARIO
    cc: { x: 135, y: 1655 },
    delegado: { x: 102, y: 1610 },

    //PAGINAS INDIVIDUALES
    //REPUESTOS
    repuesto_codigo: { x: 130, y: 581 },
    repuesto_producto: { x: 270, y: 581 },
    repuesto_precioUnitario: { x: 738, y: 581 },
    repuesto_cantidad: { x: 912, y: 581 },
    repuesto_valor_total: { x: 1017, y: 581 },

    //Mano de obra
    total_actividades: { x: 1043, y: 1558 },
  };

  /**
   * Genera un archivo PDF visual a partir de imágenes de plantilla y datos de una orden.
   *
   * - Por cada imagen en `pageImages`, genera una página del PDF:
   *   - Carga la imagen en un `canvas` HTML.
   *   - Obtiene el contexto `2D` del `canvas`.
   *   - Llama a `drawPage()` para renderizar datos sobre la imagen según el índice y los datos de la orden.
   *   - Convierte el `canvas` a `dataURL` para agregarlo al PDF.
   * - Guarda el PDF con nombre basado en el cliente: `ORDEN-{fullName}.pdf`.
   *
   * @param {any} order - Objeto de orden con los datos a insertar en el documento.
   * @returns {Promise<void>} Promesa que se resuelve al completar la generación y descarga del PDF.
   */

  public async generatePdf(order: any): Promise<void> {
    const pdf = new jsPdf();

    const pageImages = ['MECANICA_002.png'];

    for (let i = 0; i < pageImages.length; i++) {
      if (i > 0) pdf.addPage();
      const canvas = await this.loadImageToCanvas(pageImages[i]);
      const ctx = canvas.getContext('2d')!;
      await this.drawPage(ctx, i, order);
      const imgData = canvas.toDataURL('image/jpeg');
      pdf.addImage(
        imgData,
        'JPEG',
        0,
        0,
        pdf.internal.pageSize.width,
        pdf.internal.pageSize.height,
      );
    }
    pdf.save(`ORDEN-${order.preInvoice.subscriber.fullName}.pdf`);
  }

  /**
   * Carga una imagen desde la ruta proporcionada y la retorna como `HTMLImageElement` en una promesa.
   *
   * - Crea una instancia de `Image`.
   * - Asigna `onload` para resolver la promesa una vez que la imagen se ha cargado exitosamente.
   * - Asigna `onerror` para rechazar la promesa si ocurre un error.
   * - Establece `src` con la ruta proporcionada (`imagePath`) para iniciar la carga.
   *
   * @param {string} imagePath - Ruta o URL de la imagen a cargar.
   * @returns {Promise<HTMLImageElement>} Promesa que se resuelve con el elemento de imagen cargado.
   */

  private loadImage(imagePath: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imagePath;
    });
  }
  /**
   * Carga una imagen desde la ruta especificada y la dibuja en un `canvas` del mismo tamaño.
   *
   * - Crea dinámicamente un elemento `<canvas>`.
   * - Obtiene su contexto 2D (`getContext('2d')`).
   * - Usa `loadImage()` para cargar la imagen desde la ruta proporcionada (`imagePath`).
   * - Ajusta las dimensiones del `canvas` a las de la imagen.
   * - Dibuja la imagen en el `canvas` en la posición (0,0).
   * - Devuelve el `canvas` con la imagen renderizada.
   *
   * @param {string} imagePath - Ruta o URL de la imagen a cargar y renderizar.
   * @returns {Promise<HTMLCanvasElement>} Promesa que resuelve con el `canvas` que contiene la imagen.
   */

  private async loadImageToCanvas(
    imagePath: string,
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = await this.loadImage(imagePath);

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    return canvas;
  }

  /**
   * Dibuja texto en un `canvas` utilizando las coordenadas proporcionadas.
   *
   * - Utiliza el contexto `CanvasRenderingContext2D` para renderizar el texto.
   * - La posición del texto está determinada por las coordenadas absolutas `x` e `y`.
   *
   * @param {CanvasRenderingContext2D} ctx - Contexto del `canvas` en el que se dibujará el texto.
   * @param {string} text - Texto que se va a renderizar.
   * @param {{ x: number; y: number }} coordinates - Posición en el `canvas` donde se colocará el texto.
   */

  private fillText(
    ctx: CanvasRenderingContext2D,
    text: string,
    coordinates: { x: number; y: number },
  ): void {
    ctx.fillText(text, coordinates.x, coordinates.y);
  }

  /**
   * Configura el estilo de texto para un `canvas`, incluyendo tamaño, fuente y color.
   *
   * - Ajusta la propiedad `font` del contexto con el tamaño y tipo de letra deseados.
   * - Establece el color del texto mediante `fillStyle`.
   *
   * @param {CanvasRenderingContext2D} ctx - Contexto del canvas donde se aplicarán los estilos.
   * @param {number} size - Tamaño de fuente en píxeles.
   * @param {string} [style='Arial'] - Tipo de fuente (por defecto 'Arial').
   * @param {string} [color='black'] - Color del texto (por defecto 'black').
   */

  private setFont(
    ctx: CanvasRenderingContext2D,
    size: number,
    style: string = 'Arial',
    color: string = 'black',
  ): void {
    ctx.font = `${size}px ${style}`;
    ctx.fillStyle = color;
  }

  /**
   * Divide un texto largo en múltiples líneas, respetando un ancho máximo visual (`maxWidth`)
   * y una cantidad máxima de caracteres (`maxChars`) por línea.
   *
   * - Mide el ancho del texto con `ctx.measureText()` para evitar desbordes visuales.
   * - Divide la cadena en palabras y las acomoda progresivamente en líneas.
   * - Genera un arreglo de líneas (`string[]`) para ser renderizadas posteriormente.
   *
   * @param {CanvasRenderingContext2D} ctx - Contexto del canvas para medir el ancho del texto.
   * @param {string} text - Texto completo a dividir.
   * @param {number} maxWidth - Ancho máximo en píxeles permitido por línea.
   * @param {number} maxChars - Límite máximo de caracteres por línea como respaldo.
   * @returns {string[]} Arreglo de líneas de texto ajustadas según los límites especificados.
   */

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxChars: number,
  ) {
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      let testLine = currentLine + (currentLine ? ' ' : '') + word;
      let testWidth = ctx.measureText(testLine).width;

      // Si excede caracteres o ancho, se guarda la línea anterior
      if (testWidth > maxWidth || testLine.length > maxChars) {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Determina la lógica de dibujo según el índice de página y delega el renderizado correspondiente.
   *
   * - Si `pageIndex` es 0, llama a `drawPageOne()` pasando el contexto del canvas y los datos de la orden.
   * - Para cualquier otro índice, registra un mensaje en consola indicando que no hay lógica definida.
   *
   * @param {CanvasRenderingContext2D} ctx - Contexto gráfico del canvas donde se dibujará la página.
   * @param {number} pageIndex - Índice de la página actual (comenzando en 0).
   * @param {any} order - Datos de la orden para pintar sobre el canvas.
   * @returns {Promise<void>} Promesa que se resuelve cuando finaliza el dibujo de la página.
   */

  private async drawPage(
    ctx: CanvasRenderingContext2D,
    pageIndex: number,
    order: any,
  ): Promise<void> {
    switch (pageIndex) {
      case 0:
        this.drawPageOne(ctx, order);
        break;
      default:
        console.log(
          `Pagina ${pageIndex + 1} No tiene una lógica de dibujo específica`,
        );
    }
  }

  /**
   * Dibuja la primera página del PDF sobre el contexto del canvas usando los datos de una orden.
   *
   * - Renderiza campos de cabecera: código, fechas, hora, cliente y vehículo.
   * - Dibuja la sección de mano de obra con ajuste visual y recargo por tarjeta si aplica.
   * - Renderiza repuestos y repuestos extra, adaptando nombres largos a múltiples líneas.
   * - Incluye observaciones, datos del delegado y totales financieros (abono, total, subtotal).
   *
   * - Se apoya en coordenadas predefinidas (`this.COORDINATES`) para el posicionamiento.
   * - Usa helpers como `setFont`, `fillText` y `wrapText` para el layout visual.
   *
   * @param {CanvasRenderingContext2D} ctx - Contexto gráfico del canvas donde se pinta la página.
   * @param {any} order - Datos de la orden a representar visualmente en la plantilla.
   */

  private drawPageOne(ctx: CanvasRenderingContext2D, order: any): void {
    //SET FONT ME PERMITE DAR TAMAÑO AL TEXTO SIGUIENTE

    this.setFont(ctx, 27);
    this.fillText(ctx, order.codigo, this.COORDINATES.codigo);
    this.setFont(ctx, 17);
    const fecha = new Date(order.start_date).toISOString().split('T')[0];
    this.fillText(ctx, fecha, this.COORDINATES.fecha_ingreso);
    this.fillText(ctx, order.start_time, this.COORDINATES.hora_ingreso);

    this.fillText(
      ctx,
      this.formatFechaLocal(order.retiro?.exit_date),
      this.COORDINATES.fecha_entrega,
    );

    this.fillText(
      ctx,
      order.retiro?.exit_date
        ? new Date(order.retiro.exit_date).toLocaleTimeString('es-EC', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // 24 horas
          })
        : '',
      this.COORDINATES.hora_entrega,
    );

    this.fillText(
      ctx,
      order.preInvoice.subscriber.fullName,
      this.COORDINATES.razon_social,
    );
    this.fillText(ctx, order.preInvoice.subscriber.dni, this.COORDINATES.dni);
    this.fillText(
      ctx,
      order.preInvoice.subscriber.address,
      this.COORDINATES.direccion,
    );
    this.fillText(
      ctx,
      order.preInvoice.subscriber.cell_phone,
      this.COORDINATES.telefono,
    );
    //CAMPOS DE DATOS DE VEHICULOS
    this.fillText(ctx, order.preInvoice.vehicle.plate, this.COORDINATES.placa);
    this.fillText(ctx, order.preInvoice.vehicle.brand, this.COORDINATES.marca);
    this.setFont(ctx, 13);
    let text = order.preInvoice.vehicle.model;
    let maxWidth = 100;
    let splitText =
      ctx.measureText(text).width > maxWidth
        ? text.match(/.{1,40}/g) // Divide cada 20 caracteres
        : [text];

    splitText.forEach((line: any, index: any) => {
      ctx.fillText(
        line,
        this.COORDINATES.modelo.x,
        this.COORDINATES.modelo.y + index * 15,
      );
    });
    this.setFont(ctx, 17);
    //COLOR DEL VEHICULO
    this.fillText(ctx, order.key_veh ?? '', this.COORDINATES.color);
    this.fillText(
      ctx,
      order.preInvoice.vehicle.year_vehicle,
      this.COORDINATES.año,
    );
    this.fillText(
      ctx,
      order.preInvoice.vehicle.chassis_series,
      this.COORDINATES.serie_chasis,
    );
    this.fillText(ctx, order.kmts ?? '', this.COORDINATES.kmts);
    this.fillText(
      ctx,
      this.getPaymentMethodLabel(order.preInvoice.paymentM),
      this.COORDINATES.forma_pago,
    );
    const isTarjeta = order.preInvoice?.paymentM === 'tarjeta';
    //MANO DE OBRA
    const Y_INICIAL = this.COORDINATES.primera_fila_detalle.y;
    const DETALLE_X = this.COORDINATES.primera_fila_detalle.x;
    const VALOR_X = this.COORDINATES.primera_fila_valor.x;
    const ESPACIO_ENTRE_FILAS = 25;
    const MAX_WIDTH_LABOUR = 800;
    const LINE_HEIGHT_L = 18;
    this.setFont(ctx, 16);
    let yOffsetl = Y_INICIAL;
    order.labour.forEach((a: any) => {
      const labourCost = isTarjeta ? a.cost * 1.1 : a.cost;
      const labourName = a.name.toUpperCase();
      let splitTextL = this.wrapText(ctx, labourName, MAX_WIDTH_LABOUR, 88);

      splitTextL.forEach((line: any, lineIndex: any) => {
        ctx.fillText(line, DETALLE_X, yOffsetl + lineIndex * LINE_HEIGHT_L);
      });
      let extraSpacing = (splitTextL.length - 1) * LINE_HEIGHT_L;
      let centeredY = yOffsetl + extraSpacing / 2; // Centra el costo en relación con el texto
      this.fillText(ctx, `$ ${labourCost.toFixed(2)}`, {
        x: VALOR_X,
        y: centeredY,
      });
      yOffsetl += ESPACIO_ENTRE_FILAS + extraSpacing;
    });
    this.fillText(
      ctx,
      `$ ${order.preInvoice.total_labour.toFixed(2)}`,
      this.COORDINATES.total_mano_obra,
    );
    //REPUESTOS
    const Y_INICIAL_REPUESTO = this.COORDINATES.primera_fila_codigo.y;
    const ESPACIO_ENTRE_FILAS_REPUESTO = 22;
    const MAX_WIDTH_PRODUCTO = 150;
    const LINE_HEIGHT = 18;

    let yOffset = Y_INICIAL_REPUESTO; // Variable dinámica para controlar la posición Y

    order.spare_parts?.forEach((repuesto: any) => {
      const precioUnitario = isTarjeta
        ? repuesto.sale_price * 1.1
        : repuesto.sale_price;
      const total = precioUnitario * repuesto.amount;

      this.fillText(ctx, repuesto.series, {
        x: this.COORDINATES.primera_fila_codigo.x,
        y: yOffset,
      });
      const parts = repuesto.product_name.toUpperCase();
      // Manejo dinámico de nombres largos
      let splitTextN =
        ctx.measureText(parts).width > MAX_WIDTH_PRODUCTO
          ? parts.match(/.{1,45}/g)
          : [parts];

      splitTextN.forEach((line: any, lineIndex: any) => {
        ctx.fillText(
          line,
          this.COORDINATES.primera_fila_producto.x,
          yOffset + lineIndex * LINE_HEIGHT,
        );
      });

      // Ajustar la posición Y solo si hay múltiples líneas
      let extraSpacing = (splitTextN.length - 1) * LINE_HEIGHT;
      let centeredY = yOffset + extraSpacing / 2; // Centra los valores
      this.fillText(ctx, `$ ${precioUnitario.toFixed(2)}`, {
        x: this.COORDINATES.primera_fila_precioUnitario.x,
        y: centeredY,
      });

      this.fillText(ctx, repuesto.amount.toString(), {
        x: this.COORDINATES.primera_fila_cantidad.x,
        y: centeredY,
      });

      this.fillText(ctx, `$ ${total.toFixed(2)}`, {
        x: this.COORDINATES.primera_fila_valor_total.x,
        y: centeredY,
      });

      // Incrementa `yOffset` basado en el tamaño real de cada fila
      yOffset += ESPACIO_ENTRE_FILAS_REPUESTO + extraSpacing;
    });

    order.spare_parts_extra?.forEach((extraRepuesto: any) => {
      const precioUnitario = extraRepuesto.applyIncrease
        ? extraRepuesto.sale_price * 1.1
        : extraRepuesto.sale_price;
      const total = precioUnitario * extraRepuesto.amount;

      this.fillText(ctx, '0000', {
        // Código fijo para repuestos extra
        x: this.COORDINATES.primera_fila_codigo.x,
        y: yOffset,
      });
      const product = extraRepuesto.product.toUpperCase();
      let splitTextN =
        ctx.measureText(product).width > MAX_WIDTH_PRODUCTO
          ? product.match(/.{1,45}/g)
          : [product];

      splitTextN.forEach((line: any, lineIndex: any) => {
        ctx.fillText(
          line,
          this.COORDINATES.primera_fila_producto.x,
          yOffset + lineIndex * LINE_HEIGHT,
        );
      });

      let extraSpacing = (splitTextN.length - 1) * LINE_HEIGHT;
      let centeredY = yOffset + extraSpacing / 2;

      this.fillText(ctx, `$ ${precioUnitario.toFixed(2)}`, {
        x: this.COORDINATES.primera_fila_precioUnitario.x,
        y: centeredY,
      });

      this.fillText(ctx, extraRepuesto.amount.toString(), {
        x: this.COORDINATES.primera_fila_cantidad.x,
        y: centeredY,
      });

      this.fillText(ctx, `$ ${total.toFixed(2)}`, {
        x: this.COORDINATES.primera_fila_valor_total.x,
        y: centeredY,
      });

      yOffset += ESPACIO_ENTRE_FILAS_REPUESTO + extraSpacing;
    });
    this.fillText(
      ctx,
      order.retiro?.number_identification ?? '',
      this.COORDINATES.cc,
    );

    this.fillText(ctx, order.retiro?.delegate ?? '', this.COORDINATES.delegado);

    //OBSERVACIONES
    this.setFont(ctx, 17);
    let textO = (order.observation ?? '').toUpperCase();
    let mWO = 1070;
    const splitTextO = this.wrapTextByWord(ctx, textO, mWO);
    splitTextO.forEach((line, index) => {
      ctx.fillText(
        line,
        this.COORDINATES.observaciones.x,
        this.COORDINATES.observaciones.y + index * 15,
      );
    });
    this.setFont(ctx, 19);

    this.fillText(
      ctx,
      `$ ${(order.preInvoice?.abono ?? 0).toFixed(2)}`,
      this.COORDINATES.abono,
    );
    this.fillText(
      ctx,
      `$ ${(order.preInvoice.total ?? 0).toFixed(2)}`,
      this.COORDINATES.valor_pendiente,
    );
    this.fillText(
      ctx,
      `$ ${(order.preInvoice.sub_total ?? 0).toFixed(2)}`,
      this.COORDINATES.valor_total,
    );

    this.fillText(
      ctx,
      `$ ${order.preInvoice.total_inventory.toFixed(2)}`,
      this.COORDINATES.total_repuesto,
    );
  }

  /**
   * Divide un texto en líneas según el ancho máximo permitido sin cortar palabras.
   * @param ctx CanvasRenderingContext2D - El contexto para medir el ancho de texto.
   * @param text string - El texto original.
   * @param maxWidth number - El ancho máximo permitido en píxeles.
   * @returns string[] - Un arreglo de líneas listas para pintar.
   */
  wrapTextByWord(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): string[] {
    const cleanText = text.replace(/\r?\n|\r/g, ' ').trim(); // Remueve saltos de línea
    const words = cleanText.split(/\s+/); // Divide por espacios
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
      const { width } = ctx.measureText(testLine);

      if (width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Renderiza dinámicamente las actividades de mano de obra sobre el canvas, ajustando nombres y valores según el layout disponible.
   *
   * - Usa `setFont()` para establecer estilo gráfico inicial.
   * - Recorre cada entrada en `order.labour`, ajustando texto largo con `wrapText()` para múltiples líneas.
   * - Aplica un incremento del 10% al costo si el método de pago es tarjeta.
   * - Centra el valor monetario verticalmente respecto al bloque de texto.
   * - Actualiza el `yOffset` según la cantidad de líneas para evitar solapamiento.
   * - Finalmente, imprime el total acumulado de mano de obra en su coordenada designada.
   *
   * @param {CanvasRenderingContext2D} ctx - Contexto del canvas sobre el que se pinta.
   * @param {any} order - Objeto que contiene la orden y sus detalles de mano de obra.
   */

  private drawLabour(ctx: CanvasRenderingContext2D, order: any): void {
    const Y_INICIAL = this.COORDINATES.primera_fila_detalle.y;
    const DETALLE_X = this.COORDINATES.primera_fila_detalle.x;
    const VALOR_X = this.COORDINATES.primera_fila_valor.x;
    const ESPACIO_ENTRE_FILAS = 25;
    const MAX_WIDTH_LABOUR = 800;
    const LINE_HEIGHT_L = 18;

    this.setFont(ctx, 18);
    let yOffsetl = Y_INICIAL;

    const isTarjeta = order.preInvoice?.paymentM === 'tarjeta';

    order.labour.forEach((a: any) => {
      const labourCost = isTarjeta ? a.cost * 1.1 : a.cost;
      const labourName = a.name.toUpperCase();
      let splitTextL = this.wrapText(ctx, labourName, MAX_WIDTH_LABOUR, 88);

      splitTextL.forEach((line: any, lineIndex: any) => {
        ctx.fillText(line, DETALLE_X, yOffsetl + lineIndex * LINE_HEIGHT_L);
      });

      let extraSpacing = (splitTextL.length - 1) * LINE_HEIGHT_L;
      let centeredY = yOffsetl + extraSpacing / 2;
      this.fillText(ctx, `$ ${labourCost.toFixed(2)}`, {
        x: VALOR_X,
        y: centeredY,
      });

      yOffsetl += ESPACIO_ENTRE_FILAS + extraSpacing;
    });

    this.fillText(
      ctx,
      `$ ${order.preInvoice.total_labour.toFixed(2)}`,
      this.COORDINATES.total_actividades,
    );
  }

  /**
   * Dibuja la versión de página enfocada únicamente en actividades de mano de obra (labour).
   *
   * - Renderiza información general del cliente, vehículo y fechas clave.
   * - Utiliza coordenadas predefinidas (`this.COORDINATES`) para ubicar cada campo.
   * - Llama a `drawLabour()` para pintar dinámicamente las actividades con su coste.
   * - Ajusta el modelo del vehículo (`model`) con lógica de línea múltiple si excede el ancho permitido.
   *
   * @param {CanvasRenderingContext2D} ctx - Contexto de dibujo del canvas.
   * @param {any} order - Objeto con la información detallada de la orden a representar.
   */

  private drawPageActividades(ctx: CanvasRenderingContext2D, order: any): void {
    this.setFont(ctx, 27);
    this.fillText(ctx, order.codigo, this.COORDINATES.codigo);

    this.setFont(ctx, 17);
    const fecha = new Date(order.start_date).toISOString().split('T')[0];
    this.fillText(ctx, fecha, this.COORDINATES.fecha_ingreso);
    this.fillText(ctx, order.start_time, this.COORDINATES.hora_ingreso);
    this.fillText(
      ctx,
      this.formatFechaLocal(order.retiro?.exit_date),
      this.COORDINATES.fecha_entrega,
    );

    this.fillText(
      ctx,
      order.retiro?.exit_date
        ? new Date(order.retiro.exit_date).toLocaleTimeString('es-EC', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // 24 horas
          })
        : '',
      this.COORDINATES.hora_entrega,
    );
    this.fillText(
      ctx,
      order.preInvoice.subscriber.fullName,
      this.COORDINATES.razon_social,
    );
    this.fillText(ctx, order.preInvoice.subscriber.dni, this.COORDINATES.dni);
    this.fillText(
      ctx,
      order.preInvoice.subscriber.address,
      this.COORDINATES.direccion,
    );
    this.fillText(
      ctx,
      order.preInvoice.subscriber.cell_phone,
      this.COORDINATES.telefono,
    );

    this.fillText(ctx, order.preInvoice.vehicle.plate, this.COORDINATES.placa);
    this.fillText(ctx, order.preInvoice.vehicle.brand, this.COORDINATES.marca);
    this.fillText(
      ctx,
      order.preInvoice.vehicle.year_vehicle,
      this.COORDINATES.año,
    );
    this.fillText(
      ctx,
      order.preInvoice.vehicle.chassis_series,
      this.COORDINATES.serie_chasis,
    );
    this.fillText(ctx, order.kmts ?? '', this.COORDINATES.kmts);

    this.fillText(
      ctx,
      this.getPaymentMethodLabel(order.preInvoice.paymentM),
      this.COORDINATES.forma_pago,
    );
    this.fillText(ctx, order.key_veh ?? '', this.COORDINATES.color);
    this.fillText(
      ctx,
      order.retiro?.number_identification ?? '',
      this.COORDINATES.cc,
    );
    this.fillText(ctx, order.retiro?.delegate ?? '', this.COORDINATES.delegado);
    // Solo pinta la mano de obra en actividades
    this.setFont(ctx, 16);
    this.drawLabour(ctx, order);

    this.setFont(ctx, 13);
    let text = order.preInvoice.vehicle.model;
    let maxWidth = 100;
    let splitText =
      ctx.measureText(text).width > maxWidth
        ? text.match(/.{1,40}/g) // Divide cada 20 caracteres
        : [text];

    splitText.forEach((line: any, index: any) => {
      ctx.fillText(
        line,
        this.COORDINATES.modelo.x,
        this.COORDINATES.modelo.y + index * 15,
      );
    });
  }

  /**
   * Renderiza todos los repuestos y repuestos adicionales de la orden sobre el canvas.
   *
   * - Ajusta el texto largo de los nombres de productos a múltiples líneas usando `measureText` y `match()`.
   * - Aplica un incremento del 10% si el método de pago es tarjeta (`tarjeta`).
   * - Renderiza código, nombre, precio unitario, cantidad y valor total en sus respectivas coordenadas.
   * - Los repuestos extra usan un código fijo "0000", manteniendo la misma alineación visual.
   * - Calcula y centra verticalmente los valores monetarios respecto al bloque de texto.
   * - Finalmente imprime el total acumulado de repuestos (`total_inventory`).
   *
   * @param {CanvasRenderingContext2D} ctx - Contexto del canvas donde se dibuja.
   * @param {any} order - Objeto con los datos de la orden, incluyendo `spare_parts` y `spare_parts_extra`.
   */

  private drawSpareParts(ctx: CanvasRenderingContext2D, order: any): void {
    const Y_INICIAL_REPUESTO = this.COORDINATES.repuesto_codigo.y;
    const ESPACIO_ENTRE_FILAS_REPUESTO = 22;
    const MAX_WIDTH_PRODUCTO = 150;
    const LINE_HEIGHT = 18;

    let yOffset = Y_INICIAL_REPUESTO;
    const isTarjeta = order.preInvoice?.paymentM === 'tarjeta';

    order.spare_parts?.forEach((repuesto: any) => {
      const precioUnitario = isTarjeta
        ? repuesto.sale_price * 1.1
        : repuesto.sale_price;
      const total = precioUnitario * repuesto.amount;

      this.fillText(ctx, repuesto.series, {
        x: this.COORDINATES.repuesto_codigo.x,
        y: yOffset,
      });

      let splitTextN =
        ctx.measureText(repuesto.product_name).width > MAX_WIDTH_PRODUCTO
          ? repuesto.product_name.match(/.{1,45}/g)
          : [repuesto.product_name];

      splitTextN.forEach((line: any, lineIndex: any) => {
        ctx.fillText(
          line,
          this.COORDINATES.repuesto_producto.x,
          yOffset + lineIndex * LINE_HEIGHT,
        );
      });

      let extraSpacing = (splitTextN.length - 1) * LINE_HEIGHT;
      let centeredY = yOffset + extraSpacing / 2;

      this.fillText(ctx, `$ ${precioUnitario.toFixed(2)}`, {
        x: this.COORDINATES.repuesto_precioUnitario.x,
        y: centeredY,
      });
      this.fillText(ctx, repuesto.amount.toString(), {
        x: this.COORDINATES.repuesto_cantidad.x,
        y: centeredY,
      });
      this.fillText(ctx, `$ ${total.toFixed(2)}`, {
        x: this.COORDINATES.repuesto_valor_total.x,
        y: centeredY,
      });

      yOffset += ESPACIO_ENTRE_FILAS_REPUESTO + extraSpacing;
    });
    order.spare_parts_extra?.forEach((extraRepuesto: any) => {
      const precioUnitario = extraRepuesto.applyIncrease
        ? extraRepuesto.sale_price * 1.1
        : extraRepuesto.sale_price;
      const total = precioUnitario * extraRepuesto.amount;

      this.fillText(ctx, '0000', {
        x: this.COORDINATES.repuesto_codigo.x,
        y: yOffset,
      });

      let splitTextN =
        ctx.measureText(extraRepuesto.product).width > MAX_WIDTH_PRODUCTO
          ? extraRepuesto.product.match(/.{1,36}/g)
          : [extraRepuesto.product];

      splitTextN.forEach((line: any, lineIndex: any) => {
        ctx.fillText(
          line,
          this.COORDINATES.repuesto_producto.x, 
          yOffset + lineIndex * LINE_HEIGHT,
        );
      });

      let extraSpacing = (splitTextN.length - 1) * LINE_HEIGHT;
      let centeredY = yOffset + extraSpacing / 2;

      this.fillText(ctx, `$ ${precioUnitario.toFixed(2)}`, {
        x: this.COORDINATES.repuesto_precioUnitario.x,
        y: centeredY,
      });

      this.fillText(ctx, extraRepuesto.amount.toString(), {
        x: this.COORDINATES.repuesto_cantidad.x,
        y: centeredY,
      });

      this.fillText(ctx, `$ ${total.toFixed(2)}`, {
        x: this.COORDINATES.repuesto_valor_total.x, 
        y: centeredY,
      });

      yOffset += ESPACIO_ENTRE_FILAS_REPUESTO + extraSpacing;
    });
    this.fillText(
      ctx,
      `$ ${order.preInvoice.total_inventory.toFixed(2)}`,
      this.COORDINATES.total_repuesto,
    );
  }

  /**
   * Renderiza una página enfocada exclusivamente en los repuestos utilizados en la orden.
   *
   * - Dibuja los datos clave: código, fechas, cliente, vehículo, forma de pago y observaciones.
   * - Presenta los valores financieros: abono, total y subtotal.
   * - Llama a `drawSpareParts()` para renderizar dinámicamente los repuestos y repuestos extra.
   * - Gestiona el nombre del modelo del vehículo con adaptación multilinea si es demasiado largo.
   *
   * - Utiliza helpers como `setFont()`, `fillText()` y coordenadas de `this.COORDINATES` para mantener consistencia visual.
   *
   * @param {CanvasRenderingContext2D} ctx - Contexto del canvas donde se dibuja la página.
   * @param {any} order - Objeto que contiene los datos completos de la orden y su factura.
   */

  private drawPageRepuestos(ctx: CanvasRenderingContext2D, order: any): void {
    this.setFont(ctx, 27);
    this.fillText(ctx, order.codigo, this.COORDINATES.codigo);

    this.setFont(ctx, 17);
    const fecha = new Date(order.start_date).toISOString().split('T')[0];
    this.fillText(ctx, fecha, this.COORDINATES.fecha_ingreso);
    this.fillText(ctx, order.start_time, this.COORDINATES.hora_ingreso);
    this.fillText(
      ctx,
      this.formatFechaLocal(order.retiro?.exit_date),
      this.COORDINATES.fecha_entrega,
    );

    this.fillText(
      ctx,
      order.retiro?.exit_date
        ? new Date(order.retiro.exit_date).toLocaleTimeString('es-EC', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // 24 horas
          })
        : '',
      this.COORDINATES.hora_entrega,
    );
    this.fillText(
      ctx,
      order.preInvoice.subscriber.fullName,
      this.COORDINATES.razon_social,
    );
    this.fillText(ctx, order.key_veh ?? '', this.COORDINATES.color);
    this.fillText(ctx, order.preInvoice.subscriber.dni, this.COORDINATES.dni);
    this.fillText(
      ctx,
      order.preInvoice.subscriber.address,
      this.COORDINATES.direccion,
    );
    this.fillText(
      ctx,
      order.preInvoice.subscriber.cell_phone,
      this.COORDINATES.telefono,
    );

    this.fillText(ctx, order.preInvoice.vehicle.plate, this.COORDINATES.placa);
    this.fillText(ctx, order.preInvoice.vehicle.brand, this.COORDINATES.marca);
    this.fillText(
      ctx,
      order.preInvoice.vehicle.year_vehicle,
      this.COORDINATES.año,
    );
    this.fillText(
      ctx,
      order.preInvoice.vehicle.chassis_series,
      this.COORDINATES.serie_chasis,
    );
    this.fillText(ctx, order.kmts ?? '', this.COORDINATES.kmts);
    this.fillText(
      ctx,
      this.getPaymentMethodLabel(order.preInvoice.paymentM),
      this.COORDINATES.forma_pago,
    );
    this.fillText(
      ctx,
      order.retiro?.number_identification ?? '',
      this.COORDINATES.cc,
    );
    this.fillText(ctx, order.retiro?.delegate ?? '', this.COORDINATES.delegado);
    this.setFont(ctx, 17);
    let textO = (order.observation ?? '').toUpperCase();
    let mWO = 1070;
    const splitTextO = this.wrapTextByWord(ctx, textO, mWO);
    splitTextO.forEach((line, index) => {
      ctx.fillText(
        line,
        this.COORDINATES.observaciones.x,
        this.COORDINATES.observaciones.y + index * 15,
      );
    });
    this.setFont(ctx, 19);
    this.fillText(
      ctx,
      `$ ${(order.preInvoice?.abono ?? 0).toFixed(2)}`,
      this.COORDINATES.abono,
    );
    this.fillText(
      ctx,
      `$ ${(order.preInvoice.total ?? 0).toFixed(2)}`,
      this.COORDINATES.valor_pendiente,
    );
    this.fillText(
      ctx,
      `$ ${(order.preInvoice.sub_total ?? 0).toFixed(2)}`,
      this.COORDINATES.valor_total,
    );
    this.setFont(ctx, 16);
    this.drawSpareParts(ctx, order);
    this.setFont(ctx, 13);
    let text = order.preInvoice.vehicle.model;
    let maxWidth = 100;
    let splitText =
      ctx.measureText(text).width > maxWidth
        ? text.match(/.{1,40}/g) // Divide cada 20 caracteres
        : [text];

    splitText.forEach((line: any, index: any) => {
      ctx.fillText(
        line,
        this.COORDINATES.modelo.x,
        this.COORDINATES.modelo.y + index * 15,
      );
    });
  }

  /**
   * Renderiza una página enfocada exclusivamente en los repuestos utilizados en la orden.
   *
   * - Dibuja los datos clave: código, fechas, cliente, vehículo, forma de pago y observaciones.
   * - Presenta los valores financieros: abono, total y subtotal.
   * - Llama a `drawSpareParts()` para renderizar dinámicamente los repuestos y repuestos extra.
   * - Gestiona el nombre del modelo del vehículo con adaptación multilinea si es demasiado largo.
   *
   * - Utiliza helpers como `setFont()`, `fillText()` y coordenadas de `this.COORDINATES` para mantener consistencia visual.
   *
   * @param {CanvasRenderingContext2D} ctx - Contexto del canvas donde se dibuja la página.
   * @param {any} order - Objeto que contiene los datos completos de la orden y su factura.
   */

  public async generatePdfPreview(order: any): Promise<string> {
    const pdf = new jsPdf();
    const pageImages = ['MECANICA_002.png'];

    for (let i = 0; i < pageImages.length; i++) {
      if (i > 0) pdf.addPage();
      const canvas = await this.loadImageToCanvas(pageImages[i]);
      const ctx = canvas.getContext('2d')!;
      await this.drawPage(ctx, i, order);
      const imgData = canvas.toDataURL('image/jpeg');
      pdf.addImage(
        imgData,
        'JPEG',
        0,
        0,
        pdf.internal.pageSize.width,
        pdf.internal.pageSize.height,
      );
    }

    const pdfBlob = pdf.output('blob'); // Genera un Blob en lugar de descargar
    return URL.createObjectURL(pdfBlob); // Devuelve un URL temporal para mostrar en un iframe
  }

  /**
   * Genera una vista previa en PDF de múltiples páginas renderizadas sobre diferentes imágenes base.
   *
   * - Recorre el array `pageImages`, utilizando cada imagen como fondo de una página.
   * - Para cada página:
   *   - Carga y dibuja la imagen sobre un canvas.
   *   - Llama a `drawPageActividades()` o `drawPageRepuestos()` según el índice.
   *   - Convierte el contenido del canvas en imagen (`dataURL`) e inserta en el PDF.
   * - Retorna una URL temporal (`blob:`) para visualizar el PDF embebido en un `<iframe>` o visor.
   *
   * @param {any} order - Objeto con todos los datos de la orden.
   * @returns {Promise<string>} URL temporal (`blob:`) para visualizar la vista previa del PDF.
   */

  public async generatePdfPreviewAPages(order: any): Promise<string> {
    const pdf = new jsPdf();
    const pageImages = ['actividades.png', 'repuestos.png']; // Ambas imágenes en un solo PDF

    for (let i = 0; i < pageImages.length; i++) {
      if (i > 0) pdf.addPage();
      const canvas = await this.loadImageToCanvas(pageImages[i]);
      const ctx = canvas.getContext('2d')!;

      if (i === 0) {
        this.drawPageActividades(ctx, order); // Página de actividades
      } else {
        this.drawPageRepuestos(ctx, order); // Página de repuestos
      }

      const imgData = canvas.toDataURL('image/jpeg');
      pdf.addImage(
        imgData,
        'JPEG',
        0,
        0,
        pdf.internal.pageSize.width,
        pdf.internal.pageSize.height,
      );
    }

    const pdfBlob = pdf.output('blob');
    return URL.createObjectURL(pdfBlob);
  }

  /**
   * Genera un PDF centrado exclusivamente en las actividades (mano de obra) de una orden.
   *
   * - Utiliza la imagen `actividades.jpg` como fondo visual de la página.
   * - Renderiza la información utilizando `drawPageActividades()`, incluyendo datos del cliente, vehículo y actividades realizadas.
   * - Convierte el `canvas` en una imagen base (`dataURL`) y la inserta en el PDF.
   * - Finalmente descarga el PDF bajo el nombre `ACTIVIDADES-CLIENTE-{fullName}.pdf`.
   *
   * @param {any} order - Objeto con los datos de la orden y el preInvoice.
   * @returns {Promise<void>} Promesa que se resuelve una vez descargado el archivo PDF.
   */

  public async generatePdfActividades(order: any): Promise<void> {
    const pdf = new jsPdf();
    const pageImage = 'actividades.png';
    const ITEMS_PER_PAGE = 32;

    const activities = order.labour || [];
    const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE) || 1;

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();

      const canvas = await this.loadImageToCanvas(pageImage);
      const ctx = canvas.getContext('2d')!;
      const isLastPage = i === totalPages - 1;

      // Dibujar información base del cliente/vehículo
      this.drawBaseInfo(ctx, order);

      // Obtener y dibujar el segmento de actividades
      const start = i * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const pagedLabour = activities.slice(start, end);
      this.renderLabourList(ctx, pagedLabour, order);

      // Si es la última página, dibujar el total de mano de obra
      if (isLastPage) {
        this.fillText(
          ctx,
          `$ ${order.preInvoice.total_labour.toFixed(2)}`,
          this.COORDINATES.total_actividades,
        );
      }

      const imgData = canvas.toDataURL('image/jpeg');
      pdf.addImage(
        imgData,
        'JPEG',
        0,
        0,
        pdf.internal.pageSize.width,
        pdf.internal.pageSize.height,
      );
    }

    pdf.save(`ACTIVIDADES-${order.preInvoice.subscriber.fullName}.pdf`);
  }
  /**
   * Dibuja un set limitado de repuestos
   * @param isLastPage Si es la última página, dibujamos los totales
   */
  private drawPagedSpareParts(
    ctx: CanvasRenderingContext2D,
    items: any[],
    order: any,
    isLastPage: boolean,
  ): void {
    const Y_INICIAL = this.COORDINATES.repuesto_codigo.y;
    const ESPACIO = 22;
    const LINE_HEIGHT = 18;
    const isTarjeta = order.preInvoice?.paymentM === 'tarjeta';

    let yOffset = Y_INICIAL;

    items.forEach((repuesto) => {
      const apply10 = repuesto.isExtra ? repuesto.applyIncrease : isTarjeta;
      const precioUnitario = apply10
        ? repuesto.sale_price * 1.1
        : repuesto.sale_price;
      const total = precioUnitario * repuesto.amount;

      this.fillText(ctx, repuesto.series, {
        x: this.COORDINATES.repuesto_codigo.x,
        y: yOffset,
      });

      const name = (repuesto.product_name || '').toUpperCase();
      let splitTextN =
        ctx.measureText(name).width > 150
          ? name.match(/.{1,45}/g) || [name]
          : [name];

      splitTextN.forEach((line: any, index: any) => {
        ctx.fillText(
          line,
          this.COORDINATES.repuesto_producto.x,
          yOffset + index * LINE_HEIGHT,
        );
      });

      let extraSpacing = (splitTextN.length - 1) * LINE_HEIGHT;
      let centeredY = yOffset + extraSpacing / 2;

      this.fillText(ctx, `$ ${precioUnitario.toFixed(2)}`, {
        x: this.COORDINATES.repuesto_precioUnitario.x,
        y: centeredY,
      });
      this.fillText(ctx, repuesto.amount.toString(), {
        x: this.COORDINATES.repuesto_cantidad.x,
        y: centeredY,
      });
      this.fillText(ctx, `$ ${total.toFixed(2)}`, {
        x: this.COORDINATES.repuesto_valor_total.x,
        y: centeredY,
      });

      yOffset += ESPACIO + extraSpacing;
    });

    if (isLastPage) {
      this.fillText(
        ctx,
        `$ ${order.preInvoice.total_inventory.toFixed(2)}`,
        this.COORDINATES.total_repuesto,
      );
    }
  }
  /**
   * Genera un PDF enfocado exclusivamente en los repuestos asociados a una orden.
   *
   * - Utiliza como fondo la imagen `repuestos.png` para cada página.
   * - Carga cada imagen en un `canvas`, dibuja la información con `drawPageRepuestos()`.
   * - Convierte el `canvas` en un `dataURL` y lo inserta como imagen completa en el PDF.
   * - Finalmente descarga el archivo con nombre personalizado para el cliente.
   *
   * @param {any} order - Objeto que contiene los datos de la orden y los repuestos asociados.
   * @returns {Promise<void>} Promesa que se resuelve una vez descargado el PDF generado.
   */

  public async generatePdfRepuestos(order: any): Promise<void> {
    const pdf = new jsPdf();
    const pageImage = 'repuestos.png';

    // Combinamos todos los repuestos
    const allSpareParts = [
      ...(order.spare_parts || []),
      ...(order.spare_parts_extra || []).map((extra: any) => ({
        series: '0000',
        product_name: extra.product,
        sale_price: extra.sale_price,
        amount: extra.amount,
        isExtra: true,
        applyIncrease: extra.applyIncrease,
      })),
    ];

    const ITEMS_PER_PAGE = 32;
    const totalPages = Math.ceil(allSpareParts.length / ITEMS_PER_PAGE) || 1;

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();

      const canvas = await this.loadImageToCanvas(pageImage);
      const ctx = canvas.getContext('2d')!;

      // Obtenemos el segmento de repuestos para ESTA página
      const start = i * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const pagedItems = allSpareParts.slice(start, end);

      // Dibujamos la estructura base (Cliente, Vehículo, etc.)
      this.drawBaseInfo(ctx, order);

      // Dibujamos solo los repuestos de esta página
      this.drawPagedSpareParts(ctx, pagedItems, order, i === totalPages - 1);

      const imgData = canvas.toDataURL('image/jpeg');
      pdf.addImage(
        imgData,
        'JPEG',
        0,
        0,
        pdf.internal.pageSize.width,
        pdf.internal.pageSize.height,
      );
    }

    pdf.save(`REPUESTOS-${order.preInvoice.subscriber.fullName}.pdf`);
  }

  //FUNCIONES ADICIOANALES

  /**
   * Devuelve la descripción legible en español de un método de pago.
   *
   * - Traduce claves internas como `'tarjeta'`, `'efectivo'` o `'Transferencia'` a etiquetas legibles.
   * - Si el método no está definido en el diccionario, devuelve `'Método de pago desconocido'`.
   *
   * @param {string} method - Clave interna del método de pago.
   * @returns {string} Etiqueta legible correspondiente o mensaje por defecto.
   */

  private getPaymentMethodLabel(method: string): string {
    const paymentMethods: Record<PaymentMethod, string> = {
      tarjeta: 'Tarjeta de Crédito/Débito',
      efectivo: 'Efectivo',
      Transferencia: 'Transferencia',
      Credito: 'Credito',
    };

    if (method in paymentMethods) {
      return paymentMethods[method as PaymentMethod];
    }

    return 'Método de pago desconocido';
  }

  /**
   * Formatea una fecha en formato local ecuatoriano (`es-EC`) y la devuelve en forma `YYYY-MM-DD`.
   *
   * - Si `dateInput` es `null`, `undefined` o inválido, retorna una cadena vacía.
   * - Aplica la zona horaria `America/Guayaquil` para asegurar consistencia regional.
   * - Extrae día, mes y año, aplicando relleno con ceros a la izquierda para mantener formato fijo.
   *
   * @param {string | Date | undefined | null} dateInput - Fecha de entrada en cualquier formato válido.
   * @returns {string} Fecha formateada en `YYYY-MM-DD` o cadena vacía si no es válida.
   */

  private formatFechaLocal(
    dateInput: string | Date | undefined | null,
  ): string {
    if (!dateInput) return ''; // si es null o undefined

    const fecha = new Date(dateInput);
    if (isNaN(fecha.getTime())) return ''; // fecha inválida

    const parts = fecha
      .toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' })
      .split('/'); // ['17','6','2025']

    const dia = parts[0].padStart(2, '0');
    const mes = parts[1].padStart(2, '0');
    const anio = parts[2];

    return `${anio}-${mes}-${dia}`;
  }

  /**
   * Dibuja la información base (Cabecera, Cliente y Vehículo) que debe aparecer
   * en todas las páginas del documento.
   */
  private drawBaseInfo(ctx: CanvasRenderingContext2D, order: any): void {
    // --- CABECERA Y FECHAS ---
    this.setFont(ctx, 27);
    this.fillText(ctx, order.codigo, this.COORDINATES.codigo);

    this.setFont(ctx, 17);
    const fechaIngreso = new Date(order.start_date).toISOString().split('T')[0];
    this.fillText(ctx, fechaIngreso, this.COORDINATES.fecha_ingreso);
    this.fillText(ctx, order.start_time, this.COORDINATES.hora_ingreso);

    this.fillText(
      ctx,
      this.formatFechaLocal(order.retiro?.exit_date),
      this.COORDINATES.fecha_entrega,
    );

    this.fillText(
      ctx,
      order.retiro?.exit_date
        ? new Date(order.retiro.exit_date).toLocaleTimeString('es-EC', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : '',
      this.COORDINATES.hora_entrega,
    );

    // --- DATOS DEL CLIENTE ---
    this.fillText(
      ctx,
      order.preInvoice.subscriber.fullName,
      this.COORDINATES.razon_social,
    );
    this.fillText(ctx, order.preInvoice.subscriber.dni, this.COORDINATES.dni);
    this.fillText(
      ctx,
      order.preInvoice.subscriber.address,
      this.COORDINATES.direccion,
    );
    this.fillText(
      ctx,
      order.preInvoice.subscriber.cell_phone,
      this.COORDINATES.telefono,
    );

    // --- DATOS DEL VEHÍCULO ---
    this.fillText(ctx, order.preInvoice.vehicle.plate, this.COORDINATES.placa);
    this.fillText(ctx, order.preInvoice.vehicle.brand, this.COORDINATES.marca);
    this.fillText(ctx, order.key_veh ?? '', this.COORDINATES.color);
    this.fillText(
      ctx,
      order.preInvoice.vehicle.year_vehicle,
      this.COORDINATES.año,
    );
    this.fillText(
      ctx,
      order.preInvoice.vehicle.chassis_series,
      this.COORDINATES.serie_chasis,
    );
    this.fillText(ctx, order.kmts ?? '', this.COORDINATES.kmts);
    this.fillText(
      ctx,
      this.getPaymentMethodLabel(order.preInvoice.paymentM),
      this.COORDINATES.forma_pago,
    );

    // --- MODELO CON AJUSTE DE TEXTO ---
    this.setFont(ctx, 13);
    let modelText = order.preInvoice.vehicle.model;
    let maxWidthModel = 100;
    let splitModel =
      ctx.measureText(modelText).width > maxWidthModel
        ? modelText.match(/.{1,40}/g) || [modelText]
        : [modelText];

    splitModel.forEach((line: any, index: number) => {
      ctx.fillText(
        line,
        this.COORDINATES.modelo.x,
        this.COORDINATES.modelo.y + index * 15,
      );
    });

    // --- FIRMAS Y OBSERVACIONES (Solo etiquetas base) ---
    this.setFont(ctx, 17);
    this.fillText(
      ctx,
      order.retiro?.number_identification ?? '',
      this.COORDINATES.cc,
    );
    this.fillText(ctx, order.retiro?.delegate ?? '', this.COORDINATES.delegado);
  }
  /**
   * Renderiza un segmento específico de actividades (Mano de Obra).
   */
  private renderLabourList(
    ctx: CanvasRenderingContext2D,
    items: any[],
    order: any,
  ): void {
    const Y_INICIAL = this.COORDINATES.primera_fila_detalle.y;
    const DETALLE_X = this.COORDINATES.primera_fila_detalle.x;
    const VALOR_X = this.COORDINATES.primera_fila_valor.x;
    const ESPACIO = 25;
    const MAX_WIDTH_LABOUR = 800;
    const LINE_HEIGHT_L = 18;
    const isTarjeta = order.preInvoice?.paymentM === 'tarjeta';

    let yOffset = Y_INICIAL;
    this.setFont(ctx, 16);

    items.forEach((a: any) => {
      const labourCost = isTarjeta ? a.cost * 1.1 : a.cost;
      const labourName = a.name.toUpperCase();

      let splitTextL = this.wrapText(ctx, labourName, MAX_WIDTH_LABOUR, 88);

      splitTextL.forEach((line: any, lineIndex: number) => {
        ctx.fillText(line, DETALLE_X, yOffset + lineIndex * LINE_HEIGHT_L);
      });

      let extraSpacing = (splitTextL.length - 1) * LINE_HEIGHT_L;
      let centeredY = yOffset + extraSpacing / 2;

      this.fillText(ctx, `$ ${labourCost.toFixed(2)}`, {
        x: VALOR_X,
        y: centeredY,
      });

      yOffset += ESPACIO + extraSpacing;
    });
  }

  generateOrderReport(orders: any[], statusLabel: string): void {
    const doc = new jsPdf({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;

    // --- Encabezado ---
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE ÓRDENES DE TRABAJO', pageWidth / 2, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Estado: ${statusLabel}`, pageWidth / 2, 38, { align: 'center' });

    // Fecha de generación
    const today = new Date().toLocaleDateString('es-EC', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.text(`Generado: ${today}  |  Total: ${orders.length} orden(es)`, margin, 65);

    // --- Cabecera de tabla ---
    const cols = [
      { label: 'Código',        width: 70 },
      { label: 'Cliente',       width: 130 },
      { label: 'Placa',         width: 65 },
      { label: 'Modelo',        width: 90 },
      { label: 'Fecha Ingreso', width: 80 },
      { label: 'Hora',          width: 50 },
      { label: 'Requerimiento', width: 170 },
      { label: 'Estado',        width: 80 },
    ];
    const ROW_H = 27;
    const HEAD_H = 22;

    const drawHeader = (y: number) => {
      doc.setFillColor(30, 64, 175);
      doc.rect(margin, y, pageWidth - margin * 2, HEAD_H, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      let x = margin + 4;
      cols.forEach((c) => {
        doc.text(c.label, x, y + 14);
        x += c.width;
      });
    };

    const STATUS_COLORS: Record<string, [number, number, number]> = {
      'Pendiente':   [254, 240, 138],
      'En Progreso': [191, 219, 254],
      'Completada':  [187, 247, 208],
      'Cancelada':   [254, 202, 202],
      'Por Retirar': [216, 180, 254],
      'Retirado':    [229, 231, 235],
    };

    let y = 75;
    drawHeader(y);
    y += HEAD_H;

    orders.forEach((order, i) => {
      if (y + ROW_H > pageHeight - margin) {
        doc.addPage();
        y = margin;
        drawHeader(y);
        y += HEAD_H;
      }

      const isEven = i % 2 === 0;
      doc.setFillColor(isEven ? 249 : 255, isEven ? 250 : 255, isEven ? 251 : 255);
      doc.rect(margin, y, pageWidth - margin * 2, ROW_H, 'F');

      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + ROW_H, pageWidth - margin, y + ROW_H);

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const lastStatus: string = order.status?.[order.status.length - 1] ?? 'Pendiente';
      const startDate = order.start_date
        ? new Date(order.start_date).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
        : '';
      const request = order.request?.length > 35
        ? order.request.substring(0, 33) + '…'
        : (order.request ?? '');

      const values = [
        order.codigo ?? '',
        order.preInvoice?.subscriber?.fullName ?? '',
        order.preInvoice?.vehicle?.plate ?? '',
        order.preInvoice?.vehicle?.model ?? '',
        startDate,
        order.start_time ?? '',
        request,
        lastStatus,
      ];

      let x = margin + 4;
      values.forEach((val, idx) => {
        if (idx === values.length - 1) {
          // Badge de estado
          const color = STATUS_COLORS[lastStatus] ?? [229, 231, 235];
          doc.setFillColor(...color);
          doc.roundedRect(x - 2, y + 4, cols[idx].width - 4, 12, 3, 3, 'F');
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'bold');
          doc.text(val, x + (cols[idx].width - 4) / 2 - 2, y + 13, { align: 'center' });
          doc.setFont('helvetica', 'normal');
        } else {
          doc.text(String(val), x, y + 13, { maxWidth: cols[idx].width - 6 });
        }
        x += cols[idx].width;
      });

      y += ROW_H;
    });

    // Pie de página en todas las páginas
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    doc.save(`Reporte_Ordenes_${statusLabel.replace(/\s/g, '_')}_${today.replace(/\//g, '-')}.pdf`);
  }
}
