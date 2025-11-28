import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { SalesService } from '../../Services/sales-service';
import { ClientsService } from '../../Services/clients-service';
import { ProductsService } from '../../Services/products-service';
import { ServicesService } from '../../Services/services-service';

@Component({
  selector: 'app-sales',
  standalone: false,
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css'
})
export class SalesComponent implements OnInit {

  // Datos
  DataSourceSalesProducts: any[] = [];
  DataSourceSalesServices: any[] = [];
  DataSourceClients: any[] = [];
  DataSourceMasterProducts: any[] = [];
  DataSourceMasterServices: any[] = [];
  DataSourcePaymentMethods: any[] = [];
  DataSourceServiceStatus: any[] = [];
  ClientVehiclesList: any[] = [];

  // Estados de vista
  activeView: 'products' | 'services' = 'products';
  isEditMode: boolean = false;

  // Filtros
  FilterClientName: string = '';
  FilterStartDate: string = '';
  FilterEndDate: string = '';
  FilterPaymentStatus: string = '';
  FilterServiceStatus: string = '';

  // Formulario de venta de productos
  NewProdSale_ClientId: number = 0;
  NewProdSale_PaymentMethodId: number = 0;
  NewProdSale_PaymentStatusId: number = 1;
  NewProdSale_Observations: string = '';
  NewProdSale_ProductsList: any[] = [];
  Temp_ProductId: number = 0;
  Temp_ProductQty: number = 1;

  // Formulario de venta de servicios
  NewSvcSale_ClientId: number = 0;
  NewSvcSale_VehicleId: number = 0;
  NewSvcSale_PaymentMethodId: number = 0;
  NewSvcSale_PaymentStatusId: number = 1;
  NewSvcSale_Observations: string = '';
  NewSvcSale_ServicesList: any[] = [];
  Temp_ServiceId: number = 0;

  // Búsqueda en tiempo real
  filteredClients: any[] = [];
  filteredProducts: any[] = [];
  filteredServices: any[] = [];
  
  // Campos de búsqueda
  clientSearchTerm: string = '';
  productSearchTerm: string = '';
  serviceSearchTerm: string = '';

  // Actualización de pago
  IdUpdatePayment: number = 0;
  NewPaymentStatusId: number = 0;
  ClientNameUpdatePayment: string = '';
  isSaleFinalized: boolean = false;
  currentPaymentStatus: string = '';
  originalPaymentStatusId: number = 0;

  // Actualización de estado de servicio
  IdUpdateServiceStatus: number = 0;
  NewServiceStatusId: number = 0;
  ClientNameUpdateService: string = '';
  currentServiceStatus: string = '';
  originalServiceStatusId: number = 0;

  SelectedSale: any = null;

  errorMessage: string = '';
  modalError: string = '';
  formErrors: any = {};

