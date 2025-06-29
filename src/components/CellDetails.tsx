import React from 'react';
import { Cell, OrganismType, ConsumerType } from '../types/types';

interface CellDetailsProps {
  cell: Cell | null;
  organisms: Record<string, any>;
}

const CellDetails: React.FC<CellDetailsProps> = ({ cell, organisms }) => {
  if (!cell) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <p className="text-gray-500 dark:text-gray-400 text-center">Select a cell to view details</p>
      </div>
    );
  }
  
  // Group organisms in the cell by type
  const cellOrganisms = cell.organisms
    .map(id => organisms[id])
    .filter(Boolean);
  
  const producers = cellOrganisms.filter(o => o.type === OrganismType.Producer);
  const herbivores = cellOrganisms.filter(
    o => o.type === OrganismType.Consumer && o.consumerType === ConsumerType.Herbivore
  );
  const carnivores = cellOrganisms.filter(
    o => o.type === OrganismType.Consumer && o.consumerType === ConsumerType.Carnivore
  );
  const decomposers = cellOrganisms.filter(o => o.type === OrganismType.Decomposer);
  
  // Helper function to get terrain type description
  const getTerrainType = (cell: Cell): string => {
    if (cell.height > 1.5) return 'Mountain Peak';
    if (cell.height > 0.8) return 'Hill';
    if (cell.height > 0.3) return 'Elevated Ground';
    if (cell.waterLevel > 80) return 'Water';
    if (cell.waterLevel < 30 && cell.nutrientLevel < 30) return 'Desert';
    return 'Plains';
  };
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        Cell ({cell.x}, {cell.y})
      </h3>
      
      <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
        <div className="text-xs text-gray-500 dark:text-gray-400">Terrain Type</div>
        <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
          {getTerrainType(cell)}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          Elevation: {cell.height.toFixed(2)} units
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Water Level</div>
          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {cell.waterLevel.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Nutrient Level</div>
          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
            {cell.nutrientLevel.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Temperature</div>
          <div className="text-sm font-semibold text-red-600 dark:text-red-400">
            {cell.temperature.toFixed(1)}°C
          </div>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Pollution</div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {cell.pollutionLevel.toFixed(1)}%
          </div>
        </div>
      </div>
      
      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Organisms ({cellOrganisms.length})</h4>
      
      <div className="space-y-2 text-sm">
        {producers.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span className="text-gray-700 dark:text-gray-300">Producers: {producers.length}</span>
          </div>
        )}
        
        {herbivores.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-gray-700 dark:text-gray-300">Herbivores: {herbivores.length}</span>
          </div>
        )}
        
        {carnivores.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-gray-700 dark:text-gray-300">Carnivores: {carnivores.length}</span>
          </div>
        )}
        
        {decomposers.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-amber-800"></div>
            <span className="text-gray-700 dark:text-gray-300">Decomposers: {decomposers.length}</span>
          </div>
        )}
        
        {cellOrganisms.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-xs">No organisms in this cell</p>
        )}
      </div>
      
      {cellOrganisms.length > 0 && (
        <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-2">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Details</h4>
          
          <div className="max-h-40 overflow-y-auto text-xs">
            {cellOrganisms.slice(0, 8).map((organism, index) => (
              <div key={organism.id} className="mb-2 pb-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="font-semibold text-gray-700 dark:text-gray-200">{organism.species}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Energy:</span>
                    <span className="text-gray-700 dark:text-gray-300">{organism.energy.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Size:</span>
                    <span className="text-gray-700 dark:text-gray-300">{organism.size.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Age:</span>
                    <span className="text-gray-700 dark:text-gray-300">{organism.age}/{organism.maxAge}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {cellOrganisms.length > 8 && (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-1">
                +{cellOrganisms.length - 8} more organisms
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CellDetails;