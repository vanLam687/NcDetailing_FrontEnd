import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './Components/login/login.component';
import { LockComponent } from './Components/lock/lock.component';
import { ContainerComponent } from './Components/container/container.component';
import { EmployeesComponent } from './Components/employees/employees.component';
import { ClientsComponent } from './Components/clients/clients.component';
import { ServicesComponent } from './Components/services/services.component';
import { ProductsComponent } from './Components/products/products.component';
import { SalesComponent } from './Components/sales/sales.component';
import { MetricsComponent } from './Components/metrics/metrics.component';

const routes: Routes = [
  { path: "", component: LoginComponent },
    { path: "login", component: LoginComponent},
    { path: "lock", component: LockComponent},
    { path: "home", component: ContainerComponent, children: [
      { path: "employees", component: EmployeesComponent },
      { path: "clients", component: ClientsComponent },
      { path: "services", component: ServicesComponent },
      { path: "products", component: ProductsComponent },
      { path: "sales", component: SalesComponent },
      { path: "metrics", component: MetricsComponent }

    ]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
