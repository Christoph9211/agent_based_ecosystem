import React, { useRef, useEffect, useState } from 'react';
import { Cell, OrganismType, ConsumerType, DisturbanceType } from '../types/types';
import { useCameraControls, CameraState } from '../hooks/useCameraControls';

interface SimulationGridProps {
  grid: Cell[][];
  organisms: Record<string, any>;
  width: number;
  height: number;
  cellSize?: number;
  maxSize?: number;
  disturbance: {
    type: DisturbanceType;
    intensity: number;
    affectedArea: {
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    };
    active: boolean;
  } | null;
  onCellClick?: (x: number, y: number) => void;
  selectedCell?: { x: number, y: number } | null;
}

interface ProjectedPoint {
  screenX: number;
  screenY: number;
  depth: number;
}

interface DrawableObject {
  type: 'cell' | 'organism';
  gridX: number;
  gridY: number;
  screenX: number;
  screenY: number;
  depth: number;
  data: any;
}

const SimulationGrid: React.FC<SimulationGridProps> = ({
  grid,
  organisms,
  width,
  height,
  cellSize = 32,
  maxSize = 900,
  disturbance,
  onCellClick,
  selectedCell,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoverCell, setHoverCell] = useState<{ x: number, y: number } | null>(null);
  const [spritesReady, setSpritesReady] = useState(false);
  
  // Initialize camera controls
  const { cameraState, resetCamera, toggleFullscreen, isFullscreen } = useCameraControls(canvasRef);
  
  // Generate sprites programmatically
  useEffect(() => {
    // Mark sprites as ready immediately since we're drawing them programmatically
    setSpritesReady(true);
  }, []);
  
  // Helper function to get diamond points for isometric tiles
  const getDiamondPoints = (centerX: number, centerY: number, size: number) => {
    // Shift the center up by half a square so the diamonds align better
    const adjustedCenterX = centerX + size * 0.25;
    const adjustedCenterY = centerY - size * 0.25;
    
    return [
      { x: adjustedCenterX, y: adjustedCenterY }, // Top
      { x: adjustedCenterX + size * 0.5, y: adjustedCenterY + size * 0.25 }, // Right
      { x: adjustedCenterX, y: adjustedCenterY + size * 0.5 }, // Bottom
      { x: adjustedCenterX - size * 0.5, y: adjustedCenterY + size * 0.25 }, // Left
    ];
  };
  
  // Helper function to get ground color based on cell properties
  const getGroundColor = (cell: Cell): string => {
    const waterLevel = cell.waterLevel / 100;
    const nutrientLevel = cell.nutrientLevel / 100;
    const height = cell.height;
    
    // Elevated areas have different base colors
    if (height > 1.5) {
      // High mountains - rocky/snowy
      return '#A0A0A0';
    } else if (height > 0.8) {
      // Hills - brown/rocky
      return '#8B7355';
    } else if (waterLevel > 0.8) {
      // Water areas
      const blueIntensity = Math.floor(100 + waterLevel * 155);
      return `rgb(64, 164, ${blueIntensity})`;
    } else if (waterLevel < 0.3 && nutrientLevel < 0.3) {
      // Dry, low-nutrient areas (dirt/sand)
      return '#D2B48C';
    } else {
      // Grass areas - vary green intensity based on nutrients
      const greenIntensity = Math.floor(80 + nutrientLevel * 120);
      return `rgb(34, ${greenIntensity}, 34)`;
    }
  };
  
  // Helper function to darken a color for side faces
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
  
  // Convert grid coordinates to projected screen coordinates with camera transformations
  const gridToProjected = (gridX: number, gridY: number, height: number = 0): ProjectedPoint => {
    const cellWorldSize = 1;
    
    // Convert to 3D world coordinates
    let worldX = gridX * cellWorldSize - (width * cellWorldSize) / 2;
    let worldY = height;
    let worldZ = gridY * cellWorldSize - (height * cellWorldSize) / 2;
    
    // Apply inverse camera translation
    worldX -= cameraState.position.x;
    worldY -= cameraState.position.y;
    worldZ -= cameraState.position.z;
    
    // Apply inverse camera rotations
    // First, apply yaw rotation (Y-axis)
    const yawRad = (-cameraState.rotation.yaw * Math.PI) / 180;
    const cosYaw = Math.cos(yawRad);
    const sinYaw = Math.sin(yawRad);
    
    const x1 = worldX * cosYaw - worldZ * sinYaw;
    const y1 = worldY;
    const z1 = worldX * sinYaw + worldZ * cosYaw;
    
    // Then, apply pitch rotation (X-axis)
    const pitchRad = (-cameraState.rotation.pitch * Math.PI) / 180;
    const cosPitch = Math.cos(pitchRad);
    const sinPitch = Math.sin(pitchRad);
    
    const x2 = x1;
    const y2 = y1 * cosPitch - z1 * sinPitch;
    const z2 = y1 * sinPitch + z1 * cosPitch;
    
    // Apply isometric projection to the transformed coordinates
    const cos45 = Math.cos(45 * Math.PI / 180);
    const sin45 = Math.sin(45 * Math.PI / 180);
    const cos30 = Math.cos(30 * Math.PI / 180);
    const sin30 = Math.sin(30 * Math.PI / 180);
    
    // Y-axis rotation (45 degrees)
    const x_prime = x2 * cos45 + z2 * sin45;
    const y_prime = y2;
    const z_prime = -x2 * sin45 + z2 * cos45;
    
    // X-axis rotation (30 degrees)
    const x_rotated = x_prime;
    const y_rotated = y_prime * cos30 - z_prime * sin30;
    const z_rotated = y_prime * sin30 + z_prime * cos30;
    
    return {
      screenX: x_rotated * cameraState.zoom * cellSize,
      screenY: -y_rotated * cameraState.zoom * cellSize,
      depth: z_rotated
    };
  };
  
  // Convert screen coordinates back to grid coordinates (simplified for mouse interaction)
  const screenToGrid = (screenX: number, screenY: number): { x: number, y: number } | null => {
    if (!containerRef.current) return null;
    
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2;
    
    // Convert canvas coordinates to world coordinates
    const worldX = (canvasX - offsetX) / (cameraState.zoom * cellSize);
    const worldY = -(canvasY - offsetY) / (cameraState.zoom * cellSize);
    
    // Simplified reverse transformation - check multiple grid positions
    let bestMatch = null;
    let bestDistance = Infinity;
    
    for (let gy = 0; gy < height; gy++) {
      for (let gx = 0; gx < width; gx++) {
        const cell = grid[gy] && grid[gy][gx] ? grid[gy][gx] : null;
        const cellHeight = cell ? cell.height : 0;
        const projected = gridToProjected(gx, gy, cellHeight);
        const distance = Math.sqrt(
          Math.pow(projected.screenX / (cameraState.zoom * cellSize) - worldX, 2) + 
          Math.pow(projected.screenY / (cameraState.zoom * cellSize) - worldY, 2)
        );
        
        if (distance < bestDistance && distance < 1.0) {
          bestDistance = distance;
          bestMatch = { x: gx, y: gy };
        }
      }
    }
    
    return bestMatch;
  };
  
  // Calculate canvas dimensions
  const calculateCanvasDimensions = () => {
    if (!containerRef.current) return { width: 800, height: 600 };
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    return {
      width: Math.min(containerWidth, maxSize),
      height: Math.min(containerHeight, maxSize)
    };
  };
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const newDimensions = calculateCanvasDimensions();
        setDimensions(newDimensions);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height, maxSize, calculateCanvasDimensions]);
  
  // Draw ground tile based on cell properties
  const drawGroundTile = (
    ctx: CanvasRenderingContext2D,
    cell: Cell,
    screenX: number,
    screenY: number,
    scale: number
  ) => {
    const tileSize = cellSize * scale;
    const groundColor = getGroundColor(cell);
    
    // Create isometric diamond shape
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - tileSize * 0.25);
    ctx.lineTo(screenX + tileSize * 0.5, screenY);
    ctx.lineTo(screenX, screenY + tileSize * 0.25);
    ctx.lineTo(screenX - tileSize * 0.5, screenY);
    ctx.closePath();
    
    ctx.fillStyle = groundColor;
    ctx.fill();
    
    // Add subtle shading for 3D effect
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - tileSize * 0.25);
    ctx.lineTo(screenX + tileSize * 0.5, screenY);
    ctx.lineTo(screenX, screenY + tileSize * 0.25);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(
      screenX - tileSize * 0.5, screenY - tileSize * 0.25,
      screenX + tileSize * 0.5, screenY + tileSize * 0.25
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  
  // Draw plant based on organism properties
  const drawPlant = (
    ctx: CanvasRenderingContext2D,
    organism: any,
    screenX: number,
    screenY: number,
    scale: number
  ) => {
    const size = organism.size;
    const energy = organism.energy;
    const plantScale = Math.max(0.3, Math.min(2.0, size)) * scale;
    
    // Determine plant color based on energy
    const healthRatio = Math.min(1, energy / 100);
    const red = Math.floor(255 - healthRatio * 200);
    const green = Math.floor(100 + healthRatio * 155);
    const blue = 50;
    const plantColor = `rgb(${red}, ${green}, ${blue})`;
    
    if (size < 1.0) {
      // Small plants - simple grass-like
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
      // Medium plants - bushes
      const bushSize = 12 * plantScale;
      
      // Draw bush body
      ctx.beginPath();
      ctx.arc(screenX, screenY - bushSize * 0.3, bushSize * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = plantColor;
      ctx.fill();
      
      // Add highlights
      ctx.beginPath();
      ctx.arc(screenX - bushSize * 0.2, screenY - bushSize * 0.5, bushSize * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
      ctx.fill();
    } else {
      // Large plants - trees
      const trunkHeight = 20 * plantScale;
      const trunkWidth = 4 * plantScale;
      const crownSize = 16 * plantScale;
      
      // Draw trunk
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(screenX - trunkWidth / 2, screenY - trunkHeight, trunkWidth, trunkHeight);
      
      // Draw crown
      ctx.beginPath();
      ctx.arc(screenX, screenY - trunkHeight - crownSize * 0.3, crownSize * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = plantColor;
      ctx.fill();
      
      // Add crown highlights
      ctx.beginPath();
      ctx.arc(screenX - crownSize * 0.3, screenY - trunkHeight - crownSize * 0.5, crownSize * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
      ctx.fill();
    }
  };
  
  // Draw isometric cell with elevation
  const drawIsometricCell = (
    ctx: CanvasRenderingContext2D,
    cell: Cell,
    offsetX: number,
    offsetY: number,
    scale: number
  ) => {
    if (cell.height <= 0.1) {
      // For flat cells, just draw the ground tile
      const projected = gridToProjected(cell.x, cell.y, cell.height);
      const screenX = projected.screenX + offsetX;
      const screenY = projected.screenY + offsetY;
      drawGroundTile(ctx, cell, screenX, screenY, scale);
      return;
    }
    
    // For elevated cells, draw the 3D structure
    const tileSize = cellSize * scale;
    const groundColor = getGroundColor(cell);
    const sideColor = darkenColor(groundColor, 0.6);
    const frontColor = darkenColor(groundColor, 0.8);
    
    // Get projected coordinates for top and base
    const topProjected = gridToProjected(cell.x, cell.y, cell.height);
    const baseProjected = gridToProjected(cell.x, cell.y, 0);
    
    const topX = topProjected.screenX + offsetX;
    const topY = topProjected.screenY + offsetY;
    const baseX = baseProjected.screenX + offsetX;
    const baseY = baseProjected.screenY + offsetY;
    
    // Calculate the height difference in screen space
    const heightDiff = baseY - topY;
    
    // Draw the visible side faces (front-left and front-right)
    
    // Front-right face (parallelogram)
    ctx.beginPath();
    ctx.moveTo(topX, topY - tileSize * 0.25); // Top-top
    ctx.lineTo(topX + tileSize * 0.5, topY); // Top-right
    ctx.lineTo(baseX + tileSize * 0.5, baseY); // Base-right
    ctx.lineTo(baseX, baseY - tileSize * 0.25); // Base-top
    ctx.closePath();
    ctx.fillStyle = sideColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Front-left face (parallelogram)
    ctx.beginPath();
    ctx.moveTo(topX, topY - tileSize * 0.25); // Top-top
    ctx.lineTo(topX, topY + tileSize * 0.25); // Top-bottom
    ctx.lineTo(baseX, baseY + tileSize * 0.25); // Base-bottom
    ctx.lineTo(baseX, baseY - tileSize * 0.25); // Base-top
    ctx.closePath();
    ctx.fillStyle = frontColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw the top surface (diamond)
    drawGroundTile(ctx, cell, topX, topY, scale);
  };
  
  // Draw isometric organism
  const drawIsometricOrganism = (
    ctx: CanvasRenderingContext2D,
    organism: any,
    screenX: number,
    screenY: number,
    scale: number
  ) => {
    if (organism.type === OrganismType.Producer) {
      drawPlant(ctx, organism, screenX, screenY, scale);
    } else {
      // Use simplified circles for consumers and decomposers
      const size = Math.max(4, organism.size * scale * 0.3);
      const height = size * 0.8;
      
      // Determine colors based on organism type
      let color = '#333';
      let shadowColor = '#222';
      
      if (organism.type === OrganismType.Consumer) {
        if (organism.consumerType === ConsumerType.Herbivore) {
          color = '#1f78b4';
          shadowColor = '#1a6ba0';
        } else if (organism.consumerType === ConsumerType.Carnivore) {
          color = '#e31a1c';
          shadowColor = '#cc1719';
        } else {
          color = '#6a3d9a';
          shadowColor = '#5d3587';
        }
      } else if (organism.type === OrganismType.Decomposer) {
        color = '#b15928';
        shadowColor = '#9e4f24';
      }
      
      // Draw organism shadow
      ctx.beginPath();
      ctx.ellipse(screenX, screenY + height * 0.3, size * 0.6, size * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();
      
      // Draw organism body with 3D effect
      const bodyY = screenY - height * 0.5;
      
      // Main body
      ctx.beginPath();
      ctx.arc(screenX, bodyY, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Highlight
      ctx.beginPath();
      ctx.arc(screenX - size * 0.3, bodyY - size * 0.3, size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
      ctx.fill();
      
      // Shadow
      ctx.beginPath();
      ctx.arc(screenX + size * 0.2, bodyY + size * 0.2, size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = shadowColor;
      ctx.fill();
      
      // Redraw main body (smaller)
      ctx.beginPath();
      ctx.arc(screenX, bodyY, size * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Energy indicator
      if (organism.energy > 0) {
        const barWidth = size * 1.2;
        const barHeight = 3;
        const barY = bodyY - size - 8;
        const energyPercent = Math.min(1, organism.energy / 200);
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(screenX - barWidth / 2, barY, barWidth, barHeight);
        
        // Energy bar
        const energyColor = energyPercent > 0.6 ? '#4ade80' : energyPercent > 0.3 ? '#fbbf24' : '#ef4444';
        ctx.fillStyle = energyColor;
        ctx.fillRect(screenX - barWidth / 2, barY, barWidth * energyPercent, barHeight);
      }
    }
  };
  
  // Draw cell highlight
  const drawCellHighlight = (
    ctx: CanvasRenderingContext2D,
    gridX: number,
    gridY: number,
    color: string,
    offsetX: number,
    offsetY: number
  ) => {
    const cell = grid[gridY] && grid[gridY][gridX] ? grid[gridY][gridX] : null;
    const cellHeight = cell ? cell.height : 0;
    const projected = gridToProjected(gridX, gridY, cellHeight + 0.05);
    const screenX = projected.screenX + offsetX;
    const screenY = projected.screenY + offsetY;
    
    const highlightSize = cellSize * cameraState.zoom;
    
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
  
  // Main drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid || grid.length === 0 || !spritesReady) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2;
    const scale = cameraState.zoom;
    
    // Create list of all drawable objects for depth sorting
    const drawableObjects: DrawableObject[] = [];
    
    // Add cells to drawable objects
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = grid[y][x];
        if (!cell) continue;
        
        const projected = gridToProjected(x, y, cell.height);
        drawableObjects.push({
          type: 'cell',
          gridX: x,
          gridY: y,
          screenX: projected.screenX + offsetX,
          screenY: projected.screenY + offsetY,
          depth: projected.depth,
          data: cell
        });
      }
    }
    
    // Add organisms to drawable objects
    for (const organism of Object.values(organisms)) {
      const { position } = organism;
      const { x, y } = position;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const cell = grid[y] && grid[y][x] ? grid[y][x] : null;
      const cellHeight = cell ? cell.height : 0;
      const projected = gridToProjected(x, y, cellHeight + organism.size * 0.1);
      drawableObjects.push({
        type: 'organism',
        gridX: x,
        gridY: y,
        screenX: projected.screenX + offsetX,
        screenY: projected.screenY + offsetY,
        depth: projected.depth,
        data: organism
      });
    }
    
    // Sort by depth (back to front)
    drawableObjects.sort((a, b) => b.depth - a.depth);
    
    // Draw all objects in depth order
    for (const obj of drawableObjects) {
      if (obj.type === 'cell') {
        drawIsometricCell(ctx, obj.data, offsetX, offsetY, scale);
      } else if (obj.type === 'organism') {
        drawIsometricOrganism(ctx, obj.data, obj.screenX, obj.screenY, scale);
      }
    }
    
    // Draw disturbance effect
    if (disturbance && disturbance.active) {
      const { startX, startY, endX, endY } = disturbance.affectedArea;
      
      const corners = [
        gridToProjected(startX, startY, 0.1),
        gridToProjected(endX, startY, 0.1),
        gridToProjected(endX, endY, 0.1),
        gridToProjected(startX, endY, 0.1)
      ];
      
      ctx.beginPath();
      corners.forEach((corner, index) => {
        const x = corner.screenX + offsetX;
        const y = corner.screenY + offsetY;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      
      const alpha = 0.3 * disturbance.intensity;
      let disturbanceColor = `rgba(255, 100, 100, ${alpha})`;
      
      switch (disturbance.type) {
        case DisturbanceType.Fire:
          disturbanceColor = `rgba(255, 100, 0, ${alpha})`;
          break;
        case DisturbanceType.Drought:
          disturbanceColor = `rgba(255, 255, 100, ${alpha})`;
          break;
        case DisturbanceType.Flood:
          disturbanceColor = `rgba(100, 100, 255, ${alpha})`;
          break;
        case DisturbanceType.Disease:
          disturbanceColor = `rgba(100, 255, 100, ${alpha})`;
          break;
        case DisturbanceType.HumanActivity:
          disturbanceColor = `rgba(100, 100, 100, ${alpha})`;
          break;
      }
      
      ctx.fillStyle = disturbanceColor;
      ctx.fill();
    }
    
    // Draw selected cell highlight
    if (selectedCell) {
      drawCellHighlight(ctx, selectedCell.x, selectedCell.y, 'rgba(255, 255, 0, 0.8)', offsetX, offsetY);
    }
    
    // Draw hover cell highlight
    if (hoverCell) {
      drawCellHighlight(ctx, hoverCell.x, hoverCell.y, 'rgba(255, 255, 255, 0.5)', offsetX, offsetY);
    }
    
  }, [grid, organisms, width, height, disturbance, selectedCell, hoverCell, dimensions, cameraState, spritesReady, drawCellHighlight, drawIsometricCell, drawIsometricOrganism, gridToProjected, screenToGrid]);
  
  // Handle mouse events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const gridPos = screenToGrid(e.clientX, e.clientY);
    setHoverCell(gridPos);
  };
  
  const handleMouseOut = () => {
    setHoverCell(null);
  };
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCellClick) return;
    
    const gridPos = screenToGrid(e.clientX, e.clientY);
    if (gridPos) {
      onCellClick(gridPos.x, gridPos.y);
    }
  };
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex flex-col bg-gradient-to-br from-cyan-100 to-blue-200 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden"
    >
      {/* Camera Controls Info */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded z-10">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="font-semibold mb-1">Mouse Controls:</div>
            <div>Left Drag: Orbit</div>
            <div>Right/Middle: Pan</div>
            <div>Wheel: Zoom</div>
          </div>
          <div>
            <div className="font-semibold mb-1">Keyboard:</div>
            <div>WASD: Move</div>
            <div>QE: Up/Down</div>
            <div>Arrows: Rotate</div>
            <div>R: Reset | F: Fullscreen</div>
          </div>
        </div>
      </div>
      
      {/* Camera Status */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded z-10">
        <div>Pos: ({cameraState.position.x.toFixed(1)}, {cameraState.position.y.toFixed(1)}, {cameraState.position.z.toFixed(1)})</div>
        <div>Rot: ({cameraState.rotation.pitch.toFixed(0)}°, {cameraState.rotation.yaw.toFixed(0)}°)</div>
        <div>Zoom: {cameraState.zoom.toFixed(2)}x</div>
        {isFullscreen && <div className="text-yellow-300">Fullscreen Mode</div>}
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
          onMouseMove={handleMouseMove}
          onMouseOut={handleMouseOut}
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        />
      </div>
    </div>
  );
};

export default SimulationGrid;
