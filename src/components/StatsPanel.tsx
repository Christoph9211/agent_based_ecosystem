import React from 'react';
import { SimulationStatistics } from '../types/types';

interface StatsPanelProps {
  statistics: SimulationStatistics;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ statistics }) => {
  // Calculate current values (from last entry in each array)
  const getCurrentValue = <T extends keyof SimulationStatistics>(key: T): number => {
    const array = statistics[key] as number[];
    return array.length > 0 ? array[array.length - 1] : 0;
  };
  
  // Calculate trend (percentage change over last 10 days)
  const getTrend = <T extends keyof SimulationStatistics>(key: T): number => {
    const array = statistics[key] as number[];
    if (array.length < 10) return 0;
    
    const current = array[array.length - 1];
    const previous = array[array.length - 10];
    
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Get trend className based on value and whether increases are positive
  const getTrendClass = (trend: number, increasesArePositive: boolean = true): string => {
    if (Math.abs(trend) < 5) return 'text-gray-500 dark:text-gray-400'; // stable
    
    if (increasesArePositive) {
      return trend > 0 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-red-600 dark:text-red-400';
    } else {
      return trend > 0 
        ? 'text-red-600 dark:text-red-400' 
        : 'text-green-600 dark:text-green-400';
    }
  };
  
  // Format trend as string with arrow
  const formatTrend = (trend: number): string => {
    if (Math.abs(trend) < 5) return '→ Stable';
    return trend > 0 ? `↑ ${trend.toFixed(1)}%` : `↓ ${Math.abs(trend).toFixed(1)}%`;
  };
  
  // Current values
  const biodiversity = getCurrentValue('biodiversityIndex');
  const stability = getCurrentValue('stabilityIndex');
  const totalEnergy = getCurrentValue('totalEnergy');
  const totalNutrients = getCurrentValue('totalNutrients');
  
  // Trends
  const biodiversityTrend = getTrend('biodiversityIndex');
  const stabilityTrend = getTrend('stabilityIndex');
  const producersTrend = getTrend('producers');
  const consumersTrend = getTrend('herbivores') + getTrend('carnivores') / 2;
  
  // Calculate ecosystem health score (0-100)
  const calculateHealthScore = (): number => {
    if (
      statistics.producers.length === 0 ||
      statistics.herbivores.length === 0 ||
      statistics.biodiversityIndex.length === 0
    ) {
      return 0;
    }
    
    // Factors that contribute to ecosystem health
    const biodiversityFactor = Math.min(1, biodiversity / 2) * 0.3; // 30% weight
    const stabilityFactor = stability * 0.3; // 30% weight
    
    // Balance between producers and consumers (ideally around 3:1 ratio)
    const producerCount = statistics.producers[statistics.producers.length - 1];
    const consumerCount = 
      statistics.herbivores[statistics.herbivores.length - 1] + 
      statistics.carnivores[statistics.carnivores.length - 1];
    
    let balanceFactor = 0;
    if (consumerCount > 0) {
      const ratio = producerCount / consumerCount;
      balanceFactor = Math.min(1, Math.max(0, 1 - Math.abs(ratio - 3) / 3)) * 0.2; // 20% weight
    }
    
    // Population trends - moderate growth or stability is good
    const producersTrendFactor = Math.min(1, Math.max(0, 1 - Math.abs(producersTrend) / 50)) * 0.1; // 10% weight
    const consumersTrendFactor = Math.min(1, Math.max(0, 1 - Math.abs(consumersTrend) / 50)) * 0.1; // 10% weight
    
    // Combine factors
    const healthScore = (
      biodiversityFactor + 
      stabilityFactor + 
      balanceFactor + 
      producersTrendFactor + 
      consumersTrendFactor
    ) * 100;
    
    return Math.min(100, Math.max(0, healthScore));
  };
  
  const healthScore = calculateHealthScore();
  
  // Get health status text and color
  const getHealthStatus = (): { text: string; color: string } => {
    if (healthScore >= 80) {
      return { text: 'Thriving', color: 'text-green-600 dark:text-green-400' };
    } else if (healthScore >= 60) {
      return { text: 'Healthy', color: 'text-green-500 dark:text-green-300' };
    } else if (healthScore >= 40) {
      return { text: 'Stable', color: 'text-yellow-500 dark:text-yellow-400' };
    } else if (healthScore >= 20) {
      return { text: 'Struggling', color: 'text-orange-500 dark:text-orange-400' };
    } else {
      return { text: 'Critical', color: 'text-red-600 dark:text-red-400' };
    }
  };
  
  const healthStatus = getHealthStatus();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Ecosystem Health</h3>
      
      <div className="flex flex-col items-center mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
          <div 
            className="h-4 rounded-full transition-all duration-500"
            style={{ 
              width: `${healthScore}%`,
              background: healthScore >= 60 
                ? 'linear-gradient(90deg, rgb(5, 150, 105), rgb(16, 185, 129))' 
                : healthScore >= 30 
                  ? 'linear-gradient(90deg, rgb(245, 158, 11), rgb(234, 88, 12))' 
                  : 'linear-gradient(90deg, rgb(220, 38, 38), rgb(239, 68, 68))'
            }}
          ></div>
        </div>
        <div className="flex justify-between w-full text-xs text-gray-500 dark:text-gray-400">
          <span>Critical</span>
          <span>Stable</span>
          <span>Thriving</span>
        </div>
        <div className="mt-1 flex items-center">
          <span className="text-xl font-bold">{healthScore.toFixed(1)}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/100</span>
          <span className={`ml-2 text-sm font-medium ${healthStatus.color}`}>
            ({healthStatus.text})
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
          <div className="text-xs text-gray-500 dark:text-gray-400">Biodiversity</div>
          <div className="font-semibold">{biodiversity.toFixed(2)}</div>
          <div className={`text-xs ${getTrendClass(biodiversityTrend)}`}>
            {formatTrend(biodiversityTrend)}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
          <div className="text-xs text-gray-500 dark:text-gray-400">Stability</div>
          <div className="font-semibold">{(stability * 100).toFixed(0)}%</div>
          <div className={`text-xs ${getTrendClass(stabilityTrend)}`}>
            {formatTrend(stabilityTrend)}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
          <div className="text-xs text-gray-500 dark:text-gray-400">Producers Trend</div>
          <div className={`font-semibold ${getTrendClass(producersTrend)}`}>
            {formatTrend(producersTrend)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last 10 days
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
          <div className="text-xs text-gray-500 dark:text-gray-400">Consumers Trend</div>
          <div className={`font-semibold ${getTrendClass(consumersTrend)}`}>
            {formatTrend(consumersTrend)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last 10 days
          </div>
        </div>
      </div>
      
      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">System Resources</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Energy:</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {Math.round(totalEnergy).toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Nutrients:</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {Math.round(totalNutrients).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
