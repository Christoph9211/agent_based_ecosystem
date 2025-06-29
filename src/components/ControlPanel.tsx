import React, { useState } from 'react';
import { PlayCircle, PauseCircle, FastForward, SkipForward, RefreshCw, Flame, Droplet, Cloud, FlaskConical, Building2, RotateCcw, Settings } from 'lucide-react';
import { DisturbanceType, SimulationConfig } from '../types/types';

interface ControlPanelProps {
  day: number;
  season: string;
  temperature: number;
  rainfall: number;
  paused: boolean;
  speed: number;
  producerCount: number;
  herbivoreCount: number;
  carnivoreCount: number;
  decomposerCount: number;
  autoRestartOnExtinction: boolean;
  extinctionCount: number;
  lastExtinctionDay: number;
  onPauseToggle: () => void;
  onStepForward: () => void;
  onSpeedChange: (speed: number) => void;
  onAddDisturbance: (type: DisturbanceType, intensity: number, duration: number) => void;
  onReset: () => void;
  onRandomRestart: () => void;
  onSave: (name: string) => void;
  onToggleAutoRestart: () => void;
  onConfigChange: (config: Partial<SimulationConfig>) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  day,
  season,
  temperature,
  rainfall,
  paused,
  speed,
  producerCount,
  herbivoreCount,
  carnivoreCount,
  decomposerCount,
  autoRestartOnExtinction,
  extinctionCount,
  lastExtinctionDay,
  onPauseToggle,
  onStepForward,
  onSpeedChange,
  onAddDisturbance,
  onReset,
  onRandomRestart,
  onSave,
  onToggleAutoRestart,
  onConfigChange,
}) => {
  const [simulationName, setSimulationName] = useState('');
  const [disturbanceType, setDisturbanceType] = useState<DisturbanceType>(DisturbanceType.Fire);
  const [disturbanceIntensity, setDisturbanceIntensity] = useState(0.7);
  const [disturbanceDuration, setDisturbanceDuration] = useState(10);
  
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(e.target.value);
    onSpeedChange(newSpeed);
  };
  
  const handleAddDisturbance = () => {
    onAddDisturbance(disturbanceType, disturbanceIntensity, disturbanceDuration);
  };
  
  const handleSave = () => {
    if (simulationName.trim()) {
      onSave(simulationName);
      setSimulationName('');
    }
  };
  
  const totalOrganisms = producerCount + herbivoreCount + carnivoreCount + decomposerCount;
  const isExtinct = totalOrganisms === 0;
  
  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center space-x-2">
          <button 
            onClick={onPauseToggle}
            className="focus:outline-none text-primary-600 dark:text-primary-400"
          >
            {paused ? (
              <PlayCircle size={32} className="text-primary-600" />
            ) : (
              <PauseCircle size={32} className="text-primary-600" />
            )}
          </button>
          
          <button 
            onClick={onStepForward}
            className="focus:outline-none text-primary-600 dark:text-primary-400"
            disabled={!paused}
          >
            <SkipForward 
              size={24} 
              className={paused ? "text-primary-600" : "text-gray-400"}
            />
          </button>
          
          <div className="ml-2 flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Speed:</span>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={speed}
              onChange={handleSpeedChange}
              className="w-24"
            />
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">{speed}x</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={onRandomRestart}
            className="px-3 py-1 bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-200 rounded-md flex items-center space-x-1 text-sm hover:bg-purple-300 dark:hover:bg-purple-600 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Random</span>
          </button>
          
          <button 
            onClick={onReset}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md flex items-center space-x-1 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-secondary-50 dark:bg-gray-700 p-3 rounded-md">
          <div className="text-xs text-gray-500 dark:text-gray-400">Day</div>
          <div className="font-bold text-lg text-gray-800 dark:text-white">{day}</div>
          <div className="text-sm text-primary-600 dark:text-primary-400">{season}</div>
        </div>
        
        <div className="bg-secondary-50 dark:bg-gray-700 p-3 rounded-md">
          <div className="text-xs text-gray-500 dark:text-gray-400">Temperature</div>
          <div className="font-bold text-lg text-gray-800 dark:text-white">{temperature.toFixed(1)}°C</div>
          <div className="text-sm text-primary-600 dark:text-primary-400">Rainfall: {rainfall.toFixed(1)}%</div>
        </div>
        
        <div className="bg-secondary-50 dark:bg-gray-700 p-3 rounded-md">
          <div className="text-xs text-gray-500 dark:text-gray-400">Producers</div>
          <div className="font-bold text-lg text-gray-800 dark:text-white">{producerCount}</div>
          <div className="text-sm text-primary-600 dark:text-primary-400">Decomposers: {decomposerCount}</div>
        </div>
        
        <div className="bg-secondary-50 dark:bg-gray-700 p-3 rounded-md">
          <div className="text-xs text-gray-500 dark:text-gray-400">Consumers</div>
          <div className="font-bold text-lg text-gray-800 dark:text-white">{herbivoreCount + carnivoreCount}</div>
          <div className="text-sm flex justify-between">
            <span className="text-blue-600 dark:text-blue-400">H: {herbivoreCount}</span>
            <span className="text-red-600 dark:text-red-400">C: {carnivoreCount}</span>
          </div>
        </div>
      </div>
      
      {/* Auto-restart controls */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Auto-Restart Settings</h3>
          <button
            onClick={onToggleAutoRestart}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              autoRestartOnExtinction
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
          >
            {autoRestartOnExtinction ? 'Enabled' : 'Disabled'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
            <div className={`font-medium ${isExtinct ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {isExtinct ? 'Extinct' : 'Active'}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">Restarts</div>
            <div className="font-medium text-gray-800 dark:text-gray-200">{extinctionCount}</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">Last Extinction</div>
            <div className="font-medium text-gray-800 dark:text-gray-200">
              {lastExtinctionDay > 0 ? `Day ${lastExtinctionDay}` : 'None'}
            </div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          When enabled, the simulation automatically restarts with randomized parameters if all organisms go extinct.
        </p>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Disturbances</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <select
              value={disturbanceType}
              onChange={(e) => setDisturbanceType(e.target.value as DisturbanceType)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
            >
              <option value={DisturbanceType.Fire}>Fire</option>
              <option value={DisturbanceType.Drought}>Drought</option>
              <option value={DisturbanceType.Flood}>Flood</option>
              <option value={DisturbanceType.Disease}>Disease</option>
              <option value={DisturbanceType.HumanActivity}>Human Activity</option>
            </select>
            
            {disturbanceType === DisturbanceType.Fire && <Flame size={18} className="text-red-500" />}
            {disturbanceType === DisturbanceType.Drought && <Droplet size={18} className="text-amber-500" />}
            {disturbanceType === DisturbanceType.Flood && <Cloud size={18} className="text-blue-500" />}
            {disturbanceType === DisturbanceType.Disease && <FlaskConical size={18} className="text-green-500" />}
            {disturbanceType === DisturbanceType.HumanActivity && <Building2 size={18} className="text-gray-500" />}
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-600 dark:text-gray-400">Intensity:</label>
              <span className="text-xs text-gray-800 dark:text-gray-200">{(disturbanceIntensity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={disturbanceIntensity}
              onChange={(e) => setDisturbanceIntensity(parseFloat(e.target.value))}
              className="w-full"
            />
            
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-600 dark:text-gray-400">Duration:</label>
              <span className="text-xs text-gray-800 dark:text-gray-200">{disturbanceDuration} days</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={disturbanceDuration}
              onChange={(e) => setDisturbanceDuration(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <button
          onClick={handleAddDisturbance}
          className="mt-2 w-full py-2 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-md transition-colors"
        >
          Trigger Disturbance
        </button>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Save simulation as..."
            value={simulationName}
            onChange={(e) => setSimulationName(e.target.value)}
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <button
            onClick={handleSave}
            disabled={!simulationName.trim()}
            className={`px-4 py-2 ${
              simulationName.trim() 
                ? 'bg-primary-500 hover:bg-primary-600' 
                : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
            } text-white font-medium rounded-md transition-colors`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;