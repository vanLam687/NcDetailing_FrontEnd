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

  // 👁 Mostrar / ocultar contraseña
  showPassword: boolean = false;
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  ngOnInit(): void {
    this.auth.logout();
  }

  Login(): void {
    if (!this.validateLoginForm()) return;

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
          this.errorMessage = 'Credenciales inválidas.';
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

    if (!this.username || this.username.trim() === '') {
      this.formErrors.username = 'El usuario es requerido';
      isValid = false;
    } else if (this.username.length < 3) {
      this.formErrors.username = 'El usuario debe tener al menos 3 caracteres';
      isValid = false;
    }

    if (!this.password || this.password.trim() === '') {
      this.formErrors.password = 'La contraseña es requerida';
      isValid = false;
    }

    return isValid;
  }

  handleError(error: any): void {
    this.clearFormErrors();

    if (error.status === 0) 
      this.errorMessage = 'Error de conexión. Verifique su internet.';
    else if ([400, 401, 404].includes(error.status)) 
      this.errorMessage = 'Credenciales inválidas.';
    else if (error.status === 500) 
      this.errorMessage = 'Error interno del servidor. Intente más tarde.';
    else if (error.status === 503) 
      this.errorMessage = 'Servicio no disponible temporalmente.';
    else 
      this.errorMessage = 'Ocurrió un error inesperado. Intente nuevamente.';
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
        <span style="font-size: 22px; font-weight: bold; color: white; margin-right: 12px; line-height: 1;">✔</span>
        <div class="flex-grow-1">
          <strong class="me-auto" style="font-size: 16px; display: block; margin-bottom: 4px;">¡Éxito!</strong>
          <div style="font-size: 14px; opacity: 0.95;">${message}</div>
        </div>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" style="filter: brightness(0) invert(1); opacity: 0.8; margin-left: 16px;"></button>
      </div>
    `;

    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideInRight { 
          from { transform: translateX(100%); opacity: 0; } 
          to { transform: translateX(0); opacity: 1; } 
        }
        .custom-toast { backdrop-filter: blur(10px); border-left: 4px solid #1e8449 !important; }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => { 
          if (notification.parentNode) notification.parentNode.removeChild(notification); 
        }, 300);
      }
    }, 4000);
  }
}