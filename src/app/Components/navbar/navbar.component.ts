import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { ProductsService } from '../../Services/products-service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  
  isCollapsed = false;
  lowStockProducts: any[] = []; // Lista de productos con stock bajo
  isLoadingAlerts = false;

  constructor(
    private router: Router, 
    public authService: AuthService,
    private productsService: ProductsService // Inyectamos servicio de productos
  ) {}

  ngOnInit(): void {
    // Si el usuario está logueado y tiene permiso de ver productos (Admin o Empleado)
    if (this.authService.isLoggedIn() && this.canAccessProducts()) {
      this.checkLowStock();
    }
  }

  // --- Lógica de Alertas de Stock ---
  checkLowStock(): void {
    this.isLoadingAlerts = true;
    // Obtenemos solo productos activos para no alertar sobre los borrados
    this.productsService.getProducts(undefined, undefined, 'active').subscribe({
      next: (response: any) => {
        const allProducts = response.data || [];
        
        // Filtramos: Stock actual <= Stock Mínimo
        this.lowStockProducts = allProducts.filter((p: any) => p.stock <= p.min_stock);
        this.isLoadingAlerts = false;
      },
      error: () => {
        console.error('Error al verificar stock bajo');
        this.isLoadingAlerts = false;
      }
    });
  }

  // Getters para usar en la plantilla
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isEmployee(): boolean {
    return this.authService.isEmployee();
  }

  // --- Permisos de Rutas ---

  canAccessDashboard(): boolean { return this.authService.hasPermission([1, 2]); }
  canAccessMetrics(): boolean { return this.authService.hasPermission([1]); }
  canAccessSales(): boolean { return this.authService.hasPermission([1, 2]); }
  canAccessClients(): boolean { return this.authService.hasPermission([1, 2]); }
  canAccessServices(): boolean { return this.authService.hasPermission([1, 2]); }
  canAccessProducts(): boolean { return this.authService.hasPermission([1, 2]); }
  canAccessEmployees(): boolean { return this.authService.hasPermission([1]); }
  canAccessAudit(): boolean { return this.authService.hasPermission([1]); }

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