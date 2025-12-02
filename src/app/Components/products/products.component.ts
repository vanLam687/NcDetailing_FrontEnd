import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { ProductsService } from '../../Services/products-service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  standalone: false
})
export class ProductsComponent implements OnInit {

  constructor(private service: ProductsService, private router: Router, private authService: AuthService) {}

  DataSourceProducts: any[] = [];
  DataSourceCategories: any[] = [];
  filteredCategories: any[] = [];

  // Filtros
  SearchName: string = '';
  SelectedCategory: string = '';
  ProductStatus: 'active' | 'inactive' | 'all' = 'active';
  CategoryStatus: 'active' | 'inactive' | 'all' = 'active';

  // Navegación
  activeView: 'list' | 'create' | 'edit' | 'categories' = 'list';
  private historyStack: string[] = ['list'];
  
  // Formulario Producto
  ProductName: string = '';
  ProductPrice: number = 0;
  ProductStock: number = 0;
  ProductMinStock: number = 0;
  ProductCategoryId: number = 0;
  ProductCategoryName: string = '';
  
  // Acciones Producto
  ProductToDeleteName: string = '';
  ProductToRestoreName: string = '';
  IdEdit: number = 0;
  IdDelete: number = 0;
  IdRestore: number = 0;
  SelectedProduct: any = null;

  // Acciones Categoría
  CategoryName: string = '';
  CategoryToEdit: any = null;
  CategoryToDelete: any = null;
  CategoryToRestore: any = null;

  // Errores
  errorMessage: string = '';
  modalError: string = '';
  formErrors: any = {};

