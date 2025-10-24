import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { SalesService } from '../../Services/sales-service';

// Importamos los otros servicios para llenar los dropdowns
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

  DataSourceClients: any[] = [];
  DataSourceMasterProducts: any[] = [];
  DataSourceMasterServices: any[] = [];
  DataSourcePaymentMethods: any[] = [];
  ClientVehiclesList: any[] = [];

  DataSourceSalesProducts: any[] = [];
  DataSourceSalesServices: any[] = [];

  currentTab: 'products' | 'services' = 'products';
  errorMessage: string = '';
  SelectedSale: any = null;

  // --- Filtros (ngModel) ---
  FilterClientName: string = '';
  FilterStartDate: string = '';
  FilterEndDate: string = '';
  FilterPaymentStatus: string = '';

  NewProdSale_ClientId: number = 0;
  NewProdSale_PaymentMethodId: number = 0;
  NewProdSale_PaymentStatusId: number = 1;
  NewProdSale_Observations: string = '';
  NewProdSale_ProductsList: any[] = [];
  Temp_ProductId: number = 0;
  Temp_ProductQty: number = 1;

  NewSvcSale_ClientId: number = 0;
  NewSvcSale_VehicleId: number = 0;
  NewSvcSale_PaymentMethodId: number = 0;
  NewSvcSale_PaymentStatusId: number = 1; 
  NewSvcSale_Observations: string = '';
  NewSvcSale_ServicesList: any[] = [];
  Temp_ServiceId: number = 0;
  
  IdUpdatePayment: number = 0;
  NewPaymentStatusId: number = 0;
  ClientNameUpdatePayment: string = '';

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

  LoadAllData(): void {
    this.GetSalesProducts();
    this.GetSalesServices();
    
    this.LoadMasterData();
  }

  // --- Carga de Datos Maestros (para los <select> de los modales) ---
  LoadMasterData(): void {
    // Cargar Clientes
    this.clientsService.getClients().subscribe({
      next: (data: any) => this.DataSourceClients = data.data,
      error: (error) => this.handleError(error)
    });

    // Cargar Productos (usando el servicio que me diste)
    this.productsService.getProducts().subscribe({
      next: (data: any) => this.DataSourceMasterProducts = data.data,
      error: (error) => this.handleError(error)
    });

    // Cargar Servicios (usando el servicio que me diste)
    this.servicesService.getServices().subscribe({
      next: (data: any) => this.DataSourceMasterServices = data.data,
      error: (error) => this.handleError(error)
    });

    // Cargar Métodos de Pago
    this.salesService.getPaymentMethods().subscribe({
      next: (data: any) => this.DataSourcePaymentMethods = data.data,
      error: (error) => this.handleError(error)
    });
  }

  // --- Carga de Datos de las Tablas ---

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

  // --- Lógica de UI (Tabs y Filtros) ---

  selectTab(tab: 'products' | 'services'): void {
    this.currentTab = tab;
    this.ClearFilters(); // Limpiamos filtros al cambiar de pestaña
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

  // --- Lógica Modal: CREAR VENTA DE PRODUCTOS ---

  AddProductToSale(): void {
    if (!this.Temp_ProductId || this.Temp_ProductQty <= 0) {
      this.errorMessage = 'Debe seleccionar un producto y una cantidad válida.';
      return;
    }
    const product = this.DataSourceMasterProducts.find(p => p.id === this.Temp_ProductId);
    if (product) {
      // Validar stock
      if (product.stock < this.Temp_ProductQty) {
        this.errorMessage = `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`;
        return;
      }
      this.NewProdSale_ProductsList.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: this.Temp_ProductQty
      });
      // Reset temp
      this.Temp_ProductId = 0;
      this.Temp_ProductQty = 1;
      this.clearError();
    }
  }

  RemoveProductFromSale(index: number): void {
    this.NewProdSale_ProductsList.splice(index, 1);
  }

  CreateProductSale(): void {
    if (this.NewProdSale_ProductsList.length === 0) {
      this.handleError({ error: { message: "Debe agregar al menos un producto." } });
      return;
    }
    if (this.NewProdSale_ClientId === 0 || this.NewProdSale_PaymentMethodId === 0) {
      this.handleError({ error: { message: "Debe seleccionar un cliente y un método de pago." } });
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
      })) // El backend solo necesita ID y quantity
    };

    this.salesService.postSaleProducts(sale).subscribe({
      next: () => {
        this.clearError();
        location.reload(); // Como en tu ejemplo de Products
      },
      error: (error) => this.handleError(error)
    });
  }

  // --- Lógica Modal: CREAR VENTA DE SERVICIOS ---

  // Se llama cuando el usuario cambia el cliente en el modal de servicios
  OnClientChangeForServices(clientId: number): void {
    this.NewSvcSale_VehicleId = 0; // Resetea el vehículo
    if (!clientId || clientId === 0) {
      this.ClientVehiclesList = [];
      return;
    }
    this.clientsService.getClientVehicles(clientId.toString()).subscribe({
      next: (data: any) => {
        this.ClientVehiclesList = data.data;
        // Si el cliente solo tiene un vehículo, lo pre-seleccionamos
        if (this.ClientVehiclesList.length === 1) {
          this.NewSvcSale_VehicleId = this.ClientVehiclesList[0].id;
        }
      },
      error: (error) => this.handleError(error)
    });
  }

  AddServiceToSale(): void {
    if (!this.Temp_ServiceId || this.Temp_ServiceId === 0) {
      this.errorMessage = 'Debe seleccionar un servicio.';
      return;
    }
    // Evitar duplicados
    if (this.NewSvcSale_ServicesList.some(s => s.service_id === this.Temp_ServiceId)) {
      this.errorMessage = 'El servicio ya ha sido agregado.';
      return;
    }
    const service = this.DataSourceMasterServices.find(s => s.id === this.Temp_ServiceId);
    if (service) {
      this.NewSvcSale_ServicesList.push({
        service_id: service.id,
        name: service.name,
        price: service.price
      });
      this.Temp_ServiceId = 0; // Reset temp
      this.clearError();
    }
  }

  RemoveServiceFromSale(index: number): void {
    this.NewSvcSale_ServicesList.splice(index, 1);
  }

  CreateServiceSale(): void {
    if (this.NewSvcSale_ServicesList.length === 0) {
      this.handleError({ error: { message: "Debe agregar al menos un servicio." } });
      return;
    }
    if (this.NewSvcSale_ClientId === 0 || this.NewSvcSale_VehicleId === 0 || this.NewSvcSale_PaymentMethodId === 0) {
      this.handleError({ error: { message: "Debe seleccionar cliente, vehículo y método de pago." } });
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
      })) // El backend solo necesita ID
    };

    this.salesService.postSalesServices(sale).subscribe({
      next: () => {
        this.clearError();
        location.reload();
      },
      error: (error) => this.handleError(error)
    });
  }


  // --- Lógica Modal: VER DETALLES ---
  ViewSaleDetails(sale: any): void {
    this.SelectedSale = sale;
    this.clearError();
  }

  // --- Lógica Modal: ACTUALIZAR PAGO ---
  DatosUpdatePayment(sale: any): void {
    this.IdUpdatePayment = sale.sale_id;
    this.ClientNameUpdatePayment = sale.client_name;
    // Mapeamos el string del estado de pago a su ID
    switch (sale.payment_status.toLowerCase()) {
      case 'pagado':
        this.NewPaymentStatusId = 2;
        break;
      case 'cancelado':
        this.NewPaymentStatusId = 3;
        break;
      default:
        this.NewPaymentStatusId = 1; // Pendiente
    }
    this.clearError();
  }

  UpdatePaymentStatus(): void {
    if (!this.IdUpdatePayment || !this.NewPaymentStatusId) return;

    this.salesService.updatePaymentStatus(this.IdUpdatePayment.toString(), this.NewPaymentStatusId).subscribe({
      next: () => {
        this.clearError();
        location.reload();
      },
      error: (error) => this.handleError(error)
    });
  }

  // --- Utilidades (Error Handling) ---

  // Copiado de tu ejemplo de Products
  handleError(error: any): void {
    if (error.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else if (typeof error.error === 'string') {
        this.errorMessage = error.error;
    } else if (error.message) { // Agregado para errores de validación local
        this.errorMessage = error.message;
    } else if (error.status === 0) {
      this.errorMessage = 'Error de conexión. Verifique su internet.';
    } else {
      this.errorMessage = 'Ha ocurrido un error inesperado.';
    }
  }

  clearError(): void {
    this.errorMessage = '';
  }

  // Función para calcular totales en los modales de creación
  calculateTotal(items: any[]): number {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = item.quantity ? parseInt(item.quantity) : 1;
      return sum + (price * quantity);
    }, 0);
  }
  
  ResetProductSaleModal(): void {
    this.NewProdSale_ClientId = 0;
    this.NewProdSale_PaymentMethodId = 0;
    this.NewProdSale_PaymentStatusId = 1;
    this.NewProdSale_Observations = '';
    this.NewProdSale_ProductsList = [];
    this.Temp_ProductId = 0;
    this.Temp_ProductQty = 1;
    this.clearError();
  }
  
  ResetServiceSaleModal(): void {
    this.NewSvcSale_ClientId = 0;
    this.NewSvcSale_VehicleId = 0;
    this.NewSvcSale_PaymentMethodId = 0;
    this.NewSvcSale_PaymentStatusId = 1;
    this.NewSvcSale_Observations = '';
    this.NewSvcSale_ServicesList = [];
    this.ClientVehiclesList = [];
    this.Temp_ServiceId = 0;
    this.clearError();
  }

}