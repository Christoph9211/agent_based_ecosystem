import { 
  EnvironmentConfig, 
  Season, 
  Disturbance, 
  DisturbanceType, 
  SimulationConfig 
} from '../types/types';

export class Environment {
  config: EnvironmentConfig;
  day: number;
  yearLength: number;
  seasonLength: number;
  disturbances: Disturbance[];
  
  constructor(config: Partial<EnvironmentConfig> = {}, simulationConfig?: SimulationConfig) {
    this.day = 0;
    this.yearLength = 120; // 120 days per year (30 per season)
    this.seasonLength = this.yearLength / 4;
    
    // Initialize environment configuration
    this.config = {
      temperature: config.temperature || 25,
      rainfall: config.rainfall || 50,
      seasonalFactor: config.seasonalFactor || 1.0,
      nutrientLevel: config.nutrientLevel || 50,
      sunlightIntensity: config.sunlightIntensity || 80,
      width: config.width || (simulationConfig?.gridWidth || 50),
      height: config.height || (simulationConfig?.gridHeight || 50),
      pollutionLevel: config.pollutionLevel || 10,
      season: config.season || Season.Spring,
      day: config.day || 0,
    };
    
    this.disturbances = [];
  }

  update(): void {
    this.day += 1;
    this.config.day = this.day;
    
    // Update season
    const dayInYear = this.day % this.yearLength;
    const seasonIndex = Math.floor(dayInYear / this.seasonLength);
    
    const seasons = [Season.Spring, Season.Summer, Season.Fall, Season.Winter];
    this.config.season = seasons[seasonIndex];
    
    // Update seasonal factors
    this.updateSeasonalFactors();
    
    // Update disturbances
    this.updateDisturbances();
    
    // Reduced chance of random disturbance for stability
    if (Math.random() < 0.0005) { // Reduced from 0.002 to 0.0005 (0.05% chance per day)
      this.generateRandomDisturbance();
    }
  }

  private updateSeasonalFactors(): void {
    // Calculate position in current season (0-1)
    const dayInSeason = this.day % this.seasonLength;
    const seasonProgress = dayInSeason / this.seasonLength;
    
    switch (this.config.season) {
      case Season.Spring:
        // Temperature increases, rainfall increases
        this.config.temperature = 15 + 10 * seasonProgress;
        this.config.rainfall = 40 + 20 * seasonProgress;
        this.config.sunlightIntensity = 60 + 20 * seasonProgress;
        this.config.seasonalFactor = 0.7 + 0.3 * seasonProgress;
        break;
        
      case Season.Summer:
        // High temperature, decreasing rainfall
        this.config.temperature = 25 + 5 * (1 - seasonProgress);
        this.config.rainfall = 60 - 20 * seasonProgress;
        this.config.sunlightIntensity = 80 + 20 * (1 - seasonProgress);
        this.config.seasonalFactor = 1.0;
        break;
        
      case Season.Fall:
        // Temperature decreases, rainfall decreases
        this.config.temperature = 25 - 15 * seasonProgress;
        this.config.rainfall = 40 - 10 * seasonProgress;
        this.config.sunlightIntensity = 60 - 20 * seasonProgress;
        this.config.seasonalFactor = 0.7 - 0.2 * seasonProgress;
        break;
        
      case Season.Winter:
        // Low temperature, low rainfall
        this.config.temperature = 10 - 5 * seasonProgress;
        this.config.rainfall = 30 - 10 * (1 - seasonProgress);
        this.config.sunlightIntensity = 40 + 20 * seasonProgress;
        this.config.seasonalFactor = 0.5 + 0.2 * seasonProgress;
        break;
    }
    
    // Reduced random variations for stability
    this.config.temperature += (Math.random() * 2) - 1; // Reduced from +/- 3 to +/- 1 degrees
    this.config.rainfall += (Math.random() * 4) - 2; // Reduced from +/- 5 to +/- 2% rainfall
    
    // Ensure values stay within reasonable bounds
    this.config.temperature = Math.max(-10, Math.min(40, this.config.temperature));
    this.config.rainfall = Math.max(10, Math.min(100, this.config.rainfall));
    this.config.sunlightIntensity = Math.max(30, Math.min(100, this.config.sunlightIntensity));
  }

  private updateDisturbances(): void {
    // Update active disturbances
    this.disturbances = this.disturbances.filter(disturbance => {
      if (!disturbance.active) return false;
      
      disturbance.current += 1;
      
      // Check if disturbance has ended
      if (disturbance.current >= disturbance.duration) {
        disturbance.active = false;
        return false;
      }
      
      return true;
    });
  }

  addDisturbance(
    type: DisturbanceType, 
    intensity: number, 
    duration: number, 
    affectedArea: { startX: number; startY: number; endX: number; endY: number }
  ): Disturbance {
    const disturbance: Disturbance = {
      type,
      intensity,
      duration,
      affectedArea,
      current: 0,
      active: true,
    };
    
    this.disturbances.push(disturbance);
    
    // Apply immediate effects based on disturbance type
    switch (type) {
      case DisturbanceType.Fire:
        // Fire increases temperature
        this.config.temperature += 5 * intensity;
        break;
        
      case DisturbanceType.Drought:
        // Drought reduces rainfall
        this.config.rainfall *= (1 - 0.3 * intensity);
        break;
        
      case DisturbanceType.Flood:
        // Flood increases rainfall
        this.config.rainfall += 30 * intensity;
        break;
        
      case DisturbanceType.HumanActivity:
        // Human activity increases pollution
        this.config.pollutionLevel += 20 * intensity;
        break;
    }
    
    // Ensure environmental values stay within bounds
    this.config.temperature = Math.max(-10, Math.min(45, this.config.temperature));
    this.config.rainfall = Math.max(5, Math.min(100, this.config.rainfall));
    this.config.pollutionLevel = Math.max(0, Math.min(100, this.config.pollutionLevel));
    
    return disturbance;
  }

  private generateRandomDisturbance(): void {
    // Generate a random disturbance
    const disturbanceTypes = [
      DisturbanceType.Fire,
      DisturbanceType.Drought,
      DisturbanceType.Flood,
      DisturbanceType.Disease,
      DisturbanceType.HumanActivity,
    ];
    
    const type = disturbanceTypes[Math.floor(Math.random() * disturbanceTypes.length)];
    const intensity = 0.2 + Math.random() * 0.5; // Reduced from 0.3-1.0 to 0.2-0.7 for milder disturbances
    const duration = 3 + Math.floor(Math.random() * 8); // Reduced from 5-20 to 3-11 days
    
    // Random affected area
    const width = this.config.width;
    const height = this.config.height;
    
    const centerX = Math.floor(Math.random() * width);
    const centerY = Math.floor(Math.random() * height);
    
    const radius = Math.floor(Math.random() * (Math.min(width, height) / 6)) + 2; // Smaller affected areas
    
    const affectedArea = {
      startX: Math.max(0, centerX - radius),
      startY: Math.max(0, centerY - radius),
      endX: Math.min(width - 1, centerX + radius),
      endY: Math.min(height - 1, centerY + radius),
    };
    
    this.addDisturbance(type, intensity, duration, affectedArea);
  }

  getActiveDisturbances(): Disturbance[] {
    return this.disturbances.filter(d => d.active);
  }

  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }
}