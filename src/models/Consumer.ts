import { Organism } from './Organism';
import { OrganismType, ConsumerAttributes, ConsumerType, Position, EnvironmentConfig } from '../types/types';

export class Consumer extends Organism {
  consumerType: ConsumerType;
  huntingEfficiency: number;
  metabolismRate: number;
  diet: string[];

  constructor(attributes: Partial<ConsumerAttributes> = {}) {
    super({
      ...attributes,
      type: OrganismType.Consumer,
      species: attributes.species || 'Basic Consumer',
    });

    this.consumerType = attributes.consumerType || ConsumerType.Herbivore;
    this.huntingEfficiency = attributes.huntingEfficiency || 0.5;
    this.metabolismRate = attributes.metabolismRate || 0.08; // Reduced from 0.1 for better energy efficiency
    this.diet = attributes.diet || [];
  }

  update(environmentConfig: EnvironmentConfig): void {
    super.update();
    if (this.isDead) return;

    // Metabolism costs energy - affected by size, temperature, and activity
    const baseCost = this.size * this.metabolismRate;
    const temperatureFactor = this.getTemperatureFactor(environmentConfig.temperature);
    const seasonalFactor = this.getSeasonalFactor(environmentConfig.seasonalFactor);
    
    // Energy consumption increases in extreme temperatures and decreases in favorable seasons
    const energyCost = baseCost * temperatureFactor * seasonalFactor;
    this.energy -= energyCost;
  }

  eat(prey: Organism): number {
    if (this.isDead || prey.isDead) return 0;

    // Calculate hunting success based on hunting efficiency and size difference
    const sizeFactor = prey.size / this.size;
    const huntingSuccess = Math.random() < (this.huntingEfficiency / (sizeFactor + 0.3)); // Improved from 0.5 to 0.3

    if (huntingSuccess) {
      // Energy gained from eating - efficiency depends on how well adapted the consumer is to its prey
      const energyGain = prey.energy * 0.8; // Increased efficiency from 70% to 80%
      this.energy += energyGain;
      prey.die();
      return energyGain;
    }

    // Failed hunt still costs energy
    this.energy -= this.movementCost * 1.5; // Reduced cost from 2x to 1.5x
    return 0;
  }

  canEat(organism: Organism): boolean {
    // Herbivores eat only producers
    if (this.consumerType === ConsumerType.Herbivore) {
      return organism.type === OrganismType.Producer;
    }
    
    // Carnivores eat only consumers
    if (this.consumerType === ConsumerType.Carnivore) {
      return organism.type === OrganismType.Consumer;
    }
    
    // Omnivores eat both producers and consumers
    return organism.type === OrganismType.Producer || organism.type === OrganismType.Consumer;
  }

  private getTemperatureFactor(temperature: number): number {
    // Animals have optimal temperature range, with increased metabolism outside that range
    const optimalTemp = 22; // Slightly adjusted optimal temperature
    const tolerance = 25; // Increased tolerance from 20 to 25 degrees
    const diff = Math.abs(temperature - optimalTemp);
    return 1 + (diff / tolerance) * 0.5; // Reduced impact from 1.0 to 0.5
  }

  private getSeasonalFactor(seasonalFactor: number): number {
    // Seasonal factor represents how favorable the season is (0-1)
    // Metabolism is higher in less favorable seasons
    return 1.3 - (seasonalFactor * 0.4); // Reduced impact from 1.5-0.5 to 1.3-0.4
  }

  getAttributes(): ConsumerAttributes {
    return {
      ...super.getAttributes(),
      consumerType: this.consumerType,
      huntingEfficiency: this.huntingEfficiency,
      metabolismRate: this.metabolismRate,
      diet: this.diet,
    };
  }
}
