import { Cell, OrganismAttributes, OrganismType, Position, EnvironmentConfig } from '../types/types';

export class Grid {
  width: number;
  height: number;
  cells: Cell[][];

  constructor(width: number, height: number, environmentConfig: EnvironmentConfig) {
    this.width = width;
    this.height = height;
    this.cells = this.initializeGrid(environmentConfig);
  }

  private initializeGrid(environmentConfig: EnvironmentConfig): Cell[][] {
    const grid: Cell[][] = [];
    
    for (let y = 0; y < this.height; y++) {
      const row: Cell[] = [];
      
      for (let x = 0; x < this.width; x++) {
        // Create terrain variations
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - this.width / 2, 2) + Math.pow(y - this.height / 2, 2)
        );
        const normalizedDistance = distanceFromCenter / (Math.sqrt(Math.pow(this.width / 2, 2) + Math.pow(this.height / 2, 2)));
        
        // Generate elevation using multiple techniques for varied terrain
        let cellHeight = 0;
        
        // Central island - create a large elevated area in the center
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const islandRadius = Math.min(this.width, this.height) * 0.25;
        const distanceFromIslandCenter = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        
        if (distanceFromIslandCenter < islandRadius) {
          // Create a smooth elevation gradient for the central island
          const elevationFactor = 1 - (distanceFromIslandCenter / islandRadius);
          cellHeight = Math.max(cellHeight, elevationFactor * 2.5); // Max height of 2.5 units
        }
        
        // Add some smaller hills scattered around
        const numHills = 3;
        for (let i = 0; i < numHills; i++) {
          const hillX = (this.width * 0.2) + (Math.random() * this.width * 0.6);
          const hillY = (this.height * 0.2) + (Math.random() * this.height * 0.6);
          const hillRadius = 3 + Math.random() * 5;
          const distanceFromHill = Math.sqrt(
            Math.pow(x - hillX, 2) + Math.pow(y - hillY, 2)
          );
          
          if (distanceFromHill < hillRadius) {
            const hillElevationFactor = 1 - (distanceFromHill / hillRadius);
            cellHeight = Math.max(cellHeight, hillElevationFactor * (0.8 + Math.random() * 1.2));
          }
        }
        
        // Add some noise for natural variation
        cellHeight += (Math.random() - 0.5) * 0.3;
        cellHeight = Math.max(0, cellHeight); // Ensure no negative heights
        
        // More nutrients and water in lower areas, less at higher elevations
        const baseNutrients = 50 + Math.random() * 50;
        const elevationNutrientPenalty = cellHeight * 15; // Higher areas have fewer nutrients
        const nutrientVariation = 1 - normalizedDistance * 0.3;
        
        const baseWater = environmentConfig.rainfall * 0.8 + Math.random() * 20;
        const elevationWaterPenalty = cellHeight * 25; // Higher areas have much less water
        const waterVariation = 1 - normalizedDistance * 0.2;
        
        // Calculate final nutrient and water levels
        const finalNutrients = Math.max(10, (baseNutrients - elevationNutrientPenalty) * nutrientVariation);
        const finalWater = Math.max(5, (baseWater - elevationWaterPenalty) * waterVariation);
        
        row.push({
          x,
          y,
          height: cellHeight,
          nutrientLevel: finalNutrients,
          waterLevel: finalWater,
          organisms: [],
          temperature: environmentConfig.temperature + (Math.random() * 4 - 2), // Slight temperature variations
          pollutionLevel: environmentConfig.pollutionLevel * (0.8 + Math.random() * 0.4),
        });
      }
      
