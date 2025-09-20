import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface Enhanced3DControlsProps {
  enablePan?: boolean;
  enableZoom?: boolean;
  enableRotate?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
  onViewChange?: (position: THREE.Vector3, target: THREE.Vector3) => void;
}

export interface ControlsHandle {
  resetView: () => void;
  setAutoRotate: (enabled: boolean) => void;
  isAutoRotate: boolean;
}

const Enhanced3DControls = forwardRef<ControlsHandle, Enhanced3DControlsProps>(({
  enablePan = true,
  enableZoom = true,
  enableRotate = true,
  autoRotate = false,
  autoRotateSpeed = 0.5,
  minDistance = 5,
  maxDistance = 50,
  onViewChange
}, ref) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [isAutoRotate, setIsAutoRotate] = useState(autoRotate);

  // 重置视角
  const resetView = () => {
    if (controlsRef.current && camera) {
      camera.position.set(25, 25, 35);
      controlsRef.current.target.set(25, 25, 0);
      controlsRef.current.update();
      onViewChange?.(camera.position, controlsRef.current.target);
    }
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    resetView,
    setAutoRotate: setIsAutoRotate,
    isAutoRotate
  }));

  return (
    <DreiOrbitControls
      ref={controlsRef}
      enablePan={enablePan}
      enableZoom={enableZoom}
      enableRotate={enableRotate}
      autoRotate={isAutoRotate}
      autoRotateSpeed={autoRotateSpeed}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={0}
      maxPolarAngle={Math.PI}
      dampingFactor={0.1}
      enableDamping={true}
      rotateSpeed={0.8}
      panSpeed={1.2}
      zoomSpeed={1.5}
      screenSpacePanning={true}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      }}
      onChange={() => {
        if (controlsRef.current && onViewChange) {
          onViewChange(camera.position, controlsRef.current.target);
        }
      }}
    />
  );
});

export default Enhanced3DControls; 