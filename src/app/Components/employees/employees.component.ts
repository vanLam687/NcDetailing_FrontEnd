import { Component, OnInit } from '@angular/core';
import { EmployeesService } from '../../Services/employees-service';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-employees',
  standalone: false,
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css'
})
export class EmployeesComponent implements OnInit {

  constructor(
    private service: EmployeesService, 
    private router: Router, 
    private authService: AuthService,
    private notification: NzNotificationService
  ) {}

  // Datos
  DataSourceEmployees: any[] = [];
  activeView: 'list' | 'form' = 'list';
  isEditMode: boolean = false;
  EmployeeStatus: 'active' | 'inactive' = 'active';

  // Req 1: Bloqueo botón
  isSubmitting: boolean = false;

  // Formulario
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

  // Eliminación/Restauración
  IdDelete: number = 0;
  EmployeeToDeleteName: string = '';
  IdRestore: number = 0;
  EmployeeToRestoreName: string = '';

  // Errores
  errorMessage: string = '';
  modalError: string = '';
  formErrors: any = {};

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
    this.clearModalError();
    this.clearFormErrors();
    this.GetEmployees();
  }

  showCreateForm(): void {
    this.activeView = 'form';
    this.isEditMode = false;
    this.clearForm();
    this.clearError();
    this.clearModalError();
    this.clearFormErrors();
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
    this.clearModalError();
    this.clearFormErrors();
  }

  validateEmployeeForm(): boolean {
    this.clearFormErrors();
    let isValid = true;
    if (!this.currentName || this.currentName.trim() === '') {
      this.formErrors.name = 'El nombre es requerido';
      isValid = false;
    }
    if (!this.currentUsername || this.currentUsername.trim() === '') {
      this.formErrors.username = 'El usuario es requerido';
      isValid = false;
    }
    if (!this.currentEmail || this.currentEmail.trim() === '') {
      this.formErrors.email = 'El email es requerido';
      isValid = false;
    } else if (!this.isValidEmail(this.currentEmail)) {
      this.formErrors.email = 'Formato de email inválido';
      isValid = false;
    }
    if (!this.isEditMode) {
      if (!this.currentPassword || this.currentPassword.trim() === '') {
        this.formErrors.password = 'La contraseña es requerida';
        isValid = false;
      }
    }
    return isValid;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  GetEmployees(): void {
    this.service.GetEmployees(this.EmployeeStatus).subscribe({
      next: (data: any) => {
        this.DataSourceEmployees = data.data;
        this.clearError();
      },
      error: (error) => {
        if (error.status === 401) { this.authService.logout(); return; }
        this.handleError(error);
      }
    });
  }

  CreateEmployee(): void {
    if (this.isSubmitting) return;
    if (!this.validateEmployeeForm()) return;
    
    this.isSubmitting = true;
    const employee = {
      name: this.Name.trim(),
      username: this.Username.trim(),
      email: this.Email.trim(),
      password: this.Password
    };
    
    this.service.PostEmployee(employee).subscribe({
      next: () => {
        this.notification.success('¡Éxito!', 'Empleado creado correctamente');
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

  EditEmployee(): void {
    if (this.isSubmitting) return;
    if (!this.validateEmployeeForm()) return;
    
    this.isSubmitting = true;
    const employee: any = {
      name: this.NameEdit.trim(),
      username: this.UsernameEdit.trim(),
      email: this.EmailEdit.trim()
    };
    if (this.PasswordEdit && this.PasswordEdit.trim() !== '') {
      employee.password = this.PasswordEdit;
    }
    
    this.service.PutEmployee(this.IdEdit.toString(), employee).subscribe({
      next: () => {
        this.notification.success('¡Éxito!', 'Empleado actualizado correctamente');
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

  DatosDelete(employee: any): void {
    this.IdDelete = employee.id;
    this.EmployeeToDeleteName = employee.name;
    this.clearError();
    this.clearModalError();
  }

  DeleteEmployee(): void {
    this.service.DeleteEmployee(this.IdDelete.toString()).subscribe({
      next: () => {
        this.notification.success('Operación completada', 'Empleado eliminado correctamente');
        this.GetEmployees();
        this.closeModal('deleteEmployeeModal');
      },
      error: (error) => {
        if (error.status === 401) { this.authService.logout(); return; }
        this.handleModalError(error);
      }
    });
  }

  DatosRestoreEmployee(employee: any): void {
    this.IdRestore = employee.id;
    this.EmployeeToRestoreName = employee.name;
    this.clearError();
    this.clearModalError();
  }

  RestoreEmployeeConfirm(): void {
    this.service.RestoreEmployee(this.IdRestore.toString()).subscribe({
      next: () => {
        this.notification.success('Operación completada', 'Empleado restaurado correctamente');
        this.GetEmployees();
        this.closeModal('restoreEmployeeModal');
      },
      error: (error) => {
        if (error.status === 401) { this.authService.logout(); return; }
        this.handleModalError(error);
      }
    });
  }

  // @ts-ignore
  onEmployeeStatusChange(newStatus: 'active' | 'inactive'): void {
    this.EmployeeStatus = newStatus;
    this.GetEmployees();
  }

  private closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      const modalInstance = (window as any).bootstrap.Modal.getInstance(modal);
      if (modalInstance) modalInstance.hide();
    }
  }

  // Getters/Setters helpers
  get currentName(): string { return this.isEditMode ? this.NameEdit : this.Name; }
  set currentName(value: string) { if (this.isEditMode) this.NameEdit = value; else this.Name = value; }
  get currentUsername(): string { return this.isEditMode ? this.UsernameEdit : this.Username; }
  set currentUsername(value: string) { if (this.isEditMode) this.UsernameEdit = value; else this.Username = value; }
  get currentEmail(): string { return this.isEditMode ? this.EmailEdit : this.Email; }
  set currentEmail(value: string) { if (this.isEditMode) this.EmailEdit = value; else this.Email = value; }
  get currentPassword(): string { return this.isEditMode ? this.PasswordEdit : this.Password; }
  set currentPassword(value: string) { if (this.isEditMode) this.PasswordEdit = value; else this.Password = value; }

  // --- MANEJO DE ERRORES GENÉRICO ---
  private getGenericErrorMessage(status: number): string {
    switch (status) {
      case 0: return 'Error de conexión. Verifique su internet.';
      case 400: return 'Datos incorrectos. Verifique los campos.';
      case 401: return 'Sesión expirada. Inicie sesión nuevamente.';
      case 403: return 'No tiene permisos para esta acción.';
      case 404: return 'Empleado no encontrado.';
      case 409: return 'Ya existe un empleado con ese usuario o email.';
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
    // No notificamos
  }

  clearError(): void { this.errorMessage = ''; }
  clearModalError(): void { this.modalError = ''; }
  clearFormErrors(): void { this.formErrors = {}; }
  hasFormErrors(): boolean { return Object.keys(this.formErrors).length > 0; }
  clearForm(): void {
    this.Name = ''; this.Username = ''; this.Email = ''; this.Password = '';
    this.NameEdit = ''; this.UsernameEdit = ''; this.EmailEdit = ''; this.PasswordEdit = '';
    this.clearModalError(); this.clearFormErrors();
  }
}