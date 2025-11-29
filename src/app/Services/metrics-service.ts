import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from './auth-service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  url = 'http://localhost:3000/api/metrics';
  //url = 'https://ncdetailing.up.railway.app/api/metrics';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  // Tu método getHeaders
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

  getDashboardMetrics(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.filter) {
      httpParams = httpParams.set('filter', params.filter);
    } else if (params.startDate && params.endDate) {
      httpParams = httpParams.set('startDate', params.startDate);
      httpParams = httpParams.set('endDate', params.endDate);
    }
    return this.http.get(this.url + '/dashboard', { ...this.getHeaders(), params: httpParams });
  }
}