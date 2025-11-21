import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { ProductsService } from '../../Services/products-service';

@Component({
  selector: 'app-products',
  standalone: false,
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {

  constructor(private service: ProductsService, private router: Router, private authService: AuthService) {}

  // Datos
  DataSourceProducts: any[] = [];
  DataSourceCategories: any[] = [];
  filteredCategories: any[] = [];

  // Estados de vista
  activeView: 'list' | 'form' = 'list';
  isEditMode: boolean = false;

  // Filtros
  SearchName: string = '';
  SelectedCategory: string = '';

  // Formulario de producto
  ProductName: string = '';
  ProductDescription: string = '';
  ProductPrice: number = 0;
  ProductStock: number = 0;
  ProductMinStock: number = 0;
  ProductCategoryId: number = 0;
  ProductCategoryName: string = '';

  // Edición
  IdEdit: number = 0;
  ProductNameEdit: string = '';
  ProductDescriptionEdit: string = '';
  ProductPriceEdit: number = 0;
  ProductStockEdit: number = 0;
  ProductMinStockEdit: number = 0;
  ProductCategoryIdEdit: number = 0;
  ProductCategoryNameEdit: string = '';

  // Eliminación
  IdDelete: number = 0;
  ProductToDeleteName: string = '';

  // Categoría
  CategoryName: string = '';

  // Errores
  errorMessage: string = '';
  modalError: string = '';

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.GetProducts();
      this.GetCategories();
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Navegación entre vistas
  showListView(): void {
    this.activeView = 'list';
    this.clearForm();
    this.clearError();
  }

  showCreateForm(): void {
    this.activeView = 'form';
    this.isEditMode = false;
    this.clearForm();
    this.clearError();
  }

  showEditForm(product: any): void {
    this.activeView = 'form';
    this.isEditMode = true;
    
    this.IdEdit = product.id;
    this.ProductNameEdit = product.name;
    this.ProductDescriptionEdit = product.description;
    this.ProductPriceEdit = product.price;
    this.ProductStockEdit = product.stock;
    this.ProductMinStockEdit = product.min_stock;
    this.ProductCategoryNameEdit = product.category;
    
    const category = this.DataSourceCategories.find(cat => cat.name === product.category);
    this.ProductCategoryIdEdit = category ? category.id : 0;
    
    this.clearError();
  }

  // Filtrado de categorías
  filterCategories(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredCategories = this.DataSourceCategories.filter(category => 
      category.name.toLowerCase().includes(searchTerm)
    );
  }

  selectCategory(category: any): void {
    if (this.isEditMode) {
      this.ProductCategoryNameEdit = category.name;
      this.ProductCategoryIdEdit = category.id;
    } else {
      this.ProductCategoryName = category.name;
      this.ProductCategoryId = category.id;
    }
  }

  // Servicios
  GetProducts(): void {
    this.service.getProducts(this.SearchName, this.SelectedCategory).subscribe({
      next: (data: any) => {
        this.DataSourceProducts = data.data;
        this.clearError();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  GetCategories(): void {
    this.service.getCategories().subscribe({
      next: (data: any) => {
        this.DataSourceCategories = data.data;
        this.filteredCategories = [...this.DataSourceCategories];
        this.clearError();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  CreateProduct(): void {
    const product = {
      name: this.ProductName,
      description: this.ProductDescription,
      price: this.ProductPrice,
      stock: this.ProductStock,
      min_stock: this.ProductMinStock,
      category_id: this.ProductCategoryId
    };

    this.service.postProduct(product).subscribe({
      next: () => {
        this.clearError();
        this.showListView();
        this.GetProducts();
      },
      error: (error) => {
        this.handleModalError(error);
      }
    });
  }

EditProduct(): void {
  const product: any = {
    name: this.ProductNameEdit,
    description: this.ProductDescriptionEdit,
    price: this.ProductPriceEdit,
    stock: this.ProductStockEdit,
    category_id: this.ProductCategoryIdEdit,
    min_stock: this.ProductMinStockEdit
  };

  this.service.putProduct(this.IdEdit.toString(), product).subscribe({
    next: () => {
      this.clearError();
      this.showListView();
      this.GetProducts();
    },
    error: (error) => {
      this.handleModalError(error);
    }
  });
}

  DatosDelete(product: any): void {
    this.IdDelete = product.id;
    this.ProductToDeleteName = product.name;
    this.clearError();
  }

  DeleteProduct(): void {
    this.service.deleteProduct(this.IdDelete.toString()).subscribe({
      next: () => {
        this.clearError();
        this.GetProducts();
      },
      error: (error) => {
        this.handleModalError(error);
      }
    });
  }

  CreateCategory(): void {
    const category = {
      name: this.CategoryName
    };

    this.service.postCategory(category).subscribe({
      next: () => {
        this.clearModalError();
        this.CategoryName = '';
        this.GetCategories();
      },
      error: (error) => {
        this.handleModalError(error);
      }
    });
  }

  ApplyFilters(): void {
    this.GetProducts();
  }

  ClearFilters(): void {
    this.SearchName = '';
    this.SelectedCategory = '';
    this.GetProducts();
  }

  // Getters para el formulario
  get currentProductName(): string {
    return this.isEditMode ? this.ProductNameEdit : this.ProductName;
  }

  set currentProductName(value: string) {
    if (this.isEditMode) {
      this.ProductNameEdit = value;
    } else {
      this.ProductName = value;
    }
  }

  get currentProductDescription(): string {
    return this.isEditMode ? this.ProductDescriptionEdit : this.ProductDescription;
  }

  set currentProductDescription(value: string) {
    if (this.isEditMode) {
      this.ProductDescriptionEdit = value;
    } else {
      this.ProductDescription = value;
    }
  }

  get currentProductPrice(): number {
    return this.isEditMode ? this.ProductPriceEdit : this.ProductPrice;
  }

  set currentProductPrice(value: number) {
    if (this.isEditMode) {
      this.ProductPriceEdit = value;
    } else {
      this.ProductPrice = value;
    }
  }

  get currentProductStock(): number {
    return this.isEditMode ? this.ProductStockEdit : this.ProductStock;
  }

  set currentProductStock(value: number) {
    if (this.isEditMode) {
      this.ProductStockEdit = value;
    } else {
      this.ProductStock = value;
    }
  }

  get currentProductMinStock(): number {
    return this.isEditMode ? this.ProductMinStockEdit : this.ProductMinStock;
  }

  set currentProductMinStock(value: number) {
    if (this.isEditMode) {
      this.ProductMinStockEdit = value;
    } else {
      this.ProductMinStock = value;
    }
  }

  get currentProductCategoryName(): string {
    return this.isEditMode ? this.ProductCategoryNameEdit : this.ProductCategoryName;
  }

  set currentProductCategoryName(value: string) {
    if (this.isEditMode) {
      this.ProductCategoryNameEdit = value;
    } else {
      this.ProductCategoryName = value;
    }
  }

  handleError(error: any): void {
    if (error.error?.mensaje) {
      this.errorMessage = error.error.mensaje;
    } else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else if (error.error?.error) {
      this.errorMessage = error.error.error;
    } else if (typeof error.error === 'string') {
      this.errorMessage = error.error;
    } else if (error.status === 0) {
      this.errorMessage = 'Error de conexión. No se puede conectar al servidor.';
    } else if (error.statusText) {
      this.errorMessage = `Error ${error.status}: ${error.statusText}`;
    } else {
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
    this.ProductName = '';
    this.ProductDescription = '';
    this.ProductPrice = 0;
    this.ProductStock = 0;
    this.ProductMinStock = 0;
    this.ProductCategoryId = 0;
    this.ProductCategoryName = '';
    
    this.ProductNameEdit = '';
    this.ProductDescriptionEdit = '';
    this.ProductPriceEdit = 0;
    this.ProductStockEdit = 0;
    this.ProductMinStockEdit = 0;
    this.ProductCategoryIdEdit = 0;
    this.ProductCategoryNameEdit = '';
    
    this.modalError = '';
  }
}