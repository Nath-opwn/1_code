import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import Enhanced3DControls, { ControlsHandle } from './Enhanced3DControls';
import ControlPanel from './ControlPanel';
import * as THREE from 'three';

interface FluidSimulationProps {
  className?: string;
  reynoldsNumber?: number;
  viscosity?: number;
  density?: number;
  flowSpeed?: number;
  obstacleSize?: number;
  simulationType?: string;
  visualizationType?: string;
  viewType?: string;
  enableDataProbe?: boolean;
}

// 流体粒子系统
interface FluidParticles {
  positions: Float32Array;
  velocities: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
}

const FluidSimulation: React.FC<FluidSimulationProps> = ({
  className = '',
  reynoldsNumber = 100,
  viscosity = 0.01,
  density = 1.0,
  flowSpeed = 1.0,
  obstacleSize = 1.0,
  simulationType = 'cylinder',
  visualizationType = 'velocity',
  viewType = 'free',
  enableDataProbe = false
}) => {
  const controlsRef = useRef<ControlsHandle>(null);
  const [isAutoRotate, setIsAutoRotate] = useState(false);

  const handleToggleAutoRotate = () => {
    const newAutoRotate = !isAutoRotate;
    setIsAutoRotate(newAutoRotate);
    controlsRef.current?.setAutoRotate(newAutoRotate);
  };

  const handleResetView = () => {
    controlsRef.current?.resetView();
  };

  return (
    <div className={`w-full h-full relative ${className}`}>
      <Canvas shadows>
        <color attach="background" args={['#000']} />
        <PerspectiveCamera makeDefault position={[0, 5, 15]} fov={60} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        
        <FluidScene
          reynoldsNumber={reynoldsNumber}
          viscosity={viscosity}
          density={density}
          flowSpeed={flowSpeed}
          obstacleSize={obstacleSize}
          simulationType={simulationType}
          visualizationType={visualizationType}
          enableDataProbe={enableDataProbe}
        />
        
        <Enhanced3DControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
          autoRotate={isAutoRotate}
        />
      </Canvas>
      
      <ControlPanel
        isAutoRotate={isAutoRotate}
        onToggleAutoRotate={handleToggleAutoRotate}
        onResetView={handleResetView}
      />
    </div>
  );
};

