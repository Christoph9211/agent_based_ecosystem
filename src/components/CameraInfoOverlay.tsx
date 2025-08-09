import React from 'react';
import { CameraState } from '../hooks/useCameraControls';

interface CameraInfoOverlayProps {
  cameraState: CameraState;
  isFullscreen: boolean;
}

const CameraInfoOverlay: React.FC<CameraInfoOverlayProps> = ({ cameraState, isFullscreen }) => {
  return (
    <>
      {/* Camera Controls Info */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded z-10 pointer-events-none">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="font-semibold mb-1">Mouse Controls:</div>
            <div>Left Drag: Pan</div>
            <div>Right/Middle: Orbit</div>
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
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded z-10 pointer-events-none">
        <div>Pos: ({cameraState.position.x.toFixed(1)}, {cameraState.position.y.toFixed(1)}, {cameraState.position.z.toFixed(1)})</div>
        <div>Rot: ({cameraState.rotation.pitch.toFixed(0)}°, {cameraState.rotation.yaw.toFixed(0)}°)</div>
        <div>Zoom: {cameraState.zoom.toFixed(2)}x</div>
        {isFullscreen && <div className="text-yellow-300">Fullscreen Mode</div>}
      </div>
    </>
  );
};

export default CameraInfoOverlay;