import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from './auth-service';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  url = environment.apiUrl + '/sales'; 

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private router: Router
  ) {}

  private getHeaders() {
    const token = this.authService.getToken();
    
    if (!token) {
      console.error('No token found, redirecting to login');
      this.authService.logout();
      this.router.navigate(['/login']);
      throw new Error('Authentication required');
    }
    
    return { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    };
  }

  getSalesProducts(filters: any) {
    let params: any = {};
    if (filters.clientName) params.clientName = filters.clientName;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.paymentStatusId) params.paymentStatusId = filters.paymentStatusId;
    
    return this.http.get(this.url + '/products', { ...this.getHeaders(), params });
  }

  postSaleProducts(sale: any) {
    return this.http.post(this.url + '/products', sale, this.getHeaders());
  }

  getSalesServices(filters: any) {
    let params: any = {};
    if (filters.clientName) params.clientName = filters.clientName;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.paymentStatusId) params.paymentStatusId = filters.paymentStatusId;
    if (filters.serviceStatusId) params.serviceStatusId = filters.serviceStatusId;

    return this.http.get(this.url + '/services', { ...this.getHeaders(), params });
  }

  postSalesServices(sale: any) {
    return this.http.post(this.url + '/services', sale, this.getHeaders());
  }

  getPaymentMethods() {
    return this.http.get(this.url + '/payment-methods', this.getHeaders());
  }

  updatePaymentStatus(id: string, payment_status_id: number) {
    return this.http.patch(this.url + '/' + id + '/payment-status', { payment_status_id }, this.getHeaders());
  }

  updateServiceStatus(id: string, service_status_id: number) {
    return this.http.patch(this.url + '/services/' + id + '/status', { service_status_id }, this.getHeaders());
  }
}