import { Component, OnInit } from '@angular/core';
import { ClientsService } from '../../Services/clients-service';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css',
  standalone: false
})
export class ClientsComponent implements OnInit {

  constructor(private service: ClientsService, private router: Router, private authService: AuthService) {}

  // Datos
  DataSourceClients: any[] = [];
  activeView: 'list' | 'create' | 'edit' | 'history' = 'list';
  SearchTerm: string = '';

  // Formulario de cliente
  FirstName: string = '';
  LastName: string = '';
  Email: string = '';
  Phone: string = '';
  Vehicles: any[] = [];

  // Edición
  IdEdit: number = 0;
  FirstNameEdit: string = '';
  LastNameEdit: string = '';
  EmailEdit: string = '';
  PhoneEdit: string = '';
  VehiclesEdit: any[] = [];

  // Vehículos
  NewVehicleBrand: string = '';
  NewVehicleModel: string = '';
  NewVehicleYear: number = new Date().getFullYear();
  NewVehicleColor: string = '';
  NewVehicleLicensePlate: string = '';

  // Detalles e Historial
  SelectedClient: any = null;
  ClientHistory: any = null;
  HistoryLoading: boolean = false;

  // Errores
  errorMessage: string = '';
  modalError: string = '';

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.GetClients();
    } else {
      this.router.navigate(['/login']);
    }
  }

  showListView(): void {
    this.activeView = 'list';
    this.clearForm();
    this.clearError();
    this.SelectedClient = null;
  }

  showCreateForm(): void {
    this.activeView = 'create';
    this.clearForm();
    this.clearError();
  }

  showEditForm(client: any): void {
    this.activeView = 'edit';
    this.SelectedClient = client;
    
    this.IdEdit = client.id;
    this.FirstNameEdit = client.first_name;
    this.LastNameEdit = client.last_name;
    this.EmailEdit = client.email;
    this.PhoneEdit = client.phone;
    
    this.service.getClientVehicles(client.id.toString()).subscribe({
      next: (data: any) => {
        this.VehiclesEdit = data.data || [];
        this.clearError();
      },
      error: (error) => {
        this.handleModalError(error);
        this.VehiclesEdit = [];
      }
    });
    this.clearError();
  }

  showHistoryView(client: any): void {
    this.activeView = 'history';
    this.SelectedClient = client;
    this.loadClientHistory(client.id);
  }

  loadClientHistory(clientId: number): void {
    this.HistoryLoading = true;
    this.service.getClientHistory(clientId.toString()).subscribe({
      next: (data: any) => {
        this.ClientHistory = data.data;
        this.HistoryLoading = false;
        this.clearError();
      },
      error: (error) => {
        this.handleError(error);
        this.HistoryLoading = false;
        this.ClientHistory = { servicesHistory: [], productsHistory: [] };
      }
    });
  }

  GetClients(): void {
    this.service.getClients(this.SearchTerm).subscribe({
      next: (data: any) => {
        this.DataSourceClients = data.data;
        this.clearError();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  CreateClient(): void {
    const client = {
      first_name: this.FirstName,
      last_name: this.LastName,
      email: this.Email,
      phone: this.Phone,
      vehicles: this.Vehicles
    };

    this.service.postClient(client).subscribe({
      next: () => {
        this.clearError();
        this.showListView();
        this.GetClients();
      },
      error: (error) => {
        this.handleModalError(error);
      }
    });
  }

  EditClient(): void {
    const client: any = {
      first_name: this.FirstNameEdit,
      last_name: this.LastNameEdit,
      email: this.EmailEdit,
      phone: this.PhoneEdit,
      vehicles: this.VehiclesEdit.map(vehicle => ({
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        license_plate: vehicle.license_plate,
        deleted: vehicle.deleted || false
      }))
    };

    this.service.putClient(this.IdEdit.toString(), client).subscribe({
      next: () => {
        this.clearError();
        this.showListView();
        this.GetClients();
      },
      error: (error) => {
        this.handleModalError(error);
      }
    });
  }

  ViewClientDetails(client: any): void {
    this.SelectedClient = client;
    this.clearError();
  }

  AddVehicle(): void {
    if (this.NewVehicleBrand && this.NewVehicleModel && this.NewVehicleYear && 
        this.NewVehicleColor && this.NewVehicleLicensePlate) {
      
      const vehicle = {
        brand: this.NewVehicleBrand,
        model: this.NewVehicleModel,
        year: this.NewVehicleYear,
        color: this.NewVehicleColor,
        license_plate: this.NewVehicleLicensePlate
      };

      if (this.activeView === 'edit') {
        this.VehiclesEdit.push(vehicle);
      } else {
        this.Vehicles.push(vehicle);
      }
      this.clearModalError();
      
      this.NewVehicleBrand = '';
      this.NewVehicleModel = '';
      this.NewVehicleYear = new Date().getFullYear();
      this.NewVehicleColor = '';
      this.NewVehicleLicensePlate = '';
    } else {
      this.modalError = 'Por favor, complete todos los campos del vehículo';
    }
  }

  RemoveVehicle(index: number): void {
    if (this.activeView === 'edit') {
      if (this.VehiclesEdit[index].id) {
        this.VehiclesEdit[index].deleted = true;
      } else {
        this.VehiclesEdit.splice(index, 1);
      }
    } else {
      this.Vehicles.splice(index, 1);
    }
    this.clearModalError();
  }

  ApplyFilters(): void {
    this.GetClients();
  }

  ClearFilters(): void {
    this.SearchTerm = '';
    this.GetClients();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }

  formatNumber(value: any): string {
    if (value === null || value === undefined) return '0';
    const num = Number(value);
    if (isNaN(num)) return String(value).replace(/^0+/, '');
    return num.toString().replace(/^0+/, '');
  }

  getServicesTotal(services: any[]): number {
    return services.reduce((total, service) => total + (service.price || 0), 0);
  }

  getProductsTotal(products: any[]): number {
    return products.reduce((total, product) => total + (product.subtotal || 0), 0);
  }

  getVehiclesTooltip(vehicles: any[]): string {
    if (!vehicles || vehicles.length === 0) return 'Sin vehículos';
    return vehicles.map(vehicle => 
      `${vehicle.brand} ${vehicle.model} (${vehicle.license_plate}) - ${vehicle.year}`
    ).join('\n');
  }

  getFullName(client: any): string {
    return `${client.first_name} ${client.last_name}`;
  }

  // --- MANEJO DE ERRORES GENÉRICO ---

  private getGenericErrorMessage(status: number): string {
    switch (status) {
      case 0: return 'Error de conexión. Verifique su internet.';
      case 400: return 'Datos incorrectos. Verifique la información ingresada.';
      case 401: return 'Sesión expirada. Por favor inicie sesión nuevamente.';
      case 403: return 'No tiene permisos para realizar esta acción.';
      case 404: return 'Cliente no encontrado.';
      case 409: return 'Ya existe un cliente con ese email o patente.';
      case 500: return 'Error interno del servidor.';
      default: return 'Ocurrió un error inesperado.';
    }
  }

  handleError(error: any): void {
    this.errorMessage = this.getGenericErrorMessage(error.status);
  }

  handleModalError(error: any): void {
    this.modalError = this.getGenericErrorMessage(error.status);
  }

  clearError(): void {
    this.errorMessage = '';
  }

  clearModalError(): void {
    this.modalError = '';
  }

  clearForm(): void {
    this.FirstName = '';
    this.LastName = '';
    this.Email = '';
    this.Phone = '';
    this.Vehicles = [];
    this.FirstNameEdit = '';
    this.LastNameEdit = '';
    this.EmailEdit = '';
    this.PhoneEdit = '';
    this.VehiclesEdit = [];
    this.NewVehicleBrand = '';
    this.NewVehicleModel = '';
    this.NewVehicleYear = new Date().getFullYear();
    this.NewVehicleColor = '';
    this.NewVehicleLicensePlate = '';
    this.modalError = '';
  }
}