import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { DashboardService } from '../../Services/dashboard-service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  isLoading: boolean = false;
  errorMessage: string = '';
  dashboardData: any = null;
  hasError: boolean = false;

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadDashboardData();
    } else {
      this.router.navigate(['/login']);
    }
  }

  // --- Carga de Datos ---
  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.hasError = false;
    this.dashboardData = null;

    this.dashboardService.getDashboard().subscribe({
      next: (data: any) => {
        console.log('Dashboard data received:', data);
        this.dashboardData = data;
        this.isLoading = false;
        this.clearError();
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.handleError(error);
        this.isLoading = false;
        this.hasError = true;
      }
    });
  }

  handleError(error: any): void {
    if (error.status === 401) {
      this.authService.logout();
      return;
    }

    if (error.status === 403) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    if (error.status === 500) {
      this.errorMessage = 'Error del servidor. El equipo técnico ha sido notificado.';
    } else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else if (typeof error.error === 'string') {
      this.errorMessage = error.error;
    } else if (error.message) {
      this.errorMessage = error.message;
    } else if (error.status === 0) {
      this.errorMessage = 'Error de conexión. Verifique su internet.';
    } else {
      this.errorMessage = `Error inesperado (${error.status})`;
    }
  }

  clearError(): void {
    this.errorMessage = '';
    this.hasError = false;
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return timeString;
    }
  }

  calculateProductsTotal(products: any[]): number {
    if (!products || products.length === 0) return 0;
    return products.reduce((sum, product) => sum + (product.subtotal || 0), 0);
  }

  retryLoad(): void {
    this.loadDashboardData();
  }
}