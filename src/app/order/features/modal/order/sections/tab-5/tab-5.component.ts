import {
  Component,
  effect,
  input,
  OnInit,
  output,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
}

@Component({
  selector: 'app-tab-5',
  imports: [],
  templateUrl: './tab-5.component.html',
  styles: ``,
})

/**
 * Componente visual para carga, gestión y previsualización de imágenes.
 *
 * - Recibe un `FormGroup` y un `FormArray` (`imagesArray`) para vincular el estado al formulario.
 * - Soporta carga de imágenes vía input o drag & drop.
 * - Genera IDs únicos y URLs para previsualización inmediata.
 * - Permite eliminar imágenes con limpieza de memoria (`URL.revokeObjectURL`).
 * - Emite los cambios hacia el componente padre a través de los outputs `images` y `imageRemoved`.
 * - Si `dataImages` se recibe como input, reconstruye la galería en `ngOnInit`.
 * - Incluye un visor de imágenes (`selectedImage`) y reconstruye el estado desde `imagesArray` si `dataImages` está vacío.
 */
export class Tab5Component implements OnInit {
  dataImages = input<any>();
  form = input<FormGroup | null>(null);
  imagesArray = input<FormArray | null>(null);

  images = output<any>();
  imageRemoved = output<string>();
  // Almacenar las imágenes cargadas
  uploadedImages: UploadedImage[] = [];

  // Para el visor de imágenes
  selectedImage: UploadedImage | null = null;

  constructor(private fb: FormBuilder) {
    effect(() => {
      if (this.imagesArray() && !this.dataImages()) {
        this.upImagesFromFormArray();
      }
    });
  }
  // Método para abrir el visor de imágenes
  openImageViewer(image: UploadedImage): void {
    this.selectedImage = image;
  }

  // Método para cerrar el visor de imágenes
  closeImageViewer(): void {
    this.selectedImage = null;
  }
  ngOnInit() {
    if (this.dataImages() && this.dataImages().length > 0) {
      this.dataImages().forEach((image: any) => {
        this.uploadedImages.push({
          id: this.generateUniqueId(),
          file: {} as File,
          url: image,
          name: 'Sin Nombre',
        });
      });
    }
  }
  // Método para reconstruir uploadedImages desde imagesArray
  upImagesFromFormArray(): void {
    this.uploadedImages = [];
    const imagesArrayValues = this.imagesArray()?.value;

    // Iterar sobre los valores y agregar los objetos a uploadedImages
    imagesArrayValues.forEach((image: any) => {
      const uploadedImage = {
        id: image.id,
        file: image.file,
        url: image.url,
        name: image.name,
      };

      // Agregar a uploadedImages
      this.uploadedImages.push(uploadedImage);
    });
  }

  // Estado para el área de arrastrar y soltar
  dropAreaActive = false;

  // Mensaje de error
  errorMessage = '';

  // Manejar la selección de archivos desde el input
  handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(input.files);
    }
  }

  // Manejar archivos arrastrados y soltados
  handleDrop(event: DragEvent): void {
    const files = event.dataTransfer?.files;
    if (files) {
      this.processFiles(files);
    }
  }

  // Procesar los archivos seleccionados
  private processFiles(files: FileList): void {
    this.errorMessage = '';

    // Convertir FileList a Array para facilitar el procesamiento
    const fileArray = Array.from(files);

    // Filtrar solo archivos de imagen
    const imageFiles = fileArray.filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      this.errorMessage = 'Por favor, selecciona archivos de imagen válidos.';
      return;
    }

    // Procesar cada imagen
    imageFiles.forEach((file) => {
      // Validar tamaño
      if (file.size > 5 * 1024 * 1024) {
        // 5MB como ejemplo
        this.errorMessage =
          'Algunas imágenes exceden el tamaño máximo permitido.';
        return;
      }

      // Crear URL para previsualización
      const imageUrl = URL.createObjectURL(file);

      // Agregar a la lista de imágenes
      const uploadedImage = {
        id: this.generateUniqueId(),
        file: file,
        url: imageUrl,
        name: file.name,
      };

      // Agregar al arreglo de imágenes subidas
      this.uploadedImages.push(uploadedImage);

      // Agregar al FormArray de imágenes en el formulario
      this.imagesArray()?.push(
        this.fb.group({
          id: uploadedImage.id,
          name: uploadedImage.name,
          url: uploadedImage.url,
          file: uploadedImage.file,
        })
      );
    });
    // Emitir el evento con los archivos actualizados
    this.emitChanges();
  }

  // Eliminar una imagen
  deleteImage(id: string): void {
    // Encontrar la imagen
    const imageIndex = this.uploadedImages.findIndex((img) => img.id === id);

    if (imageIndex !== -1) {
      // Liberar la URL de objeto para evitar fugas de memoria
      URL.revokeObjectURL(this.uploadedImages[imageIndex].url);

      // Eliminar la imagen del array
      const deletedImageUrl = this.uploadedImages[imageIndex].url;
      this.uploadedImages.splice(imageIndex, 1);
      this.imagesArray()?.removeAt(imageIndex);
      // Emitir el evento con los archivos actualizados
      this.emitImageRemoved(deletedImageUrl);
    }
  }

  // Emitir cambios al componente padre
  private emitImageRemoved(deletedUrl: string): void {
    this.imageRemoved.emit(deletedUrl);
  }

  private emitChanges(): void {
    const files = this.uploadedImages.map((img) => img.file);
    this.images.emit(files);
  }
  // Generar ID único para cada imagen
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}