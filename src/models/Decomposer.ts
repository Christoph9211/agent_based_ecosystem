import { Organism } from './Organism';
import { DecomposerAttributes, OrganismType, EnvironmentConfig, OrganismAttributes as IOrganismAttributes } from '../types/types';

export class Decomposer extends Organism {
  decompositionRate: number;
  nutrientProductionRate: number;

  constructor(attributes: Partial<DecomposerAttributes> = {}) {
    super({
      ...attributes,
      type: OrganismType.Decomposer,
      species: attributes.species || 'Resilient Decomposer',
    });

    this.decompositionRate = attributes.decompositionRate || 0.4; // Increased from 0.35
    this.nutrientProductionRate = attributes.nutrientProductionRate || 0.3; // Increased from 0.25
  }

  update(environmentConfig: EnvironmentConfig, deadOrganismCount: number): { nutrientsProduced: number } {
    super.update();
    if (this.isDead) return { nutrientsProduced: 0 };

    // Decomposers thrive in environments with dead matter, now more efficiently
    const deadMatterFactor = Math.min(1, deadOrganismCount / 3); // Reduced threshold from 4
    
    // Environmental factors affecting decomposition
    const moistureFactor = Math.max(0.4, environmentConfig.rainfall / 100); // Increased minimum moisture factor
    const temperatureFactor = this.getTemperatureFactor(environmentConfig.temperature);
    
    // Calculate decomposition efficiency
    const decompositionEfficiency = 
      this.decompositionRate * deadMatterFactor * moistureFactor * temperatureFactor;
    
    // Energy gained from decomposition
    const energyGain = decompositionEfficiency * 15 * deadOrganismCount; // Increased from 12
    this.energy += energyGain;
    
    // Nutrients produced from decomposition
    const nutrientsProduced = 
      this.nutrientProductionRate * decompositionEfficiency * deadOrganismCount;
    
    // Growth based on available resources, now easier to achieve
    if (this.energy > 110 && deadMatterFactor > 0.2) { // Lowered thresholds from 130 and 0.25
      this.size += 0.07 * deadMatterFactor; // Increased growth rate from 0.06
      this.energy -= 3; // Reduced energy cost from 4
    }

    return { nutrientsProduced };
  }

  decompose(deadOrganism: IOrganismAttributes): number {
    if (this.isDead) return 0;
    
    // Convert dead organism into energy and nutrients more effectively
    const energyGain = deadOrganism.size * 8 * this.decompositionRate; // Increased from 6
    this.energy += energyGain;
    
    // Return nutrients produced
    return deadOrganism.size * this.nutrientProductionRate;
  }

  private getTemperatureFactor(temperature: number): number {
    // Decomposition rate increases with temperature, with a wider optimal range
    if (temperature < 0) return 0.3; // Increased from 0.2 for better cold tolerance
    if (temperature > 45) return 0.5; // Increased from 0.6 and 40 for better heat tolerance
    
    // Wider optimal range is 10-38 degrees
    if (temperature >= 10 && temperature <= 38) {
      return 1.0;
    }
    
    // Linear scaling between ranges
    if (temperature < 10) {
      return 0.3 + (temperature / 10) * 0.7; // Improved cold performance scaling
    } else { // temperature is between 38 and 45
      return 1.0 - ((temperature - 38) / 7) * 0.5; // Improved heat performance scaling
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