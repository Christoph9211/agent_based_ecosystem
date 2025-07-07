import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { SimulationStatistics } from '../types/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface PopulationGraphProps {
  statistics: SimulationStatistics;
  days: number;
  type: 'population' | 'biodiversity' | 'environment' | 'energy';
  className?: string;
}

const PopulationGraph: React.FC<PopulationGraphProps> = ({ 
  statistics, 
  days,
  type,
  className = ''
}) => {
  // Create labels (days)
  const createLabels = () => {
    if (!statistics.producers.length) return [];
    
    const currentLength = statistics.producers.length;
    const startDay = Math.max(0, currentLength - days);
    
    return Array.from({ length: Math.min(days, currentLength) }, (_, i) => startDay + i);
  };
  
  const labels = createLabels();
  
  const getDatasets = () => {
    if (type === 'population') {
      return [
        {
          label: 'Producers',
          data: statistics.producers.slice(-days),
          borderColor: 'rgb(51, 160, 44)',
          backgroundColor: 'rgba(51, 160, 44, 0.5)',
          tension: 0.2,
        },
        {
          label: 'Herbivores',
          data: statistics.herbivores.slice(-days),
          borderColor: 'rgb(31, 120, 180)',
          backgroundColor: 'rgba(31, 120, 180, 0.5)',
          tension: 0.2,
        },
        {
          label: 'Carnivores',
          data: statistics.carnivores.slice(-days),
          borderColor: 'rgb(227, 26, 28)',
          backgroundColor: 'rgba(227, 26, 28, 0.5)',
          tension: 0.2,
        },
        {
          label: 'Decomposers',
          data: statistics.decomposers.slice(-days),
          borderColor: 'rgb(177, 89, 40)',
          backgroundColor: 'rgba(177, 89, 40, 0.5)',
          tension: 0.2,
        },
      ];
    } else if (type === 'biodiversity') {
      return [
        {
          label: 'Biodiversity Index',
          data: statistics.biodiversityIndex.slice(-days),
          borderColor: 'rgb(106, 61, 154)',
          backgroundColor: 'rgba(106, 61, 154, 0.5)',
          tension: 0.2,
        },
        {
          label: 'Stability Index',
          data: statistics.stabilityIndex.slice(-days),
          borderColor: 'rgb(255, 127, 0)',
          backgroundColor: 'rgba(255, 127, 0, 0.5)',
          tension: 0.2,
        },
      ];
    } else if (type === 'environment') {
      return [
        {
          label: 'Temperature (°C)',
          data: statistics.averageTemperature.slice(-days),
          borderColor: 'rgb(227, 26, 28)',
          backgroundColor: 'rgba(227, 26, 28, 0.5)',
          tension: 0.2,
          yAxisID: 'y',
        },
        {
          label: 'Rainfall (%)',
          data: statistics.averageRainfall.slice(-days),
          borderColor: 'rgb(31, 120, 180)',
          backgroundColor: 'rgba(31, 120, 180, 0.5)',
          tension: 0.2,
          yAxisID: 'y1',
        },
      ];
    } else if (type === 'energy') {
      // Scale down total energy and nutrients for better visualization
      const energyScale = 0.001;
      const nutrientScale = 0.01;
      
      return [
        {
          label: 'Total Energy (x1000)',
          data: statistics.totalEnergy.slice(-days).map(v => v * energyScale),
          borderColor: 'rgb(255, 187, 120)',
          backgroundColor: 'rgba(255, 187, 120, 0.5)',
          tension: 0.2,
        },
        {
          label: 'Total Nutrients (x100)',
          data: statistics.totalNutrients.slice(-days).map(v => v * nutrientScale),
          borderColor: 'rgb(152, 223, 138)',
          backgroundColor: 'rgba(152, 223, 138, 0.5)',
          tension: 0.2,
        },
      ];
    }
    
    return [];
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // Disable animation for performance
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Day',
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        title: {
          display: true,
          text: type === 'environment' ? 'Temperature (°C)' : '',
        },
        beginAtZero: true,
      },
      ...(type === 'environment' ? {
        y1: {
          position: 'right' as const,
          title: {
            display: true,
            text: 'Rainfall (%)',
          },
          beginAtZero: true,
          max: 100,
          grid: {
            drawOnChartArea: false,
          },
        },
      } : {}),
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: getTitle(),
      },
    },
  };
  
  function getTitle() {
    switch (type) {
      case 'population':
        return 'Population Dynamics';
      case 'biodiversity':
        return 'Biodiversity & Stability Indices';
      case 'environment':
        return 'Environmental Conditions';
      case 'energy':
        return 'Energy & Nutrient Levels';
      default:
        return '';
    }
  }
  
  const data = {
    labels,
    datasets: getDatasets(),
  };
  
  return (
    <div className={`w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
      <div className="w-full h-full">
        <Line options={options} data={data} />
      </div>
    </div>
  );
};

export default PopulationGraph;
