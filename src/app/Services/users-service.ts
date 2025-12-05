import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  url = environment.apiUrl + '/users/';

  constructor(private httpClient: HttpClient) {}

  Login(user: any) {
    return this.httpClient.post(this.url + 'login', user)
  }

}