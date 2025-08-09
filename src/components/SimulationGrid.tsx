import React, { useRef, useEffect, useState } from 'react';
import { Cell, Disturbance } from '../types/types';
import { useCameraControls } from '../hooks/useCameraControls';
import { useSimulationRenderer } from '../hooks/useSimulationRenderer';
import { screenToGrid } from '../utils/coordinateUtils';
import CameraInfoOverlay from './CameraInfoOverlay';

interface SimulationGridProps {
  grid: Cell[][];
  organisms: Record<string, any>;
  width: number;
  height: number;
  disturbance: Disturbance | null;
  onCellClick?: (x: number, y: number) => void;
  selectedCell?: { x: number, y: number } | null;
}

const SimulationGrid: React.FC<SimulationGridProps> = (props) => {
  const { grid, organisms, width, height, disturbance, onCellClick, selectedCell } = props;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoverCell, setHoverCell] = useState<{ x: number, y: number } | null>(null);
  
  const { cameraState, isFullscreen } = useCameraControls(canvasRef);
  
  useSimulationRenderer(
    canvasRef,
    { grid, organisms, width, height, disturbance },
    cameraState,
    selectedCell ?? null,
    hoverCell
  );

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gridPos = screenToGrid(e.clientX, e.clientY, canvas, cameraState, grid, width, height);
    setHoverCell(gridPos);
  };
  
  const handleMouseOut = () => {
    setHoverCell(null);
  };
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!onCellClick || !canvas) return;
    
    const gridPos = screenToGrid(e.clientX, e.clientY, canvas, cameraState, grid, width, height);
    if (gridPos) {
      onCellClick(gridPos.x, gridPos.y);
    }
  };
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex flex-col bg-gradient-to-br from-cyan-100 to-blue-200 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden relative"
    >
      <CameraInfoOverlay cameraState={cameraState} isFullscreen={isFullscreen} />
      
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