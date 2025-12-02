import { Component, OnInit } from '@angular/core';
import { ServicesService } from '../../Services/services-service';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css'],
  standalone: false
})
export class ServicesComponent implements OnInit {

  constructor(private service: ServicesService, private router: Router, private authService: AuthService) {}

  DataSourceServices: any[] = [];
  DataSourceCategories: any[] = [];
  filteredCategories: any[] = [];

  // Filtros
  SearchName: string = '';
  SelectedCategory: string = '';
  // Req 2: Filtro simplificado
  ServiceStatus: 'active' | 'inactive' = 'active';
  CategoryStatus: 'active' | 'inactive' = 'active';

  // Navegación
  activeView: 'list' | 'create' | 'edit' | 'categories' = 'list';
  private historyStack: string[] = ['list'];
  
  // Req 1: Bloqueo botones
  isSubmitting: boolean = false;

  // Formulario Servicio
  ServiceName: string = '';
  ServiceDescription: string = '';
  ServicePrice: number = 0;
  ServiceCategoryId: number = 0;
  ServiceCategoryName: string = '';
  
  // Acciones Servicio
  ServiceToDeleteName: string = '';
  ServiceToRestoreName: string = '';
  IdEdit: number = 0;
  IdDelete: number = 0;
  IdRestore: number = 0;
  SelectedService: any = null;

  // Acciones Categoría
  CategoryName: string = '';
  CategoryToEdit: any = null;
  CategoryToDelete: any = null;
  CategoryToRestore: any = null;

  // Errores
  errorMessage: string = '';
  modalError: string = '';
  formErrors: any = {};

