import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth-service';
import { Router } from '@angular/router';
import { environment } from '../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {

  url = environment.apiUrl + '/employees/';

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

  GetEmployees(status?: string) {
    const params: any = {};
    if (status) params.status = status;
    
    return this.http.get(this.url, { ...this.getHeaders(), params });
  }

  GetEmployeeById(id: string) {
    return this.http.get(this.url + id, this.getHeaders());
  }

  PostEmployee(employee: any) {
    return this.http.post(this.url, employee, this.getHeaders());
  }

  PutEmployee(id: string, employee: any) {
    return this.http.put(this.url + id, employee, this.getHeaders());
  }

  DeleteEmployee(id: string) {
    return this.http.delete(this.url + id, this.getHeaders());
  }

  RestoreEmployee(id: string) {
    return this.http.patch(this.url + id + '/restore', {}, this.getHeaders());
  }
}