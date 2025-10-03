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

  DataSourceClients: any[] = [];

  FirstName: string = '';
  LastName: string = '';
  Email: string = '';
  Phone: string = '';

  IdEdit: number = 0;
  FirstNameEdit: string = '';
  LastNameEdit: string = '';
  EmailEdit: string = '';
  PhoneEdit: string = '';

  IdDelete: number = 0;

  SelectedClient: any = null;

  Vehicles: any[] = [];
  NewVehicleBrand: string = '';
  NewVehicleModel: string = '';
  NewVehicleYear: number = 0;
  NewVehicleColor: string = '';
  NewVehicleLicensePlate: string = '';

  errorMessage: string = '';

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.GetClients();
    } else {
      this.router.navigate(['/login']);
    }
  }

  GetClients(): void {
    this.service.getClients('').subscribe({
      next: (data: any) => {
        this.DataSourceClients = data.data;
        this.LoadClientVehicles();
        this.clearError();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  LoadClientVehicles(): void {
    this.DataSourceClients.forEach(client => {
      this.service.getClientVehicles(client.id.toString()).subscribe({
        next: (vehiclesData: any) => {
          client.vehicles = vehiclesData.data;
        },
        error: (error) => {
          console.error('Error loading vehicles for client:', client.id, error);
          client.vehicles = [];
        }
      });
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
        location.reload();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  ViewClientDetails(client: any): void {
    this.SelectedClient = client;
    this.clearError();
  }

  DatosEdit(client: any): void {
    this.IdEdit = client.id;
    this.FirstNameEdit = client.first_name;
    this.LastNameEdit = client.last_name;
    this.EmailEdit = client.email;
    this.PhoneEdit = client.phone;
    this.clearError();
    
    this.service.getClientVehicles(client.id.toString()).subscribe({
      next: (data: any) => {
        this.Vehicles = data.data;
        this.clearError();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  EditClient(): void {
    const client: any = {
      first_name: this.FirstNameEdit,
      last_name: this.LastNameEdit,
      email: this.EmailEdit,
      phone: this.PhoneEdit,
      vehicles: this.Vehicles
    };

    this.service.putClient(this.IdEdit.toString(), client).subscribe({
      next: () => {
        this.clearError();
        location.reload();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  DatosDelete(client: any): void {
    this.IdDelete = client.id;
    this.clearError();
  }

  DeleteClient(): void {
    this.service.deleteClient(this.IdDelete.toString()).subscribe({
      next: () => {
        this.clearError();
        location.reload();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
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

      this.Vehicles.push(vehicle);
      this.clearError();
      
      this.NewVehicleBrand = '';
      this.NewVehicleModel = '';
      this.NewVehicleYear = 0;
      this.NewVehicleColor = '';
      this.NewVehicleLicensePlate = '';
    } else {
      this.errorMessage = 'Por favor, complete todos los campos del vehículo';
    }
  }

  RemoveVehicle(index: number): void {
    this.Vehicles.splice(index, 1);
    this.clearError();
  }

  private handleError(error: any): void {
    if (error.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    if (error.error?.message) {
      this.errorMessage = error.error.message;
    } 
    else if (typeof error.error === 'string') {
      this.errorMessage = error.error;
    }
    else if (error.message) {
      this.errorMessage = error.message;
    }
    else if (error.status === 0) {
      this.errorMessage = 'Error de conexión. Verifique su internet.';
    } else {
      this.errorMessage = 'Ha ocurrido un error inesperado.';
    }
  }

  private clearError(): void {
    this.errorMessage = '';
  }

  getFullName(client: any): string {
    return `${client.first_name} ${client.last_name}`;
  }

  getVehicleSummary(client: any): string {
    if (client.vehicles && client.vehicles.length > 0) {
      return client.vehicles.map((v: any) => `${v.brand} ${v.model}`).join(', ');
    }
    return client.vehicles ? 'Sin vehículos' : 'Cargando...';
  }
}