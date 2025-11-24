import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService } from '../../Services/users-service';
import { AuthService } from '../../Services/auth-service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  
  constructor(
    private service: UsersService, 
    private auth: AuthService, 
    private router: Router
  ) {}
  
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  formErrors: any = {};
  isLoading: boolean = false;

  ngOnInit(): void {
    this.auth.logout();
  }

  Login(): void {
    if (!this.validateLoginForm()) {
      return;
    }

    this.isLoading = true;
    this.clearError();
    this.clearFormErrors();

    const obj = {
      username: this.username,
      password: this.password
    };

    this.service.Login(obj).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.login === true && res.token) {
          this.auth.setToken(res.token);
          this.clearError();
          this.clearFormErrors();
          this.showSuccessNotification('¡Bienvenido!');
          this.router.navigate(['/home/']);
        } else {
          this.errorMessage = 'Credenciales incorrectas. Por favor, verifique sus datos.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.handleError(error);
      }
    });
  }

  validateLoginForm(): boolean {
    this.clearFormErrors();
    let isValid = true;

    // Validar usuario
    if (!this.username || this.username.trim() === '') {
      this.formErrors.username = 'El usuario es requerido';
      isValid = false;
    } else if (this.username.length < 3) {
      this.formErrors.username = 'El usuario debe tener al menos 3 caracteres';
      isValid = false;
    }

    // Validar contraseña
    if (!this.password || this.password.trim() === '') {
      this.formErrors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (this.password.length < 4) {
      this.formErrors.password = 'La contraseña debe tener al menos 4 caracteres';
      isValid = false;
    }

    return isValid;
  }

  handleError(error: any): void {
    this.clearFormErrors();
    
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
    else if (error.status === 401) {
      this.errorMessage = 'Credenciales incorrectas. Por favor, verifique su usuario y contraseña.';
    }
    else if (error.status === 403) {
      this.errorMessage = 'Acceso denegado. No tiene permisos para acceder al sistema.';
    }
    else if (error.status === 404) {
      this.errorMessage = 'Servicio no encontrado.';
    }
    else if (error.status === 409) {
      this.errorMessage = 'Conflicto en el servidor.';
    }
    else if (error.status === 500) {
      this.errorMessage = 'Error interno del servidor. Por favor, intente más tarde.';
    }
    else if (error.status === 503) {
      this.errorMessage = 'Servicio no disponible. Por favor, intente más tarde.';
    }
    else if (error.statusText) {
      this.errorMessage = `Error ${error.status}: ${error.statusText}`;
    }
    else {
      this.errorMessage = 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.';
    }
  }

  clearError(): void {
    this.errorMessage = '';
  }

  clearFormErrors(): void {
    this.formErrors = {};
  }

  hasFormErrors(): boolean {
    return Object.keys(this.formErrors).length > 0;
  }

  private showSuccessNotification(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'alert alert-success alert-dismissible fade show custom-toast';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 350px;
      max-width: 450px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
      color: white;
      padding: 16px 20px;
      animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div class="d-flex align-items-center">
        <span style="
          font-size: 22px;
          font-weight: bold;
          color: white;
          margin-right: 12px;
          line-height: 1;
        ">
          ✔
        </span>
        <div class="flex-grow-1">
          <strong class="me-auto" 
            style="font-size: 16px; display: block; margin-bottom: 4px;">
            ¡Éxito!
          </strong>
          <div style="font-size: 14px; opacity: 0.95;">${message}</div>
        </div>
        <button type="button" class="btn-close btn-close-white" 
          data-bs-dismiss="alert"
          style="filter: brightness(0) invert(1); opacity: 0.8; margin-left: 16px;">
        </button>
      </div>
    `;

    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .custom-toast {
          backdrop-filter: blur(10px);
          border-left: 4px solid #1e8449 !important;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 4000);
  }
}