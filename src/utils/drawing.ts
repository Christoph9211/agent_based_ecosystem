import { Cell, OrganismType, ConsumerType, DisturbanceType } from '../types/types';
import { CameraState } from '../hooks/useCameraControls';
import { gridToProjected } from './coordinateUtils';

const CELL_SIZE = 32;

const getGroundColor = (cell: Cell): string => {
  const waterLevel = cell.waterLevel / 100;
  const nutrientLevel = cell.nutrientLevel / 100;
  const height = cell.height;
  
  if (height > 1.5) return '#A0A0A0';
  if (height > 0.8) return '#8B7355';
  if (waterLevel > 0.8) {
    const blueIntensity = Math.floor(100 + waterLevel * 155);
    return `rgb(64, 164, ${blueIntensity})`;
  }
  if (waterLevel < 0.3 && nutrientLevel < 0.3) return '#D2B48C';
  
  const greenIntensity = Math.floor(80 + nutrientLevel * 120);
  return `rgb(34, ${greenIntensity}, 34)`;
};

const darkenColor = (color: string, factor: number = 0.7): string => {
  if (color.startsWith('rgb(')) {
    const values = color.match(/\d+/g);
    if (values && values.length >= 3) {
      const r = Math.floor(parseInt(values[0]) * factor);
      const g = Math.floor(parseInt(values[1]) * factor);
      const b = Math.floor(parseInt(values[2]) * factor);
      return `rgb(${r}, ${g}, ${b})`;
    }
  } else if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = Math.floor(parseInt(hex.slice(0, 2), 16) * factor);
    const g = Math.floor(parseInt(hex.slice(2, 4), 16) * factor);
    const b = Math.floor(parseInt(hex.slice(4, 6), 16) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return color;
};

const drawGroundTile = (ctx: CanvasRenderingContext2D, screenX: number, screenY: number, scale: number, color: string) => {
  const tileSize = CELL_SIZE * scale;
  ctx.beginPath();
  ctx.moveTo(screenX, screenY - tileSize * 0.25);
  ctx.lineTo(screenX + tileSize * 0.5, screenY);
  ctx.lineTo(screenX, screenY + tileSize * 0.25);
  ctx.lineTo(screenX - tileSize * 0.5, screenY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  const gradient = ctx.createLinearGradient(screenX - tileSize * 0.5, screenY - tileSize * 0.25, screenX + tileSize * 0.5, screenY + tileSize * 0.25);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
};

const drawPlant = (ctx: CanvasRenderingContext2D, organism: any, screenX: number, screenY: number, scale: number) => {
  const size = organism.size;
  const energy = organism.energy;
  const plantScale = Math.max(0.3, Math.min(2.0, size)) * scale;
  
  const healthRatio = Math.min(1, energy / 100);
  const red = Math.floor(255 - healthRatio * 200);
  const green = Math.floor(100 + healthRatio * 155);
  const blue = 50;
  const plantColor = `rgb(${red}, ${green}, ${blue})`;
  
  if (size < 1.0) {
    const grassHeight = 8 * plantScale;
    const grassWidth = 3 * plantScale;
    for (let i = 0; i < 3; i++) {
      const offsetX = (i - 1) * grassWidth * 0.7;
      const offsetY = Math.random() * 2 - 1;
      ctx.beginPath();
      ctx.moveTo(screenX + offsetX, screenY);
      ctx.lineTo(screenX + offsetX, screenY - grassHeight + offsetY);
      ctx.strokeStyle = plantColor;
      ctx.lineWidth = grassWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  } else if (size < 2.0) {
    const bushSize = 12 * plantScale;
    ctx.beginPath();
    ctx.arc(screenX, screenY - bushSize * 0.3, bushSize * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = plantColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screenX - bushSize * 0.2, screenY - bushSize * 0.5, bushSize * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
    ctx.fill();
  } else {
    const trunkHeight = 20 * plantScale;
    const trunkWidth = 4 * plantScale;
    const crownSize = 16 * plantScale;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(screenX - trunkWidth / 2, screenY - trunkHeight, trunkWidth, trunkHeight);
    ctx.beginPath();
    ctx.arc(screenX, screenY - trunkHeight - crownSize * 0.3, crownSize * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = plantColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screenX - crownSize * 0.3, screenY - trunkHeight - crownSize * 0.5, crownSize * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
    ctx.fill();
  }
};

const drawAnimal = (ctx: CanvasRenderingContext2D, organism: any, screenX: number, screenY: number, scale: number) => {
  const size = Math.max(4, organism.size * scale * 0.3);
  const height = size * 0.8;
  
  let color = '#333', shadowColor = '#222';
  if (organism.consumerType === ConsumerType.Herbivore) { color = '#1f78b4'; shadowColor = '#1a6ba0'; }
  if (organism.consumerType === ConsumerType.Carnivore) { color = '#e31a1c'; shadowColor = '#cc1719'; }
  if (organism.type === OrganismType.Decomposer) { color = '#b15928'; shadowColor = '#9e4f24'; }

  const bodyY = screenY - height * 0.5;
  
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + height * 0.3, size * 0.6, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(screenX, bodyY, size, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(screenX - size * 0.3, bodyY - size * 0.3, size * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(screenX + size * 0.2, bodyY + size * 0.2, size * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = shadowColor;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(screenX, bodyY, size * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  if (organism.energy > 0) {
    const barWidth = size * 1.2;
    const barHeight = 3;
    const barY = bodyY - size - 8;
    const energyPercent = Math.min(1, organism.energy / 200);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(screenX - barWidth / 2, barY, barWidth, barHeight);
    const energyColor = energyPercent > 0.6 ? '#4ade80' : energyPercent > 0.3 ? '#fbbf24' : '#ef4444';
    ctx.fillStyle = energyColor;
    ctx.fillRect(screenX - barWidth / 2, barY, barWidth * energyPercent, barHeight);
  }
};

export const drawIsometricCell = (ctx: CanvasRenderingContext2D, cell: Cell, cameraState: CameraState, gridWidth: number, gridHeight: number, offsetX: number, offsetY: number, scale: number) => {
  const groundColor = getGroundColor(cell);
  
  if (cell.height <= 0.1) {
    const projected = gridToProjected(cell.x, cell.y, cell.height, cameraState, gridWidth, gridHeight);
    drawGroundTile(ctx, projected.screenX + offsetX, projected.screenY + offsetY, scale, groundColor);
    return;
  }
  
  const sideColor = darkenColor(groundColor, 0.6);
  const frontColor = darkenColor(groundColor, 0.8);
  const tileSize = CELL_SIZE * scale;
  
  const topProjected = gridToProjected(cell.x, cell.y, cell.height, cameraState, gridWidth, gridHeight);
  const baseProjected = gridToProjected(cell.x, cell.y, 0, cameraState, gridWidth, gridHeight);
  
  const topX = topProjected.screenX + offsetX;
  const topY = topProjected.screenY + offsetY;
  const baseX = baseProjected.screenX + offsetX;
  const baseY = baseProjected.screenY + offsetY;
  
  ctx.beginPath();
  ctx.moveTo(topX, topY - tileSize * 0.25);
  ctx.lineTo(topX + tileSize * 0.5, topY);
  ctx.lineTo(baseX + tileSize * 0.5, baseY);
  ctx.lineTo(baseX, baseY - tileSize * 0.25);
  ctx.closePath();
  ctx.fillStyle = sideColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(topX, topY - tileSize * 0.25);
  ctx.lineTo(topX, topY + tileSize * 0.25);
  ctx.lineTo(baseX, baseY + tileSize * 0.25);
  ctx.lineTo(baseX, baseY - tileSize * 0.25);
  ctx.closePath();
  ctx.fillStyle = frontColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  drawGroundTile(ctx, topX, topY, scale, groundColor);
};

export const drawIsometricOrganism = (ctx: CanvasRenderingContext2D, organism: any, screenX: number, screenY: number, scale: number) => {
  if (organism.type === OrganismType.Producer) {
    drawPlant(ctx, organism, screenX, screenY, scale);
  } else {
    drawAnimal(ctx, organism, screenX, screenY, scale);
  }
};

export const drawCellHighlight = (ctx: CanvasRenderingContext2D, gridX: number, gridY: number, color: string, cameraState: CameraState, grid: Cell[][], gridWidth: number, gridHeight: number, offsetX: number, offsetY: number) => {
  const cell = grid[gridY]?.[gridX];
  if (!cell) return;

  const cellHeight = cell.height;
  const projected = gridToProjected(gridX, gridY, cellHeight + 0.05, cameraState, gridWidth, gridHeight);
  const screenX = projected.screenX + offsetX;
  const screenY = projected.screenY + offsetY;
  
  const highlightSize = CELL_SIZE * cameraState.zoom;
  
  ctx.beginPath();
  ctx.moveTo(screenX, screenY - highlightSize * 0.2);
  ctx.lineTo(screenX + highlightSize * 0.4, screenY);
  ctx.lineTo(screenX, screenY + highlightSize * 0.2);
  ctx.lineTo(screenX - highlightSize * 0.4, screenY);
  ctx.closePath();
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
};

export const drawDisturbanceEffect = (ctx: CanvasRenderingContext2D, disturbance: any, cameraState: CameraState, gridWidth: number, gridHeight: number, offsetX: number, offsetY: number) => {
  const { startX, startY, endX, endY } = disturbance.affectedArea;
  
  const corners = [
    gridToProjected(startX, startY, 0.1, cameraState, gridWidth, gridHeight),
    gridToProjected(endX, startY, 0.1, cameraState, gridWidth, gridHeight),
    gridToProjected(endX, endY, 0.1, cameraState, gridWidth, gridHeight),
    gridToProjected(startX, endY, 0.1, cameraState, gridWidth, gridHeight)
  ];
  
  ctx.beginPath();
  corners.forEach((corner, index) => {
    const x = corner.screenX + offsetX;
    const y = corner.screenY + offsetY;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  
  const alpha = 0.3 * disturbance.intensity;
  let color = `rgba(255, 100, 100, ${alpha})`;
  
  switch (disturbance.type) {
    case DisturbanceType.Fire: color = `rgba(255, 100, 0, ${alpha})`; break;
    case DisturbanceType.Drought: color = `rgba(255, 255, 100, ${alpha})`; break;
    case DisturbanceType.Flood: color = `rgba(100, 100, 255, ${alpha})`; break;
    case DisturbanceType.Disease: color = `rgba(100, 255, 100, ${alpha})`; break;
    case DisturbanceType.HumanActivity: color = `rgba(100, 100, 100, ${alpha})`; break;
  }
  
  ctx.fillStyle = color;
  ctx.fill();
};