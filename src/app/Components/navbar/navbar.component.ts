import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  
  isCollapsed = false;

  constructor(private router: Router, public authService: AuthService) {}

  // Getters para usar en la plantilla
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isEmployee(): boolean {
    return this.authService.isEmployee();
  }

  // --- Permisos de Rutas ---

  // Dashboard: Visible para todos (Admin y Empleado)
  canAccessDashboard(): boolean {
    return this.authService.hasPermission([1, 2]);
  }

  // Métricas: Solo Admin
  canAccessMetrics(): boolean {
    return this.authService.hasPermission([1]);
  }

  // Ventas: Visible para todos
  canAccessSales(): boolean {
    return this.authService.hasPermission([1, 2]);
  }

  // Clientes: Visible para todos
  canAccessClients(): boolean {
    return this.authService.hasPermission([1, 2]);
  }

  // Servicios: Visible para todos (pero con restricciones internas)
  canAccessServices(): boolean {
    return this.authService.hasPermission([1, 2]);
  }

  // Productos: Visible para todos (pero con restricciones internas)
  canAccessProducts(): boolean {
    return this.authService.hasPermission([1, 2]);
  }

  // Empleados: Solo Admin
  canAccessEmployees(): boolean {
    return this.authService.hasPermission([1]);
  }

  // Auditorías: Solo Admin
  canAccessAudit(): boolean {
    return this.authService.hasPermission([1]);
  }

  // --- Helpers de Usuario ---

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user?.name || user?.username || 'Usuario';
  }

  getUserInitial(): string {
    const userName = this.getUserName();
    return userName.charAt(0).toUpperCase();
  }

  getUserRoleName(): string {
    if (this.isAdmin) return 'Administrador';
    if (this.isEmployee) return 'Empleado';
    return 'Usuario';
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  logout(): void {
    this.authService.logout();
  }
}