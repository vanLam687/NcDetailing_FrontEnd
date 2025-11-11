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

  // Estados de vista
  activeView: 'list' | 'form' | 'history' = 'list';
  isEditMode: boolean = false;

  // Filtros
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

  // Navegación entre vistas
  showListView(): void {
    this.activeView = 'list';
    this.clearForm();
    this.clearError();
  }

  showCreateForm(): void {
    this.activeView = 'form';
    this.isEditMode = false;
    this.clearForm();
    this.clearError();
  }

  showEditForm(client: any): void {
    this.activeView = 'form';
    this.isEditMode = true;
    
    this.IdEdit = client.id;
    this.FirstNameEdit = client.first_name;
    this.LastNameEdit = client.last_name;
    this.EmailEdit = client.email;
    this.PhoneEdit = client.phone;
    
    // Cargar vehículos del cliente
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

  // Cargar historial del cliente
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

  // Servicios
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

  // Gestión de vehículos
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

      if (this.isEditMode) {
        this.VehiclesEdit.push(vehicle);
      } else {
        this.Vehicles.push(vehicle);
      }
      
      this.clearModalError();
      
      // Limpiar campos
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
    if (this.isEditMode) {
      // Marcar como eliminado si ya tiene ID, o simplemente remover si es nuevo
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

  // Formatear fecha
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Calcular total de servicios
  getServicesTotal(services: any[]): number {
    return services.reduce((total, service) => total + (service.price || 0), 0);
  }

  // Calcular total de productos
  getProductsTotal(products: any[]): number {
    return products.reduce((total, product) => total + (product.subtotal || 0), 0);
  }

  // Getters para el formulario
  get currentFirstName(): string {
    return this.isEditMode ? this.FirstNameEdit : this.FirstName;
  }

  set currentFirstName(value: string) {
    if (this.isEditMode) {
      this.FirstNameEdit = value;
    } else {
      this.FirstName = value;
    }
  }

  get currentLastName(): string {
    return this.isEditMode ? this.LastNameEdit : this.LastName;
  }

  set currentLastName(value: string) {
    if (this.isEditMode) {
      this.LastNameEdit = value;
    } else {
      this.LastName = value;
    }
  }

  get currentEmail(): string {
    return this.isEditMode ? this.EmailEdit : this.Email;
  }

  set currentEmail(value: string) {
    if (this.isEditMode) {
      this.EmailEdit = value;
    } else {
      this.Email = value;
    }
  }

  get currentPhone(): string {
    return this.isEditMode ? this.PhoneEdit : this.Phone;
  }

  set currentPhone(value: string) {
    if (this.isEditMode) {
      this.PhoneEdit = value;
    } else {
      this.Phone = value;
    }
  }

  get currentVehicles(): any[] {
    return this.isEditMode ? this.VehiclesEdit : this.Vehicles;
  }

  // Helpers
  getFullName(client: any): string {
    return `${client.first_name} ${client.last_name}`;
  }

  getVehicleSummary(client: any): string {
    if (client.vehicles && client.vehicles.length > 0) {
      return client.vehicles.map((v: any) => `${v.brand} ${v.model}`).join(', ');
    }
    return client.vehicles ? 'Sin vehículos' : 'Cargando...';
  }

  handleError(error: any): void {
    if (error.error?.mensaje) {
      this.errorMessage = error.error.mensaje;
    } 
    else if (error.error?.message) {
      this.errorMessage = error.error.message;
    }
    else if (error.error?.error) {
      this.errorMessage = error.error.error;
    }
    else if (typeof error.error === 'string') {
      this.errorMessage = error.error;
    }
    else if (error.status === 0) {
      this.errorMessage = 'Error de conexión. No se puede conectar al servidor.';
    }
    else if (error.statusText) {
      this.errorMessage = `Error ${error.status}: ${error.statusText}`;
    }
    else {
      this.errorMessage = 'Ha ocurrido un error inesperado.';
    }
  }

  handleModalError(error: any): void {
    if (error.error?.mensaje) {
      this.modalError = error.error.mensaje;
    } else if (error.error?.message) {
      this.modalError = error.error.message;
    } else if (error.error?.error) {
      this.modalError = error.error.error;
    } else if (typeof error.error === 'string') {
      this.modalError = error.error;
    } else if (error.status === 0) {
      this.modalError = 'Error de conexión. No se puede conectar al servidor.';
    } else {
      this.modalError = 'Ha ocurrido un error inesperado.';
    }
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