  // Getter para verificar si es admin desde la vista
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.GetProducts();
      this.GetCategories();
    } else {
      this.router.navigate(['/login']);
    }
  }

  // --- CARGA DE DATOS ---

  GetProducts(): void {
    const selectedCategoryObj = this.DataSourceCategories.find(c => c.name === this.SelectedCategory);
    const categoryIdParam = selectedCategoryObj ? selectedCategoryObj.id : undefined;

    this.service.getProducts(this.SearchName, categoryIdParam?.toString(), this.ProductStatus).subscribe({
      next: (data: any) => {
        this.DataSourceProducts = data.data;
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
    this.GetProducts();
    this.addToHistory('list');
  }

  showCreateForm(): void {
    if (!this.isAdmin) return; // Protección extra
    this.activeView = 'create';
    this.clearForm(); this.clearError(); this.clearModalError(); this.clearFormErrors();
    this.addToHistory('create');
  }

  showEditForm(product: any): void {
    if (!this.isAdmin) return; // Protección extra
    this.activeView = 'edit';
    this.SelectedProduct = product;
    this.IdEdit = product.id;
    this.ProductName = product.name;
    this.ProductPrice = product.price;
    this.ProductStock = product.stock;
    this.ProductMinStock = product.min_stock;
    this.ProductCategoryId = product.category_id;
    
    const category = this.DataSourceCategories.find(cat => cat.id === product.category_id);
    this.ProductCategoryName = category ? category.name : '';
    
    this.clearError(); this.clearModalError(); this.clearFormErrors();
    this.addToHistory('edit');
  }

  showCategoriesView(): void {
    if (!this.isAdmin) return; // Protección extra
    this.activeView = 'categories';
    this.clearError(); this.clearModalError(); this.clearFormErrors();
    this.GetCategories();
    this.addToHistory('categories');
  }

  showEditBack(): void {
    if (this.SelectedProduct && this.isAdmin) {
      this.activeView = 'edit';
      this.addToHistory('edit');
    }
  }

  canShowEdit(): boolean { return this.SelectedProduct !== null; }

  private addToHistory(view: string): void {
    this.historyStack.push(view);
    if (this.historyStack.length > 10) this.historyStack.shift();
  }

  goBack(): void {
    if (this.historyStack.length > 1) {
      this.historyStack.pop();
      const previousView = this.historyStack[this.historyStack.length - 1];
      this.activeView = previousView as 'list' | 'create' | 'edit' | 'categories';
      if (this.activeView === 'list') this.SelectedProduct = null;
    } else {
      this.showListView();
    }
  }

  // --- FORMULARIOS Y VALIDACIÓN ---

  clearForm(): void {
    this.ProductName = ''; this.ProductPrice = 0;
    this.ProductStock = 0; this.ProductMinStock = 0; this.ProductCategoryId = 0;
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

  validateProductForm(): boolean {
    this.clearFormErrors();
    let isValid = true;
    if (!this.ProductName || this.ProductName.trim() === '') {
      this.formErrors.productName = 'El nombre es requerido'; isValid = false;
    }
    if (!this.ProductPrice || this.ProductPrice <= 0) {
      this.formErrors.productPrice = 'Precio debe ser mayor a 0'; isValid = false;
    }
    if (this.ProductStock === null || this.ProductStock < 0) {
      this.formErrors.productStock = 'Stock inválido'; isValid = false;
    }
    if (this.ProductMinStock === null || this.ProductMinStock < 0) {
      this.formErrors.productMinStock = 'Stock mínimo inválido'; isValid = false;
    }
    if (!this.ProductCategoryId) {
      this.formErrors.productCategory = 'Categoría requerida'; isValid = false;
    }
    return isValid;
  }

  validateCategoryForm(): boolean {
    this.clearFormErrors();
    if (!this.CategoryName || this.CategoryName.trim() === '') {
      this.formErrors.categoryName = 'Nombre requerido'; return false;
    }
    return true;
  }

  // --- CRUD PRODUCTOS ---

  CreateProduct(): void {
    if (!this.isAdmin) return;
    if (!this.validateProductForm()) return;
    const product = {
      name: this.ProductName.trim(),
      price: this.ProductPrice, stock: this.ProductStock, min_stock: this.ProductMinStock,
      category_id: this.ProductCategoryId
    };
    this.service.postProduct(product).subscribe({
      next: () => {
        this.showSuccessNotification('Producto creado');
        this.showListView();
      },
      error: (error) => {
        if (error.status === 401) { this.authService.logout(); return; }
        this.handleModalError(error);
      }
    });
  }

  EditProduct(): void {
    if (!this.isAdmin) return;
    if (!this.validateProductForm()) return;
    const product: any = {
      name: this.ProductName.trim(),
      price: this.ProductPrice, stock: this.ProductStock, min_stock: this.ProductMinStock,
      category_id: this.ProductCategoryId
    };
    this.service.putProduct(this.IdEdit.toString(), product).subscribe({
      next: () => {
        this.showSuccessNotification('Producto actualizado');
        this.showListView();
      },
      error: (error) => {
        if (error.status === 401) { this.authService.logout(); return; }
        this.handleModalError(error);
      }
    });
  }

  DatosDelete(product: any): void {
    this.IdDelete = product.id;
    this.ProductToDeleteName = product.name;
    this.clearError(); this.clearModalError();
  }

  DeleteProduct(): void {
    if (!this.isAdmin) return;
    this.service.deleteProduct(this.IdDelete.toString()).subscribe({
      next: () => {
        this.showSuccessNotification('Producto eliminado');
        this.GetProducts();
        this.closeModal('deleteProductModal');
      },
      error: (error) => {
        if (error.status === 401) { this.authService.logout(); return; }
        this.handleModalError(error);
      }
    });
  }

  DatosRestoreProduct(product: any): void {
    this.IdRestore = product.id;
    this.ProductToRestoreName = product.name;
    this.clearError(); this.clearModalError();
  }

  RestoreProductConfirm(): void {
    if (!this.isAdmin) return;
    this.service.restoreProduct(this.IdRestore.toString()).subscribe({
      next: () => {
        this.showSuccessNotification('Producto restaurado');
        this.GetProducts();
        this.closeModal('restoreProductModal');
      },
      error: (error) => {
        if (error.status === 401) { this.authService.logout(); return; }
        this.handleModalError(error);
      }
    });
  }

  // --- CRUD CATEGORÍAS ---

  CreateCategory(): void {
    if (!this.isAdmin) return;
    if (!this.validateCategoryForm()) return;
    this.service.postCategory({ name: this.CategoryName.trim() }).subscribe({
      next: () => {
        this.showSuccessNotification('Categoría creada');
        this.CategoryName = ''; this.GetCategories(); this.closeModal('createCategoryModal');
      },
      error: (error) => {
        if (error.status === 401) { this.authService.logout(); return; }
        this.handleModalError(error);
      }
    });
  }

  EditCategory(): void {
    if (!this.isAdmin) return;
    if (!this.validateCategoryForm()) return;
    this.service.putCategory(this.CategoryToEdit.id.toString(), { name: this.CategoryName.trim() }).subscribe({
      next: () => {
        this.showSuccessNotification('Categoría actualizada');
        this.CategoryName = ''; this.CategoryToEdit = null; this.GetCategories(); this.closeModal('editCategoryModal');
      },
      error: (error) => { 
        if (error.status === 401) { this.authService.logout(); return; } 
        this.handleModalError(error); 
      }
    });
  }

  DatosDeleteCategory(category: any): void { 
    this.CategoryToDelete = category; 
    this.clearError(); this.clearModalError(); 
  }

  DeleteCategory(): void {
    if (!this.isAdmin) return;
    this.service.deleteCategory(this.CategoryToDelete.id.toString()).subscribe({
      next: () => { 
        this.showSuccessNotification('Categoría eliminada'); 
        this.CategoryToDelete = null; 
        this.GetCategories(); 
        this.closeModal('deleteCategoryModal'); 
      },
      error: (error) => { 
        if (error.status === 401) { this.authService.logout(); return; } 
        if (error.status === 409) {
          this.modalError = 'No se puede eliminar la categoría porque tiene productos asociados.';
          return;
        }
        this.handleModalError(error); 
      }
    });
  }

  DatosRestoreCategory(category: any): void { 
    this.CategoryToRestore = category; 
    this.clearError(); this.clearModalError(); 
  }

  RestoreCategoryConfirm(): void {
    if (!this.isAdmin) return;
    this.service.restoreCategory(this.CategoryToRestore.id.toString()).subscribe({
      next: () => { 
        this.showSuccessNotification('Categoría restaurada'); 
        this.CategoryToRestore = null; 
        this.GetCategories(); 
        this.closeModal('restoreCategoryModal'); 
      },
      error: (error) => { 
        if (error.status === 401) { this.authService.logout(); return; } 
        this.handleModalError(error); 
      }
    });
  }

  DatosEditCategory(category: any): void { 
    this.CategoryToEdit = category; 
    this.CategoryName = category.name; 
    this.clearError(); this.clearModalError(); 
  }

  // --- FILTROS ---

  ApplyFilters(): void { this.GetProducts(); }
  ClearFilters(): void { this.SearchName = ''; this.SelectedCategory = ''; this.ProductStatus = 'active'; this.GetProducts(); }
  onProductStatusChange(newStatus: 'active' | 'inactive' | 'all'): void { this.ProductStatus = newStatus; this.GetProducts(); }
  onCategoryStatusChange(newStatus: 'active' | 'inactive' | 'all'): void { this.CategoryStatus = newStatus; this.GetCategories(); }

  // --- HELPERS ---

  private closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) { const i = (window as any).bootstrap.Modal.getInstance(modal); if (i) i.hide(); }
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
      case 401: return 'Sesión expirada. Por favor inicie sesión nuevamente.';
      case 403: return 'No tiene permisos para realizar esta acción.';
      case 404: return 'Producto o categoría no encontrada.';
      case 409: return 'Ya existe un registro con ese nombre.';
      case 500: return 'Error interno del servidor.';
      default: return 'Ocurrió un error inesperado.';
    }
  }

  handleError(error: any): void { 
    this.clearFormErrors(); 
    this.errorMessage = this.getGenericErrorMessage(error.status); 
  }

  handleModalError(error: any): void { 
    this.clearFormErrors(); 
    this.modalError = this.getGenericErrorMessage(error.status); 
  }
  
  clearError(): void { this.errorMessage = ''; }
  clearModalError(): void { this.modalError = ''; }
  clearFormErrors(): void { this.formErrors = {}; }
  hasFormErrors(): boolean { return Object.keys(this.formErrors).length > 0; }
}