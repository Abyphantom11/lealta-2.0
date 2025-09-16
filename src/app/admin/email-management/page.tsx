'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  Copy, 
  Eye, 
  Settings,
  Users,
  Heart,
  Gift,
  Clock,
  Building
} from 'lucide-react';

interface EmailTemplate {
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'system' | 'business' | 'customer';
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    type: 'email-verification',
    name: 'Verificación de Email',
    description: 'Código de verificación para nuevos registros',
    icon: <CheckCircle className="w-5 h-5" />,
    category: 'system'
  },
  {
    type: 'welcome',
    name: 'Bienvenida',
    description: 'Email de bienvenida para nuevas empresas',
    icon: <Building className="w-5 h-5" />,
    category: 'business'
  },
  {
    type: 'trial-welcome',
    name: 'Prueba Iniciada',
    description: 'Confirma el inicio de la prueba gratuita',
    icon: <Gift className="w-5 h-5" />,
    category: 'business'
  },
  {
    type: 'trial-reminder',
    name: 'Recordatorio de Prueba',
    description: 'Aviso cuando la prueba está por expirar',
    icon: <Clock className="w-5 h-5" />,
    category: 'business'
  },
  {
    type: 'staff-invitation',
    name: 'Invitación de Staff',
    description: 'Invitar nuevos miembros del equipo',
    icon: <Users className="w-5 h-5" />,
    category: 'business'
  },
  {
    type: 'loyalty-level-up',
    name: 'Ascenso de Nivel',
    description: 'Notifica cuando un cliente sube de nivel',
    icon: <Heart className="w-5 h-5" />,
    category: 'customer'
  },
  {
    type: 'promotional',
    name: 'Promocional',
    description: 'Emails de ofertas y promociones',
    icon: <Gift className="w-5 h-5" />,
    category: 'customer'
  }
];

export default function EmailManagementPage() {
  const [activeTemplate, setActiveTemplate] = useState<string>('');
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'system' | 'business' | 'customer'>('all');

  const sendTestEmail = async (templateType: string) => {
    if (!testEmail) {
      setResult({ success: false, message: 'Por favor ingresa un email de prueba' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // 🚫 TEMPORALMENTE DESACTIVADO - API de emails
      setResult({
        success: false,
        message: 'Sistema de emails temporalmente desactivado para el lanzamiento'
      });
      return;
      
      // const response = await fetch('/api/emails/test', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     to: testEmail,
      //     type: templateType,
      //   }),
      // });

      // const data = await response.json();

      // if (response.ok) {
      //   setResult({ 
      //     success: true, 
      //     message: `✅ Email enviado exitosamente a ${testEmail}`
      //   });
      // } else {
      //   setResult({ 
      //     success: false, 
      //     message: `❌ Error: ${data.error}`
      //   });
      // }
    } catch (error) {
      console.error('Error:', error);
      setResult({ 
        success: false, 
        message: '❌ Error de conexión'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = EMAIL_TEMPLATES.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  const categoryColors = {
    system: 'from-blue-500 to-cyan-500',
    business: 'from-purple-500 to-pink-500',
    customer: 'from-green-500 to-teal-500'
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <Mail className="w-8 h-8 text-blue-400 mr-3" />
            <h1 className="text-3xl font-bold text-white">Gestión de Emails</h1>
          </div>
          <p className="text-gray-400">
            Administra y prueba los templates de email de Lealta
          </p>
        </motion.div>

        {/* Configuración de prueba */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Configuración de Prueba
          </h2>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email de prueba
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="tu-email@ejemplo.com"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText('hello@lealta.app')}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center"
              title="Copiar email de Lealta"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mt-4 p-4 rounded-lg ${
                result.success 
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {result.message}
            </motion.div>
          )}
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Todos', count: EMAIL_TEMPLATES.length },
              { key: 'system', label: 'Sistema', count: EMAIL_TEMPLATES.filter(t => t.category === 'system').length },
              { key: 'business', label: 'Empresa', count: EMAIL_TEMPLATES.filter(t => t.category === 'business').length },
              { key: 'customer', label: 'Cliente', count: EMAIL_TEMPLATES.filter(t => t.category === 'customer').length },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedCategory(filter.key as any)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </motion.div>

        {/* Templates Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${categoryColors[template.category]} rounded-lg flex items-center justify-center text-white`}>
                  {template.icon}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTemplate(template.type)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">
                {template.name}
              </h3>
              
              <p className="text-gray-400 text-sm mb-4">
                {template.description}
              </p>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  template.category === 'system' ? 'bg-blue-500/20 text-blue-400' :
                  template.category === 'business' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {template.category}
                </span>

                <button
                  onClick={() => sendTestEmail(template.type)}
                  disabled={isLoading || !testEmail}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all duration-200 flex items-center text-sm"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Probar
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Templates Activos</h3>
            <p className="text-3xl font-bold text-blue-400">{EMAIL_TEMPLATES.length}</p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Configuración</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Resend API:</span>
                <span className="text-green-400">Conectado</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Dominio:</span>
                <span className="text-white">lealta.app</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Categorías</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-400">Sistema:</span>
                <span className="text-white">{EMAIL_TEMPLATES.filter(t => t.category === 'system').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">Empresa:</span>
                <span className="text-white">{EMAIL_TEMPLATES.filter(t => t.category === 'business').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-400">Cliente:</span>
                <span className="text-white">{EMAIL_TEMPLATES.filter(t => t.category === 'customer').length}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
