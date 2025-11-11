import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  
  isCollapsed = false;

  constructor(private router: Router, public authService: AuthService) {}

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user?.name || user?.username || 'Usuario';
  }

  getUserInitial(): string {
    const userName = this.getUserName();
    return userName.charAt(0).toUpperCase();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}