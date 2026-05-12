import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Order } from '../features/order-list/ordern.model';
import { map, Observable } from 'rxjs';

/**
 * Servicio Angular que gestiona las operaciones relacionadas con órdenes (`Order`).
 *
 * - Extiende `BaseHttpService` para acceder a utilidades como `getHeaders()`.
 * - Opera sobre el endpoint `${environment.API_URL}api/order`.
 *
 * Funcionalidades principales:
 * - `list()`: Lista paginada de órdenes con filtros opcionales.
 * - `create()`: Crea una nueva orden.
 * - `update()`: Actualiza una orden existente.
 * - `retiro()`: Registra datos del retiro de una orden (delegado, cédula, fecha).
 * - `delete()`: Elimina una orden por ID.
 * - `cancelar()`: Marca una orden como cancelada.
 * - `porRetirar()`: Marca una orden como lista para retiro.
 * - `filter()`: Búsqueda avanzada de órdenes según `value`.
 * - `uploadImages()`: Carga archivos asociados a la orden.
 */

@Injectable({
  providedIn: 'root',
})
export class OrderService extends BaseHttpService {
  private API_URL = `${environment.API_URL}api/order`;
  private readonly FILTER_KEY = 'orderFilters';
  list(
    page: number,
    size: number,
    value?: string,
    filter?: any,
    exitDate?: string
  ) {
    return this.http.post<any>(
      `${this.API_URL}/list?page=${page}&size=${size}`,
      { value, filter, exitDate },
      { headers: this.getHeaders() }
    );
  }

  create(order: any): Observable<Order> {
    return this.http.post<Order>(this.API_URL, order, {
      headers: this.getHeaders(),
    });
  }

  update(order: any): Observable<Order> {
    return this.http.put<Order>(this.API_URL, order, {
      headers: this.getHeaders(),
    });
  }
  retiro(retiro: any): Observable<Order> {
    const body = {
      _id: retiro._id,
      retiro: {
        delegate: retiro.delegate.trim(),
        number_identification: retiro.number_identification.trim(),
        exit_date: new Date(),
      },
    };

    return this.http.put<Order>(`${this.API_URL}/retiro`, body, {
      headers: this.getHeaders(),
    });
  }

  delete(id: string): Observable<Order> {
    return this.http.delete<Order>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }
  cancelar(id: string): Observable<Order> {
    const body = { _id: id };
    return this.http.put<Order>(`${this.API_URL}/cancelar`, body, {
      headers: this.getHeaders(),
    });
  }
  porRetirar(id: string): Observable<Order> {
    const body = { _id: id };
    return this.http.put<Order>(`${this.API_URL}/statusRetiro`, body, {
      headers: this.getHeaders(),
    });
  }
  filter(value: string) {
    return this.http.post<any>(
      `${this.API_URL}/filter`,
      { value },
      { headers: this.getHeaders() }
    );
  }

  uploadImages(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file, file.name);
    });
    return this.http.post<any>(`${this.API_URL}/upload`, formData, {
      headers: this.getHeaders(),
    });
  }
  getById(id: string): Observable<Order> {
    return this.http
      .get<{ order: Order }>(`${this.API_URL}/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(map((res) => res.order)); // extrae la orden
  }

  generateCode(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/count`, {
      headers: this.getHeaders(),
    });
  }
  // Eliminar una labour
  deleteLabour(orderId: string, labourId: string): Observable<Order> {
    return this.http.delete<Order>(
      `${this.API_URL}/${orderId}/labour/${labourId}`,
      { headers: this.getHeaders() }
    );
  }

  // Eliminar un spare_part
  deleteSparePart(orderId: string, sparePartId: string): Observable<Order> {
    return this.http.delete<Order>(
      `${this.API_URL}/${orderId}/spare-part/${sparePartId}`,
      { headers: this.getHeaders() }
    );
  }

  // Eliminar un spare_part_extra
  deleteSparePartExtra(
    orderId: string,
    sparePartExtraId: string
  ): Observable<Order> {
    return this.http.delete<Order>(
      `${this.API_URL}/${orderId}/spare-part-extra/${sparePartExtraId}`,
      { headers: this.getHeaders() }
    );
  }

  setFilters(filters: any): void {
    sessionStorage.setItem(this.FILTER_KEY, JSON.stringify(filters));
  }

  getFilters(): any {
    const filters = sessionStorage.getItem(this.FILTER_KEY);
    return filters
      ? JSON.parse(filters)
      : {
          valueFilter: '',
          selectedStatusFilter: 'Todos',
          selectedDate: '',
          pageIndex: 0,
          pageSize: 10,
        };
  }

  clearFilters(): void {
    sessionStorage.removeItem(this.FILTER_KEY);
  }


  checkConcurrency(
    orderId: string
  ): Observable<{ _id: string; updatedAt: string }> {
    return this.http.get<{ _id: string; updatedAt: string }>(
      `${this.API_URL}/check/${orderId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  getLabourReport(month: number, year: number): Observable<any> {
    return this.http.get<any>(
      `${this.API_URL}/report/labour?month=${month}&year=${year}`,
      { headers: this.getHeaders() }
    );
  }

  getLogs(orderId: string): Observable<any[]> {
    return this.http
      .get<{ code: number; message: string; data: any[] }>(
        `${this.API_URL}/logs/${orderId}`,
        { headers: this.getHeaders() }
      )
      .pipe(map((res) => res.data));
  }

  listAll(value?: string, filter?: string, exitDate?: string): Observable<Order[]> {
    return this.http
      .post<any>(
        `${this.API_URL}/list?page=1&size=9999`,
        { value, filter, exitDate },
        { headers: this.getHeaders() }
      )
      .pipe(map((res) => res.orders));
  }
}
