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
  ClientVehiclesList: any[] = [];

  // Estados de vista
  activeView: 'products' | 'services' = 'products';
  isEditMode: boolean = false;

  // Filtros
  FilterClientName: string = '';
  FilterStartDate: string = '';
  FilterEndDate: string = '';
  FilterPaymentStatus: string = '';

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

  SelectedSale: any = null;

  errorMessage: string = '';
  modalError: string = '';

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
    this.filteredClients = [...this.DataSourceClients];
    this.filteredProducts = [...this.DataSourceMasterProducts];
  }

  showCreateServiceSale(): void {
    this.clearForm();
    this.clearError();
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
      },
      error: (error) => this.handleError(error)
    });

    this.productsService.getProducts().subscribe({
      next: (data: any) => {
        this.DataSourceMasterProducts = data.data;
        this.filteredProducts = [...this.DataSourceMasterProducts];
      },
      error: (error) => this.handleError(error)
    });

    this.servicesService.getServices().subscribe({
      next: (data: any) => {
        this.DataSourceMasterServices = data.data;
        this.filteredServices = [...this.DataSourceMasterServices];
      },
      error: (error) => this.handleError(error)
    });

    this.salesService.getPaymentMethods().subscribe({
      next: (data: any) => this.DataSourcePaymentMethods = data.data,
      error: (error) => this.handleError(error)
    });
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
  }

  selectProduct(product: any): void {
    this.Temp_ProductId = product.id;
    this.productSearchTerm = product.name;
  }

  selectService(service: any): void {
    this.Temp_ServiceId = service.id;
    this.serviceSearchTerm = service.name;
  }

  GetSalesProducts(): void {
    const filters = {
      clientName: this.FilterClientName,
      startDate: this.FilterStartDate,
      endDate: this.FilterEndDate,
      paymentStatusId: this.FilterPaymentStatus ? parseInt(this.FilterPaymentStatus) : null
    };
    this.salesService.getSalesProducts(filters).subscribe({
      next: (data: any) => {
        this.DataSourceSalesProducts = data.data;
        this.clearError();
      },
      error: (error) => this.handleError(error)
    });
  }

  GetSalesServices(): void {
    const filters = {
      clientName: this.FilterClientName,
      startDate: this.FilterStartDate,
      endDate: this.FilterEndDate,
      paymentStatusId: this.FilterPaymentStatus ? parseInt(this.FilterPaymentStatus) : null
    };
    this.salesService.getSalesServices(filters).subscribe({
      next: (data: any) => {
        this.DataSourceSalesServices = data.data;
        this.clearError();
      },
      error: (error) => this.handleError(error)
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
    this.ApplyFilters();
  }

  AddProductToSale(): void {
    if (!this.Temp_ProductId || this.Temp_ProductQty <= 0) {
      this.modalError = 'Debe seleccionar un producto y una cantidad válida.';
      return;
    }
    const product = this.DataSourceMasterProducts.find(p => p.id === this.Temp_ProductId);
    if (product) {
      if (product.stock < this.Temp_ProductQty) {
        this.modalError = `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`;
        return;
      }
      this.NewProdSale_ProductsList.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: this.Temp_ProductQty
      });
      this.Temp_ProductId = 0;
      this.Temp_ProductQty = 1;
      this.productSearchTerm = '';
      this.filteredProducts = [...this.DataSourceMasterProducts];
      this.clearModalError();
    }
  }

  RemoveProductFromSale(index: number): void {
    this.NewProdSale_ProductsList.splice(index, 1);
    this.clearModalError();
  }

  CreateProductSale(): void {
    if (this.NewProdSale_ProductsList.length === 0) {
      this.modalError = "Debe agregar al menos un producto.";
      return;
    }
    if (this.NewProdSale_ClientId === 0 || this.NewProdSale_PaymentMethodId === 0) {
      this.modalError = "Debe seleccionar un cliente y un método de pago.";
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
        this.GetSalesProducts();
        this.clearForm();
      },
      error: (error) => this.handleModalError(error)
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
      },
      error: (error) => this.handleModalError(error)
    });
  }

  AddServiceToSale(): void {
    if (!this.Temp_ServiceId || this.Temp_ServiceId === 0) {
      this.modalError = 'Debe seleccionar un servicio.';
      return;
    }
    if (this.NewSvcSale_ServicesList.some(s => s.service_id === this.Temp_ServiceId)) {
      this.modalError = 'El servicio ya ha sido agregado.';
      return;
    }
    const service = this.DataSourceMasterServices.find(s => s.id === this.Temp_ServiceId);
    if (service) {
      this.NewSvcSale_ServicesList.push({
        service_id: service.id,
        name: service.name,
        price: service.price
      });
      this.Temp_ServiceId = 0;
      this.serviceSearchTerm = '';
      this.filteredServices = [...this.DataSourceMasterServices];
      this.clearModalError();
    }
  }

  RemoveServiceFromSale(index: number): void {
    this.NewSvcSale_ServicesList.splice(index, 1);
    this.clearModalError();
  }

  CreateServiceSale(): void {
    if (this.NewSvcSale_ServicesList.length === 0) {
      this.modalError = "Debe agregar al menos un servicio.";
      return;
    }
    if (this.NewSvcSale_ClientId === 0 || this.NewSvcSale_VehicleId === 0 || this.NewSvcSale_PaymentMethodId === 0) {
      this.modalError = "Debe seleccionar cliente, vehículo y método de pago.";
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

    this.salesService.postSalesServices(sale).subscribe({
      next: () => {
        this.clearError();
        this.GetSalesServices();
        this.clearForm();
      },
      error: (error) => this.handleModalError(error)
    });
  }

  ViewSaleDetails(sale: any): void {
    this.SelectedSale = sale;
    this.clearError();
  }

  DatosUpdatePayment(sale: any): void {
    this.IdUpdatePayment = sale.sale_id;
    this.ClientNameUpdatePayment = sale.client_name;
    this.currentPaymentStatus = sale.payment_status;
    
    // if esta cancelada o pagada jejeejkksdad
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
    this.clearError();
  }

  UpdatePaymentStatus(): void {
    // Validación adicional por seguridad
    if (this.isSaleFinalized) {
      this.modalError = `No se puede modificar el estado de una venta ${this.currentPaymentStatus.toLowerCase()}.`;
      return;
    }

    if (!this.IdUpdatePayment || !this.NewPaymentStatusId) return;

    this.salesService.updatePaymentStatus(this.IdUpdatePayment.toString(), this.NewPaymentStatusId).subscribe({
      next: () => {
        this.clearError();
        this.GetSalesProducts();
        this.GetSalesServices();
      },
      error: (error) => this.handleModalError(error)
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

    this.modalError = '';
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