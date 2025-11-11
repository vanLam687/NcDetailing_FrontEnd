import { Component, OnInit } from '@angular/core';
import { EmployeesService } from '../../Services/employees-service';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';

@Component({
  selector: 'app-employees',
  standalone: false,
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css'
})
export class EmployeesComponent implements OnInit {

  constructor(private service: EmployeesService, private router: Router, private authService: AuthService) {}

  // Datos
  DataSourceEmployees: any[] = [];

  // Estados de vista
  activeView: 'list' | 'form' = 'list';
  isEditMode: boolean = false;

  // Formulario de empleado
  Name: string = '';
  Username: string = '';
  Email: string = '';
  Password: string = '';

  // Edición
  IdEdit: number = 0;
  NameEdit: string = '';
  UsernameEdit: string = '';
  EmailEdit: string = '';
  PasswordEdit: string = '';

  // Eliminación
  IdDelete: number = 0;
  EmployeeToDeleteName: string = '';

  // Errores
  errorMessage: string = '';
  modalError: string = '';

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.GetEmployees();
    } else {
      this.router.navigate(['/login']);
    }
  }

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

  showEditForm(employee: any): void {
    this.activeView = 'form';
    this.isEditMode = true;
    
    this.IdEdit = employee.id;
    this.NameEdit = employee.name;
    this.UsernameEdit = employee.username;
    this.EmailEdit = employee.email;
    this.PasswordEdit = '';
    
    this.clearError();
  }

  // Servicios
  GetEmployees(): void {
    this.service.GetEmployees().subscribe({
      next: (data: any) => {
        this.DataSourceEmployees = data.data;
        this.clearError();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  CreateEmployee(): void {
    const employee = {
      name: this.Name,
      username: this.Username,
      email: this.Email,
      password: this.Password
    };

    this.service.PostEmployee(employee).subscribe({
      next: () => {
        this.clearError();
        this.showListView();
        this.GetEmployees();
      },
      error: (error) => {
        this.handleModalError(error);
      }
    });
  }

  EditEmployee(): void {
    const employee: any = {
      name: this.NameEdit,
      username: this.UsernameEdit,
      email: this.EmailEdit
    };

    if (this.PasswordEdit && this.PasswordEdit.trim() !== '') {
      employee.password = this.PasswordEdit;
    }

    this.service.PutEmployee(this.IdEdit.toString(), employee).subscribe({
      next: () => {
        this.clearError();
        this.showListView();
        this.GetEmployees();
      },
      error: (error) => {
        this.handleModalError(error);
      }
    });
  }

  DatosDelete(employee: any): void {
    this.IdDelete = employee.id;
    this.EmployeeToDeleteName = employee.name;
    this.clearError();
  }

  DeleteEmployee(): void {
    this.service.DeleteEmployee(this.IdDelete.toString()).subscribe({
      next: () => {
        this.clearError();
        this.GetEmployees();
      },
      error: (error) => {
        this.handleModalError(error);
      }
    });
  }

  // Getters para el formulario
  get currentName(): string {
    return this.isEditMode ? this.NameEdit : this.Name;
  }

  set currentName(value: string) {
    if (this.isEditMode) {
      this.NameEdit = value;
    } else {
      this.Name = value;
    }
  }

  get currentUsername(): string {
    return this.isEditMode ? this.UsernameEdit : this.Username;
  }

  set currentUsername(value: string) {
    if (this.isEditMode) {
      this.UsernameEdit = value;
    } else {
      this.Username = value;
    }
  }

  get currentEmail(): string {
    return this.isEditMode ? this.EmailEdit : this.Email;
  }

  set currentEmail(value: string) {
    if (this.isEditMode) {
      this.EmailEdit = value;
    } else {
      this.Email = value;
    }
  }

  get currentPassword(): string {
    return this.isEditMode ? this.PasswordEdit : this.Password;
  }

  set currentPassword(value: string) {
    if (this.isEditMode) {
      this.PasswordEdit = value;
    } else {
      this.Password = value;
    }
  }

  // Manejo de errores
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
    this.Name = '';
    this.Username = '';
    this.Email = '';
    this.Password = '';
    
    this.NameEdit = '';
    this.UsernameEdit = '';
    this.EmailEdit = '';
    this.PasswordEdit = '';
    
    this.modalError = '';
  }
}