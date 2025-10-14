"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { LineChart, BarChart, PieChart, Download, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type ReportType = "daily" | "weekly" | "monthly";
type ChartType = "line" | "bar" | "pie";

export function ReportsPanel() {
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleGenerateReport = () => {
    setIsLoading(true);
    
    // Simulamos la carga del reporte
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleDownload = (format: "pdf" | "csv" | "excel") => {
    alert(`Descargando reporte en formato ${format.toUpperCase()}`);
  };

  // Generar datos para gráfico de líneas
  const getLineChartData = () => {
    const labels = reportType === "daily" 
      ? ['06:00', '12:00', '18:00', '00:00']
      : reportType === "weekly"
        ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
        : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

    return {
      labels,
      datasets: [
        {
          label: 'Reservas',
          data: reportType === "daily" 
            ? [12, 19, 25, 15]
            : reportType === "weekly"
              ? [65, 59, 80, 81, 56, 55, 40]
              : [28, 35, 42, 38, 45, 52],
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
        },
      ],
    };
  };

  // Generar datos para gráfico de barras
  const getBarChartData = () => {
    const labels = reportType === "daily" 
      ? ['Mañana', 'Tarde', 'Noche']
      : reportType === "weekly"
        ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
        : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

    return {
      labels,
      datasets: [
        {
          label: 'Reservas Confirmadas',
          data: reportType === "daily" 
            ? [8, 15, 12]
            : reportType === "weekly"
              ? [45, 52, 60, 58, 48, 42, 35]
              : [20, 25, 30, 28, 32, 38],
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
        },
        {
          label: 'No Show',
          data: reportType === "daily" 
            ? [2, 3, 1]
            : reportType === "weekly"
              ? [5, 7, 8, 6, 4, 3, 5]
              : [3, 4, 5, 4, 6, 7],
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
        },
      ],
    };
  };

  // Generar datos para gráfico circular
  const getPieChartData = () => {
    return {
      labels: ['Confirmadas', 'Pendientes', 'Canceladas', 'No Show'],
      datasets: [
        {
          data: [65, 20, 10, 5],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(156, 163, 175, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(156, 163, 175, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  // Opciones para gráficos de líneas y barras
  const getChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Reservas - ${getReportPeriod()}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  });

  // Opciones específicas para gráfico circular
  const getPieChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Estado de Reservas',
      },
    },
  });

  // Funciones auxiliares para títulos
  const getReportTitle = () => {
    switch (reportType) {
      case "daily": return "Diario";
      case "weekly": return "Semanal";
      case "monthly": return "Mensual";
      default: return "Diario";
    }
  };

  const getReportDescription = () => {
    switch (reportType) {
      case "daily": return "Datos del día actual";
      case "weekly": return "Datos de la última semana";
      case "monthly": return "Datos del último mes";
      default: return "Datos del día actual";
    }
  };

  const getReportPeriod = () => {
    switch (reportType) {
      case "daily": return "Hoy";
      case "weekly": return "Esta Semana";
      case "monthly": return "Este Mes";
      default: return "Hoy";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Informes de Reservas</CardTitle>
        <CardDescription>
          Genera y visualiza estadísticas de las reservas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Tipo de Informe</Label>
            <Select
              value={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
            >
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Seleccione tipo de informe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="chart-type">Tipo de Gráfico</Label>
            <Tabs 
              value={chartType} 
              onValueChange={(value) => setChartType(value as ChartType)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="line" className="flex items-center">
                  <LineChart className="h-4 w-4 mr-2" />
                  Línea
                </TabsTrigger>
                <TabsTrigger value="bar" className="flex items-center">
                  <BarChart className="h-4 w-4 mr-2" />
                  Barra
                </TabsTrigger>
                <TabsTrigger value="pie" className="flex items-center">
                  <PieChart className="h-4 w-4 mr-2" />
                  Circular
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="mt-6 border rounded-lg overflow-hidden">
          <div className="h-72 p-4 bg-muted/20">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">Cargando datos...</p>
              </div>
            ) : (
              <div className="h-full">
                {chartType === "line" && (
                  <Line 
                    data={getLineChartData()} 
                    options={getChartOptions()} 
                  />
                )}
                {chartType === "bar" && (
                  <Bar 
                    data={getBarChartData()} 
                    options={getChartOptions()} 
                  />
                )}
                {chartType === "pie" && (
                  <Pie 
                    data={getPieChartData()} 
                    options={getPieChartOptions()} 
                  />
                )}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-muted/20 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">
                  Informe {getReportTitle()}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {getReportDescription()}
                </p>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleDownload("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload("csv")}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload("excel")}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
        <Button onClick={handleGenerateReport} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            "Generar Informe"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
