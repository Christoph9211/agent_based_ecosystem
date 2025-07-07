import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  SimulationState, 
  SimulationConfig,
  SimulationStatistics, 
  OrganismType, 
  ConsumerType, 
  DisturbanceType,
  Season,
  Position,
  SavedSimulation,
  Disturbance
} from '../types/types';
import { Grid } from '../models/Grid';
import { Environment } from '../models/Environment';
import { Producer } from '../models/Producer';
import { Consumer } from '../models/Consumer';
import { Decomposer } from '../models/Decomposer';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: SimulationConfig = {
  gridWidth: 30,
  gridHeight: 30,
  initialProducers: 80, // Increased from 50 for stronger foundation
  initialHerbivores: 25, // Slightly increased from 20
  initialCarnivores: 8, // Increased from 5 for better balance
  initialDecomposers: 100, // Increased from 15 for better nutrient cycling
  simulationSpeed: 1,
  initialTemperature: 25,
  initialRainfall: 30,
  enableEvolution: true,
  enableDisturbances: false, // Disabled initially for stability
};

const EMPTY_STATS: SimulationStatistics = {
  producers: [],
  herbivores: [],
  carnivores: [],
  decomposers: [],
  biodiversityIndex: [],
  averageTemperature: [],
  averageRainfall: [],
  totalEnergy: [],
  totalNutrients: [],
  stabilityIndex: [],
};

// Generate randomized simulation configuration
const generateRandomConfig = (): SimulationConfig => {
  return {
    gridWidth: 25 + Math.floor(Math.random() * 15), // 25-40
    gridHeight: 25 + Math.floor(Math.random() * 15), // 25-40
    initialProducers: 60 + Math.floor(Math.random() * 40), // 60-100
    initialHerbivores: 15 + Math.floor(Math.random() * 20), // 15-35
    initialCarnivores: 5 + Math.floor(Math.random() * 10), // 5-15
    initialDecomposers: 50 + Math.floor(Math.random() * 20), // 15-35
    simulationSpeed: 1,
    initialTemperature: 20 + Math.random() * 10, // 20-30°C
    initialRainfall: 40 + Math.random() * 40, // 40-80%
    enableEvolution: true,
    enableDisturbances: Math.random() > 0.5, // 50% chance
  };
};

