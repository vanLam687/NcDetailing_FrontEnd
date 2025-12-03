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
          // Se eliminó la notificación de éxito, redirige directo
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
}