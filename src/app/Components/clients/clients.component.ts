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
  activeView: 'list' | 'create' | 'edit' | 'history' = 'list';

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
  formErrors: any = {};

  // Historial de navegación
  private historyStack: string[] = ['list'];

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
    this.clearModalError();
    this.clearFormErrors();
    this.addToHistory('list');
  }

  showCreateForm(): void {
    this.activeView = 'create';
    this.clearForm();
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
    this.addToHistory('create');
  }

  showEditForm(client: any): void {
    this.activeView = 'edit';
    this.SelectedClient = client;
    
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
        this.clearModalError();
      },
      error: (error) => {
        if (error.status === 401) {
          this.authService.logout();
          return;
        }
        this.handleModalError(error);
        this.VehiclesEdit = [];
      }
    });
    
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
    this.addToHistory('edit');
  }

  showHistoryView(client: any): void {
    this.activeView = 'history';
    this.SelectedClient = client;
    this.loadClientHistory(client.id);
    this.addToHistory('history');
  }

  // Métodos para navegar desde el header
  showEditBack(): void {
    if (this.SelectedClient) {
      this.activeView = 'edit';
      this.addToHistory('edit');
    }
  }

  showHistoryBack(): void {
    if (this.SelectedClient) {
      this.activeView = 'history';
      this.addToHistory('history');
    }
  }

  // Métodos para verificar si se puede mostrar edición/historial
  canShowEdit(): boolean {
    return this.SelectedClient !== null;
  }

  canShowHistory(): boolean {
    return this.SelectedClient !== null;
  }

  // Métodos auxiliares para manejar el historial de navegación
  private addToHistory(view: string): void {
    this.historyStack.push(view);
    // Mantener solo los últimos 10 elementos en el historial
    if (this.historyStack.length > 10) {
      this.historyStack.shift();
    }
  }

  // Método para volver atrás
  goBack(): void {
    if (this.historyStack.length > 1) {
      this.historyStack.pop(); // Remover vista actual
      const previousView = this.historyStack[this.historyStack.length - 1];
      this.activeView = previousView as 'list' | 'create' | 'edit' | 'history';
      
      // Si volvemos al listado, limpiar el cliente seleccionado
      if (this.activeView === 'list') {
        this.SelectedClient = null;
      }
    } else {
      this.showListView();
    }
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
        if (error.status === 401) {
          this.authService.logout();
          return;
        }
        this.handleError(error);
        this.HistoryLoading = false;
        this.ClientHistory = { servicesHistory: [], productsHistory: [] };
      }
    });
  }

  // Validación de formulario de cliente - NUEVO
  validateClientForm(): boolean {
    this.clearFormErrors();
    let isValid = true;

    // Validar nombre
    if (!this.currentFirstName || this.currentFirstName.trim() === '') {
      this.formErrors.firstName = 'El nombre es requerido';
      isValid = false;
    } else if (this.currentFirstName.length > 50) {
      this.formErrors.firstName = 'El nombre no puede exceder los 50 caracteres';
      isValid = false;
    }

    // Validar apellido
    if (!this.currentLastName || this.currentLastName.trim() === '') {
      this.formErrors.lastName = 'El apellido es requerido';
      isValid = false;
    } else if (this.currentLastName.length > 50) {
      this.formErrors.lastName = 'El apellido no puede exceder los 50 caracteres';
      isValid = false;
    }

    // Validar email
    if (!this.currentEmail || this.currentEmail.trim() === '') {
      this.formErrors.email = 'El email es requerido';
      isValid = false;
    } else if (!this.isValidEmail(this.currentEmail)) {
      this.formErrors.email = 'El formato del email no es válido';
      isValid = false;
    } else if (this.currentEmail.length > 100) {
      this.formErrors.email = 'El email no puede exceder los 100 caracteres';
      isValid = false;
    }

    // Validar teléfono
    if (!this.currentPhone || this.currentPhone.trim() === '') {
      this.formErrors.phone = 'El teléfono es requerido';
      isValid = false;
    } else if (this.currentPhone.length > 20) {
      this.formErrors.phone = 'El teléfono no puede exceder los 20 caracteres';
      isValid = false;
    }

    // Validar vehículos (opcional)
    const currentVehicles = this.activeView === 'edit' ? this.VehiclesEdit : this.Vehicles;
    for (let i = 0; i < currentVehicles.length; i++) {
      const vehicle = currentVehicles[i];
      if (!vehicle.brand || vehicle.brand.trim() === '') {
        this.formErrors[`vehicleBrand_${i}`] = 'La marca del vehículo es requerida';
        isValid = false;
      }
      if (!vehicle.model || vehicle.model.trim() === '') {
        this.formErrors[`vehicleModel_${i}`] = 'El modelo del vehículo es requerido';
        isValid = false;
      }
      if (!vehicle.license_plate || vehicle.license_plate.trim() === '') {
        this.formErrors[`vehicleLicensePlate_${i}`] = 'La patente del vehículo es requerida';
        isValid = false;
      }
    }

    return isValid;
  }

  // Validar formato de email - NUEVO
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Servicios
  GetClients(): void {
    this.service.getClients(this.SearchTerm).subscribe({
      next: (data: any) => {
        this.DataSourceClients = data.data;
        this.clearError();
      },
      error: (error) => {
        if (error.status === 401) {
          this.authService.logout();
          return;
        }
        this.handleError(error);
      }
    });
  }

  CreateClient(): void {
    if (!this.validateClientForm()) {
      return;
    }

    const client = {
      first_name: this.FirstName.trim(),
      last_name: this.LastName.trim(),
      email: this.Email.trim(),
      phone: this.Phone.trim(),
      vehicles: this.Vehicles.map(vehicle => ({
        brand: vehicle.brand.trim(),
        model: vehicle.model.trim(),
        year: vehicle.year,
        color: vehicle.color.trim(),
        license_plate: vehicle.license_plate.trim()
      }))
    };

    this.service.postClient(client).subscribe({
      next: () => {
        this.clearError();
        this.clearModalError();
        this.clearFormErrors();
        this.showSuccessNotification('Cliente creado correctamente');
        this.showListView();
        this.GetClients();
      },
      error: (error) => {
        if (error.status === 401) {
          this.authService.logout();
          return;
        }
        this.handleModalError(error);
      }
    });
  }

  EditClient(): void {
    if (!this.validateClientForm()) {
      return;
    }

    const client: any = {
      first_name: this.FirstNameEdit.trim(),
      last_name: this.LastNameEdit.trim(),
      email: this.EmailEdit.trim(),
      phone: this.PhoneEdit.trim(),
      vehicles: this.VehiclesEdit.map(vehicle => ({
        id: vehicle.id,
        brand: vehicle.brand.trim(),
        model: vehicle.model.trim(),
        year: vehicle.year,
        color: vehicle.color.trim(),
        license_plate: vehicle.license_plate.trim(),
        deleted: vehicle.deleted || false
      }))
    };

    this.service.putClient(this.IdEdit.toString(), client).subscribe({
      next: () => {
        this.clearError();
        this.clearModalError();
        this.clearFormErrors();
        this.showSuccessNotification('Cliente actualizado correctamente');
        this.showListView();
        this.GetClients();
      },
      error: (error) => {
        if (error.status === 401) {
          this.authService.logout();
          return;
        }
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
    this.clearModalError();
    this.clearFormErrors();

    if (!this.NewVehicleBrand || this.NewVehicleBrand.trim() === '') {
      this.modalError = 'La marca del vehículo es requerida';
      return;
    }
    if (!this.NewVehicleModel || this.NewVehicleModel.trim() === '') {
      this.modalError = 'El modelo del vehículo es requerido';
      return;
    }
    if (!this.NewVehicleYear) {
      this.modalError = 'El año del vehículo es requerido';
      return;
    }
    if (!this.NewVehicleColor || this.NewVehicleColor.trim() === '') {
      this.modalError = 'El color del vehículo es requerido';
      return;
    }
    if (!this.NewVehicleLicensePlate || this.NewVehicleLicensePlate.trim() === '') {
      this.modalError = 'La patente del vehículo es requerida';
      return;
    }
    
    const vehicle = {
      brand: this.NewVehicleBrand.trim(),
      model: this.NewVehicleModel.trim(),
      year: this.NewVehicleYear,
      color: this.NewVehicleColor.trim(),
      license_plate: this.NewVehicleLicensePlate.trim()
    };

    if (this.activeView === 'edit') {
      this.VehiclesEdit.push(vehicle);
    } else {
      this.Vehicles.push(vehicle);
    }
    
    // Limpiar campos
    this.NewVehicleBrand = '';
    this.NewVehicleModel = '';
    this.NewVehicleYear = new Date().getFullYear();
    this.NewVehicleColor = '';
    this.NewVehicleLicensePlate = '';
  }

  RemoveVehicle(index: number): void {
    if (this.activeView === 'edit') {
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
    this.clearFormErrors();
  }

  ApplyFilters(): void {
    this.GetClients();
  }

  ClearFilters(): void {
    this.SearchTerm = '';
    this.GetClients();
  }

  // Método para cerrar modales - NUEVO
  private closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      const modalInstance = (window as any).bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  // Método para mostrar notificaciones de éxito - NUEVO
  private showSuccessNotification(message: string): void {
    // Crear elemento de notificación con diseño mejorado
    const notification = document.createElement('div');
    notification.className = 'alert alert-success alert-dismissible fade show custom-toast';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 350px;
      max-width: 450px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
      color: white;
      padding: 16px 20px;
      animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div class="d-flex align-items-center">
        <!-- CHECK NORMAL -->
        <span style="
          font-size: 22px;
          font-weight: bold;
          color: white;
          margin-right: 12px;
          line-height: 1;
        ">
          ✔
        </span>

        <div class="flex-grow-1">
          <strong class="me-auto" 
            style="font-size: 16px; display: block; margin-bottom: 4px;">
            ¡Éxito!
          </strong>
          <div style="font-size: 14px; opacity: 0.95;">${message}</div>
        </div>

        <button type="button" class="btn-close btn-close-white" 
          data-bs-dismiss="alert"
          style="filter: brightness(0) invert(1); opacity: 0.8; margin-left: 16px;">
        </button>
      </div>
    `;

    // Agregar estilos CSS para la animación
    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .custom-toast {
          backdrop-filter: blur(10px);
          border-left: 4px solid #1e8449 !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Agregar al body
    document.body.appendChild(notification);

    // Auto-remover después de 4 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 4000);
  }

  // Getters para el formulario actual
  get currentFirstName(): string {
    return this.activeView === 'edit' ? this.FirstNameEdit : this.FirstName;
  }

  get currentLastName(): string {
    return this.activeView === 'edit' ? this.LastNameEdit : this.LastName;
  }

  get currentEmail(): string {
    return this.activeView === 'edit' ? this.EmailEdit : this.Email;
  }

  get currentPhone(): string {
    return this.activeView === 'edit' ? this.PhoneEdit : this.Phone;
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

  // Tooltip para vehículos
  getVehiclesTooltip(vehicles: any[]): string {
    if (!vehicles || vehicles.length === 0) {
      return 'Sin vehículos';
    }
    
    return vehicles.map(vehicle => 
      `${vehicle.brand} ${vehicle.model} (${vehicle.license_plate}) - ${vehicle.year}`
    ).join('\n');
  }

  // Helpers
  getFullName(client: any): string {
    return `${client.first_name} ${client.last_name}`;
  }

  // Manejo de errores - MEJORADO
  handleError(error: any): void {
    this.clearFormErrors();
    
    if (error.error?.mensaje) {
      this.errorMessage = error.error.mensaje;
    } 
    else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } 
    else if (error.error?.error) {
      // Extraer mensajes específicos de validación
      if (typeof error.error.error === 'string') {
        this.errorMessage = error.error.error;
      } else if (error.error.error.details) {
        // Manejar errores de Joi
        const details = error.error.error.details;
        this.errorMessage = details.map((detail: any) => {
          // Traducir mensajes de Joi a español
          if (detail.type === 'string.empty') {
            return `"${detail.context.label}" no puede estar vacío`;
          } else if (detail.type === 'string.max') {
            return `"${detail.context.label}" no puede exceder los ${detail.context.limit} caracteres`;
          } else if (detail.type === 'string.email') {
            return `"${detail.context.label}" debe ser un email válido`;
          } else if (detail.type === 'any.required') {
            return `"${detail.context.label}" es requerido`;
          }
          return detail.message;
        }).join(', ');
      } else {
        this.errorMessage = error.error.error;
      }
    }
    else if (typeof error.error === 'string') {
      this.errorMessage = error.error;
    }
    else if (error.status === 0) {
      this.errorMessage = 'Error de conexión. No se puede conectar al servidor.';
    }
    else if (error.status === 400) {
      this.errorMessage = 'Solicitud incorrecta. Verifique los datos ingresados.';
    }
    else if (error.status === 409) {
      this.errorMessage = 'El cliente ya existe.';
    }
    else if (error.status === 404) {
      this.errorMessage = 'Cliente no encontrado.';
    }
    else if (error.status === 500) {
      this.errorMessage = 'Error interno del servidor.';
    }
    else {
      this.errorMessage = 'Ha ocurrido un error inesperado.';
    }
  }

  handleModalError(error: any): void {
    this.clearFormErrors();
    
    if (error.error?.mensaje) {
      this.modalError = error.error.mensaje;
    } 
    else if (error.error?.message) {
      this.modalError = error.error.message;
    } 
    else if (error.error?.error) {
      // Extraer mensajes específicos de validación
      if (typeof error.error.error === 'string') {
        this.modalError = error.error.error;
      } else if (error.error.error.details) {
        // Manejar errores de Joi
        const details = error.error.error.details;
        this.modalError = details.map((detail: any) => {
          // Traducir mensajes de Joi a español
          if (detail.type === 'string.empty') {
            return `"${detail.context.label}" no puede estar vacío`;
          } else if (detail.type === 'string.max') {
            return `"${detail.context.label}" no puede exceder los ${detail.context.limit} caracteres`;
          } else if (detail.type === 'string.email') {
            return `"${detail.context.label}" debe ser un email válido`;
          } else if (detail.type === 'any.required') {
            return `"${detail.context.label}" es requerido`;
          }
          return detail.message;
        }).join(', ');
      } else {
        this.modalError = error.error.error;
      }
    }
    else if (typeof error.error === 'string') {
      this.modalError = error.error;
    }
    else if (error.status === 0) {
      this.modalError = 'Error de conexión. No se puede conectar al servidor.';
    }
    else if (error.status === 400) {
      this.modalError = 'Solicitud incorrecta. Verifique los datos ingresados.';
    }
    else if (error.status === 409) {
      this.modalError = 'Ya existe un cliente con ese email o teléfono.';
    }
    else if (error.status === 404) {
      this.modalError = 'El cliente no fue encontrado.';
    }
    else if (error.status === 500) {
      this.modalError = 'Error interno del servidor.';
    }
    else {
      this.modalError = 'Ha ocurrido un error inesperado.';
    }

    // Mostrar toast de error
    this.showToast(this.modalError, 'error');
  }

  // Método para mostrar toast de error - NUEVO
  private showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    // Crear elemento de notificación con diseño mejorado
    const notification = document.createElement('div');
    notification.className = 'alert alert-dismissible fade show custom-toast';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 350px;
      max-width: 450px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      padding: 16px 20px;
      animation: slideInRight 0.3s ease-out;
    `;

    // Configurar colores según el tipo
    if (type === 'success') {
      notification.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
      notification.style.color = 'white';
      notification.style.borderLeft = '4px solid #1e8449';
    } else if (type === 'error') {
      notification.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
      notification.style.color = 'white';
      notification.style.borderLeft = '4px solid #a93226';
    } else {
      notification.style.background = 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)';
      notification.style.color = 'white';
      notification.style.borderLeft = '4px solid #a84300';
    }
    
    notification.innerHTML = `
      <div class="d-flex align-items-center">
        <!-- Icono -->
        <span style="
          font-size: 22px;
          font-weight: bold;
          color: white;
          margin-right: 12px;
          line-height: 1;
        ">
          ${type === 'success' ? '✔' : type === 'error' ? '✖' : '⚠'}
        </span>

        <div class="flex-grow-1">
          <strong class="me-auto" 
            style="font-size: 16px; display: block; margin-bottom: 4px;">
            ${type === 'success' ? '¡Éxito!' : type === 'error' ? 'Error' : 'Advertencia'}
          </strong>
          <div style="font-size: 14px; opacity: 0.95;">${message}</div>
        </div>

        <button type="button" class="btn-close btn-close-white" 
          data-bs-dismiss="alert"
          style="filter: brightness(0) invert(1); opacity: 0.8; margin-left: 16px;">
        </button>
      </div>
    `;

    // Agregar al body
    document.body.appendChild(notification);

    // Auto-remover después de 4 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 4000);
  }

  clearError(): void {
    this.errorMessage = '';
  }

  clearModalError(): void {
    this.modalError = '';
  }

  clearFormErrors(): void {
    this.formErrors = {};
  }

  hasFormErrors(): boolean {
    return Object.keys(this.formErrors).length > 0;
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
    
    this.clearModalError();
    this.clearFormErrors();
  }
}