import { Organism } from './Organism';
import { DecomposerAttributes, OrganismType, EnvironmentConfig } from '../types/types';

export class Decomposer extends Organism {
  decompositionRate: number;
  nutrientProductionRate: number;

  constructor(attributes: Partial<DecomposerAttributes> = {}) {
    super({
      ...attributes,
      type: OrganismType.Decomposer,
      species: attributes.species || 'Basic Decomposer',
    });

    this.decompositionRate = attributes.decompositionRate || 0.35; // Increased from 0.3 for better decomposition
    this.nutrientProductionRate = attributes.nutrientProductionRate || 0.25; // Increased from 0.2 for better nutrient cycling
  }

  update(environmentConfig: EnvironmentConfig, deadOrganismCount: number): { nutrientsProduced: number } {
    super.update();
    if (this.isDead) return { nutrientsProduced: 0 };

    // Decomposers thrive in environments with dead matter
    const deadMatterFactor = Math.min(1, deadOrganismCount / 4); // Reduced threshold from 5 to 4
    
    // Environmental factors affecting decomposition
    const moistureFactor = Math.max(0.3, environmentConfig.rainfall / 100); // Minimum moisture factor
    const temperatureFactor = this.getTemperatureFactor(environmentConfig.temperature);
    
    // Calculate decomposition efficiency
    const decompositionEfficiency = 
      this.decompositionRate * deadMatterFactor * moistureFactor * temperatureFactor;
    
    // Energy gained from decomposition
    const energyGain = decompositionEfficiency * 12 * deadOrganismCount; // Increased from 10 to 12
    this.energy += energyGain;
    
    // Nutrients produced from decomposition
    const nutrientsProduced = 
      this.nutrientProductionRate * decompositionEfficiency * deadOrganismCount;
    
    // Growth based on available resources
    if (this.energy > 130 && deadMatterFactor > 0.25) { // Lowered thresholds
      this.size += 0.06 * deadMatterFactor; // Increased growth rate
      this.energy -= 4; // Reduced energy cost from 5 to 4
    }

    return { nutrientsProduced };
  }

  decompose(deadOrganism: Organism): number {
    if (this.isDead) return 0;
    
    // Convert dead organism into energy and nutrients
    const energyGain = deadOrganism.size * 6 * this.decompositionRate; // Increased from 5 to 6
    this.energy += energyGain;
    
    // Return nutrients produced
    return deadOrganism.size * this.nutrientProductionRate;
  }

  private getTemperatureFactor(temperature: number): number {
    // Decomposition rate increases with temperature, up to a point
    if (temperature < 0) return 0.2; // Increased from 0.1 for better cold tolerance
    if (temperature > 40) return 0.6; // Increased from 0.5 for better heat tolerance
    
    // Optimal range is 15-35 degrees
    if (temperature >= 15 && temperature <= 35) {
      return 1.0;
    }
    
    // Linear scaling between ranges
    if (temperature < 15) {
      return 0.2 + (temperature / 15) * 0.8; // Improved cold performance
    } else {
      return 1.0 - ((temperature - 35) / 10) * 0.4; // Improved heat performance
    }
  }

  getAttributes(): DecomposerAttributes {
    return {
      ...super.getAttributes(),
      decompositionRate: this.decompositionRate,
      nutrientProductionRate: this.nutrientProductionRate,
    };
  }
}