export function useSimulation(initialConfig: Partial<SimulationConfig> = {}) {
  // Create merged configuration
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG, ...initialConfig });
  
  // Auto-restart state
  const [autoRestartOnExtinction, setAutoRestartOnExtinction] = useState(true);
  const [extinctionCount, setExtinctionCount] = useState(0);
  const [lastExtinctionDay, setLastExtinctionDay] = useState(0);
  
  // Simulation state
  const [state, setState] = useState<SimulationState>({
    day: 0,
    season: Season.Spring,
    environment: {
      temperature: config.initialTemperature,
      rainfall: config.initialRainfall,
      seasonalFactor: 1.0,
      nutrientLevel: 50,
      sunlightIntensity: 80,
      width: config.gridWidth,
      height: config.gridHeight,
      pollutionLevel: 10,
      season: Season.Spring,
      day: 0,
    },
    grid: Array(config.gridHeight).fill(null).map(() => Array(config.gridWidth).fill(null)),
    organisms: {},
    disturbance: null,
    statistics: { ...EMPTY_STATS },
    paused: true,
    cyclesPerSecond: config.simulationSpeed,
  });
  
  // References to simulation objects
  const gridRef = useRef<Grid | null>(null);
  const environmentRef = useRef<Environment | null>(null);
  const simulationIntervalRef = useRef<number | null>(null);
  const cycleCountRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  
  // Initialize simulation
  const initialize = useCallback((newConfig?: SimulationConfig) => {
    const configToUse = newConfig || config;
    
    // Update config if new one provided
    if (newConfig) {
      setConfig(newConfig);
    }
    
    // Create environment
    const environment = new Environment(
      {
        temperature: configToUse.initialTemperature,
        rainfall: configToUse.initialRainfall,
      },
      configToUse
    );
    environmentRef.current = environment;
    
    // Create grid
    const grid = new Grid(configToUse.gridWidth, configToUse.gridHeight, environment.getConfig());
    gridRef.current = grid;
    
    // Initialize organisms
    const organisms: Record<string, any> = {};
    
    // Add producers (plants) - improved parameters for stability
    for (let i = 0; i < configToUse.initialProducers; i++) {
      const position = {
        x: Math.floor(Math.random() * configToUse.gridWidth),
        y: Math.floor(Math.random() * configToUse.gridHeight),
      };
      
      const producer = new Producer({
        position,
        energy: 120 + Math.random() * 40, // Increased base energy
        size: 0.6 + Math.random() * 1.2, // Slightly larger starting size
        maxAge: 90 + Math.floor(Math.random() * 30), // Longer lifespan
        reproductionRate: 0.12 + Math.random() * 0.15, // Slightly higher reproduction
        reproductionEnergy: 110 + Math.random() * 50, // Lower energy threshold
        species: 'Basic Plant',
        growthRate: 0.06 + Math.random() * 0.08, // Slightly higher growth
        photosynthesisRate: 0.15 + Math.random() * 0.15, // Improved photosynthesis
      });
      
      organisms[producer.id] = producer.getAttributes();
      grid.addOrganism(producer.getAttributes());
    }
    
    // Add herbivores - adjusted for better survival
    for (let i = 0; i < configToUse.initialHerbivores; i++) {
      const position = {
        x: Math.floor(Math.random() * configToUse.gridWidth),
        y: Math.floor(Math.random() * configToUse.gridHeight),
      };
      
      const consumer = new Consumer({
        position,
        energy: 180 + Math.random() * 40, // Higher starting energy
        size: 1.0 + Math.random() * 0.8, // Slightly smaller for efficiency
        maxAge: 70 + Math.floor(Math.random() * 25), // Longer lifespan
        reproductionRate: 0.06 + Math.random() * 0.12, // Slightly higher reproduction
        reproductionEnergy: 160 + Math.random() * 30, // Lower threshold
        species: 'Herbivore',
        consumerType: ConsumerType.Herbivore,
        huntingEfficiency: 0.5 + Math.random() * 0.25, // Better hunting
        metabolismRate: 0.06 + Math.random() * 0.03, // Lower metabolism
        movementCost: 0.6 + Math.random() * 0.3, // Lower movement cost
        diet: ['Basic Plant'],
      });
      
      organisms[consumer.id] = consumer.getAttributes();
      grid.addOrganism(consumer.getAttributes());
    }
    
    // Add carnivores - balanced for ecosystem stability
    for (let i = 0; i < configToUse.initialCarnivores; i++) {
      const position = {
        x: Math.floor(Math.random() * configToUse.gridWidth),
        y: Math.floor(Math.random() * configToUse.gridHeight),
      };
      
      const consumer = new Consumer({
        position,
        energy: 220 + Math.random() * 80, // Higher starting energy
        size: 1.8 + Math.random() * 1.5, // Slightly smaller
        maxAge: 80 + Math.floor(Math.random() * 30), // Longer lifespan
        reproductionRate: 0.04 + Math.random() * 0.06, // Slightly higher reproduction
        reproductionEnergy: 220 + Math.random() * 40, // Lower threshold
        species: 'Carnivore',
        consumerType: ConsumerType.Carnivore,
        huntingEfficiency: 0.6 + Math.random() * 0.3, // Better hunting
        metabolismRate: 0.08 + Math.random() * 0.04, // Lower metabolism
        movementCost: 1.0 + Math.random() * 0.4, // Lower movement cost
        diet: ['Herbivore'],
      });
      
      organisms[consumer.id] = consumer.getAttributes();
      grid.addOrganism(consumer.getAttributes());
    }
    
    // Add decomposers - enhanced for better nutrient cycling
    for (let i = 0; i < configToUse.initialDecomposers; i++) {
      const position = {
        x: Math.floor(Math.random() * configToUse.gridWidth),
        y: Math.floor(Math.random() * configToUse.gridHeight),
      };
      
      const decomposer = new Decomposer({
        position,
        energy: 100 + Math.random() * 30, // Higher starting energy
        size: 0.4 + Math.random() * 0.6, // Slightly larger
        maxAge: 75 + Math.floor(Math.random() * 15), // Longer lifespan
        reproductionRate: 0.25 + Math.random() * 0.15, // Higher reproduction
        reproductionEnergy: 90 + Math.random() * 40, // Lower threshold
        species: 'Decomposer',
        decompositionRate: 0.25 + Math.random() * 0.25, // Higher decomposition
        nutrientProductionRate: 0.3 + Math.random() * 0.2, // Better nutrient production
        movementCost: 0.2 + Math.random() * 0.2, // Lower movement cost
      });
      
      organisms[decomposer.id] = decomposer.getAttributes();
      grid.addOrganism(decomposer.getAttributes());
    }
    
    // Update state
    setState({
      day: 0,
      season: Season.Spring,
      environment: environment.getConfig(),
      grid: grid.cells,
      organisms,
      disturbance: null,
      statistics: { ...EMPTY_STATS },
      paused: true,
      cyclesPerSecond: configToUse.simulationSpeed,
    });
    
  }, [config]);
  
  // Check for extinction and handle auto-restart
  const checkForExtinction = useCallback((newOrganisms: Record<string, any>, currentDay: number) => {
    const producerCount = Object.values(newOrganisms).filter(o => o.type === OrganismType.Producer).length;
    const herbivoreCount = Object.values(newOrganisms).filter(
      o => o.type === OrganismType.Consumer && (o as any).consumerType === ConsumerType.Herbivore
    ).length;
    const carnivoreCount = Object.values(newOrganisms).filter(
      o => o.type === OrganismType.Consumer && (o as any).consumerType === ConsumerType.Carnivore
    ).length;
    const decomposerCount = Object.values(newOrganisms).filter(o => o.type === OrganismType.Decomposer).length;
    
    const totalOrganisms = producerCount + herbivoreCount + carnivoreCount + decomposerCount;
    
    // Check for extinction (all organisms dead)
    if (totalOrganisms === 0 && autoRestartOnExtinction) {
      console.log(`Extinction detected on day ${currentDay}. Auto-restarting with new parameters...`);
      
      // Update extinction statistics
      setExtinctionCount(prev => prev + 1);
      setLastExtinctionDay(currentDay);
      
      // Generate new random configuration
      const newConfig = generateRandomConfig();
      
      // Small delay before restart to allow UI to update
      setTimeout(() => {
        initialize(newConfig);
        
        // Auto-start the new simulation
        setState(prev => ({ ...prev, paused: false }));
      }, 100);
      
      return true; // Extinction occurred
    }
    
    return false; // No extinction
  }, [autoRestartOnExtinction, initialize]);
  
  // Run one cycle of the simulation
  const runCycle = useCallback(() => {
    if (!environmentRef.current || !gridRef.current) return;
    
    // Update environment
    environmentRef.current.update();
    const environmentConfig = environmentRef.current.getConfig();
    
    // Get active disturbances
    const activeDisturbances = environmentRef.current.getActiveDisturbances();
    
    // Update grid environment
    gridRef.current.updateEnvironment(environmentConfig);
    
    // Apply disturbances to grid
    for (const disturbance of activeDisturbances) {
      gridRef.current.applyDisturbance(
        disturbance.affectedArea.startX,
        disturbance.affectedArea.startY,
        disturbance.affectedArea.endX,
        disturbance.affectedArea.endY,
        disturbance.type,
        disturbance.intensity
      );
    }
    
    // Update state to reflect new simulation state
    setState(prevState => {
      // Create copies of organisms and statistics to modify
      const newOrganisms = { ...prevState.organisms };
      const deadOrganisms: string[] = [];
      const newStatistics = { ...prevState.statistics };
      
      // Create maps to track changes to avoid concurrent modification issues
      const positionChanges: Map<string, { oldPos: Position; newPos: Position }> = new Map();
      const newOrganismsToAdd: any[] = [];
      
      // Count dead organisms per cell for decomposers
      const deadOrganismsCounts: Record<string, number> = {};
      
      for (const [id, organism] of Object.entries(newOrganisms)) {
        if (organism.isDead) {
          deadOrganisms.push(id);
          const cellKey = `${organism.position.x},${organism.position.y}`;
          deadOrganismsCounts[cellKey] = (deadOrganismsCounts[cellKey] || 0) + 1;
          continue;
        }
        
        // Get current cell
        const cell = gridRef.current?.getCell(organism.position);
        if (!cell) continue;
        
        // Update organisms by type
        if (organism.type === OrganismType.Producer) {
          const producer = new Producer(organism);
          producer.update(environmentConfig, cell.nutrientLevel, cell.waterLevel);
          newOrganisms[id] = producer.getAttributes();
          
          // Handle reproduction
          if (producer.canReproduce()) {
            const offspringPosition = gridRef.current?.findAvailablePosition(producer.position, 2);
            if (offspringPosition) {
              const offspring = producer.reproduce();
              offspring.position = offspringPosition;
              newOrganismsToAdd.push(offspring);
            }
          }
        } 
        else if (organism.type === OrganismType.Consumer) {
          const consumer = new Consumer(organism);
          consumer.update(environmentConfig);
          
          // Move consumers
          if (Math.random() < 0.8) { // 80% chance to move
            // Find nearby cells and choose one
            const validMoves: Position[] = [];
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                
                const newPos = { 
                  x: consumer.position.x + dx, 
                  y: consumer.position.y + dy 
                };
                
                // Check if position is valid
                if (
                  newPos.x >= 0 && newPos.x < environmentConfig.width &&
                  newPos.y >= 0 && newPos.y < environmentConfig.height
                ) {
                  validMoves.push(newPos);
                }
              }
            }
            
            if (validMoves.length > 0) {
              const newPos = validMoves[Math.floor(Math.random() * validMoves.length)];
              const oldPos = { ...consumer.position };
              consumer.move(newPos);
              positionChanges.set(consumer.id, { oldPos, newPos });
            }
          }
          
          // Consumers try to eat
          if (consumer.consumerType !== ConsumerType.Carnivore) {
            // Herbivores and omnivores can eat plants
            const nearbyProducers = gridRef.current?.getNearbyOrganisms(consumer.position, 1)
              .filter(id => 
                newOrganisms[id] && 
                newOrganisms[id].type === OrganismType.Producer &&
                !newOrganisms[id].isDead
              );
              
            if (nearbyProducers && nearbyProducers.length > 0) {
              const targetId = nearbyProducers[Math.floor(Math.random() * nearbyProducers.length)];
              const target = newOrganisms[targetId];
              
              if (target && consumer.canEat(target)) {
                const targetInstance = new Producer(target);
                consumer.eat(targetInstance);
                newOrganisms[targetId] = targetInstance.getAttributes();
              }
            }
          } 
          
          if (consumer.consumerType !== ConsumerType.Herbivore) {
            // Carnivores and omnivores can eat consumers
            const nearbyConsumers = gridRef.current?.getNearbyOrganisms(consumer.position, 2)
              .filter(id => 
                newOrganisms[id] && 
                newOrganisms[id].type === OrganismType.Consumer &&
                newOrganisms[id].id !== consumer.id &&
                !newOrganisms[id].isDead
              );
              
            if (nearbyConsumers && nearbyConsumers.length > 0) {
              const targetId = nearbyConsumers[Math.floor(Math.random() * nearbyConsumers.length)];
              const target = newOrganisms[targetId];
              
              // Check if target is valid prey (herbivores eat plants, carnivores eat herbivores)
              if (target && consumer.canEat(target)) {
                const targetInstance = new Consumer(target);
                consumer.eat(targetInstance);
                newOrganisms[targetId] = targetInstance.getAttributes();
              }
            }
          }
          
          // Handle reproduction
          if (consumer.canReproduce()) {
            const offspringPosition = gridRef.current?.findAvailablePosition(consumer.position, 3);
            if (offspringPosition) {
              const offspring = consumer.reproduce();
              offspring.position = offspringPosition;
              newOrganismsToAdd.push(offspring);
            }
          }
          
          newOrganisms[id] = consumer.getAttributes();
        } 
        else if (organism.type === OrganismType.Decomposer) {
          const decomposer = new Decomposer(organism);
          const cellKey = `${decomposer.position.x},${decomposer.position.y}`;
          const deadCount = deadOrganismsCounts[cellKey] || 0;
          
          const { nutrientsProduced } = decomposer.update(environmentConfig, deadCount);
          
          // Add nutrients to cell
          if (nutrientsProduced > 0) {
            gridRef.current?.addNutrients(decomposer.position, nutrientsProduced);
          }
          
          // Move decomposers occasionally
          if (Math.random() < 0.4) { // 40% chance to move
            // Find nearby cells with dead organisms
            const validMoves: Position[] = [];
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                
                const newPos = { 
                  x: decomposer.position.x + dx, 
                  y: decomposer.position.y + dy 
                };
                
                // Check if position is valid
                if (
                  newPos.x >= 0 && newPos.x < environmentConfig.width &&
                  newPos.y >= 0 && newPos.y < environmentConfig.height
                ) {
                  // Prefer cells with dead organisms
                  const moveCellKey = `${newPos.x},${newPos.y}`;
                  const deadAtTarget = deadOrganismsCounts[moveCellKey] || 0;
                  
                  // Add position multiple times based on dead count to increase probability
                  for (let i = 0; i < deadAtTarget + 1; i++) {
                    validMoves.push(newPos);
                  }
                }
              }
            }
            
            if (validMoves.length > 0) {
              const newPos = validMoves[Math.floor(Math.random() * validMoves.length)];
              const oldPos = { ...decomposer.position };
              decomposer.move(newPos);
              positionChanges.set(decomposer.id, { oldPos, newPos });
            }
          }
          
          // Decomposers can consume dead organisms
          if (deadCount > 0) {
            // Attempt to decompose a dead organism in same cell
            const cellOrganisms = cell.organisms
              .filter(id => 
                newOrganisms[id] && 
                newOrganisms[id].isDead
              );
              
            if (cellOrganisms.length > 0) {
              const targetId = cellOrganisms[Math.floor(Math.random() * cellOrganisms.length)];
              if (newOrganisms[targetId]) {
                const nutrients = decomposer.decompose(newOrganisms[targetId]);
                gridRef.current?.addNutrients(decomposer.position, nutrients);
                
                // Mark this organism for removal
                if (deadOrganisms.indexOf(targetId) === -1) {
                  deadOrganisms.push(targetId);
                }
              }
            }
          }
          
          // Handle reproduction
          if (decomposer.canReproduce()) {
            const offspringPosition = gridRef.current?.findAvailablePosition(decomposer.position, 2);
            if (offspringPosition) {
              const offspring = decomposer.reproduce();
              offspring.position = offspringPosition;
              newOrganismsToAdd.push(offspring);
            }
          }
          
          newOrganisms[id] = decomposer.getAttributes();
        }
      }
      
      // Update positions in grid
      for (const [id, move] of positionChanges.entries()) {
        gridRef.current?.moveOrganism(id, move.oldPos, move.newPos);
        newOrganisms[id].position = move.newPos;
      }
      
      // Add new organisms
      for (const newOrganism of newOrganismsToAdd) {
        newOrganisms[newOrganism.id] = newOrganism.getAttributes();
        gridRef.current?.addOrganism(newOrganism.getAttributes());
      }
      
      // Remove dead organisms
      for (const id of deadOrganisms) {
        if (newOrganisms[id]) {
          gridRef.current?.removeOrganism(id, newOrganisms[id].position);
          delete newOrganisms[id];
        }
      }
      
      // Update statistics
      const producerCount = Object.values(newOrganisms).filter(o => o.type === OrganismType.Producer).length;
      const herbivoreCount = Object.values(newOrganisms).filter(
        o => o.type === OrganismType.Consumer && (o as any).consumerType === ConsumerType.Herbivore
      ).length;
      const carnivoreCount = Object.values(newOrganisms).filter(
        o => o.type === OrganismType.Consumer && (o as any).consumerType === ConsumerType.Carnivore
      ).length;
      const decomposerCount = Object.values(newOrganisms).filter(o => o.type === OrganismType.Decomposer).length;
      
      // Check for extinction before updating state
      const extinctionOccurred = checkForExtinction(newOrganisms, environmentConfig.day);
      if (extinctionOccurred) {
        // Return current state without updating if extinction restart is happening
        return prevState;
      }
      
      // Calculate total energy in system
      const totalEnergy = Object.values(newOrganisms).reduce((sum, o) => sum + o.energy, 0);
      
      // Calculate total nutrients in grid
      const totalNutrients = gridRef.current?.cells.reduce(
        (sum, row) => sum + row.reduce((rowSum, cell) => rowSum + cell.nutrientLevel, 0), 
        0
      ) || 0;
      
      // Calculate biodiversity index (simple Shannon index approximation)
      const speciesCounts: Record<string, number> = {};
      for (const organism of Object.values(newOrganisms)) {
        speciesCounts[organism.species] = (speciesCounts[organism.species] || 0) + 1;
      }
      
      const totalOrganisms = Object.values(speciesCounts).reduce((sum, count) => sum + count, 0);
      let biodiversity = 0;
      
      for (const count of Object.values(speciesCounts)) {
        const proportion = count / totalOrganisms;
        biodiversity -= proportion * Math.log(proportion);
      }
      
      // Calculate stability index (variation in population over time)
      let stabilityIndex = 1.0;
      if (newStatistics.producers.length > 10) {
        const recentProducers = newStatistics.producers.slice(-10);
        const avgProducers = recentProducers.reduce((sum, val) => sum + val, 0) / recentProducers.length;
        const variationProducers = recentProducers.reduce((sum, val) => sum + Math.abs(val - avgProducers), 0) / avgProducers;
        
        const recentHerbivores = newStatistics.herbivores.slice(-10);
        const avgHerbivores = recentHerbivores.reduce((sum, val) => sum + val, 0) / recentHerbivores.length;
        const variationHerbivores = avgHerbivores > 0 ? 
          recentHerbivores.reduce((sum, val) => sum + Math.abs(val - avgHerbivores), 0) / avgHerbivores : 0;
        
        stabilityIndex = Math.max(0, 1.0 - (variationProducers + variationHerbivores) / 4);
      }
      
      // Update statistics
      newStatistics.producers.push(producerCount);
      newStatistics.herbivores.push(herbivoreCount);
      newStatistics.carnivores.push(carnivoreCount);
      newStatistics.decomposers.push(decomposerCount);
      newStatistics.biodiversityIndex.push(biodiversity);
      newStatistics.averageTemperature.push(environmentConfig.temperature);
      newStatistics.averageRainfall.push(environmentConfig.rainfall);
      newStatistics.totalEnergy.push(totalEnergy);
      newStatistics.totalNutrients.push(totalNutrients);
      newStatistics.stabilityIndex.push(stabilityIndex);
      
      // Limit statistics array length to prevent memory issues
      if (newStatistics.producers.length > 500) {
        for (const key in newStatistics) {
          if (Array.isArray(newStatistics[key as keyof SimulationStatistics])) {
            (newStatistics[key as keyof SimulationStatistics] as any) = 
              (newStatistics[key as keyof SimulationStatistics] as any).slice(-500);
          }
        }
      }
      
      // Return updated state
      return {
        ...prevState,
        day: environmentConfig.day,
        season: environmentConfig.season,
        environment: environmentConfig,
        grid: gridRef.current?.cells || prevState.grid,
        organisms: newOrganisms,
        disturbance: activeDisturbances.length > 0 ? activeDisturbances[0] : null,
        statistics: newStatistics,
      };
    });
    
  }, [checkForExtinction]);
  
  // Step forward one day
  const step = useCallback(() => {
    if (!environmentRef.current || !gridRef.current) return;
    runCycle();
  }, [runCycle]);
  
  // Start/stop simulation
  const togglePause = useCallback(() => {
    setState(prev => ({ ...prev, paused: !prev.paused }));
  }, []);
  
  // Change simulation speed
  const setSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, cyclesPerSecond: speed }));
  }, []);
  
  // Toggle auto-restart on extinction
  const toggleAutoRestart = useCallback(() => {
    setAutoRestartOnExtinction(prev => !prev);
  }, []);
  
  // Add disturbance to simulation
  const addDisturbance = useCallback((
    type: DisturbanceType, 
    intensity: number, 
    duration: number, 
    area?: { startX: number; startY: number; endX: number; endY: number }
  ) => {
    if (!environmentRef.current || !gridRef.current) return null;
    
    const width = environmentRef.current.config.width;
    const height = environmentRef.current.config.height;
    
    // Default to center area if not specified
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const radius = Math.floor(Math.min(width, height) / 4);
    
    const affectedArea = area || {
      startX: Math.max(0, centerX - radius),
      startY: Math.max(0, centerY - radius),
      endX: Math.min(width - 1, centerX + radius),
      endY: Math.min(height - 1, centerY + radius),
    };
    
    const disturbance = environmentRef.current.addDisturbance(type, intensity, duration, affectedArea);
    
    // Update state with new disturbance
    setState(prev => ({
      ...prev,
      disturbance,
    }));
    
    return disturbance;
  }, []);
  
  // Reset simulation
  const reset = useCallback((newConfig?: SimulationConfig) => {
    initialize(newConfig);
  }, [initialize]);
  
  // Save simulation state
  const saveSimulation = useCallback((name: string): SavedSimulation => {
    const savedState: SavedSimulation = {
      name,
      date: new Date().toISOString(),
      state: { ...state },
      config: { ...config },
    };
    
    return savedState;
  }, [state, config]);
  
  // Load simulation state
  const loadSimulation = useCallback((savedSimulation: SavedSimulation) => {
    if (!savedSimulation || !savedSimulation.state) return;
    
    // Recreate environment and grid from saved state
    const environment = new Environment(savedSimulation.state.environment, savedSimulation.config);
    environmentRef.current = environment;
    
    const grid = new Grid(
      savedSimulation.state.environment.width,
      savedSimulation.state.environment.height,
      environment.getConfig()
    );
    
    // Repopulate grid with organisms
    for (const organism of Object.values(savedSimulation.state.organisms)) {
      grid.addOrganism(organism);
    }
    
    gridRef.current = grid;
    
    // Update state and config
    setState(savedSimulation.state);
    setConfig(savedSimulation.config);
  }, []);
  
  // Run simulation loop
  useEffect(() => {
    if (state.paused) {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      return;
    }
    
    const targetCyclesPerSecond = state.cyclesPerSecond;
    
    simulationIntervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastUpdateTimeRef.current;
      
      // Calculate how many cycles should have occurred in the elapsed time
      const targetCycles = (targetCyclesPerSecond * elapsed) / 1000;
      
      if (cycleCountRef.current + 1 < targetCycles) {
        // Run multiple cycles to catch up
        const cyclesToRun = Math.min(5, Math.floor(targetCycles - cycleCountRef.current));
        for (let i = 0; i < cyclesToRun; i++) {
          runCycle();
        }
        cycleCountRef.current += cyclesToRun;
      } else {
        // Run a single cycle
        runCycle();
        cycleCountRef.current += 1;
      }
      
      // Reset counters if too much time has passed
      if (elapsed > 1000) {
        lastUpdateTimeRef.current = now;
        cycleCountRef.current = 0;
      }
    }, 1000 / 30); // Update at 30fps for smooth UI
    
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    };
  }, [state.paused, state.cyclesPerSecond, runCycle]);
  
  // Initialize on first render
  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return {
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
  };
}

export default useSimulation;
