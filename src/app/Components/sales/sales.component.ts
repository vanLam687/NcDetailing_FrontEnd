import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { SalesService } from '../../Services/sales-service';
import { ClientsService } from '../../Services/clients-service';
import { ProductsService } from '../../Services/products-service';
import { ServicesService } from '../../Services/services-service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

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
  
  // Filtros
  FilterClientName: string = '';
  FilterStartDate: string = '';
  FilterEndDate: string = '';
  FilterPaymentStatus: string = '';
  FilterServiceStatus: string = '';

  // Formulario Productos
  NewProdSale_ClientId: number = 0;
  NewProdSale_PaymentMethodId: number = 0;
  NewProdSale_PaymentStatusId: number = 1;
  NewProdSale_Observations: string = '';
  NewProdSale_ProductsList: any[] = [];
  Temp_ProductId: number = 0;
  Temp_ProductQty: number = 1;

  // Formulario Servicios
  NewSvcSale_ClientId: number = 0;
  NewSvcSale_VehicleId: number = 0;
  NewSvcSale_PaymentMethodId: number = 0;
  NewSvcSale_PaymentStatusId: number = 1;
  NewSvcSale_Observations: string = '';
  NewSvcSale_ServicesList: any[] = [];
  Temp_ServiceId: number = 0;

  // Búsqueda
  filteredClients: any[] = [];
  filteredProducts: any[] = [];
  filteredServices: any[] = [];
  clientSearchTerm: string = '';
  productSearchTerm: string = '';
  serviceSearchTerm: string = '';

  // Updates
  IdUpdatePayment: number = 0;
  NewPaymentStatusId: number = 0;
  ClientNameUpdatePayment: string = '';
  isSaleFinalized: boolean = false;
  currentPaymentStatus: string = '';
  originalPaymentStatusId: number = 0;

  IdUpdateServiceStatus: number = 0;
  NewServiceStatusId: number = 0;
  ClientNameUpdateService: string = '';
  currentServiceStatus: string = '';
  originalServiceStatusId: number = 0;

  SelectedSale: any = null;
  errorMessage: string = '';
  modalError: string = '';
  formErrors: any = {};
  
  isLoading: boolean = false;
  // Bloqueo de botones
  isSubmitting: boolean = false;

  constructor(
    private salesService: SalesService,
    private clientsService: ClientsService, 
    private productsService: ProductsService,  
    private servicesService: ServicesService,  
    private router: Router,
    private authService: AuthService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.LoadAllData();
    } else {
      this.router.navigate(['/login']);
    }
  }

  closeModal(id: string): void { const m = document.getElementById(id); if(m){const i=(window as any).bootstrap.Modal.getInstance(m);if(i)i.hide();} }

  showProductsView(): void { this.activeView = 'products'; this.clearError(); }
  showServicesView(): void { this.activeView = 'services'; this.clearError(); }

  showCreateProductSale(): void {
    this.clearForm(); this.clearError(); this.clearModalError(); this.clearFormErrors();
    this.filteredClients = [...this.DataSourceClients];
    this.filteredProducts = [...this.DataSourceMasterProducts];
  }

  showCreateServiceSale(): void {
    this.clearForm(); this.clearError(); this.clearModalError(); this.clearFormErrors();
    this.filteredClients = [...this.DataSourceClients];
    this.filteredServices = [...this.DataSourceMasterServices];
  }

  LoadAllData(): void {
    this.GetSalesProducts();
    this.GetSalesServices();
    this.LoadMasterData();
  }

  LoadMasterData(): void {
    this.clientsService.getClients().subscribe({ next: (d: any) => { this.DataSourceClients = d.data; this.filteredClients = [...d.data]; }, error: (e) => this.handleError(e) });
    this.productsService.getProducts().subscribe({ next: (d: any) => { this.DataSourceMasterProducts = d.data; this.filteredProducts = [...d.data]; }, error: (e) => this.handleError(e) });
    this.servicesService.getServices().subscribe({ next: (d: any) => { this.DataSourceMasterServices = d.data; this.filteredServices = [...d.data]; }, error: (e) => this.handleError(e) });
    this.salesService.getPaymentMethods().subscribe({ next: (d: any) => { this.DataSourcePaymentMethods = d.data; }, error: (e) => this.handleError(e) });
    this.loadServiceStatus();
  }

  loadServiceStatus(): void {
    this.DataSourceServiceStatus = [{ id: 1, name: 'Pendiente' }, { id: 2, name: 'En Progreso' }, { id: 3, name: 'Completado' }, { id: 4, name: 'Cancelado' }];
  }

  // Filters & Selection
  filterClients(event: any): void { const t = event.target.value.toLowerCase(); this.filteredClients = this.DataSourceClients.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(t)); }
  filterProducts(event: any): void { const t = event.target.value.toLowerCase(); this.filteredProducts = this.DataSourceMasterProducts.filter(p => p.name.toLowerCase().includes(t)); }
  filterServices(event: any): void { const t = event.target.value.toLowerCase(); this.filteredServices = this.DataSourceMasterServices.filter(s => s.name.toLowerCase().includes(t)); }

  selectClient(c: any): void { 
    this.NewProdSale_ClientId = c.id; 
    this.NewSvcSale_ClientId = c.id; 
    this.clientSearchTerm = `${c.first_name} ${c.last_name}`; 
    this.OnClientChangeForServices(c.id); 
    this.clearFormErrors(); 
  }
  
  selectProduct(p: any): void { this.Temp_ProductId = p.id; this.productSearchTerm = p.name; this.clearFormErrors(); }
  selectService(s: any): void { this.Temp_ServiceId = s.id; this.serviceSearchTerm = s.name; this.clearFormErrors(); }

  GetSalesProducts(): void {
    if ((this.FilterStartDate && !this.FilterEndDate) || (!this.FilterStartDate && this.FilterEndDate)) {
       this.notification.warning('Atención', 'Seleccione ambas fechas para filtrar por rango.');
       return;
    }
    this.isLoading = true;
    this.salesService.getSalesProducts({clientName: this.FilterClientName, startDate: this.FilterStartDate, endDate: this.FilterEndDate, paymentStatusId: this.FilterPaymentStatus ? parseInt(this.FilterPaymentStatus) : null}).subscribe({
      next: (d: any) => { 
        this.DataSourceSalesProducts = d.data; 
        this.clearError(); 
        this.isLoading = false;
      },
      error: (e) => { 
        if (e.status === 401) { this.authService.logout(); return; } 
        this.handleError(e); 
        this.isLoading = false;
      }
    });
  }

  GetSalesServices(): void {
    if ((this.FilterStartDate && !this.FilterEndDate) || (!this.FilterStartDate && this.FilterEndDate)) {
      this.notification.warning('Atención', 'Seleccione ambas fechas para filtrar por rango.');
      return;
    }
    this.isLoading = true;
    this.salesService.getSalesServices({clientName: this.FilterClientName, startDate: this.FilterStartDate, endDate: this.FilterEndDate, paymentStatusId: this.FilterPaymentStatus ? parseInt(this.FilterPaymentStatus) : null, serviceStatusId: this.FilterServiceStatus ? parseInt(this.FilterServiceStatus) : null}).subscribe({
      next: (d: any) => { this.DataSourceSalesServices = d.data; this.clearError(); this.isLoading = false; },
      error: (e) => { if (e.status === 401) { this.authService.logout(); return; } this.handleError(e); this.isLoading = false; }
    });
  }

  ApplyFilters(): void { this.GetSalesProducts(); this.GetSalesServices(); }
  ClearFilters(): void { this.FilterClientName = ''; this.FilterStartDate = ''; this.FilterEndDate = ''; this.FilterPaymentStatus = ''; this.FilterServiceStatus = ''; this.ApplyFilters(); }

  // Validations
  validateProductSaleForm(): boolean {
    this.clearFormErrors();
    let isValid = true;
    if (!this.NewProdSale_ClientId) { this.formErrors.client = 'Seleccione cliente'; isValid = false; }
    if (!this.NewProdSale_PaymentMethodId) { this.formErrors.paymentMethod = 'Seleccione método pago'; isValid = false; }
    if (this.NewProdSale_ProductsList.length === 0) { this.formErrors.products = 'Agregue productos'; isValid = false; }
    return isValid;
  }

  validateServiceSaleForm(): boolean {
    this.clearFormErrors();
    let isValid = true;
    if (!this.NewSvcSale_ClientId) { this.formErrors.client = 'Seleccione cliente'; isValid = false; }
    if (!this.NewSvcSale_VehicleId) { this.formErrors.vehicle = 'Seleccione vehículo'; isValid = false; }
    if (!this.NewSvcSale_PaymentMethodId) { this.formErrors.paymentMethod = 'Seleccione método pago'; isValid = false; }
    if (this.NewSvcSale_ServicesList.length === 0) { this.formErrors.services = 'Agregue servicios'; isValid = false; }
    return isValid;
  }

  // Logic to add/remove items (Product/Service)
  AddProductToSale(): void {
    this.clearModalError();
    if (!this.Temp_ProductId || !this.Temp_ProductQty || this.Temp_ProductQty < 1) { 
      this.modalError = 'Seleccione un producto y cantidad válida (mínimo 1)'; 
      return; 
    }
    const p = this.DataSourceMasterProducts.find(x => x.id === this.Temp_ProductId);
    if (p) {
      if (p.stock < this.Temp_ProductQty) { this.modalError = 'Stock insuficiente'; return; }
      const exists = this.NewProdSale_ProductsList.findIndex(x => x.product_id === p.id);
      if (exists > -1) this.NewProdSale_ProductsList[exists].quantity += this.Temp_ProductQty;
      else this.NewProdSale_ProductsList.push({ product_id: p.id, name: p.name, price: p.price, quantity: this.Temp_ProductQty });
      
      this.Temp_ProductId = 0; 
      this.Temp_ProductQty = 1; 
      this.productSearchTerm = ''; 
      this.filteredProducts = [...this.DataSourceMasterProducts];
    }
  }
  
  RemoveProductFromSale(i: number): void { this.NewProdSale_ProductsList.splice(i, 1); }

  AddServiceToSale(): void {
    this.clearModalError();
    if (!this.Temp_ServiceId) { this.modalError = 'Seleccione servicio'; return; }
    const s = this.DataSourceMasterServices.find(x => x.id === this.Temp_ServiceId);
    if (s) {
      if (this.NewSvcSale_ServicesList.some(x => x.service_id === s.id)) { this.modalError = 'Ya agregado'; return; }
      this.NewSvcSale_ServicesList.push({ service_id: s.id, name: s.name, price: s.price });
      this.Temp_ServiceId = 0; this.serviceSearchTerm = ''; this.filteredServices = [...this.DataSourceMasterServices];
    }
  }
  
  RemoveServiceFromSale(i: number): void { this.NewSvcSale_ServicesList.splice(i, 1); }

  // Create Sales
  CreateProductSale(): void {
    if (this.isSubmitting) return;
    if (!this.validateProductSaleForm()) return;
    
    this.isSubmitting = true;
    const sale = {
      client_id: this.NewProdSale_ClientId, payment_method_id: this.NewProdSale_PaymentMethodId,
      payment_status_id: this.NewProdSale_PaymentStatusId, observations: this.NewProdSale_Observations,
      products: this.NewProdSale_ProductsList.map(p => ({ product_id: p.product_id, quantity: p.quantity }))
    };
    this.salesService.postSaleProducts(sale).subscribe({
      next: () => { 
        this.notification.success('¡Éxito!', 'Venta de productos creada correctamente.');
        this.GetSalesProducts(); 
        this.closeModal('createProductSaleModal'); 
        this.isSubmitting = false;
      },
      error: (e) => { 
        this.isSubmitting = false;
        if (e.status === 401) { this.authService.logout(); return; } 
        this.handleModalError(e); 
      }
    });
  }

  CreateServiceSale(): void {
    if (this.isSubmitting) return;
    if (!this.validateServiceSaleForm()) return;
    
    this.isSubmitting = true;
    const sale = {
      client_id: this.NewSvcSale_ClientId, vehicle_id: this.NewSvcSale_VehicleId,
      payment_method_id: this.NewSvcSale_PaymentMethodId, payment_status_id: this.NewSvcSale_PaymentStatusId,
      observations: this.NewSvcSale_Observations, services: this.NewSvcSale_ServicesList.map(s => ({ service_id: s.service_id }))
    };
    this.salesService.postSalesServices(sale).subscribe({
      next: () => { 
        this.notification.success('¡Éxito!', 'Venta de servicios creada correctamente.');
        this.GetSalesServices(); 
        this.closeModal('createServiceSaleModal'); 
        this.isSubmitting = false;
      },
      error: (e) => { 
        this.isSubmitting = false;
        if (e.status === 401) { this.authService.logout(); return; } 
        this.handleModalError(e); 
      }
    });
  }

  OnClientChangeForServices(id: number): void {
    this.NewSvcSale_VehicleId = 0; if(!id) { this.ClientVehiclesList=[]; return; }
    this.clientsService.getClientVehicles(id.toString()).subscribe({ next: (d: any) => { this.ClientVehiclesList = d.data; if(this.ClientVehiclesList.length===1) this.NewSvcSale_VehicleId=this.ClientVehiclesList[0].id; }, error: (e) => this.handleModalError(e) });
  }

  ViewSaleDetails(sale: any): void {
    this.SelectedSale = sale; 
    this.clearError();

    if (sale.products && sale.products.length > 0) { 
        setTimeout(() => { 
            this.closeModal('viewServiceSaleModal'); 
            new (window as any).bootstrap.Modal(document.getElementById('viewProductSaleModal')).show(); 
        }, 50); 
    }
    else if (sale.services && sale.services.length > 0) { 
        setTimeout(() => { 
            this.closeModal('viewProductSaleModal'); 
            new (window as any).bootstrap.Modal(document.getElementById('viewServiceSaleModal')).show(); 
        }, 50); 
    }
  }

  // Updates
  DatosUpdatePayment(sale: any): void {
    this.IdUpdatePayment = sale.sale_id; this.ClientNameUpdatePayment = sale.client_name; this.currentPaymentStatus = sale.payment_status;
    this.isSaleFinalized = sale.payment_status === 'Pagado' || sale.payment_status === 'Cancelado';
    this.NewPaymentStatusId = sale.payment_status.toLowerCase() === 'pagado' ? 2 : (sale.payment_status.toLowerCase() === 'cancelado' ? 3 : 1);
    this.originalPaymentStatusId = this.NewPaymentStatusId; this.clearError(); this.clearModalError();
  }

  get hasPaymentStatusChanged(): boolean { return this.NewPaymentStatusId !== this.originalPaymentStatusId; }

  UpdatePaymentStatus(): void {
    if (this.isSaleFinalized || !this.hasPaymentStatusChanged || this.isSubmitting) { 
      if(!this.isSubmitting) this.modalError = 'No se puede modificar o sin cambios'; 
      return; 
    }
    
    this.isSubmitting = true;
    this.salesService.updatePaymentStatus(this.IdUpdatePayment.toString(), this.NewPaymentStatusId).subscribe({
      next: () => { 
        this.notification.success('¡Éxito!', 'Estado de pago actualizado.');
        this.GetSalesProducts(); 
        this.GetSalesServices(); 
        this.closeModal('updatePaymentModal'); 
        this.isSubmitting = false;
      },
      error: (e) => { 
        this.isSubmitting = false;
        if (e.status === 401) { this.authService.logout(); return; } 
        this.handleModalError(e); 
      }
    });
  }

  DatosUpdateServiceStatus(sale: any): void {
    this.IdUpdateServiceStatus = sale.sale_id; this.ClientNameUpdateService = sale.client_name; this.currentServiceStatus = sale.service_status;
    const map: any = { 'pendiente': 1, 'en progreso': 2, 'completado': 3, 'cancelado': 4 };
    this.NewServiceStatusId = map[sale.service_status.toLowerCase()] || 1; this.originalServiceStatusId = this.NewServiceStatusId;
    this.clearError(); this.clearModalError();
  }

  get hasServiceStatusChanged(): boolean { return Number(this.NewServiceStatusId) !== Number(this.originalServiceStatusId); }

  UpdateServiceStatus(): void {
    if (!this.hasServiceStatusChanged || this.isSubmitting) { 
        if(!this.isSubmitting) this.modalError = 'No se puede elegir el mismo estado de servicio.'; 
        return; 
    }

    this.isSubmitting = true;
    this.salesService.updateServiceStatus(this.IdUpdateServiceStatus.toString(), this.NewServiceStatusId).subscribe({
      next: () => { 
        this.notification.success('¡Éxito!', 'Estado del servicio actualizado.');
        this.GetSalesServices(); 
        this.closeModal('updateServiceStatusModal'); 
        this.isSubmitting = false;
      },
      error: (e) => { 
        this.isSubmitting = false;
        if (e.status === 401) { this.authService.logout(); return; } 
        if (e.status === 400) {
            this.modalError = 'El estado seleccionado es el mismo que el actual.';
            this.notification.warning('Aviso', this.modalError);
        } else {
            this.handleModalError(e); 
        }
      }
    });
  }

  // Helpers
  calculateTotal(items: any[]): number { return items ? items.reduce((s, i) => s + ((parseFloat(i.price)||0) * (parseInt(i.quantity)||1)), 0) : 0; }
  formatDate(d: string): string { return new Date(d).toLocaleDateString('es-ES', {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}); }
  getProductsTooltip(p: any[]): string { return p.map(x => `${x.product_name} (x${x.quantity})`).join('\n'); }
  getServicesTooltip(s: any[]): string { return s.map(x => `${x.service_name}`).join('\n'); }

  // --- MANEJO DE ERRORES GENÉRICO ---
  private getGenericErrorMessage(status: number): string {
    switch (status) {
      case 0: return 'Error de conexión.';
      case 400: return 'Datos de venta incorrectos. Verifique stock o campos.';
      case 401: return 'Sesión expirada.';
      case 403: return 'No tiene permisos.';
      case 404: return 'Venta/Producto/Servicio no encontrado.';
      case 409: return 'Conflicto en la operación.';
      case 500: return 'Error interno del servidor.';
      default: return 'Ocurrió un error inesperado.';
    }
  }

  handleError(e: any): void { this.clearFormErrors(); this.errorMessage = this.getGenericErrorMessage(e.status); }
  
  handleModalError(e: any): void { 
    this.clearFormErrors(); 
    this.modalError = this.getGenericErrorMessage(e.status); 
    this.notification.error('Error', this.modalError);
  }

  clearError(): void { this.errorMessage = ''; }
  clearModalError(): void { this.modalError = ''; }
  clearFormErrors(): void { this.formErrors = {}; }
  hasFormErrors(): boolean { return Object.keys(this.formErrors).length > 0; }
  clearForm(): void {
    this.NewProdSale_ClientId = 0; this.NewProdSale_PaymentMethodId = 0; this.NewProdSale_PaymentStatusId = 1;
    this.NewProdSale_Observations = ''; this.NewProdSale_ProductsList = [];
    this.Temp_ProductId = 0; this.Temp_ProductQty = 1;
    this.NewSvcSale_ClientId = 0; this.NewSvcSale_VehicleId = 0; this.NewSvcSale_PaymentMethodId = 0;
    this.NewSvcSale_PaymentStatusId = 1; this.NewSvcSale_Observations = ''; this.NewSvcSale_ServicesList = [];
    this.ClientVehiclesList = []; this.Temp_ServiceId = 0;
    this.filteredClients = [...this.DataSourceClients]; this.filteredProducts = [...this.DataSourceMasterProducts]; this.filteredServices = [...this.DataSourceMasterServices];
    this.clientSearchTerm = ''; this.productSearchTerm = ''; this.serviceSearchTerm = '';
    this.clearModalError(); this.clearFormErrors();
  }
}