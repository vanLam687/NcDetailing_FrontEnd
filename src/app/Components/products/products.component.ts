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

  DataSourceProducts: any[] = [];
  DataSourceCategories: any[] = [];

  ProductName: string = '';
  ProductDescription: string = '';
  ProductPrice: number = 0;
  ProductStock: number = 0;
  ProductMinStock: number = 0;
  ProductCategoryId: number = 0;

  IdEdit: number = 0;
  ProductNameEdit: string = '';
  ProductDescriptionEdit: string = '';
  ProductPriceEdit: number = 0;
  ProductStockEdit: number = 0;
  ProductMinStockEdit: number = 0;
  ProductCategoryIdEdit: number = 0;

  IdDelete: number = 0;
  IdUpdateMinStock: number = 0;
  NewMinStock: number = 0;

  CategoryName: string = '';

  SearchName: string = '';
  SelectedCategory: string = '';

  errorMessage: string = '';

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
        this.handleError(error);
      }
    });
  }

  GetCategories(): void {
    this.service.getCategories().subscribe({
      next: (data: any) => {
        this.DataSourceCategories = data.data;
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
        location.reload();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  DatosEdit(product: any): void {
    this.IdEdit = product.id;
    this.ProductNameEdit = product.name;
    this.ProductDescriptionEdit = product.description;
    this.ProductPriceEdit = product.price;
    this.ProductStockEdit = product.stock;
    this.ProductMinStockEdit = product.min_stock;
    this.ProductCategoryIdEdit = product.category_id;
    this.clearError();
  }

  EditProduct(): void {
    const product: any = {
      name: this.ProductNameEdit,
      description: this.ProductDescriptionEdit,
      price: this.ProductPriceEdit,
      stock: this.ProductStockEdit,
      category_id: this.ProductCategoryIdEdit
    };

    this.service.putProduct(this.IdEdit.toString(), product).subscribe({
      next: () => {
        this.clearError();
        location.reload();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  DatosUpdateMinStock(product: any): void {
    this.IdUpdateMinStock = product.id;
    this.NewMinStock = product.min_stock;
    this.clearError();
  }

  UpdateMinStock(): void {
    this.service.updateMinStock(this.IdUpdateMinStock.toString(), this.NewMinStock).subscribe({
      next: () => {
        this.clearError();
        location.reload();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  DatosDelete(product: any): void {
    this.IdDelete = product.id;
    this.clearError();
  }

  DeleteProduct(): void {
    this.service.deleteProduct(this.IdDelete.toString()).subscribe({
      next: () => {
        this.clearError();
        location.reload();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  CreateCategory(): void {
    const category = {
      name: this.CategoryName
    };

    this.service.postCategory(category).subscribe({
      next: () => {
        this.clearError();
        location.reload();
      },
      error: (error) => {
        this.handleError(error);
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

  handleError(error: any): void {
    if (error.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else if (error.status === 0) {
      this.errorMessage = 'Error de conexión. Verifique su internet.';
    } else {
      this.errorMessage = 'Ha ocurrido un error inesperado.';
    }
  }

  clearError(): void {
    this.errorMessage = '';
  }
}