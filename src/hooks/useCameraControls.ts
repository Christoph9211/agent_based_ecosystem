import { useState, useEffect, useRef, useCallback } from 'react';

export interface CameraState {
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number };
  zoom: number;
}

export interface CameraControls {
  cameraState: CameraState;
  resetCamera: () => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
}

interface CameraSettings {
  movementSpeed: number;
  rotationSpeed: number;
  zoomSpeed: number;
  mouseSensitivity: number;
  damping: number;
}

const DEFAULT_CAMERA_STATE: CameraState = {
  // Centered slightly above the grid looking down from an isometric angle
  position: { x: 0, y: 15, z: 15 },
  // Rotation is handled by the isometric projection so start at zero
  rotation: { pitch: 0, yaw: 0 },
  zoom: 0.8,
};

const DEFAULT_SETTINGS: CameraSettings = {
  movementSpeed: 0.1,
  rotationSpeed: 1.0,
  zoomSpeed: 0.1,
  mouseSensitivity: 0.5,
  damping: 0.9,
};

export function useCameraControls(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  settings: Partial<CameraSettings> = {}
): CameraControls {
  const config = { ...DEFAULT_SETTINGS, ...settings };
  
  const [cameraState, setCameraState] = useState<CameraState>(DEFAULT_CAMERA_STATE);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Input state
  const keysPressed = useRef<Set<string>>(new Set());
  const mouseState = useRef({
    isLeftDown: false,
    isMiddleDown: false,
    isRightDown: false,
    lastX: 0,
    lastY: 0,
  });
  
  // Movement velocities for smooth movement
  const velocities = useRef({
    position: { x: 0, y: 0, z: 0 },
    rotation: { pitch: 0, yaw: 0 },
    zoom: 0,
  });
  
  // Animation frame reference
  const animationFrameRef = useRef<number>();
  
  // Reset camera to default state
  const resetCamera = useCallback(() => {
    setCameraState({ ...DEFAULT_CAMERA_STATE });
    velocities.current = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { pitch: 0, yaw: 0 },
      zoom: 0,
    };
  }, []);
  
  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Failed to exit fullscreen:', err);
      });
    }
  }, []);
  
  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Keyboard event handlers
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysPressed.current.add(e.code);
    
    // Handle special keys
    switch (e.code) {
      case 'KeyR':
        resetCamera();
        break;
      case 'KeyF':
      case 'F11':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'Escape':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        break;
    }
  }, [resetCamera, toggleFullscreen]);
  
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current.delete(e.code);
  }, []);
  
  // Mouse event handlers
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    
    e.preventDefault();
    
    mouseState.current.lastX = e.clientX;
    mouseState.current.lastY = e.clientY;
    
    switch (e.button) {
      case 0: // Left button - pan
        mouseState.current.isLeftDown = true;
        break;
      case 1: // Middle button - rotate
        mouseState.current.isMiddleDown = true;
        break;
      case 2: // Right button - rotate
        mouseState.current.isRightDown = true;
        break;
    }
    
    canvasRef.current.style.cursor = 'grabbing';
  }, [canvasRef]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    
    const deltaX = e.clientX - mouseState.current.lastX;
    const deltaY = e.clientY - mouseState.current.lastY;
    
    if (mouseState.current.isLeftDown) {
      // Camera panning (drag with left mouse button)
      const panSpeed = 0.02 * (1 / cameraState.zoom);
      const panDelta = {
        x: -deltaX * panSpeed,
        z: -deltaY * panSpeed,
      };

      setCameraState(prev => ({
        ...prev,
        position: {
          x: prev.position.x + panDelta.x,
          y: prev.position.y,
          z: prev.position.z + panDelta.z,
        },
      }));
    } else if (mouseState.current.isRightDown || mouseState.current.isMiddleDown) {
      // Orbit camera rotation (drag with right or middle mouse button)
      const rotationDelta = {
        yaw: deltaX * config.mouseSensitivity,
        pitch: -deltaY * config.mouseSensitivity,
      };

      setCameraState(prev => ({
        ...prev,
        rotation: {
          pitch: Math.max(-89, Math.min(89, prev.rotation.pitch + rotationDelta.pitch)),
          yaw: (prev.rotation.yaw + rotationDelta.yaw) % 360,
        },
      }));
    }
    
    mouseState.current.lastX = e.clientX;
    mouseState.current.lastY = e.clientY;
  }, [config.mouseSensitivity, cameraState.zoom]);
  
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    
    switch (e.button) {
      case 0:
        mouseState.current.isLeftDown = false;
        break;
      case 1:
        mouseState.current.isMiddleDown = false;
        break;
      case 2:
        mouseState.current.isRightDown = false;
        break;
    }
    
    if (!mouseState.current.isLeftDown && !mouseState.current.isMiddleDown && !mouseState.current.isRightDown) {
      canvasRef.current.style.cursor = 'pointer';
    }
  }, [canvasRef]);
  
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const zoomDelta = e.deltaY > 0 ? -config.zoomSpeed : config.zoomSpeed;
    
    setCameraState(prev => ({
      ...prev,
      zoom: Math.max(0.2, Math.min(3.0, prev.zoom + zoomDelta)), // Adjusted zoom range for better control
    }));
  }, [config.zoomSpeed]);
  
  // Update camera based on keyboard input
  const updateCamera = useCallback(() => {
    const keys = keysPressed.current;
    const positionDelta = { x: 0, y: 0, z: 0 };
    const rotationDelta = { pitch: 0, yaw: 0 };
    
    // Movement (WASD + QE)
    if (keys.has('KeyW')) positionDelta.z -= config.movementSpeed;
    if (keys.has('KeyS')) positionDelta.z += config.movementSpeed;
    if (keys.has('KeyA')) positionDelta.x -= config.movementSpeed;
    if (keys.has('KeyD')) positionDelta.x += config.movementSpeed;
    if (keys.has('KeyQ')) positionDelta.y -= config.movementSpeed;
    if (keys.has('KeyE')) positionDelta.y += config.movementSpeed;
    
    // Rotation (Arrow keys)
    if (keys.has('ArrowLeft')) rotationDelta.yaw -= config.rotationSpeed;
    if (keys.has('ArrowRight')) rotationDelta.yaw += config.rotationSpeed;
    if (keys.has('ArrowUp')) rotationDelta.pitch += config.rotationSpeed;
    if (keys.has('ArrowDown')) rotationDelta.pitch -= config.rotationSpeed;
    
    // Apply velocities with acceleration
    velocities.current.position.x += positionDelta.x * 0.1;
    velocities.current.position.y += positionDelta.y * 0.1;
    velocities.current.position.z += positionDelta.z * 0.1;
    velocities.current.rotation.pitch += rotationDelta.pitch * 0.1;
    velocities.current.rotation.yaw += rotationDelta.yaw * 0.1;
    
    // Apply damping
    velocities.current.position.x *= config.damping;
    velocities.current.position.y *= config.damping;
    velocities.current.position.z *= config.damping;
    velocities.current.rotation.pitch *= config.damping;
    velocities.current.rotation.yaw *= config.damping;
    
    // Update camera state if there's movement
    const hasMovement = 
      Math.abs(velocities.current.position.x) > 0.001 ||
      Math.abs(velocities.current.position.y) > 0.001 ||
      Math.abs(velocities.current.position.z) > 0.001 ||
      Math.abs(velocities.current.rotation.pitch) > 0.001 ||
      Math.abs(velocities.current.rotation.yaw) > 0.001;
    
    if (hasMovement) {
      setCameraState(prev => ({
        ...prev,
        position: {
          x: prev.position.x + velocities.current.position.x,
          y: prev.position.y + velocities.current.position.y,
          z: prev.position.z + velocities.current.position.z,
        },
        rotation: {
          pitch: Math.max(-89, Math.min(89, prev.rotation.pitch + velocities.current.rotation.pitch)),
          yaw: (prev.rotation.yaw + velocities.current.rotation.yaw) % 360,
        },
      }));
    }
    
    animationFrameRef.current = requestAnimationFrame(updateCamera);
  }, [config]);
  
  // Set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Keyboard events (global)
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Mouse events (canvas-specific)
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(updateCamera);
    
    return () => {
      // Cleanup
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasRef, handleKeyDown, handleKeyUp, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, updateCamera]);
  
  return {
    cameraState,
    resetCamera,
    toggleFullscreen,
    isFullscreen,
  };
}
