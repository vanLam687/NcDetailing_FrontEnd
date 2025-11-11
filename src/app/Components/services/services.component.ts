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
  activeView: 'list' | 'form' = 'list';
  isEditMode: boolean = false;
  
  ServiceName: string = '';
  ServiceDescription: string = '';
  ServicePrice: number = 0;
  ServiceCategoryId: number = 0;
  ServiceCategoryName: string = '';
  ServiceToDeleteName: string = '';

  IdEdit: number = 0;
  IdDelete: number = 0;

  CategoryName: string = '';

  errorMessage: string = '';
  modalError: string = '';

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
        this.filteredCategories = data.data;
        this.clearError();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  showListView(): void {
    this.activeView = 'list';
    this.clearError();
    this.clearModalError();
    this.GetServices();
  }

  showCreateForm(): void {
    this.activeView = 'form';
    this.isEditMode = false;
    this.clearForm();
    this.clearError();
    this.clearModalError();
  }

  showEditForm(service: any): void {
    this.activeView = 'form';
    this.isEditMode = true;
    this.IdEdit = service.id;
    this.ServiceName = service.name;
    this.ServiceDescription = service.description || '';
    this.ServicePrice = service.price;
    this.ServiceCategoryId = service.category_id;
    
    const category = this.DataSourceCategories.find(cat => cat.id === service.category_id);
    this.ServiceCategoryName = category ? category.name : '';
    
    this.clearError();
    this.clearModalError();
  }

  clearForm(): void {
    this.ServiceName = '';
    this.ServiceDescription = '';
    this.ServicePrice = 0;
    this.ServiceCategoryId = 0;
    this.ServiceCategoryName = '';
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

  // CRUD Operations
  CreateService(): void {
    const service = {
      name: this.ServiceName,
      description: this.ServiceDescription,
      price: this.ServicePrice,
      category_id: this.ServiceCategoryId
    };

    this.service.postService(service).subscribe({
      next: () => {
        this.clearModalError();
        this.showListView();
      },
      error: (error) => {
        this.handleModalError(error);
      }
    });
  }

  EditService(): void {
    const service: any = {
      name: this.ServiceName,
      description: this.ServiceDescription,
      price: this.ServicePrice,
      category_id: this.ServiceCategoryId
    };

    this.service.putService(this.IdEdit.toString(), service).subscribe({
      next: () => {
        this.clearModalError();
        this.showListView();
      },
      error: (error) => {
        this.handleModalError(error);
      }
    });
  }

  DatosDelete(service: any): void {
    this.IdDelete = service.id;
    this.ServiceToDeleteName = service.name;
    this.clearError();
    this.clearModalError();
  }

  DeleteService(): void {
    this.service.deleteService(this.IdDelete.toString()).subscribe({
      next: () => {
        this.clearError();
        this.clearModalError();
        this.GetServices();
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
    this.GetServices();
  }

  ClearFilters(): void {
    this.SearchName = '';
    this.SelectedCategory = '';
    this.GetServices();
  }

  handleError(error: any): void {
    if (error.error?.mensaje) {
      this.errorMessage = error.error.mensaje;
    } 
    else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } 
    else if (error.error?.error) {
      this.errorMessage = error.error.error;
    }
    else if (typeof error.error === 'string') {
      this.errorMessage = error.error;
    }
    else if (error.status === 0) {
      this.errorMessage = 'Error de conexión. No se puede conectar al servidor.';
    }
    else {
      this.errorMessage = 'Ha ocurrido un error inesperado.';
    }
  }

  handleModalError(error: any): void {
    if (error.error?.mensaje) {
      this.modalError = error.error.mensaje;
    } 
    else if (error.error?.message) {
      this.modalError = error.error.message;
    } 
    else if (error.error?.error) {
      this.modalError = error.error.error;
    }
    else if (typeof error.error === 'string') {
      this.modalError = error.error;
    }
    else if (error.status === 0) {
      this.modalError = 'Error de conexión. No se puede conectar al servidor.';
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
}