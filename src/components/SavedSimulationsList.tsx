import React from 'react';
import { SavedSimulation } from '../types/types';

interface SavedSimulationsListProps {
  savedSimulations: SavedSimulation[];
  onLoad: (simulation: SavedSimulation) => void;
  onDelete: (index: number) => void;
}

const SavedSimulationsList: React.FC<SavedSimulationsListProps> = ({
  savedSimulations,
  onLoad,
  onDelete,
}) => {
  if (savedSimulations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Saved Simulations</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">No saved simulations yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Saved Simulations</h3>
      
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
        {savedSimulations.map((simulation, index) => (
          <div 
            key={`${simulation.name}-${index}`}
            className="p-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">{simulation.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Day {simulation.state.day} | {new Date(simulation.date).toLocaleString()}
                </p>
                <div className="mt-1 flex space-x-2 text-xs">
                  <span className="text-green-600 dark:text-green-400">
                    P: {simulation.state.statistics.producers.slice(-1)[0]}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    H: {simulation.state.statistics.herbivores.slice(-1)[0]}
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    C: {simulation.state.statistics.carnivores.slice(-1)[0]}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">
                    D: {simulation.state.statistics.decomposers.slice(-1)[0]}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onLoad(simulation)}
                  className="px-2 py-1 text-xs font-medium text-white bg-primary-500 rounded hover:bg-primary-600 transition-colors"
                >
                  Load
                </button>
                <button
                  onClick={() => onDelete(index)}
                  className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedSimulationsList;
