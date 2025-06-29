import React, { useState, useEffect } from 'react';
import { Dices, Leaf, FileDown, FileUp, Info, RotateCcw, Settings } from 'lucide-react';
import useSimulation from './hooks/useSimulation';
import SimulationGrid from './components/SimulationGrid';
import ControlPanel from './components/ControlPanel';
import PopulationGraph from './components/PopulationGraph';
import CellDetails from './components/CellDetails';
import StatsPanel from './components/StatsPanel';
import SavedSimulationsList from './components/SavedSimulationsList';
import { Cell, DisturbanceType, SimulationConfig, SavedSimulation } from './types/types';

const DEFAULT_CONFIG: SimulationConfig = {
  gridWidth: 30,
  gridHeight: 30,
  initialProducers: 80,
  initialHerbivores: 25,
  initialCarnivores: 8,
  initialDecomposers: 25,
  simulationSpeed: 1,
  initialTemperature: 25,
  initialRainfall: 60,
  enableEvolution: true,
  enableDisturbances: false,
};

function App() {
  const {
    state,
    step,
    togglePause,
    setSpeed,
    addDisturbance,
    reset,
    saveSimulation,
    loadSimulation,
    autoRestartOnExtinction,
    toggleAutoRestart,
    extinctionCount,
    lastExtinctionDay,
    generateRandomConfig,
  } = useSimulation(DEFAULT_CONFIG);
  
  const [selectedCell, setSelectedCell] = useState<{ x: number, y: number } | null>(null);
  const [cellData, setCellData] = useState<Cell | null>(null);
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [showStartGuide, setShowStartGuide] = useState(true);
  const [graphType, setGraphType] = useState<'population' | 'biodiversity' | 'environment' | 'energy'>('population');
  const [graphTimespan, setGraphTimespan] = useState<number>(100);
  
  // Handle cell selection
  useEffect(() => {
    if (selectedCell && state.grid && state.grid.length > 0) {
      const { x, y } = selectedCell;
      if (y < state.grid.length && x < state.grid[y].length) {
        setCellData(state.grid[y][x]);
      }
    }
  }, [selectedCell, state.grid]);
  
  // Handle cell click
  const handleCellClick = (x: number, y: number) => {
    setSelectedCell({ x, y });
  };
  
  // Handle save simulation
  const handleSave = (name: string) => {
    const saved = saveSimulation(name);
    setSavedSimulations([...savedSimulations, saved]);
    
    // Save to localStorage
    try {
      const simulations = [...savedSimulations, saved];
      localStorage.setItem('ecosystemSimulations', JSON.stringify(simulations));
    } catch (e) {
      console.error('Failed to save simulations to localStorage', e);
    }
  };
  
  // Handle load simulation
  const handleLoad = (simulation: SavedSimulation) => {
    loadSimulation(simulation);
    setShowStartGuide(false);
  };
  
  // Handle delete simulation
  const handleDelete = (index: number) => {
    const newSimulations = [...savedSimulations];
    newSimulations.splice(index, 1);
    setSavedSimulations(newSimulations);
    
    // Update localStorage
    try {
      localStorage.setItem('ecosystemSimulations', JSON.stringify(newSimulations));
    } catch (e) {
      console.error('Failed to save simulations to localStorage', e);
    }
  };
  
  // Handle random restart
  const handleRandomRestart = () => {
    const newConfig = generateRandomConfig();
    reset(newConfig);
  };
  
  // Load saved simulations from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ecosystemSimulations');
      if (saved) {
        setSavedSimulations(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load simulations from localStorage', e);
    }
  }, []);
  
  // Count organisms by type
  const producerCount = Object.values(state.organisms).filter(o => o.type === 'Producer').length;
  const herbivoreCount = Object.values(state.organisms).filter(
    o => o.type === 'Consumer' && o.consumerType === 'Herbivore'
  ).length;
  const carnivoreCount = Object.values(state.organisms).filter(
    o => o.type === 'Consumer' && o.consumerType === 'Carnivore'
  ).length;
  const decomposerCount = Object.values(state.organisms).filter(o => o.type === 'Decomposer').length;
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Leaf className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-2" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ecosystem Simulator</h1>
            
            {/* Auto-restart indicator */}
            {autoRestartOnExtinction && (
              <div className="ml-4 flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-md">
                <RotateCcw size={16} className="text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300">Auto-restart enabled</span>
                {extinctionCount > 0 && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    ({extinctionCount} restarts)
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleRandomRestart}
              className="flex items-center space-x-1 px-3 py-1 bg-purple-200 dark:bg-purple-700 rounded-md text-sm transition-colors hover:bg-purple-300 dark:hover:bg-purple-600"
            >
              <Dices size={16} />
              <span>Random Start</span>
            </button>
            
            <button 
              onClick={() => reset()}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
            
            <button
              onClick={() => setShowStartGuide(!showStartGuide)}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <Info size={16} />
              <span>{showStartGuide ? 'Hide' : 'Show'} Info</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {showStartGuide && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 mb-6">
            <h2 className="text-lg font-semibold mb-3">Welcome to the Ecosystem Simulator!</h2>
            <p className="mb-3">This simulator models a complex ecosystem with multiple trophic levels, environmental factors, and emergent behaviors.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                <h3 className="font-medium mb-2">Organism Types</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center"><div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div> Producers (Plants)</li>
                  <li className="flex items-center"><div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div> Herbivores</li>
                  <li className="flex items-center"><div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div> Carnivores</li>
                  <li className="flex items-center"><div className="w-3 h-3 bg-amber-800 rounded-full mr-2"></div> Decomposers</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                <h3 className="font-medium mb-2">Environmental Factors</h3>
                <ul className="space-y-1 text-sm">
                  <li>Temperature affects metabolism and growth</li>
                  <li>Rainfall determines water availability</li>
                  <li>Seasons cycle through the year</li>
                  <li>Nutrients are recycled through the ecosystem</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                <h3 className="font-medium mb-2">Camera Controls</h3>
                <ul className="space-y-1 text-sm">
                  <li><strong>Mouse:</strong> Left drag to orbit, Right/Middle drag to pan, Wheel to zoom</li>
                  <li><strong>Keyboard:</strong> WASD to move, QE for elevation, Arrow keys to rotate</li>
                  <li><strong>Special:</strong> R to reset camera, F for fullscreen, ESC to exit fullscreen</li>
                </ul>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Getting Started</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Press the play button to start the simulation</li>
                <li>Adjust the simulation speed using the slider</li>
                <li>Use camera controls to explore the 3D ecosystem</li>
                <li>Click on cells to view detailed information</li>
                <li>Add disturbances to test ecosystem resilience</li>
                <li>Monitor population graphs and health metrics</li>
              </ol>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
              <h3 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Auto-Restart Feature</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                When enabled, the simulation automatically restarts with randomized parameters if all organisms go extinct. 
                This allows for continuous exploration of different ecosystem dynamics. You can toggle this feature in the control panel.
              </p>
            </div>
            
            <button 
              onClick={() => setShowStartGuide(false)}
              className="px-4 py-2 bg-primary-500 text-white rounded-md text-sm hover:bg-primary-600 transition-colors"
            >
              Start Exploring
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Grid and controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden relative" style={{ height: '500px' }}>
              <SimulationGrid
                grid={state.grid}
                organisms={state.organisms}
                width={state.environment.width}
                height={state.environment.height}
                disturbance={state.disturbance}
                onCellClick={handleCellClick}
                selectedCell={selectedCell}
              />
            </div>
            
            <ControlPanel
              day={state.day}
              season={state.season}
              temperature={state.environment.temperature}
              rainfall={state.environment.rainfall}
              paused={state.paused}
              speed={state.cyclesPerSecond}
              producerCount={producerCount}
              herbivoreCount={herbivoreCount}
              carnivoreCount={carnivoreCount}
              decomposerCount={decomposerCount}
              autoRestartOnExtinction={autoRestartOnExtinction}
              extinctionCount={extinctionCount}
              lastExtinctionDay={lastExtinctionDay}
              onPauseToggle={togglePause}
              onStepForward={step}
              onSpeedChange={setSpeed}
              onAddDisturbance={(type, intensity, duration) => {
                addDisturbance(type as DisturbanceType, intensity, duration);
              }}
              onReset={reset}
              onRandomRestart={handleRandomRestart}
              onSave={handleSave}
              onToggleAutoRestart={toggleAutoRestart}
              onConfigChange={() => {}}
            />
          </div>
          
          {/* Right column - Details and stats */}
          <div className="space-y-6">
            <CellDetails cell={cellData} organisms={state.organisms} />
            
            <StatsPanel statistics={state.statistics} />
            
            <SavedSimulationsList
              savedSimulations={savedSimulations}
              onLoad={handleLoad}
              onDelete={handleDelete}
            />
          </div>
        </div>
        
        {/* Graphs section */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setGraphType('population')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  graphType === 'population' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Population
              </button>
              
              <button
                onClick={() => setGraphType('biodiversity')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  graphType === 'biodiversity' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Biodiversity
              </button>
              
              <button
                onClick={() => setGraphType('environment')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  graphType === 'environment' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Environment
              </button>
              
              <button
                onClick={() => setGraphType('energy')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  graphType === 'energy' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Energy Flow
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Timespan:</span>
              <select
                value={graphTimespan}
                onChange={(e) => setGraphTimespan(parseInt(e.target.value))}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-1"
              >
                <option value="25">25 days</option>
                <option value="50">50 days</option>
                <option value="100">100 days</option>
                <option value="200">200 days</option>
                <option value="500">500 days</option>
              </select>
            </div>
          </div>
          
          <div style={{ height: '300px' }}>
            <PopulationGraph 
              statistics={state.statistics} 
              days={graphTimespan}
              type={graphType}
            />
          </div>
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Ecosystem Simulator &copy; {new Date().getFullYear()} | An agent-based modeling approach to ecological systems
          {extinctionCount > 0 && (
            <span className="ml-4 text-green-600 dark:text-green-400">
              • {extinctionCount} ecosystem{extinctionCount !== 1 ? 's' : ''} explored through auto-restart
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;