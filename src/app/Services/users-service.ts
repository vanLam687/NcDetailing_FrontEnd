import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  url = 'http://localhost:3000/api/users/';

  constructor(private httpClient: HttpClient) {}

  Login(user: any) {
    return this.httpClient.post(this.url + 'login', user)
  }

}

