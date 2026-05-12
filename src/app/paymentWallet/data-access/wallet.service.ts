import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';
import { Wallet } from '../features/wallet-list/wallet.model';
import { Observable } from 'rxjs';

/**
 * Servicio encargado de gestionar operaciones relacionadas con billeteras (`Wallet`).
 *
 * - Extiende de `BaseHttpService` para heredar lógica común de headers, manejo de errores, etc.
 * - Interactúa con la API `${environment.API_URL}api/wallet`.
 */
@Injectable({
  providedIn: 'root',
})
export class WalletService extends BaseHttpService {
  private API_URL = `${environment.API_URL}api/wallet`;

  /**
   * Obtiene una lista de billeteras paginada, con filtro opcional por `value` y `status`.
   *
   * @param page - Número de página (base 1).
   * @param size - Cantidad de elementos por página.
   * @param value - Texto a filtrar (opcional).
   * @param status - Estado de la billetera (opcional).
   * @returns Observable con los datos paginados.
   */
  list(page: number, size: number, value?: string, status?: any) {
    return this.http.post<any>(
      `${this.API_URL}/list?page=${page}&size=${size}`,
      { value, status },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Crea una nueva billetera.
   *
   * @param wallet - Objeto `Wallet` con los datos a guardar.
   * @returns Observable con la billetera creada.
   */
  create(wallet: Wallet): Observable<Wallet> {
    return this.http.post<Wallet>(this.API_URL, wallet, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Actualiza los datos de una billetera existente.
   *
   * @param Wallet - Objeto con la información actualizada.
   * @returns Observable con la billetera modificada.
   */
  update(Wallet: any): Observable<Wallet> {
    return this.http.put<Wallet>(this.API_URL, Wallet, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Elimina una billetera por su ID.
   *
   * @param id - Identificador único de la billetera.
   * @returns Observable con la respuesta del backend.
   */
  delete(id: string): Observable<Wallet> {
    return this.http.delete<Wallet>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}
