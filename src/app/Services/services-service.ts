import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  url = 'http://localhost:3000/api/services/';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders() {
    const token = this.authService.getToken();
    return { 
      headers: { 'Authorization': `Bearer ${token}` } 
    };
  }

  getServices(name?: string, category?: string) {
    const params: any = {};
    if (name) params.name = name;
    if (category) params.category = category;
    
    return this.http.get(this.url, { ...this.getHeaders(), params });
  }

  getCategories() {
    return this.http.get(this.url + 'categories', this.getHeaders());
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

  postCategory(category: any) {
    return this.http.post(this.url + 'categories', category, this.getHeaders());
  }
  
}