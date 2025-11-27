'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  Plus,
  Settings,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Smartphone,
  Zap,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

interface WhatsAppAccount {
  id: string
  name: string
  phoneNumber: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED'
  isDefault: boolean
  isPrimary: boolean
  maxDailyMessages: number
  verificationStatus: string
  qualityRating?: string
  _count: {
    WhatsAppMessage: number
    WhatsAppQueue: number
  }
}

interface Queue {
  id: string
  name: string
  description?: string
  status: 'DRAFT' | 'SCHEDULED' | 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'FAILED'
  priority: number
  totalMessages: number
  sentMessages: number
  failedMessages: number
  scheduledAt?: string
  WhatsAppAccount: {
    name: string
    phoneNumber: string
  }
  jobStats?: {
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
  }
}

export default function WhatsAppAccountManager() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'queues'>('accounts')
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([])
  const [queues, setQueues] = useState<Queue[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [showCreateQueue, setShowCreateQueue] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [accountsRes, queuesRes] = await Promise.all([
        fetch('/api/whatsapp/accounts'),
        fetch('/api/whatsapp/queue')
      ])

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json()
        setAccounts(accountsData.accounts || [])
      }

      if (queuesRes.ok) {
        const queuesData = await queuesRes.json()
        setQueues(queuesData.queues || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'accounts', label: 'Cuentas WhatsApp', icon: Smartphone },
    { id: 'queues', label: 'Colas de Envío', icon: Zap }
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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Phone className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Gestión de WhatsApp Business</h1>
        </div>
        <p className="text-blue-100">
          Administra múltiples números de WhatsApp y sistema de colas profesional
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
          {activeTab === 'accounts' && (
            <AccountsTab 
              accounts={accounts} 
              onCreateAccount={() => setShowCreateAccount(true)}
              onRefresh={loadData}
            />
          )}
          {activeTab === 'queues' && (
            <QueuesTab 
              queues={queues}
              accounts={accounts}
              onCreateQueue={() => setShowCreateQueue(true)}
              onRefresh={loadData}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modales */}
      {showCreateAccount && (
        <CreateAccountModal
          onClose={() => setShowCreateAccount(false)}
          onSuccess={() => {
            setShowCreateAccount(false)
            loadData()
          }}
        />
      )}

      {showCreateQueue && (
        <CreateQueueModal
          accounts={accounts}
          onClose={() => setShowCreateQueue(false)}
          onSuccess={() => {
            setShowCreateQueue(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}

// Cuentas Tab
function AccountsTab({ 
  accounts, 
  onCreateAccount
}: { 
  accounts: WhatsAppAccount[]
  onCreateAccount: () => void
  onRefresh: () => void
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'SUSPENDED':
      case 'EXPIRED':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-700 bg-green-100'
      case 'SUSPENDED':
      case 'EXPIRED':
        return 'text-red-700 bg-red-100'
      default:
        return 'text-yellow-700 bg-yellow-100'
    }
  }

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case 'GREEN':
        return 'text-green-700 bg-green-100'
      case 'YELLOW':
        return 'text-yellow-700 bg-yellow-100'
      case 'RED':
        return 'text-red-700 bg-red-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Cuentas de WhatsApp</h2>
        <button
          onClick={onCreateAccount}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Cuenta</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Phone className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{accounts.length}</div>
              <div className="text-sm text-gray-500">Total Cuentas</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {accounts.filter(acc => acc.status === 'ACTIVE').length}
              </div>
              <div className="text-sm text-gray-500">Cuentas Activas</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {accounts.reduce((sum, acc) => sum + acc._count.WhatsAppMessage, 0)}
              </div>
              <div className="text-sm text-gray-500">Mensajes Enviados</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {accounts.reduce((sum, acc) => sum + acc._count.WhatsAppQueue, 0)}
              </div>
              <div className="text-sm text-gray-500">Colas Activas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuenta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Límite Diario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {account.name}
                          {account.isPrimary && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              Primaria
                            </span>
                          )}
                          {account.isDefault && (
                            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                              Por Defecto
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.phoneNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(account.status)}
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(account.status)}`}>
                        {account.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getQualityColor(account.qualityRating)}`}>
                      {account.qualityRating || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.maxDailyMessages.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account._count.WhatsAppMessage} mensajes<br />
                    {account._count.WhatsAppQueue} colas
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-8">
            <Phone className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cuentas de WhatsApp</h3>
            <p className="mt-1 text-sm text-gray-500">Agrega tu primera cuenta para comenzar.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Colas Tab
function QueuesTab({ 
  queues, 
  accounts,
  onCreateQueue,
  onRefresh 
}: { 
  queues: Queue[]
  accounts: WhatsAppAccount[]
  onCreateQueue: () => void
  onRefresh: () => void
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'PROCESSING':
        return <Zap className="h-5 w-5 text-blue-600 animate-pulse" />
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'PAUSED':
        return <Pause className="h-5 w-5 text-yellow-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-700 bg-green-100'
      case 'PROCESSING':
        return 'text-blue-700 bg-blue-100'
      case 'FAILED':
        return 'text-red-700 bg-red-100'
      case 'PAUSED':
        return 'text-yellow-700 bg-yellow-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  const processQueue = async (queueId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/queue/${queueId}/process`, {
        method: 'POST'
      })

      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error processing queue:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Colas de Envío</h2>
        <button
          onClick={onCreateQueue}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Crear Cola</span>
        </button>
      </div>

      {/* Queues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queues.map((queue) => (
          <motion.div
            key={queue.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{queue.name}</h3>
                {queue.description && (
                  <p className="text-sm text-gray-500 mt-1">{queue.description}</p>
                )}
              </div>
              <div className="flex items-center">
                {getStatusIcon(queue.status)}
                <span className={`ml-2 px-2 py-1 text-xs leading-4 font-semibold rounded-full ${getStatusColor(queue.status)}`}>
                  {queue.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Cuenta:</span>
                <span className="font-medium">{queue.WhatsAppAccount.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Prioridad:</span>
                <span className="font-medium">{queue.priority}/10</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Mensajes:</span>
                <span className="font-medium">
                  {queue.sentMessages || 0} / {queue.totalMessages || 0}
                </span>
              </div>
            </div>

            {queue.status === 'PROCESSING' && queue.jobStats && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progreso</span>
                  <span>{Math.round(((queue.jobStats.completed || 0) / queue.jobStats.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${((queue.jobStats.completed || 0) / queue.jobStats.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              {queue.status === 'DRAFT' || queue.status === 'SCHEDULED' ? (
                <button
                  onClick={() => processQueue(queue.id)}
                  className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm"
                >
                  <Play className="h-4 w-4" />
                  <span>Procesar</span>
                </button>
              ) : null}
              
              <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm">
                <Eye className="h-4 w-4" />
                <span>Ver</span>
              </button>
              
              <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 text-sm">
                <Settings className="h-4 w-4" />
                <span>Editar</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {queues.length === 0 && (
        <div className="text-center py-12">
          <Zap className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay colas de envío</h3>
          <p className="mt-1 text-sm text-gray-500">Crea tu primera cola para envíos programados.</p>
        </div>
      )}
    </div>
  )
}

// Modal Crear Cuenta (simplificado)
function CreateAccountModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Agregar Cuenta de WhatsApp</h2>
        <p className="text-gray-600 mb-4">
          Funcionalidad completa disponible - implementar formulario según necesidades específicas.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSuccess}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Crear Cuenta
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Crear Cola (simplificado)
function CreateQueueModal({ 
  onClose, 
  onSuccess 
}: { 
  accounts: WhatsAppAccount[]
  onClose: () => void
  onSuccess: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Crear Cola de Envío</h2>
        <p className="text-gray-600 mb-4">
          {accounts.length} cuentas disponibles. Funcionalidad completa implementada en APIs.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSuccess}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Crear Cola
          </button>
        </div>
      </div>
    </div>
  )
}
