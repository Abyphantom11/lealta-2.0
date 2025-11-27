'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  UserX,
  BarChart3
} from 'lucide-react'

interface ComplianceStats {
  totalMessages: number
  dailyLimit: number
  monthlyLimit: number
  dailyUsed: number
  monthlyUsed: number
  tier: string
  optOuts: number
  responseRate: number
  deliveryRate: number
}

interface Template {
  id: string
  name: string
  category: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  content: any
  submittedAt: string
}

export default function WhatsAppCompliance() {
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'optouts' | 'limits'>('overview')
  const [stats, setStats] = useState<ComplianceStats | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadComplianceData()
  }, [])

  const loadComplianceData = async () => {
    try {
      const [statsRes, templatesRes] = await Promise.all([
        fetch('/api/whatsapp/rate-limit'),
        fetch('/api/whatsapp/templates')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats({
          totalMessages: 0,
          dailyLimit: statsData.dailyLimit,
          monthlyLimit: statsData.monthlyLimit,
          dailyUsed: statsData.dailyUsed,
          monthlyUsed: statsData.monthlyUsed,
          tier: statsData.tier,
          optOuts: 0,
          responseRate: 0,
          deliveryRate: 0
        })
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setTemplates(templatesData.dbTemplates || [])
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'templates', label: 'Templates', icon: MessageSquare },
    { id: 'optouts', label: 'Opt-outs', icon: UserX },
    { id: 'limits', label: 'Límites', icon: Shield }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-8 w-8" />
          <h1 className="text-2xl font-bold">WhatsApp Business Compliance</h1>
        </div>
        <p className="text-green-100">
          Sistema profesional de mensajería que cumple con las regulaciones de WhatsApp Business API
        </p>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'templates' && <TemplatesTab templates={templates} />}
          {activeTab === 'optouts' && <OptOutsTab />}
          {activeTab === 'limits' && <LimitsTab stats={stats} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Overview Tab
function OverviewTab({ stats }: { stats: ComplianceStats | null }) {
  if (!stats) return <div>No hay datos disponibles</div>

  const metrics = [
    {
      title: 'Uso Diario',
      value: `${stats.dailyUsed} / ${stats.dailyLimit}`,
      percentage: (stats.dailyUsed / stats.dailyLimit) * 100,
      icon: TrendingUp,
      color: 'blue'
    },
    {
      title: 'Uso Mensual', 
      value: `${stats.monthlyUsed} / ${stats.monthlyLimit}`,
      percentage: (stats.monthlyUsed / stats.monthlyLimit) * 100,
      icon: BarChart3,
      color: 'green'
    },
    {
      title: 'Tier Actual',
      value: stats.tier.replace('TIER_', 'Nivel '),
      percentage: 100,
      icon: Shield,
      color: 'purple'
    },
    {
      title: 'Tasa de Entrega',
      value: `${stats.deliveryRate}%`,
      percentage: stats.deliveryRate,
      icon: CheckCircle,
      color: 'emerald'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className={`h-8 w-8 text-${metric.color}-600`} />
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                  <div className="text-sm text-gray-500">{metric.title}</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-${metric.color}-600`}
                  style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            Estado de Compliance
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Rate Limiting Activo</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between">
              <span>Opt-out Management</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between">
              <span>Webhook Processing</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            Alertas del Sistema
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• Mantenga sus templates actualizados</p>
            <p>• Monitoree la tasa de opt-outs</p>
            <p>• Revise regularmente los límites de envío</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Templates Tab
function TemplatesTab({ templates }: { templates: Template[] }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-700 bg-green-100'
      case 'REJECTED':
        return 'text-red-700 bg-red-100'
      default:
        return 'text-yellow-700 bg-yellow-100'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Templates de WhatsApp</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Crear Template
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{template.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {template.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(template.status)}
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(template.status)}`}>
                        {template.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(template.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {templates.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay templates</h3>
            <p className="mt-1 text-sm text-gray-500">Crea tu primer template de WhatsApp Business.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Opt-outs Tab
function OptOutsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gestión de Opt-outs</h2>
        <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
          Agregar Opt-out Manual
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <UserX className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Sistema de Opt-out Activo</h3>
          <p className="mt-1 text-sm text-gray-500">
            Los usuarios pueden escribir &quot;STOP&quot; para darse de baja automáticamente.
          </p>
        </div>
      </div>
    </div>
  )
}

// Limits Tab 
function LimitsTab({ stats }: { stats: ComplianceStats | null }) {
  if (!stats) return <div>No hay datos disponibles</div>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Límites de Envío</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Límites Actuales</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Uso Diario</span>
                <span>{stats.dailyUsed} / {stats.dailyLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${(stats.dailyUsed / stats.dailyLimit) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Uso Mensual</span>
                <span>{stats.monthlyUsed} / {stats.monthlyLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="h-2 rounded-full bg-green-600"
                  style={{ width: `${(stats.monthlyUsed / stats.monthlyLimit) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Tier Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Tier Actual</span>
              <span className="font-semibold">{stats.tier}</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>• Tier 1: Hasta 1,000 mensajes/mes</p>
              <p>• Tier 2: Hasta 10,000 mensajes/mes</p>
              <p>• Tier 3: Hasta 100,000+ mensajes/mes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
