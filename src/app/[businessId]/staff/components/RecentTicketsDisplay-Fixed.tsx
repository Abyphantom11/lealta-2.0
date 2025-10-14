'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, FileText, RefreshCw } from 'lucide-react';
import type { RecentTicket } from '../types/staff.types';

interface RecentTicketsDisplayProps {
  tickets: RecentTicket[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const TicketCard = ({ ticket, index }: { ticket: RecentTicket; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-dark-700/50 border border-dark-600 rounded-lg p-4 hover:bg-dark-700/70 transition-all hover:shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-white font-medium text-sm">{ticket.cliente}</h4>
            <p className="text-dark-400 text-xs">Cédula: {ticket.cedula}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-bold">${ticket.total.toFixed(2)}</p>
          <p className="text-yellow-400 text-xs font-medium">+{ticket.puntos} pts</p>
        </div>
      </div>

      {/* Products List */}
      {ticket.productos && ticket.productos.length > 0 && (
        <div className="mb-3">
          <p className="text-dark-400 text-xs mb-1">Productos:</p>
          <div className="flex flex-wrap gap-1">
            {ticket.productos.slice(0, 3).map((producto, i) => (
              <span
                key={`${ticket.id}-product-${i}`}
                className="inline-block px-2 py-1 bg-dark-600 text-white text-xs rounded"
              >
                {producto}
              </span>
            ))}
            {ticket.productos.length > 3 && (
              <span className="inline-block px-2 py-1 bg-dark-600 text-dark-300 text-xs rounded">
                +{ticket.productos.length - 3} más
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1 text-dark-400">
          <Clock className="w-3 h-3" />
          <span>{ticket.hora}</span>
        </div>
        {ticket.tipo && (
          <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs">
            {ticket.tipo}
          </span>
        )}
      </div>
    </motion.div>
  );
};

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-12"
  >
    <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
      <FileText className="w-8 h-8 text-dark-400" />
    </div>
    <h3 className="text-white font-medium mb-2">No hay tickets procesados</h3>
    <p className="text-dark-400 text-sm">
      Los tickets aparecerán aquí una vez que comiences a procesar consumos.
    </p>
  </motion.div>
);

const LoadingState = () => {
  const skeletonKeys = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'];
  
  return (
    <div className="space-y-3">
      {skeletonKeys.map((key) => (
        <div key={key} className="bg-dark-700/50 border border-dark-600 rounded-lg p-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-dark-600 rounded-full"></div>
              <div>
                <div className="h-4 bg-dark-600 rounded w-24 mb-1"></div>
                <div className="h-3 bg-dark-600 rounded w-16"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-dark-600 rounded w-16 mb-1"></div>
              <div className="h-3 bg-dark-600 rounded w-12"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-dark-600 rounded w-full"></div>
            <div className="h-3 bg-dark-600 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function RecentTicketsDisplay({ 
  tickets, 
  isLoading = false, 
  onRefresh 
}: RecentTicketsDisplayProps) {

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6 h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-500/10 p-2 rounded-lg">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Tickets Recientes</h3>
            <p className="text-dark-400 text-sm">
              {tickets.length > 0 ? `${tickets.length} tickets procesados hoy` : 'Sin actividad hoy'}
            </p>
          </div>
        </div>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white rounded-lg transition-all"
            title="Actualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="overflow-hidden">
        {isLoading ? (
          <LoadingState />
        ) : tickets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            <AnimatePresence>
              {tickets.map((ticket, index) => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {tickets.length > 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 pt-4 border-t border-dark-600"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-dark-400 text-xs">Total Tickets</p>
              <p className="text-white font-medium">{tickets.length}</p>
            </div>
            <div>
              <p className="text-dark-400 text-xs">Total Ventas</p>
              <p className="text-green-400 font-medium">
                ${tickets.reduce((sum, ticket) => sum + ticket.total, 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-dark-400 text-xs">Total Puntos</p>
              <p className="text-yellow-400 font-medium">
                {tickets.reduce((sum, ticket) => sum + ticket.puntos, 0)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