  // Getter de Admin
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.GetServices();
      this.GetCategories();
    } else {
      this.router.navigate(['/login']);
    }
  }

  // --- CARGA DE DATOS ---

  GetServices(): void {
    this.service.getServices(this.SearchName, this.SelectedCategory, this.ServiceStatus).subscribe({
      next: (data: any) => { 
        this.DataSourceServices = data.data; 
        this.clearError(); 
      },
      error: (error) => { 
        if (error.status === 401) { this.authService.logout(); return; } 
        this.handleError(error); 
      }
    });
  }

  GetCategories(): void {
    this.service.getCategories(this.CategoryStatus).subscribe({
      next: (data: any) => { 
        this.DataSourceCategories = data.data; 
        this.filteredCategories = data.data; 
        this.clearError(); 
      },
      error: (error) => { 
        if (error.status === 401) { this.authService.logout(); return; } 
        this.handleError(error); 
      }
    });
  }

  // --- NAVEGACIÓN ---

  showListView(): void { 
    this.activeView = 'list'; 
    this.clearError(); this.clearModalError(); this.clearFormErrors(); 
    this.GetServices(); 
    this.addToHistory('list'); 
  }

  showCreateForm(): void { 
    if (!this.isAdmin) return;
    this.activeView = 'create'; 
    this.clearForm(); this.clearError(); this.clearModalError(); this.clearFormErrors();
    this.addToHistory('create'); 
  }

  showEditForm(service: any): void {
    if (!this.isAdmin) return;
    this.activeView = 'edit'; 
    this.SelectedService = service; 
    this.IdEdit = service.id;
    this.ServiceName = service.name; 
    this.ServiceDescription = service.description || '';
    this.ServicePrice = service.price; 
    this.ServiceCategoryId = service.category_id;
    
    const cat = this.DataSourceCategories.find(c => c.id === service.category_id);
    this.ServiceCategoryName = cat ? cat.name : '';
    
    this.clearError(); this.clearModalError(); this.clearFormErrors();
    this.addToHistory('edit');
  }

  showCategoriesView(): void { 
    if (!this.isAdmin) return;
    this.activeView = 'categories'; 
    this.clearError(); this.clearModalError(); this.clearFormErrors();
    this.GetCategories(); 
    this.addToHistory('categories'); 
  }

  showEditBack(): void { 
    if (this.SelectedService && this.isAdmin) { 
      this.activeView = 'edit'; 
      this.addToHistory('edit'); 
    } 
  }

  canShowEdit(): boolean { return this.SelectedService !== null; }

  private addToHistory(view: string): void { 
    this.historyStack.push(view); 
    if(this.historyStack.length > 10) this.historyStack.shift(); 
  }

  goBack(): void {
    if (this.historyStack.length > 1) {
      this.historyStack.pop();
      const prev = this.historyStack[this.historyStack.length - 1];
      this.activeView = prev as any;
      if(this.activeView === 'list') this.SelectedService = null;
    } else {
      this.showListView();
    }
  }

  // --- FORMULARIOS ---

  clearForm(): void {
    this.ServiceName = ''; this.ServiceDescription = ''; this.ServicePrice = 0;
    this.ServiceCategoryId = 0; this.ServiceCategoryName = ''; this.clearFormErrors();
  }

  filterCategories(event: any): void {
    const q = event.target.value.toLowerCase();
    this.filteredCategories = this.DataSourceCategories.filter(c => c.name.toLowerCase().includes(q));
  }

  selectCategory(c: any): void { 
    this.ServiceCategoryId = c.id; 
    this.ServiceCategoryName = c.name; 
    this.filteredCategories = this.DataSourceCategories; 
  }

  // --- VALIDACIÓN ---

  validateServiceForm(): boolean {
    this.clearFormErrors();
    let isValid = true;
    if(!this.ServiceName || this.ServiceName.trim() === '') { this.formErrors.serviceName = 'Nombre requerido'; isValid = false; }
    if(!this.ServicePrice || this.ServicePrice <= 0) { this.formErrors.servicePrice = 'Precio debe ser mayor a 0'; isValid = false; }
    if(!this.ServiceCategoryId) { this.formErrors.serviceCategory = 'Categoría requerida'; isValid = false; }
    return isValid;
  }

  validateCategoryForm(): boolean {
    this.clearFormErrors();
    if(!this.CategoryName || this.CategoryName.trim() === '') { this.formErrors.categoryName = 'Nombre requerido'; return false; }
    return true;
  }

  // --- CRUD SERVICIOS ---

  CreateService(): void {
    if (!this.isAdmin || this.isSubmitting) return; // Req 1
    if(!this.validateServiceForm()) return;
    
    this.isSubmitting = true;
    this.service.postService({name: this.ServiceName.trim(), price: this.ServicePrice, category_id: this.ServiceCategoryId}).subscribe({
      next: () => { 
        this.showSuccessNotification('Servicio creado'); 
        this.showListView(); 
        this.isSubmitting = false;
      },
      error: (e) => { 
        this.isSubmitting = false;
        if(e.status===401){this.authService.logout();return;} 
        this.handleModalError(e); 
      }
    });
  }

  EditService(): void {
    if (!this.isAdmin || this.isSubmitting) return; // Req 1
    if(!this.validateServiceForm()) return;
    
    this.isSubmitting = true;
    this.service.putService(this.IdEdit.toString(), {name: this.ServiceName.trim(), price: this.ServicePrice, category_id: this.ServiceCategoryId}).subscribe({
      next: () => { 
        this.showSuccessNotification('Servicio actualizado'); 
        this.showListView(); 
        this.isSubmitting = false;
      },
      error: (e) => { 
        this.isSubmitting = false;
        if(e.status===401){this.authService.logout();return;} 
        this.handleModalError(e); 
      }
    });
  }

  DatosDelete(s: any): void { 
    this.IdDelete = s.id; 
    this.ServiceToDeleteName = s.name; 
    this.clearError(); this.clearModalError(); 
  }

  DeleteService(): void {
    if (!this.isAdmin) return;
    this.service.deleteService(this.IdDelete.toString()).subscribe({
      next: () => { 
        this.showSuccessNotification('Servicio eliminado'); 
        this.GetServices(); 
        this.closeModal('deleteServiceModal'); 
      },
      error: (e) => { if(e.status===401){this.authService.logout();return;} this.handleModalError(e); }
    });
  }

  DatosRestoreService(s: any): void { 
    this.IdRestore = s.id; 
    this.ServiceToRestoreName = s.name; 
    this.clearError(); this.clearModalError(); 
  }

  RestoreServiceConfirm(): void {
    if (!this.isAdmin) return;
    this.service.restoreService(this.IdRestore.toString()).subscribe({
      next: () => { 
        this.showSuccessNotification('Servicio restaurado'); 
        this.GetServices(); 
        this.closeModal('restoreServiceModal'); 
      },
      error: (e) => { if(e.status===401){this.authService.logout();return;} this.handleModalError(e); }
    });
  }

  // --- CRUD CATEGORÍAS ---

  CreateCategory(): void {
    if (!this.isAdmin || this.isSubmitting) return; // Req 1
    if(!this.validateCategoryForm()) return;
    
    this.isSubmitting = true;
    this.service.postCategory({name: this.CategoryName.trim()}).subscribe({
      next: () => { 
        this.showSuccessNotification('Categoría creada'); 
        this.CategoryName=''; this.GetCategories(); 
        this.closeModal('createCategoryModal'); 
        this.isSubmitting = false;
      },
      error: (e) => { 
        this.isSubmitting = false;
        if(e.status===401){this.authService.logout();return;} 
        this.handleModalError(e); 
      }
    });
  }

  EditCategory(): void {
    if (!this.isAdmin || this.isSubmitting) return; // Req 1
    if(!this.validateCategoryForm()) return;
    
    this.isSubmitting = true;
    this.service.putCategory(this.CategoryToEdit.id.toString(), {name: this.CategoryName.trim()}).subscribe({
      next: () => { 
        this.showSuccessNotification('Categoría actualizada'); 
        this.CategoryName=''; this.CategoryToEdit=null; this.GetCategories(); 
        this.closeModal('editCategoryModal'); 
        this.isSubmitting = false;
      },
      error: (e) => { 
        this.isSubmitting = false;
        if(e.status===401){this.authService.logout();return;} 
        this.handleModalError(e); 
      }
    });
  }

  DatosDeleteCategory(c: any): void { 
    this.CategoryToDelete=c; 
    this.clearError(); this.clearModalError(); 
  }

  DeleteCategory(): void {
    if (!this.isAdmin) return;
    this.service.deleteCategory(this.CategoryToDelete.id.toString()).subscribe({
      next: () => { 
        this.showSuccessNotification('Categoría eliminada'); 
        this.CategoryToDelete=null; 
        this.GetCategories(); 
        this.closeModal('deleteCategoryModal'); 
      },
      error: (e) => { 
        if(e.status===401){this.authService.logout();return;} 
        if (e.status === 409) {
          this.modalError = 'No se puede eliminar la categoría porque tiene servicios asociados.';
          return;
        }
        this.handleModalError(e); 
      }
    });
  }

  DatosRestoreCategory(c: any): void { 
    this.CategoryToRestore=c; 
    this.clearError(); this.clearModalError(); 
  }

  RestoreCategoryConfirm(): void {
    if (!this.isAdmin) return;
    this.service.restoreCategory(this.CategoryToRestore.id.toString()).subscribe({
      next: () => { 
        this.showSuccessNotification('Categoría restaurada'); 
        this.CategoryToRestore=null; 
        this.GetCategories(); 
        this.closeModal('restoreCategoryModal'); 
      },
      error: (e) => { if(e.status===401){this.authService.logout();return;} this.handleModalError(e); }
    });
  }

  DatosEditCategory(c: any): void { 
    this.CategoryToEdit=c; 
    this.CategoryName=c.name; 
    this.clearError(); this.clearModalError(); 
  }

  // --- FILTROS ---

  ApplyFilters(): void { this.GetServices(); }
  ClearFilters(): void { this.SearchName = ''; this.SelectedCategory = ''; this.ServiceStatus = 'active'; this.GetServices(); }
  // @ts-ignore
  onServiceStatusChange(n: 'active'|'inactive'): void { this.ServiceStatus = n; this.GetServices(); }
  // @ts-ignore
  onCategoryStatusChange(n: 'active'|'inactive'): void { this.CategoryStatus = n; this.GetCategories(); }

  // --- HELPERS ---

  private closeModal(id: string): void { 
    const m = document.getElementById(id); 
    if(m){const i=(window as any).bootstrap.Modal.getInstance(m);if(i)i.hide();} 
  }

  private showSuccessNotification(message: string): void {
    const n = document.createElement('div');
    n.className = 'alert alert-success alert-dismissible fade show custom-toast';
    n.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;min-width:350px;background:linear-gradient(135deg,#27ae60 0%,#229954 100%);color:white;padding:16px 20px;`;
    n.innerHTML = `<div class="d-flex align-items-center"><span style="font-size:22px;margin-right:12px;">✔</span><div><strong>¡Éxito!</strong><div>${message}</div></div><button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button></div>`;
    document.body.appendChild(n);
    setTimeout(() => { if(n.parentNode) n.parentNode.removeChild(n); }, 4000);
  }

  // --- MANEJO DE ERRORES GENÉRICO ---

  private getGenericErrorMessage(status: number): string {
    switch (status) {
      case 0: return 'Error de conexión. Verifique su internet.';
      case 400: return 'Datos incorrectos. Verifique los campos.';
      case 401: return 'Sesión expirada. Inicie sesión nuevamente.';
      case 403: return 'No tiene permisos para esta acción.';
      case 404: return 'Servicio o categoría no encontrada.';
      case 409: return 'Ya existe un registro con ese nombre.';
      case 500: return 'Error interno del servidor.';
      default: return 'Ocurrió un error inesperado.';
    }
  }

  handleError(e: any): void { 
    this.clearFormErrors(); 
    this.errorMessage = this.getGenericErrorMessage(e.status); 
  }

  handleModalError(e: any): void { 
    this.clearFormErrors(); 
    this.modalError = this.getGenericErrorMessage(e.status); 
  }
  
  clearError(): void { this.errorMessage = ''; }
  clearModalError(): void { this.modalError = ''; }
  clearFormErrors(): void { this.formErrors = {}; }
  hasFormErrors(): boolean { return Object.keys(this.formErrors).length > 0; }
}