// 流体场景组件
const FluidScene: React.FC<Omit<FluidSimulationProps, 'className' | 'viewType'>> = ({
  reynoldsNumber = 100,
  viscosity = 0.01,
  density = 1.0,
  flowSpeed = 1.0,
  obstacleSize = 1.0,
  simulationType = 'cylinder',
  visualizationType = 'velocity',
  enableDataProbe = false
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const obstacleRef = useRef<THREE.Mesh>(null);
  
  const [particles, setParticles] = useState<FluidParticles | null>(null);
  const [time, setTime] = useState(0);

  // 初始化粒子系统
  useEffect(() => {
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // 在入口区域分布粒子
      positions[i * 3] = -10 + Math.random() * 5; // x
      positions[i * 3 + 1] = -5 + Math.random() * 10; // y
      positions[i * 3 + 2] = -2 + Math.random() * 4; // z

      // 初始速度
      velocities[i * 3] = flowSpeed + Math.random() * 0.5; // x
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.2; // y
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2; // z

      // 初始颜色 (蓝色系)
      colors[i * 3] = 0.2 + Math.random() * 0.3; // r
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.3; // g
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // b

      // 粒子大小
      sizes[i] = 0.1 + Math.random() * 0.2;
    }

    setParticles({ positions, velocities, colors, sizes });
  }, [flowSpeed]);

  // 更新粒子动画
  useFrame((state, delta) => {
    if (!particles || !particlesRef.current) return;

    setTime(prev => prev + delta);

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < positions.length / 3; i++) {
      const i3 = i * 3;
      
      // 当前位置
      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];

      // 计算与圆柱体障碍物的距离（仅在XY平面）
      const obstacleX = 0;
      const obstacleY = 0;
      const obstacleRadius = obstacleSize * 2;

      const dx = x - obstacleX;
      const dy = y - obstacleY;
      // 圆柱体碰撞检测：只考虑XY平面的距离，忽略Z轴
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 计算速度场
      let vx = flowSpeed;
      let vy = 0;
      let vz = 0;

      // 圆柱绕流效果
      if (simulationType === 'cylinder' || simulationType === 'karman') {
        if (distance < obstacleRadius + 2) {
          // 障碍物附近的流场扰动
          const angle = Math.atan2(dy, dx);
          const strength = Math.max(0, (obstacleRadius + 2 - distance) / 2);
          
          vx = flowSpeed * (1 - strength) + Math.cos(angle + Math.PI/2) * strength * flowSpeed;
          vy = Math.sin(angle + Math.PI/2) * strength * flowSpeed;
          
          // 卡门涡街效果
          if (simulationType === 'karman' && x > obstacleX) {
            const vortexFreq = reynoldsNumber * 0.01;
            const vortexStrength = 0.5;
            vy += Math.sin(time * vortexFreq + y * 0.5) * vortexStrength;
          }
        }
      }

      // 更新位置
      positions[i3] += vx * delta;
      positions[i3 + 1] += vy * delta;
      positions[i3 + 2] += vz * delta;

      // 边界处理
      if (x > 15 || distance < obstacleRadius) {
        // 重置到入口
        positions[i3] = -10 + Math.random() * 5;
        positions[i3 + 1] = -5 + Math.random() * 10;
        positions[i3 + 2] = -2 + Math.random() * 4;
      }

      // 根据速度更新颜色
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      const speedNorm = Math.min(speed / (flowSpeed * 2), 1);

      if (visualizationType === 'velocity') {
        colors[i3] = 0.1 + speedNorm * 0.8; // r
        colors[i3 + 1] = 0.3 + speedNorm * 0.5; // g
        colors[i3 + 2] = 0.8 + speedNorm * 0.2; // b
      } else if (visualizationType === 'pressure') {
        // 模拟压力可视化
        const pressure = 1 - distance / 10;
        colors[i3] = Math.max(0, pressure); // r
        colors[i3 + 1] = 0.2; // g
        colors[i3 + 2] = Math.max(0, 1 - pressure); // b
      } else if (visualizationType === 'vorticity') {
        // 模拟涡量可视化
        const vorticity = Math.abs(vy);
        colors[i3] = vorticity > 0.5 ? 1 : 0; // r
        colors[i3 + 1] = 0.3; // g
        colors[i3 + 2] = vorticity < 0.5 ? 1 : 0; // b
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.geometry.attributes.color.needsUpdate = true;
  });

  // 渲染粒子着色器材质
  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float r = distance(gl_PointCoord, vec2(0.5, 0.5));
          if (r > 0.5) {
            discard;
          }
          
          float intensity = 1.0 - 2.0 * r;
          intensity = pow(intensity, 0.5);
          
          gl_FragColor = vec4(vColor * intensity, intensity);
        }
      `
    });
  }, []);

  return (
    <group ref={groupRef}>
      {/* 障碍物 */}
      <mesh 
        ref={obstacleRef}
        position={[0, 0, 0]}
        castShadow 
        receiveShadow
      >
        <cylinderGeometry args={[obstacleSize * 2, obstacleSize * 2, 6, 32]} />
        <meshStandardMaterial 
          color="#444" 
          roughness={0.7} 
          metalness={0.3} 
        />
      </mesh>

      {/* 流体粒子 */}
      {particles && (
        <points ref={particlesRef} material={particleMaterial}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particles.positions.length / 3}
              array={particles.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={particles.colors.length / 3}
              array={particles.colors}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={particles.sizes.length}
              array={particles.sizes}
              itemSize={1}
            />
          </bufferGeometry>
        </points>
      )}

      {/* 流场可视化网格 */}
      <gridHelper 
        args={[30, 30, '#333', '#111']} 
        position={[0, -5, 0]} 
      />

      {/* 坐标轴 */}
      <axesHelper args={[5]} />
    </group>
  );
};

export default FluidSimulation; 