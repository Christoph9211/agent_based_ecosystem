import { useState, useEffect, useRef, useCallback } from 'react';

export interface CameraState {
  target: { x: number; y: number; z: number }; // The point the camera is looking at
  rotation: { pitch: number; yaw: number };
  distance: number; // Distance from target
}

export interface CameraControls {
  cameraState: CameraState;
  resetCamera: () => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
}

interface CameraSettings {
  panSpeed: number;
  rotationSpeed: number;
  zoomSpeed: number;
  mouseSensitivity: number;
  damping: number;
  minPitch: number;
  maxPitch: number;
  minDistance: number;
  maxDistance: number;
}

const DEFAULT_CAMERA_STATE: CameraState = {
  target: { x: 0, y: 0, z: 0 },
  rotation: { pitch: 35, yaw: 45 }, // Standard isometric-like starting angle
  distance: 50,
};

const DEFAULT_SETTINGS: CameraSettings = {
  panSpeed: 0.1,
  rotationSpeed: 0.5,
  zoomSpeed: 0.1,
  mouseSensitivity: 0.4,
  damping: 0.85,
  minPitch: 5,
  maxPitch: 89, // Prevent gimbal lock/flipping
  minDistance: 5,
  maxDistance: 200,
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
    target: { x: 0, y: 0, z: 0 },
    rotation: { pitch: 0, yaw: 0 },
    distance: 0,
  });

  // Animation frame reference
  const animationFrameRef = useRef<number>();

  // Reset camera to default state
  const resetCamera = useCallback(() => {
    setCameraState({ ...DEFAULT_CAMERA_STATE });
    velocities.current = {
      target: { x: 0, y: 0, z: 0 },
      rotation: { pitch: 0, yaw: 0 },
      distance: 0,
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

    // Only prevent default if clicking on the canvas
    if (e.target === canvasRef.current) {
      e.preventDefault();
      canvasRef.current.focus();
    }

    mouseState.current.lastX = e.clientX;
    mouseState.current.lastY = e.clientY;

    switch (e.button) {
      case 0: // Left button
        mouseState.current.isLeftDown = true;
        break;
      case 1: // Middle button
        mouseState.current.isMiddleDown = true;
        break;
      case 2: // Right button
        mouseState.current.isRightDown = true;
        break;
    }

    canvasRef.current.style.cursor = 'grabbing';
  }, [canvasRef]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;

    const deltaX = e.clientX - mouseState.current.lastX;
    const deltaY = e.clientY - mouseState.current.lastY;

    // Pan: Right click OR Middle click OR Shift+Left click
    const isPanning = mouseState.current.isRightDown || mouseState.current.isMiddleDown || (mouseState.current.isLeftDown && e.shiftKey);
    // Orbit: Left click (without shift)
    const isOrbiting = mouseState.current.isLeftDown && !e.shiftKey;

    if (isPanning) {
      // Calculate pan direction relative to camera rotation
      const yawRad = (cameraState.rotation.yaw * Math.PI) / 180;
      const cosYaw = Math.cos(yawRad);
      const sinYaw = Math.sin(yawRad);

      // Adjust pan speed based on distance (zoom level)
      const currentPanSpeed = config.panSpeed * (cameraState.distance / 20);

      // Pan X moves left/right relative to camera
      const panX_X = -deltaX * cosYaw * currentPanSpeed;
      const panX_Z = -deltaX * sinYaw * currentPanSpeed;

      // Pan Y moves forward/backward relative to camera (projected onto ground plane)
      // Or up/down if we want screen-space panning.
      // Let's do screen-space panning: Up/Down on screen maps to forward/back on ground plane
      const panY_X = -deltaY * sinYaw * currentPanSpeed;
      const panY_Z = deltaY * cosYaw * currentPanSpeed;

      setCameraState(prev => ({
        ...prev,
        target: {
          x: prev.target.x + panX_X + panY_X,
          y: prev.target.y, // Keep height constant for now, or allow Y panning if desired
          z: prev.target.z + panX_Z + panY_Z,
        },
      }));
    } else if (isOrbiting) {
      const rotationDelta = {
        yaw: deltaX * config.mouseSensitivity,
        pitch: deltaY * config.mouseSensitivity,
      };

      setCameraState(prev => ({
        ...prev,
        rotation: {
          pitch: Math.max(config.minPitch, Math.min(config.maxPitch, prev.rotation.pitch + rotationDelta.pitch)),
          yaw: (prev.rotation.yaw + rotationDelta.yaw) % 360,
        },
      }));
    }

    mouseState.current.lastX = e.clientX;
    mouseState.current.lastY = e.clientY;
  }, [config, cameraState.rotation.yaw, cameraState.distance]);

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

    // Zoom logic
    const zoomFactor = 1.1;
    const direction = e.deltaY > 0 ? 1 : -1;

    setCameraState(prev => {
      let newDistance = prev.distance;
      if (direction > 0) {
        newDistance *= zoomFactor;
      } else {
        newDistance /= zoomFactor;
      }

      return {
        ...prev,
        distance: Math.max(config.minDistance, Math.min(config.maxDistance, newDistance)),
      };
    });
  }, [config.minDistance, config.maxDistance]);

  // Update camera based on keyboard input (smooth movement)
  const updateCamera = useCallback(() => {
    const keys = keysPressed.current;
    const targetDelta = { x: 0, y: 0, z: 0 };
    const rotationDelta = { pitch: 0, yaw: 0 };

    // Keyboard movement (WASD pans the target)
    const moveSpeed = config.panSpeed * (cameraState.distance / 10); // Scale speed with zoom

    if (keys.has('KeyW')) targetDelta.z -= moveSpeed;
    if (keys.has('KeyS')) targetDelta.z += moveSpeed;
    if (keys.has('KeyA')) targetDelta.x -= moveSpeed;
    if (keys.has('KeyD')) targetDelta.x += moveSpeed;

    // Elevation (Q/E) - moves target up/down
    // if (keys.has('KeyQ')) targetDelta.y -= moveSpeed;
    // if (keys.has('KeyE')) targetDelta.y += moveSpeed;

    // Keyboard rotation (Arrow keys)
    if (keys.has('ArrowLeft')) rotationDelta.yaw -= config.rotationSpeed;
    if (keys.has('ArrowRight')) rotationDelta.yaw += config.rotationSpeed;
    if (keys.has('ArrowUp')) rotationDelta.pitch -= config.rotationSpeed;
    if (keys.has('ArrowDown')) rotationDelta.pitch += config.rotationSpeed;

    // Rotate movement vector by camera's yaw to make it relative to view
    const yawRad = (cameraState.rotation.yaw * Math.PI) / 180;
    const cosYaw = Math.cos(yawRad);
    const sinYaw = Math.sin(yawRad);

    const worldDeltaX = targetDelta.x * cosYaw - targetDelta.z * sinYaw;
    const worldDeltaZ = targetDelta.x * sinYaw + targetDelta.z * cosYaw;

    // Apply velocities with acceleration
    velocities.current.target.x += worldDeltaX * 0.2;
    velocities.current.target.y += targetDelta.y * 0.2;
    velocities.current.target.z += worldDeltaZ * 0.2;
    velocities.current.rotation.pitch += rotationDelta.pitch * 0.2;
    velocities.current.rotation.yaw += rotationDelta.yaw * 0.2;

    // Apply damping
    velocities.current.target.x *= config.damping;
    velocities.current.target.y *= config.damping;
    velocities.current.target.z *= config.damping;
    velocities.current.rotation.pitch *= config.damping;
    velocities.current.rotation.yaw *= config.damping;

    // Update camera state if there is movement
    const hasMovement =
      Math.abs(velocities.current.target.x) > 0.001 ||
      Math.abs(velocities.current.target.y) > 0.001 ||
      Math.abs(velocities.current.target.z) > 0.001 ||
      Math.abs(velocities.current.rotation.pitch) > 0.001 ||
      Math.abs(velocities.current.rotation.yaw) > 0.001;

    if (hasMovement) {
      setCameraState(prev => ({
        ...prev,
        target: {
          x: prev.target.x + velocities.current.target.x,
          y: prev.target.y + velocities.current.target.y,
          z: prev.target.z + velocities.current.target.z,
        },
        rotation: {
          pitch: Math.max(config.minPitch, Math.min(config.maxPitch, prev.rotation.pitch + velocities.current.rotation.pitch)),
          yaw: (prev.rotation.yaw + velocities.current.rotation.yaw) % 360,
        },
      }));
    }

    animationFrameRef.current = requestAnimationFrame(updateCamera);
  }, [config, cameraState.rotation.yaw, cameraState.distance]);

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
