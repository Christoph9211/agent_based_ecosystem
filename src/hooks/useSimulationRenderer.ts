import React, { useEffect } from 'react';
import { Cell, OrganismType, Disturbance } from '../types/types';
import { CameraState } from './useCameraControls';
import { gridToProjected } from '../utils/coordinateUtils';
import {
  drawIsometricCell,
  drawIsometricOrganism,
  drawCellHighlight,
  drawDisturbanceEffect,
} from '../utils/drawing';

interface SimulationRendererProps {
  grid: Cell[][];
  organisms: Record<string, any>;
  width: number;
  height: number;
  disturbance: Disturbance | null;
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

export const useSimulationRenderer = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  props: SimulationRendererProps,
  cameraState: CameraState,
  selectedCell: { x: number; y: number } | null,
  hoverCell: { x: number; y: number } | null
) => {
  const { grid, organisms, width, height, disturbance } = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid || grid.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2;
    const scale = cameraState.zoom;

    const drawableObjects: DrawableObject[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = grid[y][x];
        if (!cell) continue;
        const projected = gridToProjected(x, y, cell.height, cameraState, width, height);
        drawableObjects.push({
          type: 'cell',
          gridX: x,
          gridY: y,
          screenX: projected.screenX + offsetX,
          screenY: projected.screenY + offsetY,
          depth: projected.depth,
          data: cell,
        });
      }
    }

    for (const organism of Object.values(organisms)) {
      const { position } = organism;
      const { x, y } = position;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const cell = grid[y]?.[x];
      const cellHeight = cell ? cell.height : 0;
      const elevation = organism.type === OrganismType.Producer ? cellHeight : cellHeight + organism.size * 0.5;
      const projected = gridToProjected(x, y, elevation, cameraState, width, height);
      drawableObjects.push({
        type: 'organism',
        gridX: x,
        gridY: y,
        screenX: projected.screenX + offsetX,
        screenY: projected.screenY + offsetY,
        depth: projected.depth,
        data: organism,
      });
    }

    drawableObjects.sort((a, b) => b.depth - a.depth);

    for (const obj of drawableObjects) {
      if (obj.type === 'cell') {
        drawIsometricCell(ctx, obj.data, cameraState, width, height, offsetX, offsetY, scale);
      } else if (obj.type === 'organism') {
        drawIsometricOrganism(ctx, obj.data, obj.screenX, obj.screenY, scale);
      }
    }

    if (disturbance && disturbance.active) {
      drawDisturbanceEffect(ctx, disturbance, cameraState, width, height, offsetX, offsetY);
    }

    if (selectedCell) {
      drawCellHighlight(ctx, selectedCell.x, selectedCell.y, 'rgba(255, 255, 0, 0.8)', cameraState, grid, width, height, offsetX, offsetY);
    }

    if (hoverCell) {
      drawCellHighlight(ctx, hoverCell.x, hoverCell.y, 'rgba(255, 255, 255, 0.5)', cameraState, grid, width, height, offsetX, offsetY);
    }
  }, [grid, organisms, width, height, disturbance, selectedCell, hoverCell, cameraState, canvasRef]);
};