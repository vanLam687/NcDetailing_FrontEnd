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

  ServiceName: string = '';
  ServiceDescription: string = '';
  ServicePrice: number = 0;
  ServiceCategoryId: number = 0;

  IdEdit: number = 0;
  ServiceNameEdit: string = '';
  ServiceDescriptionEdit: string = '';
  ServicePriceEdit: number = 0;
  ServiceCategoryIdEdit: number = 0;

  IdDelete: number = 0;

  CategoryName: string = '';

  SearchName: string = '';
  SelectedCategory: string = '';

  errorMessage: string = '';

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

  CreateService(): void {
    const service = {
      name: this.ServiceName,
      description: this.ServiceDescription,
      price: this.ServicePrice,
      category_id: this.ServiceCategoryId
    };

    this.service.postService(service).subscribe({
      next: () => {
        this.clearError();
        location.reload();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  DatosEdit(service: any): void {
    this.IdEdit = service.id;
    this.ServiceNameEdit = service.name;
    this.ServiceDescriptionEdit = service.description;
    this.ServicePriceEdit = service.price;
    this.ServiceCategoryIdEdit = service.category_id;
    this.clearError();
  }

  EditService(): void {
    const service: any = {
      name: this.ServiceNameEdit,
      description: this.ServiceDescriptionEdit,
      price: this.ServicePriceEdit,
      category_id: this.ServiceCategoryIdEdit
    };

    this.service.putService(this.IdEdit.toString(), service).subscribe({
      next: () => {
        this.clearError();
        location.reload();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  DatosDelete(service: any): void {
    this.IdDelete = service.id;
    this.clearError();
  }

  DeleteService(): void {
    this.service.deleteService(this.IdDelete.toString()).subscribe({
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
    this.GetServices();
  }

  ClearFilters(): void {
    this.SearchName = '';
    this.SelectedCategory = '';
    this.GetServices();
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