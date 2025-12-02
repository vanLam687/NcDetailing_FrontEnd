import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { ProductsService } from '../../Services/products-service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  standalone: false
})
export class ProductsComponent implements OnInit {

  constructor(
    private service: ProductsService, 
    private router: Router, 
    private authService: AuthService,
    private notification: NzNotificationService 
  ) {}

  DataSourceProducts: any[] = [];
  DataSourceCategories: any[] = [];
  filteredCategories: any[] = [];

  // Filtros
  SearchName: string = '';
  SelectedCategory: string = '';
  ProductStatus: 'active' | 'inactive' = 'active'; 
  CategoryStatus: 'active' | 'inactive' = 'active';

  // Navegación
  activeView: 'list' | 'create' | 'edit' | 'categories' = 'list';
  // SE ELIMINÓ: historyStack (ya no guardamos historial de navegación)
  
  // Req 1: Flag para bloquear botones
  isSubmitting: boolean = false;

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

  // --- NAVEGACIÓN SIMPLIFICADA (SIN HISTORIAL) ---

  showListView(): void {
    this.activeView = 'list';
    this.clearError(); this.clearModalError(); this.clearFormErrors();
    this.GetProducts();
  }

  showCreateForm(): void {
    if (!this.isAdmin) return;
    this.activeView = 'create';
    this.clearForm(); this.clearError(); this.clearModalError(); this.clearFormErrors();
  }

  showEditForm(product: any): void {
    if (!this.isAdmin) return;
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
  }

  showCategoriesView(): void {
    if (!this.isAdmin) return;
    this.activeView = 'categories';
    this.clearError(); this.clearModalError(); this.clearFormErrors();
    this.GetCategories();
  }

  showEditBack(): void {
    if (this.SelectedProduct && this.isAdmin) {
      this.activeView = 'edit';
    }
  }

  canShowEdit(): boolean { return this.SelectedProduct !== null; }

  // SE ELIMINÓ: private addToHistory(view: string)

  goBack(): void {
    // Simplemente volvemos a la lista de productos
    this.showListView();
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
    if (!this.isAdmin || this.isSubmitting) return;
    if (!this.validateProductForm()) return;
    
    this.isSubmitting = true;
    const product = {
      name: this.ProductName.trim(),
      price: this.ProductPrice, stock: this.ProductStock, min_stock: this.ProductMinStock,
      category_id: this.ProductCategoryId
    };
    
    this.service.postProduct(product).subscribe({
      next: () => {
        this.notification.success('¡Éxito!', 'Producto creado correctamente');
        this.showListView();
        this.isSubmitting = false;
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.status === 401) { this.authService.logout(); return; }
        this.handleModalError(error);
      }
    });
  }

  EditProduct(): void {
    if (!this.isAdmin || this.isSubmitting) return;
    if (!this.validateProductForm()) return;
    
    this.isSubmitting = true;
    const product: any = {
      name: this.ProductName.trim(),
      price: this.ProductPrice, stock: this.ProductStock, min_stock: this.ProductMinStock,
      category_id: this.ProductCategoryId
    };
    
    this.service.putProduct(this.IdEdit.toString(), product).subscribe({
      next: () => {
        this.notification.success('¡Éxito!', 'Producto actualizado correctamente');
        this.showListView();
        this.isSubmitting = false;
      },
      error: (error) => {
        this.isSubmitting = false;
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
        this.notification.success('Operación completada', 'Producto eliminado correctamente');
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
        this.notification.success('Operación completada', 'Producto restaurado correctamente');
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
    if (!this.isAdmin || this.isSubmitting) return;
    if (!this.validateCategoryForm()) return;
    
    this.isSubmitting = true;
    this.service.postCategory({ name: this.CategoryName.trim() }).subscribe({
      next: () => {
        this.notification.success('¡Éxito!', 'Categoría creada correctamente');
        this.CategoryName = ''; this.GetCategories(); this.closeModal('createCategoryModal');
        this.isSubmitting = false;
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.status === 401) { this.authService.logout(); return; }
        this.handleModalError(error);
      }
    });
  }

  EditCategory(): void {
    if (!this.isAdmin || this.isSubmitting) return;
    if (!this.validateCategoryForm()) return;
    
    this.isSubmitting = true;
    this.service.putCategory(this.CategoryToEdit.id.toString(), { name: this.CategoryName.trim() }).subscribe({
      next: () => {
        this.notification.success('¡Éxito!', 'Categoría actualizada correctamente');
        this.CategoryName = ''; this.CategoryToEdit = null; this.GetCategories(); this.closeModal('editCategoryModal');
        this.isSubmitting = false;
      },
      error: (error) => { 
        this.isSubmitting = false;
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
        this.notification.success('Operación completada', 'Categoría eliminada correctamente');
        this.CategoryToDelete = null; 
        this.GetCategories(); 
        this.closeModal('deleteCategoryModal'); 
      },
      error: (error) => { 
        if (error.status === 401) { this.authService.logout(); return; } 
        if (error.status === 409) {
          this.modalError = 'No se puede eliminar la categoría porque tiene productos asociados.';
          this.notification.warning('Atención', 'No se puede eliminar: tiene productos asociados.');
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
        this.notification.success('Operación completada', 'Categoría restaurada correctamente');
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
  // @ts-ignore
  onProductStatusChange(newStatus: 'active' | 'inactive'): void { this.ProductStatus = newStatus; this.GetProducts(); }
  // @ts-ignore
  onCategoryStatusChange(newStatus: 'active' | 'inactive'): void { this.CategoryStatus = newStatus; this.GetCategories(); }

  // --- HELPERS ---

  private closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) { const i = (window as any).bootstrap.Modal.getInstance(modal); if (i) i.hide(); }
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