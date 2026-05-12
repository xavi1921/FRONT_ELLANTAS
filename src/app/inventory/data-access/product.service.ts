import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Product } from '../features/inventory-list/products.model';
import { Observable } from 'rxjs';

/**
 * Servicio encargado de gestionar productos dentro del módulo de inventario.
 * 
 * - Extiende `BaseHttpService` para reutilizar lógica común como headers y errores.
 * - Usa `environment.API_URL` como base para las rutas del backend.
 * 
 * Métodos disponibles:
 * - `list(page, size, name?)`: Devuelve productos paginados y opcionalmente filtrados por nombre.
 * - `create(product)`: Crea un nuevo producto en la base de datos.
 * - `update(product)`: Actualiza los datos de un producto existente.
 * - `updateStock(product)`: Modifica el stock de un producto determinado.
 * - `delete(id)`: Elimina un producto según su ID.
 * - `combo(page, limit, search)`: Devuelve productos resumidos para dropdowns/autocompletado.
 * - `getProductsByIds(ids)`: Obtiene un conjunto de productos por sus identificadores.
 *
 * @see BaseHttpService para lógica compartida.
 */

@Injectable({
  providedIn: 'root',
})
export class ProductService extends BaseHttpService {
  private API_URL = `${environment.API_URL}api/inventory`;

  list(page: number, size: number, name?: string) {
    return this.http.post<any>(
      `${this.API_URL}/list?page=${page}&size=${size}`,
      { name },
      { headers: this.getHeaders() }
    );
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.API_URL, product, {
      headers: this.getHeaders(),
    });
  }

  update(product: Product): Observable<Product> {
    return this.http.put<Product>(this.API_URL, product, {
      headers: this.getHeaders(),
    });
  }
  updateStock(product: any): Observable<Product> {
    return this.http.put<any>(`${this.API_URL}/stock`, product, {
      headers: this.getHeaders(),
    });
  }

  delete(id: string): Observable<Product> {
    return this.http.delete<Product>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  combo(page: number, limit: number, search: string = '') {
    return this.http.get<any>(`${this.API_URL}/combo`, {
      headers: this.getHeaders(),
      params: {
        page: page.toString(),
        limit: limit.toString(),
        search,
      },
    });
  }
  getProductsByIds(ids: string[]): Observable<{ code: number; items: any[] }> {
    return this.http.post<{ code: number; items: any[] }>(
      `${this.API_URL}/getByIds`,
      { ids },
      {
        headers: this.getHeaders(),
      }
    );
  }
    filterProducts(value: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/filter`, {value}, {
      headers: this.getHeaders(),
    });
  }
}