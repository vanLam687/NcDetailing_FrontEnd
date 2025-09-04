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
  constructor( private service: UsersService, private auth: AuthService, private router: Router) {}

  username: any;
  password: any;
  message: any;
  err: any;

 ngOnInit(): void {
    this.auth.clearToken();
  }

  Login(): void {
    const obj = {
      username: this.username,
      password: this.password
    };

    this.service.Login(obj).subscribe(
      (x: any) => {
        if (x?.login === true && x.token) {
          this.auth.setToken(x.token);

          this.router.navigate(['/home/']);
        } else {
          this.message = x?.mensaje || 'Invalid credentials';
        }
      },
      (err) => {
        this.message = err?.error?.mensaje || 'Login error';
      }
    );
  }
}