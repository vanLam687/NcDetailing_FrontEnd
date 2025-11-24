import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

// NG-ZORRO Modules - CORREGIDO
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
import { NzEmptyModule } from 'ng-zorro-antd/empty'; // Cambiado a módulo
import { NzSelectModule } from 'ng-zorro-antd/select'; // Cambiado a módulo
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzListModule } from 'ng-zorro-antd/list'; // Cambiado a módulo
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzNotificationService } from 'ng-zorro-antd/notification';
//iconos de NG-Zorro
import { NZ_I18N, es_ES } from 'ng-zorro-antd/i18n';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import * as AllIcons from '@ant-design/icons-angular/icons';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';

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
registerLocaleData(es);

// Importar TODOS los iconos de Ant Design
const antDesignIcons = AllIcons as {
  [key: string]: IconDefinition;
};

const icons: IconDefinition[] = Object.keys(antDesignIcons).map(key => {
  const icon = antDesignIcons[key];
  if (icon && typeof icon.name === 'string') {
    return icon;
  }
  return null;
}).filter(icon => icon !== null) as IconDefinition[];

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
    FormsModule, // ✅ FormsModule está correctamente importado
    ReactiveFormsModule,
    AppRoutingModule,
    
    // NG-ZORRO Modules - CORREGIDO
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
    NzEmptyModule, // ✅ Cambiado a módulo
    NzSelectModule, // ✅ Cambiado a módulo (importante para ngValue)
    NzInputNumberModule,
    NzListModule, // ✅ Cambiado a módulo    
    NgApexchartsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    NzAlertModule,
  ],
  providers: [
    { provide: NZ_I18N, useValue: es_ES },
    { provide: NZ_ICONS, useValue: icons }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }