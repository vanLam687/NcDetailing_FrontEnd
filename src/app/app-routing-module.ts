import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './Components/login/login.component';
import { RegisterComponent } from './Components/register/register.component';
import { LockComponent } from './Components/lock/lock.component';
import { ContainerComponent } from './Components/container/container.component';

const routes: Routes = [
  { path: "", component: LoginComponent },
    { path: "login", component: LoginComponent},
    { path: "register", component: RegisterComponent },
    { path: "lock", component: LockComponent},
    { path: "home", component: ContainerComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
