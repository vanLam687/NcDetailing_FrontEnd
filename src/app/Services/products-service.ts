import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth-service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  url = 'http://localhost:3000/api/products';

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

  getProducts(name?: string, category_id?: string) {
    const params: any = {};
    if (name) params.name = name;
    if (category_id) params.category_id = category_id;
    
    return this.http.get(this.url, { ...this.getHeaders(), params });
  }

  getCategories() {
    return this.http.get(this.url + '/categories', this.getHeaders());
  }

  getProductById(id: string) {
    return this.http.get(this.url + '/' + id, this.getHeaders());
  }

  postProduct(product: any) {
    return this.http.post(this.url, product, this.getHeaders());
  }

  putProduct(id: string, product: any) {
    return this.http.put(this.url + '/' + id, product, this.getHeaders());
  }

  updateMinStock(id: string, min_stock: number) {
    return this.http.patch(this.url + '/' + id + '/min-stock', { min_stock }, this.getHeaders());
  }

  deleteProduct(id: string) {
    return this.http.delete(this.url + '/' + id, this.getHeaders());
  }

  postCategory(category: any) {
    return this.http.post(this.url + '/category', category, this.getHeaders());
  }
}