import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {
  url = 'http://localhost:3000/api/employees/';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders() {
    const token = this.authService.getToken();
    return { 
      headers: { 'Authorization': `Bearer ${token}` } 
    };
  }

  GetEmployees() {
    return this.http.get(this.url, this.getHeaders());
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
}