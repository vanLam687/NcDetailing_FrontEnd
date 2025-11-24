import { Component, OnInit } from '@angular/core';
import { ServicesService } from '../../Services/services-service';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
  standalone: false
})
export class ServicesComponent implements OnInit {

  constructor(private service: ServicesService, private router: Router, private authService: AuthService) {}

  DataSourceServices: any[] = [];
  DataSourceCategories: any[] = [];
  filteredCategories: any[] = [];

  // Variables para lista
  SearchName: string = '';
  SelectedCategory: string = '';

  // Variables para formulario
  activeView: 'list' | 'create' | 'edit' | 'categories' = 'list';
  
  ServiceName: string = '';
  ServiceDescription: string = '';
  ServicePrice: number = 0;
  ServiceCategoryId: number = 0;
  ServiceCategoryName: string = '';
  ServiceToDeleteName: string = '';

  IdEdit: number = 0;
  IdDelete: number = 0;

  // Variables para categorías
  CategoryName: string = '';
  CategoryToEdit: any = null;
  CategoryToDelete: any = null;

  // Para navegación
  SelectedService: any = null;
  private historyStack: string[] = ['list'];

  errorMessage: string = '';
  modalError: string = '';
  formErrors: any = {};

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.GetServices();
      this.GetCategories();
    } else {
      this.router.navigate(['/login']);
    }
  }

  GetServices(): void {
    this.service.getServices(this.SearchName, this.SelectedCategory).subscribe({
      next: (data: any) => {
        this.DataSourceServices = data.data;
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

  GetCategories(): void {
    this.service.getCategories().subscribe({
      next: (data: any) => {
        this.DataSourceCategories = data.data;
        this.filteredCategories = data.data;
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

  // Navegación entre vistas
  showListView(): void {
    this.activeView = 'list';
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
    this.GetServices();
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

  showEditForm(service: any): void {
    this.activeView = 'edit';
    this.SelectedService = service;
    this.IdEdit = service.id;
    this.ServiceName = service.name;
    this.ServiceDescription = service.description || '';
    this.ServicePrice = service.price;
    this.ServiceCategoryId = service.category_id;
    
    const category = this.DataSourceCategories.find(cat => cat.id === service.category_id);
    this.ServiceCategoryName = category ? category.name : '';
    
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
    this.addToHistory('edit');
  }

  showCategoriesView(): void {
    this.activeView = 'categories';
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
    this.GetCategories();
    this.addToHistory('categories');
  }

  // Métodos para navegar desde el header
  showEditBack(): void {
    if (this.SelectedService) {
      this.activeView = 'edit';
      this.addToHistory('edit');
    }
  }

  // Método para verificar si se puede mostrar edición
  canShowEdit(): boolean {
    return this.SelectedService !== null;
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
      this.activeView = previousView as 'list' | 'create' | 'edit' | 'categories';
      
      // Si volvemos al listado, limpiar el servicio seleccionado
      if (this.activeView === 'list') {
        this.SelectedService = null;
      }
    } else {
      this.showListView();
    }
  }

  clearForm(): void {
    this.ServiceName = '';
    this.ServiceDescription = '';
    this.ServicePrice = 0;
    this.ServiceCategoryId = 0;
    this.ServiceCategoryName = '';
    this.clearFormErrors();
  }

  filterCategories(event: any): void {
    const query = event.target.value.toLowerCase();
    this.filteredCategories = this.DataSourceCategories.filter(category => 
      category.name.toLowerCase().includes(query)
    );
  }

  selectCategory(category: any): void {
    this.ServiceCategoryId = category.id;
    this.ServiceCategoryName = category.name;
    this.filteredCategories = this.DataSourceCategories;
  }

  // Validación de formularios
  validateServiceForm(): boolean {
    this.clearFormErrors();
    let isValid = true;

    // Validar nombre
    if (!this.ServiceName || this.ServiceName.trim() === '') {
      this.formErrors.serviceName = 'El nombre del servicio es requerido';
      isValid = false;
    } else if (this.ServiceName.length > 100) {
      this.formErrors.serviceName = 'El nombre no puede exceder los 100 caracteres';
      isValid = false;
    }

    // Validar precio
    if (!this.ServicePrice || this.ServicePrice <= 0) {
      this.formErrors.servicePrice = 'El precio debe ser mayor a 0';
      isValid = false;
    }

    // Validar categoría
    if (!this.ServiceCategoryId || this.ServiceCategoryId === 0) {
      this.formErrors.serviceCategory = 'Debe seleccionar una categoría';
      isValid = false;
    }

    // Validar descripción - ahora es requerida y no puede estar vacía
    if (!this.ServiceDescription || this.ServiceDescription.trim() === '') {
      this.formErrors.serviceDescription = 'La descripción es requerida';
      isValid = false;
    } else if (this.ServiceDescription.length > 500) {
      this.formErrors.serviceDescription = 'La descripción no puede exceder los 500 caracteres';
      isValid = false;
    }

    return isValid;
  }

  validateCategoryForm(): boolean {
    this.clearFormErrors();
    let isValid = true;

    if (!this.CategoryName || this.CategoryName.trim() === '') {
      this.formErrors.categoryName = 'El nombre de la categoría es requerido';
      isValid = false;
    } else if (this.CategoryName.length > 100) {
      this.formErrors.categoryName = 'El nombre no puede exceder los 100 caracteres';
      isValid = false;
    }

    return isValid;
  }

  // CRUD Operations para Servicios
  CreateService(): void {
    if (!this.validateServiceForm()) {
      return;
    }

    const service = {
      name: this.ServiceName.trim(),
      description: this.ServiceDescription.trim(),
      price: this.ServicePrice,
      category_id: this.ServiceCategoryId
    };

    this.service.postService(service).subscribe({
      next: () => {
        this.clearModalError();
        this.clearFormErrors();
        this.showSuccessNotification('Servicio creado correctamente');
        this.showListView();
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

  EditService(): void {
    if (!this.validateServiceForm()) {
      return;
    }

    const service: any = {
      name: this.ServiceName.trim(),
      description: this.ServiceDescription.trim(),
      price: this.ServicePrice,
      category_id: this.ServiceCategoryId
    };

    this.service.putService(this.IdEdit.toString(), service).subscribe({
      next: () => {
        this.clearModalError();
        this.clearFormErrors();
        this.showSuccessNotification('Servicio actualizado correctamente');
        this.showListView();
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

  DatosDelete(service: any): void {
    this.IdDelete = service.id;
    this.ServiceToDeleteName = service.name;
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
  }

  DeleteService(): void {
    this.service.deleteService(this.IdDelete.toString()).subscribe({
      next: () => {
        this.clearError();
        this.clearModalError();
        this.clearFormErrors();
        this.showSuccessNotification('Servicio eliminado correctamente');
        this.GetServices();
        this.closeModal('deleteServiceModal');
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

  // CRUD Operations para Categorías
  CreateCategory(): void {
    if (!this.validateCategoryForm()) {
      return;
    }

    const category = {
      name: this.CategoryName.trim()
    };

    this.service.postCategory(category).subscribe({
      next: () => {
        this.clearModalError();
        this.clearFormErrors();
        this.showSuccessNotification('Categoría creada correctamente');
        this.CategoryName = '';
        this.GetCategories();
        this.closeModal('createCategoryModal');
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

  EditCategory(): void {
    if (!this.validateCategoryForm()) {
      return;
    }

    const category = {
      name: this.CategoryName.trim()
    };

    this.service.putCategory(this.CategoryToEdit.id.toString(), category).subscribe({
      next: () => {
        this.clearModalError();
        this.clearFormErrors();
        this.showSuccessNotification('Categoría actualizada correctamente');
        this.CategoryName = '';
        this.CategoryToEdit = null;
        this.GetCategories();
        this.closeModal('editCategoryModal');
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

  DatosDeleteCategory(category: any): void {
    this.CategoryToDelete = category;
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
  }

  DeleteCategory(): void {
    this.service.deleteCategory(this.CategoryToDelete.id.toString()).subscribe({
      next: () => {
        this.clearError();
        this.clearModalError();
        this.clearFormErrors();
        this.showSuccessNotification('Categoría eliminada correctamente');
        this.CategoryToDelete = null;
        this.GetCategories();
        this.closeModal('deleteCategoryModal');
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

  DatosEditCategory(category: any): void {
    this.CategoryToEdit = category;
    this.CategoryName = category.name;
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
  }

  ApplyFilters(): void {
    this.GetServices();
  }

  ClearFilters(): void {
    this.SearchName = '';
    this.SelectedCategory = '';
    this.GetServices();
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
}