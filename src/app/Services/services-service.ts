import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth-service';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  url = environment.apiUrl + '/services/';

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

  getServices(name?: string, category?: string, status?: string) {
    const params: any = {};
    if (name) params.name = name;
    if (category) params.category = category;
    if (status) params.status = status;
    
    return this.http.get(this.url, { ...this.getHeaders(), params });
  }

  getCategories(status?: string) {
    const params: any = {};
    if (status) params.status = status;
    
    return this.http.get(this.url + 'categories', { 
      ...this.getHeaders(), 
      params 
    });
  }

  getServiceById(id: string) {
    return this.http.get(this.url + id, this.getHeaders());
  }

  postService(service: any) {
    return this.http.post(this.url, service, this.getHeaders());
  }

  putService(id: string, service: any) {
    return this.http.put(this.url + id, service, this.getHeaders());
  }

  deleteService(id: string) {
    return this.http.delete(this.url + id, this.getHeaders());
  }

  restoreService(id: string) {
    return this.http.patch(this.url + id + '/restore', {}, this.getHeaders());
  }

  postCategory(category: any) {
    return this.http.post(this.url + 'category', category, this.getHeaders());
  }

  putCategory(id: string, category: any) {
    return this.http.put(this.url + 'category/' + id, category, this.getHeaders());
  }

  deleteCategory(id: string) {
    return this.http.delete(this.url + 'category/' + id, this.getHeaders());
  }

  restoreCategory(id: string) {
    return this.http.patch(this.url + 'category/' + id + '/restore', {}, this.getHeaders());
  }

  getCategoryById(id: string) {
    return this.http.get(this.url + 'category/' + id, this.getHeaders());
  }
}