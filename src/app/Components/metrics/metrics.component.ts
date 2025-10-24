import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { MetricsService } from '../../Services/metrics-service';

@Component({
  selector: 'app-metrics',
  standalone: false,
  templateUrl: './metrics.component.html',
  styleUrl: './metrics.component.css'
})
export class MetricsComponent implements OnInit {

  // --- Estado de la UI ---
  isLoading: boolean = false;
  errorMessage: string = '';
  metricsData: any = null;

  // --- Filtros (ngModel) ---
  selectedFilter: string = 'monthly';
  startDate: string = ''; 
  endDate: string = '';  

  public breakdownChartOptions: any = {};
  public paymentChartOptions: any = {};
  public topProductsChartOptions: any = {};
  public topServicesChartOptions: any = {};

  constructor(
    private metricsService: MetricsService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadMetrics();
    } else {
      this.router.navigate(['/login']);
    }
  }

  // --- Carga de Datos ---
  loadMetrics(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.metricsData = null;

    let params: any = {};
    if (this.startDate && this.endDate) {
      params.startDate = this.startDate;
      params.endDate = this.endDate;
    } else {
      params.filter = this.selectedFilter;
    }

    this.metricsService.getDashboardMetrics(params).subscribe({
      next: (data: any) => {
        this.metricsData = data;
        this.prepareCharts();
        this.isLoading = false;
        this.clearError();
      },
      error: (error) => {
        this.handleError(error);
        this.isLoading = false;
      }
    });
  }

  // --- Preparación de Datos para Gráficos ---
  prepareCharts(): void {
    if (!this.metricsData) return;

    // 1. Gráfico de Desglose (Ingresos por Periodo)
    if (this.metricsData.breakdown?.length > 0) {
      this.breakdownChartOptions = {
        series: [
          { name: "Ingresos Servicios", data: this.metricsData.breakdown.map((item: any) => parseFloat(item.service_revenue)) },
          { name: "Ingresos Productos", data: this.metricsData.breakdown.map((item: any) => parseFloat(item.product_revenue)) }
        ],
        chart: { type: 'area', height: 350 },
        xaxis: {
          categories: this.metricsData.breakdown.map((item: any) => item.breakdown_key),
          type: this.metricsData.range.breakdown === 'daily' ? 'datetime' : 'category',
        },
        yaxis: { title: { text: 'Ingresos ($)' } },
        title: { text: 'Ingresos por Tipo y Periodo' },
        tooltip: { y: { formatter: (val: number) => `$${val.toFixed(2)}` } }
      };
    } else {
      this.breakdownChartOptions = { series: [], chart: { type: 'line' }, xaxis: { categories: [] } }; // Gráfico vacío
    }

    // 2. Gráfico de Métodos de Pago (Donut)
    if (this.metricsData.paymentMethods?.length > 0) {
      this.paymentChartOptions = {
        series: this.metricsData.paymentMethods.map((item: any) => parseFloat(item.total)),
        chart: { type: 'donut', height: 350 },
        labels: this.metricsData.paymentMethods.map((item: any) => item.method),
        title: { text: 'Ingresos por Método de Pago' },
        legend: { position: 'right' },
        tooltip: { y: { formatter: (val: number) => `$${val.toFixed(2)}` } }
      };
    } else {
      this.paymentChartOptions = { series: [], labels: [], chart: { type: 'donut' } }; // Gráfico vacío
    }

    // 3. Gráfico Top Productos (Barras Horizontales)
    if (this.metricsData.top?.products?.length > 0) {
      this.topProductsChartOptions = {
        series: [{ name: "Cantidad Vendida", data: this.metricsData.top.products.map((item: any) => item.quantity) }],
        chart: { type: 'bar', height: 300 },
        plotOptions: { bar: { horizontal: true } },
        xaxis: { categories: this.metricsData.top.products.map((item: any) => item.product) },
        title: { text: 'Top 5 Productos Vendidos' }
      };
    } else {
       this.topProductsChartOptions = { series: [], chart: { type: 'bar' }, xaxis: { categories: [] } }; // Gráfico vacío
    }

    // 4. Gráfico Top Servicios (Barras Horizontales)
    if (this.metricsData.top?.services?.length > 0) {
       this.topServicesChartOptions = {
        series: [{ name: "Cantidad Realizada", data: this.metricsData.top.services.map((item: any) => item.quantity) }],
        chart: { type: 'bar', height: 300 },
        plotOptions: { bar: { horizontal: true } },
        xaxis: { categories: this.metricsData.top.services.map((item: any) => item.service) },
        title: { text: 'Top 5 Servicios Realizados' }
      };
    } else {
       this.topServicesChartOptions = { series: [], chart: { type: 'bar' }, xaxis: { categories: [] } }; // Gráfico vacío
    }
  }

  // --- Manejadores de Eventos UI ---
  selectFilter(filter: string): void {
    this.selectedFilter = filter;
    this.startDate = '';
    this.endDate = '';
    this.loadMetrics();
  }

  applyCustomRange(): void {
    if (this.startDate && this.endDate) {
      this.selectedFilter = '';
      this.loadMetrics();
    } else {
      this.handleError({ message: "Por favor, seleccione una fecha de inicio y fin." });
    }
  }

  // --- Utilidades (Error Handling - Tu versión) ---
  handleError(error: any): void {
    if (error.status === 401 || error.status === 403) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else if (typeof error.error === 'string') {
        this.errorMessage = error.error;
    } else if (error.message) {
        this.errorMessage = error.message;
    } else if (error.status === 0) {
      this.errorMessage = 'Error de conexión. Verifique su internet.';
    } else {
      this.errorMessage = `Error inesperado (${error.status})`;
    }
    console.error("Metrics Error:", error);
  }

  clearError(): void {
    this.errorMessage = '';
  }
}