  constructor(
    private salesService: SalesService,
    private clientsService: ClientsService, 
    private productsService: ProductsService,  
    private servicesService: ServicesService,  
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.LoadAllData();
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Método para mostrar notificaciones Toast - MEJORADO
  showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
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

    // Agregar estilos CSS para la animación si no existen
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

  // Método para cerrar modales programáticamente
  closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }
    }
  }

  showProductsView(): void {
    this.activeView = 'products';
    this.clearError();
  }

  showServicesView(): void {
    this.activeView = 'services';
    this.clearError();
  }

  showCreateProductSale(): void {
    this.clearForm();
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
    this.filteredClients = [...this.DataSourceClients];
    this.filteredProducts = [...this.DataSourceMasterProducts];
  }

  showCreateServiceSale(): void {
    this.clearForm();
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
    this.filteredClients = [...this.DataSourceClients];
    this.filteredServices = [...this.DataSourceMasterServices];
  }

  LoadAllData(): void {
    this.GetSalesProducts();
    this.GetSalesServices();
    this.LoadMasterData();
  }

  LoadMasterData(): void {
    this.clientsService.getClients().subscribe({
      next: (data: any) => {
        this.DataSourceClients = data.data;
        this.filteredClients = [...this.DataSourceClients];
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

    this.productsService.getProducts().subscribe({
      next: (data: any) => {
        this.DataSourceMasterProducts = data.data;
        this.filteredProducts = [...this.DataSourceMasterProducts];
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

    this.servicesService.getServices().subscribe({
      next: (data: any) => {
        this.DataSourceMasterServices = data.data;
        this.filteredServices = [...this.DataSourceMasterServices];
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

    this.salesService.getPaymentMethods().subscribe({
      next: (data: any) => {
        this.DataSourcePaymentMethods = data.data;
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

    // Cargar estados de servicio
    this.loadServiceStatus();
  }

  loadServiceStatus(): void {
    // Simulamos los estados de servicio (deberías tener un endpoint para esto)
    this.DataSourceServiceStatus = [
      { id: 1, name: 'Pendiente' },
      { id: 2, name: 'En Progreso' },
      { id: 3, name: 'Completado' },
      { id: 4, name: 'Cancelado' }
    ];
  }

  filterClients(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredClients = this.DataSourceClients.filter(client => 
      `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm) ||
      client.phone.toLowerCase().includes(searchTerm)
    );
  }

  filterProducts(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredProducts = this.DataSourceMasterProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm))
    );
  }

  filterServices(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredServices = this.DataSourceMasterServices.filter(service => 
      service.name.toLowerCase().includes(searchTerm) ||
      (service.description && service.description.toLowerCase().includes(searchTerm))
    );
  }

  selectClient(client: any): void {
    this.NewProdSale_ClientId = client.id;
    this.NewSvcSale_ClientId = client.id;
    this.clientSearchTerm = `${client.first_name} ${client.last_name}`;
    this.OnClientChangeForServices(client.id);
    this.clearFormErrors();
  }

  selectProduct(product: any): void {
    this.Temp_ProductId = product.id;
    this.productSearchTerm = product.name;
    this.clearFormErrors();
  }

  selectService(service: any): void {
    this.Temp_ServiceId = service.id;
    this.serviceSearchTerm = service.name;
    this.clearFormErrors();
  }

  GetSalesProducts(): void {
    const filters = {
      clientName: this.FilterClientName,
      startDate: this.FilterStartDate,
      endDate: this.FilterEndDate,
      paymentStatusId: this.FilterPaymentStatus ? parseInt(this.FilterPaymentStatus) : null
    };

    // Validación de fechas
    if (this.FilterStartDate && !this.FilterEndDate) {
      this.showToast('Debe seleccionar una fecha de fin para el filtro', 'warning');
      return;
    }
    if (!this.FilterStartDate && this.FilterEndDate) {
      this.showToast('Debe seleccionar una fecha de inicio para el filtro', 'warning');
      return;
    }

    this.salesService.getSalesProducts(filters).subscribe({
      next: (data: any) => {
        this.DataSourceSalesProducts = data.data;
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

  GetSalesServices(): void {
    const filters = {
      clientName: this.FilterClientName,
      startDate: this.FilterStartDate,
      endDate: this.FilterEndDate,
      paymentStatusId: this.FilterPaymentStatus ? parseInt(this.FilterPaymentStatus) : null,
      serviceStatusId: this.FilterServiceStatus ? parseInt(this.FilterServiceStatus) : null
    };

    // Validación de fechas
    if (this.FilterStartDate && !this.FilterEndDate) {
      this.showToast('Debe seleccionar una fecha de fin para el filtro', 'warning');
      return;
    }
    if (!this.FilterStartDate && this.FilterEndDate) {
      this.showToast('Debe seleccionar una fecha de inicio para el filtro', 'warning');
      return;
    }

    this.salesService.getSalesServices(filters).subscribe({
      next: (data: any) => {
        this.DataSourceSalesServices = data.data;
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

  ApplyFilters(): void {
    this.GetSalesProducts();
    this.GetSalesServices();
  }

  ClearFilters(): void {
    this.FilterClientName = '';
    this.FilterStartDate = '';
    this.FilterEndDate = '';
    this.FilterPaymentStatus = '';
    this.FilterServiceStatus = '';
    this.ApplyFilters();
  }

  // Validación de formulario de productos
  validateProductSaleForm(): boolean {
    this.clearFormErrors();
    let isValid = true;

    if (!this.NewProdSale_ClientId || this.NewProdSale_ClientId === 0) {
      this.formErrors.client = 'Debe seleccionar un cliente';
      isValid = false;
    }

    if (!this.NewProdSale_PaymentMethodId || this.NewProdSale_PaymentMethodId === 0) {
      this.formErrors.paymentMethod = 'Debe seleccionar un método de pago';
      isValid = false;
    }

    if (this.NewProdSale_ProductsList.length === 0) {
      this.formErrors.products = 'Debe agregar al menos un producto a la venta';
      isValid = false;
    }

    for (let i = 0; i < this.NewProdSale_ProductsList.length; i++) {
      const item = this.NewProdSale_ProductsList[i];
      const product = this.DataSourceMasterProducts.find(p => p.id === item.product_id);
      if (product && product.stock < item.quantity) {
        this.formErrors[`productStock_${i}`] = `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`;
        isValid = false;
      }
    }

    return isValid;
  }

  // Validación de formulario de servicios
  validateServiceSaleForm(): boolean {
    this.clearFormErrors();
    let isValid = true;

    if (!this.NewSvcSale_ClientId || this.NewSvcSale_ClientId === 0) {
      this.formErrors.client = 'Debe seleccionar un cliente';
      isValid = false;
    }

    if (!this.NewSvcSale_VehicleId || this.NewSvcSale_VehicleId === 0) {
      this.formErrors.vehicle = 'Debe seleccionar un vehículo';
      isValid = false;
    }

    if (!this.NewSvcSale_PaymentMethodId || this.NewSvcSale_PaymentMethodId === 0) {
      this.formErrors.paymentMethod = 'Debe seleccionar un método de pago';
      isValid = false;
    }

    if (this.NewSvcSale_ServicesList.length === 0) {
      this.formErrors.services = 'Debe agregar al menos un servicio a la venta';
      isValid = false;
    }

    return isValid;
  }

  AddProductToSale(): void {
    this.clearModalError();
    this.clearFormErrors();

    if (!this.Temp_ProductId || this.Temp_ProductId === 0) {
      this.modalError = 'Debe seleccionar un producto';
      return;
    }

    if (!this.Temp_ProductQty || this.Temp_ProductQty <= 0) {
      this.modalError = 'La cantidad debe ser mayor a 0';
      return;
    }

    const product = this.DataSourceMasterProducts.find(p => p.id === this.Temp_ProductId);
    if (product) {
      if (product.stock < this.Temp_ProductQty) {
        this.modalError = `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`;
        return;
      }

      const existingIndex = this.NewProdSale_ProductsList.findIndex(p => p.product_id === product.id);
      if (existingIndex > -1) {
        this.NewProdSale_ProductsList[existingIndex].quantity += this.Temp_ProductQty;
      } else {
        this.NewProdSale_ProductsList.push({
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: this.Temp_ProductQty
        });
      }

      this.Temp_ProductId = 0;
      this.Temp_ProductQty = 1;
      this.productSearchTerm = '';
      this.filteredProducts = [...this.DataSourceMasterProducts];
    }
  }

  RemoveProductFromSale(index: number): void {
    this.NewProdSale_ProductsList.splice(index, 1);
    this.clearModalError();
    this.clearFormErrors();
  }

  CreateProductSale(): void {
    if (!this.validateProductSaleForm()) {
      return;
    }

    const sale = {
      client_id: this.NewProdSale_ClientId,
      payment_method_id: this.NewProdSale_PaymentMethodId,
      payment_status_id: this.NewProdSale_PaymentStatusId,
      observations: this.NewProdSale_Observations,
      products: this.NewProdSale_ProductsList.map(p => ({
        product_id: p.product_id,
        quantity: p.quantity
      }))
    };

    this.salesService.postSaleProducts(sale).subscribe({
      next: () => {
        this.clearError();
        this.clearModalError();
        this.clearFormErrors();
        this.GetSalesProducts();
        this.clearForm();
        this.showToast('Venta de productos creada exitosamente', 'success');
        this.closeModal('createProductSaleModal');
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

  OnClientChangeForServices(clientId: number): void {
    this.NewSvcSale_VehicleId = 0;
    if (!clientId || clientId === 0) {
      this.ClientVehiclesList = [];
      return;
    }
    this.clientsService.getClientVehicles(clientId.toString()).subscribe({
      next: (data: any) => {
        this.ClientVehiclesList = data.data;
        if (this.ClientVehiclesList.length === 1) {
          this.NewSvcSale_VehicleId = this.ClientVehiclesList[0].id;
        }
        this.clearModalError();
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

  AddServiceToSale(): void {
    this.clearModalError();
    this.clearFormErrors();

    if (!this.Temp_ServiceId || this.Temp_ServiceId === 0) {
      this.modalError = 'Debe seleccionar un servicio';
      return;
    }

    const service = this.DataSourceMasterServices.find(s => s.id === this.Temp_ServiceId);
    if (service) {
      if (this.NewSvcSale_ServicesList.some(s => s.service_id === service.id)) {
        this.modalError = 'El servicio ya ha sido agregado';
        return;
      }

      this.NewSvcSale_ServicesList.push({
        service_id: service.id,
        name: service.name,
        price: service.price
      });

      this.Temp_ServiceId = 0;
      this.serviceSearchTerm = '';
      this.filteredServices = [...this.DataSourceMasterServices];
    }
  }

  RemoveServiceFromSale(index: number): void {
    this.NewSvcSale_ServicesList.splice(index, 1);
    this.clearModalError();
    this.clearFormErrors();
  }

  CreateServiceSale(): void {
    if (!this.validateServiceSaleForm()) {
      return;
    }

    const sale = {
      client_id: this.NewSvcSale_ClientId,
      vehicle_id: this.NewSvcSale_VehicleId,
      payment_method_id: this.NewSvcSale_PaymentMethodId,
      payment_status_id: this.NewSvcSale_PaymentStatusId,
      observations: this.NewSvcSale_Observations,
      services: this.NewSvcSale_ServicesList.map(s => ({
        service_id: s.service_id
      }))
    };

    console.log('Enviando datos de venta de servicio:', sale);

    this.salesService.postSalesServices(sale).subscribe({
      next: () => {
        this.clearError();
        this.clearModalError();
        this.clearFormErrors();
        this.GetSalesServices();
        this.clearForm();
        this.showToast('Venta de servicios creada exitosamente', 'success');
        this.closeModal('createServiceSaleModal');
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

  ViewSaleDetails(sale: any): void {
    this.SelectedSale = sale;
    this.clearError();
    
    // Determinar qué modal abrir según el tipo de venta
    if (sale.products && sale.products.length > 0) {
      // Es una venta de productos
      setTimeout(() => {
        this.closeModal('viewServiceSaleModal'); // Cerrar modal de servicios si está abierto
        const modal = new (window as any).bootstrap.Modal(document.getElementById('viewProductSaleModal'));
        modal.show();
      }, 50);
    } else if (sale.services && sale.services.length > 0) {
      // Es una venta de servicios
      setTimeout(() => {
        this.closeModal('viewProductSaleModal'); // Cerrar modal de productos si está abierto
        const modal = new (window as any).bootstrap.Modal(document.getElementById('viewServiceSaleModal'));
        modal.show();
      }, 50);
    }
  }

  DatosUpdatePayment(sale: any): void {
    this.IdUpdatePayment = sale.sale_id;
    this.ClientNameUpdatePayment = sale.client_name;
    this.currentPaymentStatus = sale.payment_status;
    this.isSaleFinalized = sale.payment_status === 'Pagado' || sale.payment_status === 'Cancelado';
    
    switch (sale.payment_status.toLowerCase()) {
      case 'pagado':
        this.NewPaymentStatusId = 2;
        break;
      case 'cancelado':
        this.NewPaymentStatusId = 3;
        break;
      default:
        this.NewPaymentStatusId = 1;
    }
    this.originalPaymentStatusId = this.NewPaymentStatusId;
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
  }

  // Verificar si el estado de pago cambió
  get hasPaymentStatusChanged(): boolean {
    return this.NewPaymentStatusId !== this.originalPaymentStatusId;
  }

  UpdatePaymentStatus(): void {
    if (this.isSaleFinalized) {
      this.modalError = `No se puede modificar el estado de una venta ${this.currentPaymentStatus.toLowerCase()}.`;
      return;
    }

    if (!this.hasPaymentStatusChanged) {
      this.modalError = 'Debe seleccionar un estado de pago diferente al actual';
      return;
    }

    if (!this.IdUpdatePayment || !this.NewPaymentStatusId) {
      this.modalError = 'Datos de actualización incompletos';
      return;
    }

    this.salesService.updatePaymentStatus(this.IdUpdatePayment.toString(), this.NewPaymentStatusId).subscribe({
      next: () => {
        this.clearError();
        this.clearModalError();
        this.clearFormErrors();
        this.GetSalesProducts();
        this.GetSalesServices();
        this.showToast('Estado de pago actualizado exitosamente', 'success');
        this.closeModal('updatePaymentModal');
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

  // Métodos para actualizar estado de servicio
  DatosUpdateServiceStatus(sale: any): void {
    this.IdUpdateServiceStatus = sale.sale_id;
    this.ClientNameUpdateService = sale.client_name;
    this.currentServiceStatus = sale.service_status;
    
    // Mapear el estado actual al ID correspondiente
    const statusMap: { [key: string]: number } = {
      'pendiente': 1,
      'en progreso': 2,
      'completado': 3,
      'cancelado': 4
    };
    
    this.NewServiceStatusId = statusMap[sale.service_status.toLowerCase()] || 1;
    this.originalServiceStatusId = this.NewServiceStatusId;
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
  }

  // Verificar si el estado de servicio cambió
  get hasServiceStatusChanged(): boolean {
    return this.NewServiceStatusId !== this.originalServiceStatusId;
  }

  UpdateServiceStatus(): void {
    if (!this.hasServiceStatusChanged) {
      this.modalError = 'Debe seleccionar un estado de servicio diferente al actual';
      return;
    }

    if (!this.IdUpdateServiceStatus || !this.NewServiceStatusId) {
      this.modalError = 'Datos de actualización incompletos';
      return;
    }

    this.salesService.updateServiceStatus(this.IdUpdateServiceStatus.toString(), this.NewServiceStatusId).subscribe({
      next: () => {
        this.clearError();
        this.clearModalError();
        this.clearFormErrors();
        this.GetSalesServices();
        this.showToast('Estado de servicio actualizado exitosamente', 'success');
        this.closeModal('updateServiceStatusModal');
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

  calculateTotal(items: any[]): number {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = item.quantity ? parseInt(item.quantity) : 1;
      return sum + (price * quantity);
    }, 0);
  }

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

  // Manejo de errores mejorado
  handleError(error: any): void {
    this.clearFormErrors();
    
    if (error.error?.mensaje) {
      this.errorMessage = error.error.mensaje;
    } 
    else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } 
    else if (error.error?.error) {
      if (typeof error.error.error === 'string') {
        this.errorMessage = error.error.error;
      } else if (error.error.error.details) {
        const details = error.error.error.details;
        this.errorMessage = details.map((detail: any) => {
          if (detail.type === 'string.empty') {
            return `"${detail.context.label}" no puede estar vacío`;
          } else if (detail.type === 'string.max') {
            return `"${detail.context.label}" no puede exceder los ${detail.context.limit} caracteres`;
          } else if (detail.type === 'number.positive') {
            return `"${detail.context.label}" debe ser un número positivo`;
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
      this.errorMessage = 'El registro ya existe.';
    }
    else if (error.status === 404) {
      this.errorMessage = 'Recurso no encontrado.';
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
      if (typeof error.error.error === 'string') {
        this.modalError = error.error.error;
      } else if (error.error.error.details) {
        const details = error.error.error.details;
        this.modalError = details.map((detail: any) => {
          if (detail.type === 'string.empty') {
            return `"${detail.context.label}" no puede estar vacío`;
          } else if (detail.type === 'string.max') {
            return `"${detail.context.label}" no puede exceder los ${detail.context.limit} caracteres`;
          } else if (detail.type === 'number.positive') {
            return `"${detail.context.label}" debe ser un número positivo`;
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
      this.modalError = 'Ya existe un registro con ese nombre.';
    }
    else if (error.status === 404) {
      this.modalError = 'El registro no fue encontrado.';
    }
    else if (error.status === 500) {
      this.modalError = 'Error interno del servidor.';
    }
    else {
      this.modalError = 'Ha ocurrido un error inesperado.';
    }

    this.showToast(this.modalError, 'error');
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
    // Limpiar formulario de productos
    this.NewProdSale_ClientId = 0;
    this.NewProdSale_PaymentMethodId = 0;
    this.NewProdSale_PaymentStatusId = 1;
    this.NewProdSale_Observations = '';
    this.NewProdSale_ProductsList = [];
    this.Temp_ProductId = 0;
    this.Temp_ProductQty = 1;
    this.clientSearchTerm = '';
    this.productSearchTerm = '';

    // Limpiar formulario de servicios
    this.NewSvcSale_ClientId = 0;
    this.NewSvcSale_VehicleId = 0;
    this.NewSvcSale_PaymentMethodId = 0;
    this.NewSvcSale_PaymentStatusId = 1;
    this.NewSvcSale_Observations = '';
    this.NewSvcSale_ServicesList = [];
    this.ClientVehiclesList = [];
    this.Temp_ServiceId = 0;
    this.serviceSearchTerm = '';

    // Resetear filtros
    this.filteredClients = [...this.DataSourceClients];
    this.filteredProducts = [...this.DataSourceMasterProducts];
    this.filteredServices = [...this.DataSourceMasterServices];

    this.clearModalError();
    this.clearFormErrors();
  }

  getProductsTooltip(products: any[]): string {
    return products.map(p => 
      `${p.product_name} (x${p.quantity}) - $${p.price}`
    ).join('\n');
  }

  getServicesTooltip(services: any[]): string {
    return services.map(s => 
      `${s.service_name} - $${s.price}`
    ).join('\n');
  }
}