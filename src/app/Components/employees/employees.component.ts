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

  DataSourceEmployees: any[] = [];
  Name: string = '';
  Username: string = '';
  Email: string = '';
  Password: string = '';
  IdEdit: number = 0;
  NameEdit: string = '';
  UsernameEdit: string = '';
  EmailEdit: string = '';
  PasswordEdit: string = '';
  IdDelete: number = 0;
  errorMessage: string = '';

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.GetEmployees();
    } else {
      this.router.navigate(['/login']);
    }
  }

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
        location.reload();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  DatosEdit(employee: any): void {
    this.IdEdit = employee.id;
    this.NameEdit = employee.name;
    this.UsernameEdit = employee.username;
    this.EmailEdit = employee.email;
    this.PasswordEdit = '';
    this.clearError();
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
        location.reload();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  DatosDelete(employee: any): void {
    this.IdDelete = employee.id;
    this.clearError();
  }

  DeleteEmployee(): void {
    this.service.DeleteEmployee(this.IdDelete.toString()).subscribe({
      next: () => {
        this.clearError();
        location.reload();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

handleError(error: any): void {
  if (error.status === 401) {
    this.authService.logout();
    this.router.navigate(['/login']);
    return;
  }

  if (error.error?.message) {
    this.errorMessage = error.error.message;
  } 
  else if (typeof error.error === 'string') {
    this.errorMessage = error.error;
  }
  else if (error.message) {
    this.errorMessage = error.message;
  }
  else if (error.status === 0) {
    this.errorMessage = 'Error de conexión. Verifique su internet.';
  } else {
    this.errorMessage = 'Ha ocurrido un error inesperado.';
  }
}

clearError(): void {
    this.errorMessage = '';
  }
}