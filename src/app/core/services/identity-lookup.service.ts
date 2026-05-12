import { Injectable } from '@angular/core';
import { BaseHttpService } from '../../shared/data-access/base-http.service';
import { environment } from '../../environments/environment.dev';

@Injectable({
  providedIn: 'root',
})
export class IdentityLookupService extends BaseHttpService {
  private API_URL = `${environment.API_URL}api/identityLookup/`;

  getNaturalPerson(term: string) {
    return this.http.get<any>(`${this.API_URL}person/${term}`, {
      headers: this.getHeaders(),
    });
  }

  getCompanyByRuc(term: string) {
    return this.http.get<any>(`${this.API_URL}company/${term}`, {
      headers: this.getHeaders(),
    });
  }
  getVehicleByPlate(term: string) {
    return this.http.get<any>(`${this.API_URL}vehicle/${term}`, {
      headers: this.getHeaders(),
    });
  }
}
