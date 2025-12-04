import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { AuditService } from '../../Services/audit-service';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.css',
  standalone: false
})
export class AuditComponent implements OnInit {

  constructor(private service: AuditService, private router: Router, private authService: AuthService) {}

  DataSourceAudit: any[] = [];

  // Variables para filtros
  SearchUsername: string = '';
  SelectedActionType: string = '';
  SelectedEntityType: string = '';
  StartDate: string = '';
  EndDate: string = '';

  // Variables para lista de opciones
  actionTypes: string[] = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN_SUCCESS', 'LOGIN_FAIL'];
  entityTypes: string[] = ['product', 'client', 'sale_service', 'user', 'category'];

  // Variables para el modal de cambios
  selectedChanges: any = null;
  changesJson: string = '';
  showChangesModal: boolean = false;
  copySuccess: boolean = false;

  // Variables para el modal de errores
  selectedError: string = '';
  showErrorModal: boolean = false;

  errorMessage: string = '';
  isLoading: boolean = false;

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.GetAuditLogs();
    } else {
      this.router.navigate(['/login']);
    }
  }

  GetAuditLogs(): void {
    const filters: any = {};
    
    if (this.SearchUsername) filters.username = this.SearchUsername;
    if (this.SelectedActionType) filters.actionType = this.SelectedActionType;
    if (this.SelectedEntityType) filters.entityType = this.SelectedEntityType;
    if (this.StartDate) filters.startDate = this.StartDate;
    if (this.EndDate) filters.endDate = this.EndDate;

    this.isLoading = true;
    this.service.getAuditLogs(filters).subscribe({
      next: (data: any) => {
        this.DataSourceAudit = data.data;
        this.clearError();
        this.isLoading = false;
      },
      error: (error) => {
        if (error.status === 401) {
          this.authService.logout();
          return;
        }
        this.isLoading = false;
        this.handleError(error);
      }
    });
  }

  ApplyFilters(): void {
    this.GetAuditLogs();
  }

  ClearFilters(): void {
    this.SearchUsername = '';
    this.SelectedActionType = '';
    this.SelectedEntityType = '';
    this.StartDate = '';
    this.EndDate = '';
    this.GetAuditLogs();
  }

  // Método para abrir el modal con los cambios
  viewChanges(changes: any): void {
    this.selectedChanges = changes;
    this.copySuccess = false;
    
    try {
      if (typeof changes === 'string') {
        changes = JSON.parse(changes);
      }
      this.changesJson = JSON.stringify(changes, null, 2);
    } catch (error) {
      this.changesJson = 'Error al formatear los cambios: ' + changes;
    }
    
    this.showChangesModal = true;
  }

  // Método para abrir el modal con el error
  viewError(errorMessage: string): void {
    this.selectedError = errorMessage;
    this.showErrorModal = true;
  }

  // Método para cerrar el modal de cambios
  closeChangesModal(): void {
    this.showChangesModal = false;
    this.selectedChanges = null;
    this.changesJson = '';
    this.copySuccess = false;
  }

  // Método para cerrar el modal de errores
  closeErrorModal(): void {
    this.showErrorModal = false;
    this.selectedError = '';
  }

  // Método para copiar JSON al portapapeles
  copyToClipboard(): void {
    navigator.clipboard.writeText(this.changesJson).then(() => {
      this.copySuccess = true;
      setTimeout(() => {
        this.copySuccess = false;
      }, 2000);
    }).catch(err => {
      console.error('Error al copiar: ', err);
    });
  }

  // Método para copiar error al portapapeles
  copyErrorToClipboard(): void {
    navigator.clipboard.writeText(this.selectedError).then(() => {
      this.copySuccess = true;
      setTimeout(() => {
        this.copySuccess = false;
      }, 2000);
    }).catch(err => {
      console.error('Error al copiar: ', err);
    });
  }

  hasChanges(changes: any): boolean {
    if (!changes) return false;
    
    try {
      if (typeof changes === 'string') {
        changes = JSON.parse(changes);
      }
      return Object.keys(changes).length > 0;
    } catch {
      return false;
    }
  }

  hasError(errorMessage: string): boolean {
    return !!errorMessage && errorMessage.trim().length > 0;
  }

  handleError(error: any): void {
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
    else if (error.status === 403) {
      this.errorMessage = 'No tiene permisos para acceder a los registros de auditoría.';
    }
    else if (error.status === 500) {
      this.errorMessage = 'Error interno del servidor.';
    }
    else {
      this.errorMessage = 'Ha ocurrido un error inesperado.';
    }
  }
  
  getActionTypeClass(actionType: string): string {
    switch (actionType) {
      case 'CREATE':
        return 'badge-success';
      case 'UPDATE':
        return 'badge-warning';
      case 'DELETE':
        return 'badge-danger';
      case 'LOGIN_SUCCESS':
        return 'badge-info';
      case 'LOGIN_FAIL':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getStatusClass(status: string): string {
    return status === 'SUCCESS' ? 'badge-success' : 'badge-danger';
  }

  clearError(): void {
    this.errorMessage = '';
  }
}