import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  url = 'https://ncdetailing.up.railway.app/api/clients/';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders() {
    const token = this.authService.getToken();
    return { 
      headers: { 'Authorization': `Bearer ${token}` } 
    };
  }

  getClients(search?: string) {
    const params: any = {};
    if (search) params.search = search;
    
    return this.http.get(this.url, { ...this.getHeaders(), params });
  }

  getClientById(id: string) {
    return this.http.get(this.url + id, this.getHeaders());
  }

  getClientVehicles(id: string) {
    return this.http.get(this.url + id + '/vehicles', this.getHeaders());
  }

  getClientHistory(id: string) {
    return this.http.get(this.url + id + '/history', this.getHeaders());
  }

  postClient(client: any) {
    return this.http.post(this.url, client, this.getHeaders());
  }

  putClient(id: string, client: any) {
    return this.http.put(this.url + id, client, this.getHeaders());
  }

  deleteClient(id: string) {
    return this.http.delete(this.url + id, this.getHeaders());
  }
}