'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMetrics } from '@/lib/metrics-collector';
import { performanceOptimizer } from '@/lib/performance-optimizer';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Database, 
  Globe, 
  MemoryStick, 
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

interface MetricsData {
  business: {
    userEngagement: number;
    conversions: number;
    revenue: number;
  };
  technical: {
    avgApiResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
  userExperience: {
    avgPageLoadTime: number;
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
  };
  alerts: {
    active: number;
    resolved: number;
    critical: number;
  };
}

export default function MetricsPage() {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { getMetricsSummary } = useMetrics();

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      setMetricsData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceReport = () => {
    return performanceOptimizer.getPerformanceReport();
  };

  const getWebVitalStatus = (metric: string, value: number) => {
    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metricsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No se pudieron cargar las métricas</h2>
          <Button onClick={fetchMetrics}>Reintentar</Button>
        </div>
      </div>
    );
  }

  const performanceReport = getPerformanceReport();
  const localMetrics = getMetricsSummary();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Métricas</h1>
          <p className="text-gray-600 mt-1">
            Última actualización: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={fetchMetrics} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Alert Summary */}
      {metricsData.alerts.active > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Badge variant="destructive">
                {metricsData.alerts.critical} Críticas
              </Badge>
              <Badge variant="secondary">
                {metricsData.alerts.active - metricsData.alerts.critical} Advertencias
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="business">Negocio</TabsTrigger>
          <TabsTrigger value="technical">Técnico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricsData.business.userEngagement}</div>
                <p className="text-xs text-muted-foreground">+12% desde ayer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo de Respuesta</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricsData.technical.avgApiResponseTime}ms</div>
                <p className="text-xs text-muted-foreground">-5% desde ayer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metricsData.technical.cacheHitRate * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">+3% desde ayer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metricsData.technical.errorRate * 100).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">-0.1% desde ayer</p>
              </CardContent>
            </Card>
          </div>

          {/* Core Web Vitals */}
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>
                Métricas de experiencia de usuario según Google
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">
                    {metricsData.userExperience.fcp}ms
                  </div>
                  <div className="text-sm text-gray-600 mb-2">First Contentful Paint</div>
                  <Badge className={getStatusColor(getWebVitalStatus('fcp', metricsData.userExperience.fcp))}>
                    {getWebVitalStatus('fcp', metricsData.userExperience.fcp)}
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">
                    {metricsData.userExperience.lcp}ms
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Largest Contentful Paint</div>
                  <Badge className={getStatusColor(getWebVitalStatus('lcp', metricsData.userExperience.lcp))}>
                    {getWebVitalStatus('lcp', metricsData.userExperience.lcp)}
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">
                    {metricsData.userExperience.fid}ms
                  </div>
                  <div className="text-sm text-gray-600 mb-2">First Input Delay</div>
                  <Badge className={getStatusColor(getWebVitalStatus('fid', metricsData.userExperience.fid))}>
                    {getWebVitalStatus('fid', metricsData.userExperience.fid)}
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">
                    {metricsData.userExperience.cls.toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Cumulative Layout Shift</div>
                  <Badge className={getStatusColor(getWebVitalStatus('cls', metricsData.userExperience.cls))}>
                    {getWebVitalStatus('cls', metricsData.userExperience.cls)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Budget Status</CardTitle>
              <CardDescription>
                Estado actual vs presupuestos de performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Budget Violations</span>
                  <Badge variant={performanceReport.budgetViolations > 0 ? "destructive" : "default"}>
                    {performanceReport.budgetViolations}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Critical Violations</span>
                  <Badge variant={performanceReport.criticalViolations > 0 ? "destructive" : "default"}>
                    {performanceReport.criticalViolations}
                  </Badge>
                </div>

                {performanceReport.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Sugerencias de Optimización:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {performanceReport.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Local Metrics Summary</CardTitle>
              <CardDescription>
                Métricas recolectadas localmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{localMetrics.total}</div>
                  <div className="text-sm text-gray-600">Total Events</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">{localMetrics.avgValue.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Avg Value</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">{localMetrics.byType.business || 0}</div>
                  <div className="text-sm text-gray-600">Business</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">{localMetrics.byType.technical || 0}</div>
                  <div className="text-sm text-gray-600">Technical</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Conversiones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metricsData.business.conversions}</div>
                <p className="text-sm text-gray-600">Este mes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metricsData.business.userEngagement}</div>
                <p className="text-sm text-gray-600">Interacciones</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${metricsData.business.revenue}</div>
                <p className="text-sm text-gray-600">Este mes</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Avg Query Time</span>
                    <span className="font-mono">{metricsData.technical.avgApiResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Hit Rate</span>
                    <span className="font-mono">{(metricsData.technical.cacheHitRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MemoryStick className="h-5 w-5 mr-2" />
                  System Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Error Rate</span>
                    <span className="font-mono">{(metricsData.technical.errorRate * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime</span>
                    <span className="font-mono">99.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}