import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { MetricsService } from '../../Services/metrics-service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-metrics',
  standalone: false,
  templateUrl: './metrics.component.html',
  styleUrl: './metrics.component.css'
})
export class MetricsComponent implements OnInit {

  isLoading: boolean = false;
  errorMessage: string = '';
  metricsData: any = null;
  isExporting: boolean = false;

  selectedFilter: string = 'monthly';
  startDate: string = '';
  endDate: string = '';

  public breakdownChartOptions: any = {};
  public paymentChartOptions: any = {};
  public topProductsChartOptions: any = {};
  public topServicesChartOptions: any = {};

  @ViewChild('dashboardContent') dashboardContent!: ElementRef;

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

  today: Date = new Date();

  // ------------------- EXPORTAR A PDF (CORREGIDO) -------------------
  exportToPDF(): void {
    if (this.isExporting) return; // evita doble click

    this.isExporting = true; // 🔥 ya NO ocultamos el botón

    const element = this.dashboardContent.nativeElement;
    const filename = `dashboard-metricas-${new Date().toISOString().split('T')[0]}.pdf`;

    html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    })
      .then((canvas) => {

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const xPosition = (210 - imgWidth) / 2;

        pdf.addImage(imgData, 'PNG', xPosition, 10, imgWidth, imgHeight);

        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 105, 285, {
          align: 'center',
        });

        pdf.save(filename);

        this.isExporting = false; // 🔥 habilita nuevamente
      })
      .catch((error) => {
        console.error('Error al exportar PDF:', error);

        this.isExporting = false;
        this.handleError({ message: 'Error al generar el PDF' });
      });
  }

  // ------------------- CARGA DE DATOS -------------------
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
        if (error.status === 401) {
          this.authService.logout();
          return;
        }
        this.handleError(error);
        this.isLoading = false;
      }
    });
  }

  // ------------------- PREPARACIÓN DE GRÁFICOS -------------------
  prepareCharts(): void {
    if (!this.metricsData) return;

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
      this.breakdownChartOptions = { series: [], chart: { type: 'line' }, xaxis: { categories: [] } };
    }

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
      this.paymentChartOptions = { series: [], labels: [], chart: { type: 'donut' } };
    }

    if (this.metricsData.top?.products?.length > 0) {
      this.topProductsChartOptions = {
        series: [{ name: "Cantidad Vendida", data: this.metricsData.top.products.map((item: any) => item.quantity) }],
        chart: { type: 'bar', height: 300 },
        plotOptions: { bar: { horizontal: true } },
        xaxis: { categories: this.metricsData.top.products.map((item: any) => item.product) },
        title: { text: 'Top 5 Productos Vendidos' }
      };
    } else {
      this.topProductsChartOptions = { series: [], chart: { type: 'bar' }, xaxis: { categories: [] } };
    }

    if (this.metricsData.top?.services?.length > 0) {
      this.topServicesChartOptions = {
        series: [{ name: "Cantidad Realizada", data: this.metricsData.top.services.map((item: any) => item.quantity) }],
        chart: { type: 'bar', height: 300 },
        plotOptions: { bar: { horizontal: true } },
        xaxis: { categories: this.metricsData.top.services.map((item: any) => item.service) },
        title: { text: 'Top 5 Servicios Realizados' }
      };
    } else {
      this.topServicesChartOptions = { series: [], chart: { type: 'bar' }, xaxis: { categories: [] } };
    }
  }

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

  handleError(error: any): void {
    if (error.status === 401) {
      this.authService.logout();
      return;
    }

    if (error.status === 403) {
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
