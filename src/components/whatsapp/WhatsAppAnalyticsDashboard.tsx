'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Users,
  DollarSign,
  Zap,
  Target,
  Lightbulb,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface AnalyticsData {
  period: string
  summary: {
    totalSent: number
    totalDelivered: number
    totalFailed: number
    totalReplied: number
    deliveryRate: number
    responseRate: number
    totalCost: number
    activeClients: number
    newClients: number
  }
  dailyData: any[]
}

interface Insight {
  id: string
  title: string
  description: string
  type: string
  priority: string
  metric?: string
  value?: string
  isRead: boolean
}

export default function WhatsAppAnalyticsDashboard() {
  const [period, setPeriod] = useState('7')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [analyticsRes, insightsRes] = await Promise.all([
        fetch(`/api/whatsapp/analytics?period=${period}`),
        fetch('/api/whatsapp/analytics/insights')
      ])

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalytics(data)
      }

      if (insightsRes.ok) {
        const data = await insightsRes.json()
        setInsights(data.insights || [])
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const { summary, dailyData } = analytics

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Análisis detallado de tu campaña WhatsApp</p>
          </div>

          <div className="flex gap-2">
            {['7', '30', '90'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {p} días
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Mensajes Enviados"
            value={summary.totalSent.toLocaleString()}
            icon={MessageSquare}
            trend={12}
            color="blue"
          />
          <KPICard
            title="Tasa de Entrega"
            value={`${summary.deliveryRate.toFixed(1)}%`}
            icon={CheckCircle}
            trend={5}
            color="green"
          />
          <KPICard
            title="Tasa de Respuesta"
            value={`${summary.responseRate.toFixed(1)}%`}
            icon={Zap}
            trend={8}
            color="purple"
          />
          <KPICard
            title="Costo Total"
            value={`$${parseFloat(summary.totalCost as any).toFixed(2)}`}
            icon={DollarSign}
            trend={-3}
            color="orange"
          />
        </div>

        {/* Client Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Clientes</h3>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Clientes Activos</span>
                  <span className="font-semibold text-gray-900">{summary.activeClients}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Nuevos Clientes</span>
                  <span className="font-semibold text-green-600">+{summary.newClients}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message Stats */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mensajes</h3>
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Entregados</span>
                <span className="font-semibold text-gray-900">{summary.totalDelivered}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fallidos</span>
                <span className="font-semibold text-red-600">{summary.totalFailed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Con Respuesta</span>
                <span className="font-semibold text-blue-600">{summary.totalReplied}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart: Mensajes por día */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Envíos Diarios</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalMessagesSent" stroke="#3b82f6" name="Enviados" />
                <Line type="monotone" dataKey="totalDelivered" stroke="#10b981" name="Entregados" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Tasas */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasas Diarias</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="deliveryRate" fill="#8b5cf6" name="Entrega %" />
                <Bar dataKey="responseRate" fill="#ec4899" name="Respuesta %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Insights Inteligentes</h3>
            <Lightbulb className="h-5 w-5 text-yellow-500" />
          </div>

          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 ${getInsightColors(insight.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      {insight.value && (
                        <p className="text-sm font-medium text-gray-900 mt-2">
                          Valor: {insight.value}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(insight.priority)}`}>
                      {insight.priority}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay insights disponibles</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className: string }>
  trend: number
  color: string
}

function KPICard({ title, value, icon: Icon, trend, color }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          {Math.abs(trend)}%
        </div>
      </div>
    </motion.div>
  )
}

function getInsightColors(type: string): string {
  switch (type) {
    case 'ALERT':
      return 'bg-red-50 border-red-400'
    case 'RECOMMENDATION':
      return 'bg-blue-50 border-blue-400'
    case 'TREND':
      return 'bg-green-50 border-green-400'
    case 'OPPORTUNITY':
      return 'bg-purple-50 border-purple-400'
    default:
      return 'bg-gray-50 border-gray-400'
  }
}

function getPriorityBadge(priority: string): string {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800'
    case 'HIGH':
      return 'bg-orange-100 text-orange-800'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
