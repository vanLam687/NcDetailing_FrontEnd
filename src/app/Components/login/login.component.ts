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
  
  constructor(private service: UsersService, private auth: AuthService, private router: Router) {}
  
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  ngOnInit(): void {
    this.auth.logout();
  }

  Login(): void {
    const obj = {
      username: this.username,
      password: this.password
    };

    this.service.Login(obj).subscribe({
      next: (res: any) => {
        if (res.login === true && res.token) {
          this.auth.setToken(res.token);
          this.clearError();
          this.router.navigate(['/home/']);
        } else {
          this.errorMessage = res.mensaje || 'Usuario o contraseña incorrectos';
        }
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

handleError(error: any): void {
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