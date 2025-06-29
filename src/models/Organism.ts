import { v4 as uuidv4 } from 'uuid';
import { OrganismAttributes, OrganismType, Position } from '../types/types';

export class Organism {
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

  constructor(attributes: Partial<OrganismAttributes> = {}) {
    this.id = attributes.id || uuidv4();
    this.type = attributes.type || OrganismType.Producer;
    this.position = attributes.position || { x: 0, y: 0 };
    this.energy = attributes.energy || 100;
    this.size = attributes.size || 1;
    this.age = attributes.age || 0;
    this.maxAge = attributes.maxAge || 100;
    this.reproductionEnergy = attributes.reproductionEnergy || 150;
    this.reproductionRate = attributes.reproductionRate || 0.2;
    this.movementCost = attributes.movementCost || 1;
    this.isDead = attributes.isDead || false;
    this.species = attributes.species || 'Generic Organism';
  }

  update(): void {
    this.age += 1;

    // Check for death by old age
    if (this.age >= this.maxAge) {
      this.die();
      return;
    }

    // Check for death by energy depletion
    if (this.energy <= 0) {
      this.die();
      return;
    }
  }

  move(newPosition: Position): void {
    this.position = newPosition;
    this.energy -= this.movementCost;
  }

  canReproduce(): boolean {
    return this.energy >= this.reproductionEnergy && Math.random() < this.reproductionRate;
  }

  reproduce(): Organism {
    // Create offspring with similar traits but with some variations
    const offspringAttributes: Partial<OrganismAttributes> = {
      type: this.type,
      position: { ...this.position },
      energy: this.energy * 0.5, // Offspring gets half the parent's energy
      size: this.size * (0.9 + Math.random() * 0.2), // Slight variation in size
      maxAge: this.maxAge * (0.9 + Math.random() * 0.2), // Variation in max age
      reproductionEnergy: this.reproductionEnergy * (0.9 + Math.random() * 0.2),
      reproductionRate: this.reproductionRate * (0.9 + Math.random() * 0.2),
      movementCost: this.movementCost * (0.9 + Math.random() * 0.2),
      species: this.species,
    };

    // Reduce parent's energy after reproduction
    this.energy *= 0.5;

    return new Organism(offspringAttributes);
  }

  die(): void {
    this.isDead = true;
  }

  getAttributes(): OrganismAttributes {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      energy: this.energy,
      size: this.size,
      age: this.age,
      maxAge: this.maxAge,
      reproductionEnergy: this.reproductionEnergy,
      reproductionRate: this.reproductionRate,
      movementCost: this.movementCost,
      isDead: this.isDead,
      species: this.species,
    };
  }
}