import { CameraState } from '../hooks/useCameraControls';
import { Cell } from '../types/types';

const CELL_SIZE = 32;

export const gridToProjected = (
  gridX: number,
  gridY: number,
  elevation: number = 0,
  cameraState: CameraState,
  gridWidth: number,
  gridHeight: number
): { screenX: number; screenY: number; depth: number } => {
  const cellWorldSize = 1;
  const verticalScale = 0.5 * cellWorldSize;

  let worldX = gridX * cellWorldSize - (gridWidth * cellWorldSize) / 2;
  let worldY = elevation * verticalScale;
  let worldZ = gridY * cellWorldSize - (gridHeight * cellWorldSize) / 2;

  worldX -= cameraState.position.x;
  worldY -= cameraState.position.y;
  worldZ -= cameraState.position.z;

  const yawRad = (-cameraState.rotation.yaw * Math.PI) / 180;
  const cosYaw = Math.cos(yawRad);
  const sinYaw = Math.sin(yawRad);
  const x1 = worldX * cosYaw - worldZ * sinYaw;
  const y1 = worldY;
  const z1 = worldX * sinYaw + worldZ * cosYaw;

  const pitchRad = (-cameraState.rotation.pitch * Math.PI) / 180;
  const cosPitch = Math.cos(pitchRad);
  const sinPitch = Math.sin(pitchRad);
  const x2 = x1;
  const y2 = y1 * cosPitch - z1 * sinPitch;
  const z2 = y1 * sinPitch + z1 * cosPitch;

  const cos45 = Math.cos(45 * Math.PI / 180);
  const sin45 = Math.sin(45 * Math.PI / 180);
  const cos30 = Math.cos(30 * Math.PI / 180);
  const sin30 = Math.sin(30 * Math.PI / 180);

  const x_prime = x2 * cos45 + z2 * sin45;
  const y_prime = y2;
  const z_prime = -x2 * sin45 + z2 * cos45;

  const x_rotated = x_prime;
  const y_rotated = y_prime * cos30 - z_prime * sin30;
  const z_rotated = y_prime * sin30 + z_prime * cos30;

  return {
    screenX: x_rotated * cameraState.zoom * CELL_SIZE,
    screenY: y_rotated * cameraState.zoom * CELL_SIZE,
    depth: z_rotated,
  };
};

export const screenToGrid = (
  screenX: number,
  screenY: number,
  canvas: HTMLCanvasElement,
  cameraState: CameraState,
  grid: Cell[][],
  gridWidth: number,
  gridHeight: number
): { x: number; y: number } | null => {
  const rect = canvas.getBoundingClientRect();
  const canvasX = screenX - rect.left;
  const canvasY = screenY - rect.top;

  const offsetX = canvas.width / 2;
  const offsetY = canvas.height / 2;

  const worldX = (canvasX - offsetX) / (cameraState.zoom * CELL_SIZE);
  const worldY = -(canvasY - offsetY) / (cameraState.zoom * CELL_SIZE);

  let bestMatch = null;
  let bestDistance = Infinity;

  for (let gy = 0; gy < gridHeight; gy++) {
    for (let gx = 0; gx < gridWidth; gx++) {
      const cell = grid[gy]?.[gx];
      const cellHeight = cell ? cell.height : 0;
      const projected = gridToProjected(gx, gy, cellHeight, cameraState, gridWidth, gridHeight);
      const distance = Math.sqrt(
        Math.pow(projected.screenX / (cameraState.zoom * CELL_SIZE) - worldX, 2) +
        Math.pow(projected.screenY / (cameraState.zoom * CELL_SIZE) - worldY, 2)
      );

      if (distance < bestDistance && distance < 1.0) {
        bestDistance = distance;
        bestMatch = { x: gx, y: gy };
      }
    }
  }

  return bestMatch;
};