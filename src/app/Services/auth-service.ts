import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'token';

  constructor(private router: Router) {}

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  // Método para obtener información del usuario desde el token
  getCurrentUser(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        name: payload.name,
        username: payload.username,
        role_id: payload.role_id,
        email: payload.email
      };
    } catch {
      return null;
    }
  }

  // Método para verificar si es admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role_id === 1;
  }

  // Método para verificar si es empleado
  isEmployee(): boolean {
    const user = this.getCurrentUser();
    return user?.role_id === 2;
  }

  // Método para obtener el rol actual
  getCurrentRole(): number | null {
    const user = this.getCurrentUser();
    return user?.role_id || null;
  }

  // Método para verificar permisos específicos
  hasPermission(requiredRoles: number[]): boolean {
    const userRole = this.getCurrentRole();
    return userRole ? requiredRoles.includes(userRole) : false;
  }
}