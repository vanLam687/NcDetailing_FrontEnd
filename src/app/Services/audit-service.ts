import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth-service';
import { Router } from '@angular/router';
import { environment } from '../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  url = environment.apiUrl + '/audit-log';

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

  getAuditLogs(filters?: any) {
    const params: any = {};
    if (filters) {
      if (filters.userId) params.userId = filters.userId;
      if (filters.username) params.username = filters.username;
      if (filters.actionType) params.actionType = filters.actionType;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
    }
    
    return this.http.get(this.url, { ...this.getHeaders(), params });
  }
}