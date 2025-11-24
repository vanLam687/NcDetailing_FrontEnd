import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { ProductsService } from '../../Services/products-service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
  standalone: false
})
export class ProductsComponent implements OnInit {

  constructor(private service: ProductsService, private router: Router, private authService: AuthService) {}

  DataSourceProducts: any[] = [];
  DataSourceCategories: any[] = [];
  filteredCategories: any[] = [];

  // Variables para lista
  SearchName: string = '';
  SelectedCategory: string = '';

  // Variables para formulario
  activeView: 'list' | 'create' | 'edit' | 'categories' = 'list';
  
  ProductName: string = '';
  ProductDescription: string = '';
  ProductPrice: number = 0;
  ProductStock: number = 0;
  ProductMinStock: number = 0;
  ProductCategoryId: number = 0;
  ProductCategoryName: string = '';
  ProductToDeleteName: string = '';

  IdEdit: number = 0;
  IdDelete: number = 0;

  // Variables para categorías
  CategoryName: string = '';
  CategoryToEdit: any = null;
  CategoryToDelete: any = null;

  // Para navegación
  SelectedProduct: any = null;
  private historyStack: string[] = ['list'];

  errorMessage: string = '';
  modalError: string = '';
  formErrors: any = {};

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.GetProducts();
      this.GetCategories();
    } else {
      this.router.navigate(['/login']);
    }
  }

  GetProducts(): void {
    this.service.getProducts(this.SearchName, this.SelectedCategory).subscribe({
      next: (data: any) => {
        this.DataSourceProducts = data.data;
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
    this.GetProducts();
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

  showEditForm(product: any): void {
    this.activeView = 'edit';
    this.SelectedProduct = product;
    this.IdEdit = product.id;
    this.ProductName = product.name;
    this.ProductDescription = product.description || '';
    this.ProductPrice = product.price;
    this.ProductStock = product.stock;
    this.ProductMinStock = product.min_stock;
    this.ProductCategoryId = product.category_id;
    
    const category = this.DataSourceCategories.find(cat => cat.id === product.category_id);
    this.ProductCategoryName = category ? category.name : '';
    
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
    if (this.SelectedProduct) {
      this.activeView = 'edit';
      this.addToHistory('edit');
    }
  }

  // Método para verificar si se puede mostrar edición
  canShowEdit(): boolean {
    return this.SelectedProduct !== null;
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
      
      // Si volvemos al listado, limpiar el producto seleccionado
      if (this.activeView === 'list') {
        this.SelectedProduct = null;
      }
    } else {
      this.showListView();
    }
  }

  clearForm(): void {
    this.ProductName = '';
    this.ProductDescription = '';
    this.ProductPrice = 0;
    this.ProductStock = 0;
    this.ProductMinStock = 0;
    this.ProductCategoryId = 0;
    this.ProductCategoryName = '';
    this.clearFormErrors();
  }

  filterCategories(event: any): void {
    const query = event.target.value.toLowerCase();
    this.filteredCategories = this.DataSourceCategories.filter(category => 
      category.name.toLowerCase().includes(query)
    );
  }

  selectCategory(category: any): void {
    this.ProductCategoryId = category.id;
    this.ProductCategoryName = category.name;
    this.filteredCategories = this.DataSourceCategories;
  }

  // Validación de formularios - CORREGIDA
  validateProductForm(): boolean {
    this.clearFormErrors();
    let isValid = true;

    // Validar nombre
    if (!this.ProductName || this.ProductName.trim() === '') {
      this.formErrors.productName = 'El nombre del producto es requerido';
      isValid = false;
    } else if (this.ProductName.length > 100) {
      this.formErrors.productName = 'El nombre no puede exceder los 100 caracteres';
      isValid = false;
    }

    // Validar precio
    if (!this.ProductPrice || this.ProductPrice <= 0) {
      this.formErrors.productPrice = 'El precio debe ser mayor a 0';
      isValid = false;
    }

    // Validar stock
    if (this.ProductStock === null || this.ProductStock === undefined) {
      this.formErrors.productStock = 'El stock es requerido';
      isValid = false;
    } else if (!Number.isInteger(this.ProductStock)) {
      this.formErrors.productStock = 'El stock debe ser un número entero';
      isValid = false;
    } else if (this.ProductStock < 0) {
      this.formErrors.productStock = 'El stock no puede ser negativo';
      isValid = false;
    }

    // Validar stock mínimo
    if (this.ProductMinStock === null || this.ProductMinStock === undefined) {
      this.formErrors.productMinStock = 'El stock mínimo es requerido';
      isValid = false;
    } else if (!Number.isInteger(this.ProductMinStock)) {
      this.formErrors.productMinStock = 'El stock mínimo debe ser un número entero';
      isValid = false;
    } else if (this.ProductMinStock < 0) {
      this.formErrors.productMinStock = 'El stock mínimo no puede ser negativo';
      isValid = false;
    }

    // Validar categoría
    if (!this.ProductCategoryId || this.ProductCategoryId === 0) {
      this.formErrors.productCategory = 'Debe seleccionar una categoría';
      isValid = false;
    }

    // Validar descripción - CORREGIDO: usar productDescription en lugar de serviceDescription
    if (!this.ProductDescription || this.ProductDescription.trim() === '') {
      this.formErrors.productDescription = 'La descripción es requerida';
      isValid = false;
    } else if (this.ProductDescription.length > 500) {
      this.formErrors.productDescription = 'La descripción no puede exceder los 500 caracteres';
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
    } else if (this.CategoryName.length > 50) {
      this.formErrors.categoryName = 'El nombre no puede exceder los 50 caracteres';
      isValid = false;
    }

    return isValid;
  }

  // CRUD Operations para Productos
  CreateProduct(): void {
    if (!this.validateProductForm()) {
      return;
    }

    // Si la descripción está vacía o solo tiene espacios, enviar null
    const descriptionValue = this.ProductDescription && this.ProductDescription.trim() !== '' 
      ? this.ProductDescription.trim() 
      : null;

    const product = {
      name: this.ProductName.trim(),
      description: descriptionValue,
      price: this.ProductPrice,
      stock: this.ProductStock,
      min_stock: this.ProductMinStock,
      category_id: this.ProductCategoryId
    };

    this.service.postProduct(product).subscribe({
      next: () => {
        this.clearModalError();
        this.clearFormErrors();
        this.showSuccessNotification('Producto creado correctamente');
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

  EditProduct(): void {
    if (!this.validateProductForm()) {
      return;
    }

    // Si la descripción está vacía o solo tiene espacios, enviar null
    const descriptionValue = this.ProductDescription && this.ProductDescription.trim() !== '' 
      ? this.ProductDescription.trim() 
      : null;

    const product: any = {
      name: this.ProductName.trim(),
      description: descriptionValue,
      price: this.ProductPrice,
      stock: this.ProductStock,
      min_stock: this.ProductMinStock,
      category_id: this.ProductCategoryId
    };

    this.service.putProduct(this.IdEdit.toString(), product).subscribe({
      next: () => {
        this.clearModalError();
        this.clearFormErrors();
        this.showSuccessNotification('Producto actualizado correctamente');
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

  DatosDelete(product: any): void {
    this.IdDelete = product.id;
    this.ProductToDeleteName = product.name;
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
  }

  DeleteProduct(): void {
    this.service.deleteProduct(this.IdDelete.toString()).subscribe({
      next: () => {
        this.clearError();
        this.clearModalError();
        this.clearFormErrors();
        this.showSuccessNotification('Producto eliminado correctamente');
        this.GetProducts();
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
    this.GetProducts();
  }

  ClearFilters(): void {
    this.SearchName = '';
    this.SelectedCategory = '';
    this.GetProducts();
  }

  // Método para cerrar modales
  private closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      const modalInstance = (window as any).bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  // Método para mostrar notificaciones de éxito - MEJORADO
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
      if (typeof error.error.error === 'string') {
        this.errorMessage = error.error.error;
      } else if (error.error.error.details) {
        const details = error.error.error.details;
        this.errorMessage = details.map((detail: any) => {
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