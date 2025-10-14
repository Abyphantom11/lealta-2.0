'use client';

import { motion } from 'framer-motion';
import { Clock, User, TrendingUp } from 'lucide-react';
import { RecentTicket } from '../types/staff.types';

interface RecentTicketsProps {
  recentTickets: RecentTicket[];
}

export const RecentTickets = ({ recentTickets }: RecentTicketsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-purple-500/10 p-2 rounded-lg">
          <Clock className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-xl font-semibold text-white">
          Tickets Recientes
        </h3>
      </div>

      {recentTickets.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-dark-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-dark-400" />
          </div>
          <p className="text-dark-400">No hay tickets procesados hoy</p>
          <p className="text-dark-500 text-sm mt-1">
            Los tickets aparecerán aquí cuando los proceses
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentTickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-dark-700 rounded-lg p-4 border border-dark-600"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {ticket.cliente || 'Cliente no especificado'}
                    </p>
                    <p className="text-dark-400 text-xs">
                      Cédula: {ticket.cedula}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">
                    ${ticket.total.toFixed(2)}
                  </p>
                  <p className="text-yellow-400 text-xs">
                    +{ticket.puntos} pts
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ticket.tipo === 'IA' 
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-green-500/20 text-green-300'
                  }`}>
                    {ticket.tipo || 'Manual'}
                  </span>
                  <span className="text-dark-400">
                    {ticket.items?.length || 0} productos
                  </span>
                </div>
                <span className="text-dark-400">
                  {ticket.hora}
                </span>
              </div>

              {/* Productos */}
              {ticket.items && ticket.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-dark-600">
                  <p className="text-dark-400 text-xs mb-1">Productos:</p>
                  <div className="flex flex-wrap gap-1">
                    {ticket.items.slice(0, 3).map((item, itemIndex) => (
                      <span
                        key={itemIndex}
                        className="text-xs bg-dark-600 text-dark-300 px-2 py-1 rounded"
                      >
                        {item.length > 15 ? `${item.substring(0, 15)}...` : item}
                      </span>
                    ))}
                    {ticket.items.length > 3 && (
                      <span className="text-xs text-dark-400">
                        +{ticket.items.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
