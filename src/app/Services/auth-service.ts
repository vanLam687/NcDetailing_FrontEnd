import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  tokenKey = 'token';
  userKey = 'user';

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    const user = this.decodeToken(token);
    if (user) {
      this.setCurrentUser(user);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  setCurrentUser(user: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      return JSON.parse(userStr);
    }
    
    const token = this.getToken();
    if (token) {
      const user = this.decodeToken(token);
      if (user) {
        this.setCurrentUser(user);
        return user;
      }
    }
    
    return null;
  }

  clearCurrentUser(): void {
    localStorage.removeItem(this.userKey);
  }

  logout(): void {
    this.clearToken();
    this.clearCurrentUser();
  }

  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      const decodedToken = JSON.parse(decodedPayload);
      
      return {
        id: decodedToken.id,
        name: decodedToken.name,
        username: decodedToken.username,
        role_id: decodedToken.role_id
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role_id === 1;
  }
}