      grid.push(row);
    }
    
    return grid;
  }

  getCell(position: Position): Cell | null {
    const { x, y } = position;
    
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.cells[y][x];
    }
    
    return null;
  }

  addOrganism(organism: OrganismAttributes): boolean {
    const cell = this.getCell(organism.position);
    
    if (cell) {
      cell.organisms.push(organism.id);
      return true;
    }
    
    return false;
  }

  removeOrganism(organismId: string, position: Position): boolean {
    const cell = this.getCell(position);
    
    if (cell) {
      const index = cell.organisms.indexOf(organismId);
      
      if (index !== -1) {
        cell.organisms.splice(index, 1);
        return true;
      }
    }
    
    return false;
  }

  moveOrganism(organismId: string, oldPosition: Position, newPosition: Position): boolean {
    // Check if the new position is valid
    if (
      newPosition.x < 0 || newPosition.x >= this.width || 
      newPosition.y < 0 || newPosition.y >= this.height
    ) {
      return false;
    }
    
    // Remove from old cell
    const removed = this.removeOrganism(organismId, oldPosition);
    
    if (!removed) {
      return false;
    }
    
    // Add to new cell
    const newCell = this.getCell(newPosition);
    
    if (newCell) {
      newCell.organisms.push(organismId);
      return true;
    }
    
    return false;
  }

  updateEnvironment(environmentConfig: EnvironmentConfig): void {
    // Update cell conditions based on environmental config
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x];
        
        // Calculate elevation-based modifiers
        const elevationFactor = 1 + cell.height * 0.3; // Higher areas have increased evaporation
        const drainageFactor = Math.min(1, cell.height * 0.4); // Higher areas drain water better
        
        // Update water level based on rainfall with elevation considerations
        const baseEvaporationRate = 0.08 * (1 + (environmentConfig.temperature - 20) / 15);
        const elevationEvaporationRate = baseEvaporationRate * elevationFactor;
        
        // Rainfall is reduced on elevated areas (rain shadow effect)
        const elevationRainfallReduction = Math.min(0.7, cell.height * 0.2);
        const effectiveRainfall = environmentConfig.rainfall * (1 - elevationRainfallReduction);
        const rainAddition = effectiveRainfall * 0.15 * environmentConfig.seasonalFactor;
        
        // Apply drainage for elevated areas
        const drainageAmount = cell.waterLevel * drainageFactor * 0.1;
        
        // Calculate new water level
        let newWaterLevel = cell.waterLevel * (1 - elevationEvaporationRate) + rainAddition - drainageAmount;
        
        // Set maximum water level based on elevation
        const maxWaterLevel = Math.max(20, 100 - (cell.height * 30)); // Higher areas can hold less water
        newWaterLevel = Math.max(0, Math.min(maxWaterLevel, newWaterLevel));
        
        cell.waterLevel = newWaterLevel;
        
        // Diffuse nutrients to neighboring cells (with elevation affecting flow)
        const diffusionRate = 0.01;
        let nutrientDiffusion = 0;
        
        // Check neighboring cells
        const neighbors: Position[] = [
          { x: x-1, y }, { x: x+1, y }, { x, y: y-1 }, { x, y: y+1 }
        ];
        
        let validNeighborCount = 0;
        
        for (const neighbor of neighbors) {
          const neighborCell = this.getCell(neighbor);
          
          if (neighborCell) {
            // Nutrients flow from higher to lower elevations more easily
            const heightDifference = cell.height - neighborCell.height;
            const flowModifier = heightDifference > 0 ? 1.5 : 0.7; // Easier flow downhill
            
            const nutrientDifference = (neighborCell.nutrientLevel - cell.nutrientLevel) * flowModifier;
            nutrientDiffusion += nutrientDifference;
            validNeighborCount++;
          }
        }
        
        if (validNeighborCount > 0) {
          nutrientDiffusion = nutrientDiffusion * diffusionRate / validNeighborCount;
          cell.nutrientLevel += nutrientDiffusion;
        }
        
        // Update temperature based on environmental temperature and elevation
        const tempAdjustmentRate = 0.2;
        const elevationTempReduction = cell.height * 2; // Higher areas are cooler
        const targetTemperature = environmentConfig.temperature - elevationTempReduction;
        
        cell.temperature = cell.temperature * (1 - tempAdjustmentRate) + 
                          targetTemperature * tempAdjustmentRate;
        
        // Update pollution level (pollution settles in lower areas)
        const pollutionDecayRate = 0.01;
        const elevationPollutionReduction = cell.height * 0.1; // Higher areas have less pollution
        const targetPollution = Math.max(0, environmentConfig.pollutionLevel - elevationPollutionReduction);
        
        cell.pollutionLevel = Math.max(0, 
          cell.pollutionLevel * (1 - pollutionDecayRate) + targetPollution * 0.02
        );
      }
    }
  }

  applyDisturbance(
    startX: number, startY: number, endX: number, endY: number, 
    type: string, intensity: number
  ): void {
    // Apply disturbance effects to the affected area
    for (let y = Math.max(0, startY); y <= Math.min(this.height - 1, endY); y++) {
      for (let x = Math.max(0, startX); x <= Math.min(this.width - 1, endX); x++) {
        const cell = this.cells[y][x];
        
        // Elevation affects how disturbances impact cells
        const elevationResistance = 1 - Math.min(0.5, cell.height * 0.2); // Higher areas are more resistant
        const effectiveIntensity = intensity * elevationResistance;
        
        switch (type) {
          case 'Fire':
            // Fires spread more easily on higher, drier areas
            const fireIntensity = cell.height > 1 ? intensity * 1.3 : effectiveIntensity;
            cell.nutrientLevel = cell.nutrientLevel * (1 - 0.2 * fireIntensity);
            cell.waterLevel = cell.waterLevel * (1 - 0.8 * fireIntensity);
            cell.temperature += 20 * fireIntensity;
            break;
            
          case 'Drought':
            // Droughts affect elevated areas more severely
            const droughtIntensity = cell.height > 0.5 ? intensity * 1.4 : effectiveIntensity;
            cell.waterLevel = cell.waterLevel * (1 - 0.7 * droughtIntensity);
            cell.temperature += 5 * droughtIntensity;
            break;
            
          case 'Flood':
            // Floods primarily affect low-lying areas
            const floodIntensity = cell.height < 0.5 ? intensity * 1.5 : effectiveIntensity * 0.3;
            cell.waterLevel = Math.min(100, cell.waterLevel + 40 * floodIntensity);
            cell.nutrientLevel = cell.nutrientLevel * (1 - 0.3 * floodIntensity);
            break;
            
          case 'Disease':
            // Diseases don't directly affect the environment
            break;
            
          case 'Human Activity':
            // Human activity affects accessible (lower) areas more
            const humanIntensity = cell.height < 1 ? intensity * 1.2 : effectiveIntensity * 0.6;
            cell.nutrientLevel = cell.nutrientLevel * (1 - 0.4 * humanIntensity);
            cell.pollutionLevel = Math.min(100, cell.pollutionLevel + 30 * humanIntensity);
            break;
        }
      }
    }
  }

  getNearbyOrganisms(position: Position, radius: number): string[] {
    const nearbyOrganisms: string[] = [];
    
    for (let y = Math.max(0, position.y - radius); y <= Math.min(this.height - 1, position.y + radius); y++) {
      for (let x = Math.max(0, position.x - radius); x <= Math.min(this.width - 1, position.x + radius); x++) {
        const cell = this.cells[y][x];
        nearbyOrganisms.push(...cell.organisms);
      }
    }
    
    return nearbyOrganisms;
  }

  findAvailablePosition(origin: Position, maxDistance: number): Position | null {
    const positions: Position[] = [];
    
    for (let y = Math.max(0, origin.y - maxDistance); y <= Math.min(this.height - 1, origin.y + maxDistance); y++) {
      for (let x = Math.max(0, origin.x - maxDistance); x <= Math.min(this.width - 1, origin.x + maxDistance); x++) {
        const cell = this.cells[y][x];
        
        // Prefer positions with fewer organisms and consider elevation
        const baseScore = 10 - Math.min(10, cell.organisms.length);
        const elevationBonus = cell.height > 1 ? 2 : 0; // Slight preference for elevated areas
        const score = baseScore + elevationBonus;
        
        // Add position multiple times based on score to increase probability of selection
        for (let i = 0; i < score; i++) {
          positions.push({ x, y });
        }
      }
    }
    
    if (positions.length === 0) return null;
    
    // Select random position weighted by score
    const randomIndex = Math.floor(Math.random() * positions.length);
    return positions[randomIndex];
  }

  addNutrients(position: Position, amount: number): void {
    const cell = this.getCell(position);
    
    if (cell) {
      cell.nutrientLevel = Math.min(100, cell.nutrientLevel + amount);
    }
  }
}