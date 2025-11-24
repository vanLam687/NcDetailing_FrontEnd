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

  // Reemplazar la propiedad isAdmin por métodos más específicos
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isEmployee(): boolean {
    return this.authService.isEmployee();
  }

  // Verificar permisos para rutas específicas
  canAccessMetrics(): boolean {
    return this.authService.hasPermission([1]); // Solo admin
  }

  canAccessEmployees(): boolean {
    return this.authService.hasPermission([1]); // Solo admin
  }

  canAccessSales(): boolean {
    return this.authService.hasPermission([1, 2]); // Admin y empleado
  }

  canAccessClients(): boolean {
    return this.authService.hasPermission([1, 2]); // Admin y empleado
  }

  canAccessServices(): boolean {
    return this.authService.hasPermission([1, 2]); // Admin y empleado
  }

  canAccessProducts(): boolean {
    return this.authService.hasPermission([1, 2]); // Admin y empleado
  }

  // Auditorías - Solo Admin
  canAccessAudit(): boolean {
    return this.authService.hasPermission([1]); // Solo admin
  }

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