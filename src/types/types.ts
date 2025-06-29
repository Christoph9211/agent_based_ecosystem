// Organism Types
export enum OrganismType {
  Producer = 'Producer',
  Consumer = 'Consumer',
  Decomposer = 'Decomposer',
}

export enum ConsumerType {
  Herbivore = 'Herbivore',
  Carnivore = 'Carnivore',
  Omnivore = 'Omnivore',
}

export interface Position {
  x: number;
  y: number;
}

export interface OrganismAttributes {
  id: string;
  type: OrganismType;
  position: Position;
  energy: number;
  size: number;
  age: number;
  maxAge: number;
  reproductionEnergy: number;
  reproductionRate: number;
  movementCost: number;
  isDead: boolean;
  species: string;
}

export interface ProducerAttributes extends OrganismAttributes {
  growthRate: number;
  photosynthesisRate: number;
  waterConsumption: number;
}

export interface ConsumerAttributes extends OrganismAttributes {
  consumerType: ConsumerType;
  huntingEfficiency: number;
  metabolismRate: number;
  diet: string[];
}

export interface DecomposerAttributes extends OrganismAttributes {
  decompositionRate: number;
  nutrientProductionRate: number;
}

// Environment Types
export interface EnvironmentConfig {
  temperature: number;
  rainfall: number;
  seasonalFactor: number;
  nutrientLevel: number;
  sunlightIntensity: number;
  width: number;
  height: number;
  pollutionLevel: number;
  season: Season;
  day: number;
}

export enum Season {
  Spring = 'Spring',
  Summer = 'Summer',
  Fall = 'Fall',
  Winter = 'Winter',
}

export enum DisturbanceType {
  Fire = 'Fire',
  Drought = 'Drought',
  Flood = 'Flood',
  Disease = 'Disease',
  HumanActivity = 'Human Activity',
  None = 'None',
}

export interface Disturbance {
  type: DisturbanceType;
  intensity: number; // 0-1
  duration: number; // in days
  affectedArea: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
  current: number; // current duration
  active: boolean;
}

// Grid Cell Types
export interface Cell {
  x: number;
  y: number;
  height: number; // Elevation of the cell (0 = sea level, higher values = elevated terrain)
  nutrientLevel: number;
  waterLevel: number;
  organisms: string[];
  temperature: number;
  pollutionLevel: number;
}

// Simulation Types
export interface SimulationConfig {
  gridWidth: number;
  gridHeight: number;
  initialProducers: number;
  initialHerbivores: number;
  initialCarnivores: number;
  initialDecomposers: number;
  simulationSpeed: number;
  initialTemperature: number;
  initialRainfall: number;
  enableEvolution: boolean;
  enableDisturbances: boolean;
}

export interface SimulationState {
  day: number;
  season: Season;
  environment: EnvironmentConfig;
  grid: Cell[][];
  organisms: Record<string, OrganismAttributes>;
  disturbance: Disturbance | null;
  statistics: SimulationStatistics;
  paused: boolean;
  cyclesPerSecond: number;
}

export interface SimulationStatistics {
  producers: number[];
  herbivores: number[];
  carnivores: number[];
  decomposers: number[];
  biodiversityIndex: number[];
  averageTemperature: number[];
  averageRainfall: number[];
  totalEnergy: number[];
  totalNutrients: number[];
  stabilityIndex: number[];
}

export interface SimulationControls {
  speed: number;
  paused: boolean;
}

export interface SavedSimulation {
  name: string;
  date: string;
  state: SimulationState;
  config: SimulationConfig;
}