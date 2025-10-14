// Customer level styling utilities

export const getCustomerLevelClasses = (nivel: string): string => {
  switch (nivel.toLowerCase()) {
    case 'bronce':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'plata':
      return 'bg-gray-100 text-gray-800 border border-gray-200';
    case 'oro':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'platino':
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    case 'diamante':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

export const getCustomerLevelIcon = (nivel: string): string => {
  switch (nivel.toLowerCase()) {
    case 'bronce':
      return '🥉';
    case 'plata':
      return '🥈';
    case 'oro':
      return '🥇';
    case 'platino':
      return '💎';
    case 'diamante':
      return '💍';
    default:
      return '⭐';
  }
};

export const formatCustomerPoints = (puntos: number): string => {
  if (puntos >= 1000000) {
    return `${(puntos / 1000000).toFixed(1)}M`;
  } else if (puntos >= 1000) {
    return `${(puntos / 1000).toFixed(1)}K`;
  }
  return puntos.toString();
};
