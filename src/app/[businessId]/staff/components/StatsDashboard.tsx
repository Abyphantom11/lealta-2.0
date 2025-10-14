'use client';

import { motion } from 'framer-motion';
import { FileText, Award, TrendingUp } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatsCard = ({ title, value, icon, color }: StatsCardProps) => (
  <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-dark-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
      <div className={`${color} p-3 rounded-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

interface StatsDashboardProps {
  todayStats: {
    ticketsProcessed: number;
    totalPoints: number;
    totalAmount: number;
  };
}

export const StatsDashboard = ({ todayStats }: StatsDashboardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
    >
      <StatsCard
        title="Tickets Hoy"
        value={todayStats.ticketsProcessed}
        icon={<FileText className="w-6 h-6 text-blue-400" />}
        color="bg-blue-500/10"
      />
      
      <StatsCard
        title="Puntos Dados"
        value={todayStats.totalPoints.toLocaleString()}
        icon={<Award className="w-6 h-6 text-yellow-400" />}
        color="bg-yellow-500/10"
      />
      
      <StatsCard
        title="Total Ventas"
        value={`$${todayStats.totalAmount.toFixed(2)}`}
        icon={<TrendingUp className="w-6 h-6 text-purple-400" />}
        color="bg-purple-500/10"
      />
    </motion.div>
  );
};
