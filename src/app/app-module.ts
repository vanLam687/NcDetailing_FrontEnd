import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';

// Angular Material
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

// NG-ZORRO Modules
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzAlertModule } from 'ng-zorro-antd/alert';

// NZ-Zorro locales
import { NZ_I18N, es_ES } from 'ng-zorro-antd/i18n';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import * as AllIcons from '@ant-design/icons-angular/icons';

import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';
registerLocaleData(es);

// App
import { AppRoutingModule } from './app-routing-module';
import { AppComponent } from './app.component';
import { ContainerComponent } from './Components/container/container.component';
import { NavbarComponent } from './Components/navbar/navbar.component';
import { LockComponent } from './Components/lock/lock.component';
import { LoginComponent } from './Components/login/login.component';
import { EmployeesComponent } from './Components/employees/employees.component';
import { ClientsComponent } from './Components/clients/clients.component';
import { ServicesComponent } from './Components/services/services.component';
import { ProductsComponent } from './Components/products/products.component';
import { SalesComponent } from './Components/sales/sales.component';
import { MetricsComponent } from './Components/metrics/metrics.component';
import { DashboardComponent } from './Components/dashboard/dashboard.component';
import { AuditComponent } from './Components/audit/audit.component';

// Importar TODOS los íconos de Ant Design
const antDesignIcons = AllIcons as {
  [key: string]: IconDefinition;
};

const icons: IconDefinition[] = Object.keys(antDesignIcons)
  .map(key => antDesignIcons[key])
  .filter(icon => icon && typeof icon.name === 'string') as IconDefinition[];

@NgModule({
  declarations: [
    AppComponent,
    ContainerComponent,
    NavbarComponent,
    LockComponent,
    LoginComponent,
    EmployeesComponent,
    ClientsComponent,
    ServicesComponent,
    ProductsComponent,
    SalesComponent,
    MetricsComponent,
    DashboardComponent,
    AuditComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,

    // NG-ZORRO
    NzCardModule,
    NzFormModule,
    NzButtonModule,
    NzIconModule,
    NzAlertModule,
    NzToolTipModule,
    NzModalModule,
    NzDropDownModule,
    NzMenuModule,
    NzLayoutModule,
    NzBreadCrumbModule,
    NzDividerModule,
    NzTableModule,
    NzInputModule,
    NzTagModule,
    NzSpinModule,
    NzEmptyModule,
    NzSelectModule,
    NzInputNumberModule,
    NzListModule,

    // ApexCharts + Material
    NgApexchartsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule
  ],
  providers: [
    { provide: NZ_I18N, useValue: es_ES },
    { provide: NZ_ICONS, useValue: icons },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }