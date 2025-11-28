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

  // ------------------- TOAST MESSAGE (similar a sales) -------------------
  showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    const n = document.createElement('div');
    n.className = 'alert alert-dismissible fade show custom-toast';
    n.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;min-width:350px;padding:16px 20px;`;
    
    if (type === 'success') {
      n.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
      n.style.color = 'white';
      n.style.borderLeft = '4px solid #1e8449';
    } else if (type === 'error') {
      n.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
      n.style.color = 'white';
      n.style.borderLeft = '4px solid #a93226';
    } else {
      n.style.background = 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)';
      n.style.color = 'white';
      n.style.borderLeft = '4px solid #a84300';
    }
    
    n.innerHTML = `<div class="d-flex align-items-center"><span style="font-size:22px;margin-right:12px;">${type === 'success' ? '✔' : type === 'error' ? '✖' : '⚠'}</span><div><strong>${type === 'success' ? '¡Éxito!' : type === 'error' ? 'Error' : 'Advertencia'}</strong><div>${message}</div></div><button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button></div>`;
    document.body.appendChild(n);
    setTimeout(() => { if(n.parentNode) n.parentNode.removeChild(n); }, 4000);
  }

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
    // Validación de fechas (similar a sales component)
    if (this.startDate && !this.endDate) { 
      this.showToast('Seleccione fecha fin', 'warning'); 
      return; 
    }
    if (!this.startDate && this.endDate) { 
      this.showToast('Seleccione fecha inicio', 'warning'); 
      return; 
    }

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
    // Validación de fechas (similar a sales component)
    if (this.startDate && !this.endDate) { 
      this.showToast('Seleccione fecha fin', 'warning'); 
      return; 
    }
    if (!this.startDate && this.endDate) { 
      this.showToast('Seleccione fecha inicio', 'warning'); 
      return; 
    }
    
    if (this.startDate && this.endDate) {
      this.selectedFilter = '';
      this.loadMetrics();
    } else {
      this.showToast('Por favor, seleccione una fecha de inicio y fin.', 'warning');
    }
  }

  // ------------------- MANEJO DE ERRORES GENÉRICO (similar a sales) -------------------
  private getGenericErrorMessage(status: number): string {
    switch (status) {
      case 0: return 'Error de conexión.';
      case 400: return 'Datos de filtro incorrectos. Verifique las fechas.';
      case 401: return 'Sesión expirada.';
      case 403: return 'No tiene permisos.';
      case 404: return 'Datos no encontrados.';
      case 409: return 'Conflicto en la operación.';
      case 500: return 'Error interno del servidor.';
      default: return 'Ocurrió un error inesperado.';
    }
  }

  handleError(e: any): void { 
    this.errorMessage = this.getGenericErrorMessage(e.status); 
    this.showToast(this.errorMessage, 'error');
  }

  clearError(): void { 
    this.errorMessage = ''; 
  }
}