import { Organism } from './Organism';
import { OrganismType, ProducerAttributes, Position, EnvironmentConfig } from '../types/types';

export class Producer extends Organism {
  growthRate: number;
  photosynthesisRate: number;
  waterConsumption: number;

  constructor(attributes: Partial<ProducerAttributes> = {}) {
    super({
      ...attributes,
      type: OrganismType.Producer,
      species: attributes.species || 'Basic Plant',
      movementCost: 0, // Plants don't move
    });

    this.growthRate = attributes.growthRate || 0.1;
    this.photosynthesisRate = attributes.photosynthesisRate || 0.25; // Increased from 0.2 for better energy production
    this.waterConsumption = attributes.waterConsumption || 0.08; // Reduced from 0.1 for better water efficiency
  }

  update(
    environmentConfig: EnvironmentConfig,
    cellNutrientLevel: number,
    cellWaterLevel: number
  ): void {
    super.update();
    if (this.isDead) return;

    // Photosynthesis affected by sunlight, temperature, and seasonal factors
    const environmentFactor =
      (environmentConfig.sunlightIntensity / 100) *
      this.getTemperatureFactor(environmentConfig.temperature) *
      (1 - environmentConfig.pollutionLevel / 100) *
      this.getSeasonalFactor(environmentConfig.seasonalFactor);

    // Growth affected by nutrients and water
    const resourceFactor = Math.min(cellNutrientLevel / 100, cellWaterLevel / 100);

    // Calculate energy gain from photosynthesis
    const energyGain = this.photosynthesisRate * environmentFactor * resourceFactor * 12; // Increased multiplier from 10 to 12
    this.energy += energyGain;

    // Consume water and nutrients
    const waterConsumption = this.waterConsumption * this.size;
    
    // Growth affects size
    if (this.energy > 110 && resourceFactor > 0.4) { // Lowered thresholds for easier growth
      this.size += this.growthRate * resourceFactor;
      this.energy -= this.growthRate * 8; // Reduced energy cost from 10 to 8
    }
  }

  private getTemperatureFactor(temperature: number): number {
    // Plants have optimal temperature range, with reduced efficiency outside that range
    const optimalTemp = 25; // Celsius
    const tolerance = 18; // Increased tolerance from 15 to 18 degrees
    const diff = Math.abs(temperature - optimalTemp);
    return Math.max(0.1, 1 - diff / tolerance); // Minimum efficiency of 0.1 instead of 0
  }

  private getSeasonalFactor(seasonalFactor: number): number {
    // Seasonal factor already normalized between 0-1
    return Math.max(0.3, seasonalFactor); // Minimum seasonal factor of 0.3 for stability
  }

  getAttributes(): ProducerAttributes {
    return {
      ...super.getAttributes(),
      growthRate: this.growthRate,
      photosynthesisRate: this.photosynthesisRate,
      waterConsumption: this.waterConsumption,
    };
  }
}