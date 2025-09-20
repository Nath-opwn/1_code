import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import Enhanced3DControls, { ControlsHandle } from './Enhanced3DControls';
import ControlPanel from './ControlPanel';
import * as THREE from 'three';

interface KarmanVortexStreetProps {
  className?: string;
  reynoldsNumber?: number;
  obstacleSize?: number;
  flowSpeed?: number;
  showVorticity?: boolean;
  showPressure?: boolean;
  showVelocity?: boolean;
  showStreamlines?: boolean;
  autoRotate?: boolean;
  onSimulationData?: (data: any) => void;
}

// 粒子系统接口
interface ParticleSystem {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
}

/**
 * 卡门涡街3D模拟组件
 */
const KarmanVortexStreet: React.FC<KarmanVortexStreetProps> = ({
  className = '',
  reynoldsNumber = 100,
  obstacleSize = 1.0,
  flowSpeed = 1.0,
  showVorticity = true,
  showPressure = false,
  showVelocity = true,
  showStreamlines = true,
  autoRotate = false,
  onSimulationData
}) => {
  const controlsRef = useRef<ControlsHandle>(null);
  const [isAutoRotate, setIsAutoRotate] = useState(autoRotate);

  const handleToggleAutoRotate = () => {
    const newAutoRotate = !isAutoRotate;
    setIsAutoRotate(newAutoRotate);
    controlsRef.current?.setAutoRotate(newAutoRotate);
  };

  const handleResetView = () => {
    controlsRef.current?.resetView();
  };

  return (
    <div className={`${className} w-full h-full relative`}>
      {/* 标题覆盖层 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
        <h3 className="text-white text-lg font-semibold bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
          卡门涡街模拟
        </h3>
      </div>
      
      <Canvas shadows gl={{ antialias: true }}>
        <color attach="background" args={['#000']} />
        <PerspectiveCamera makeDefault position={[25, 25, 35]} fov={60} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        
        <KarmanVortexSimulation 
          reynoldsNumber={reynoldsNumber}
          obstacleSize={obstacleSize}
          flowSpeed={flowSpeed}
          showVorticity={showVorticity}
          showPressure={showPressure}
          showVelocity={showVelocity}
          showStreamlines={showStreamlines}
          onSimulationData={onSimulationData}
        />
        
        <Enhanced3DControls 
          ref={controlsRef}
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          autoRotate={isAutoRotate}
          autoRotateSpeed={0.5}
          minDistance={10}
          maxDistance={80}
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

// 卡门涡街模拟场景
const KarmanVortexSimulation: React.FC<Omit<KarmanVortexStreetProps, 'className' | 'autoRotate'>> = ({
  reynoldsNumber = 100,
  obstacleSize = 1.0,
  flowSpeed = 1.0,
  showVorticity = true,
  showPressure = false,
  showVelocity = true,
  showStreamlines = true,
  onSimulationData
}) => {
  // 引用
  const cylinderRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const streamlinesRef = useRef<THREE.Group>(null);
  const vorticityMeshRef = useRef<THREE.Mesh>(null);
  
  // 状态
  const [particles, setParticles] = useState<ParticleSystem | null>(null);
  const [time, setTime] = useState(0);

  // 初始化粒子系统
  useEffect(() => {
    const particleCount = 5000; // 增加粒子数量
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // 创建颜色渐变
    const baseColors = [
      [0.1, 0.4, 0.9], // 蓝色
      [0.2, 0.5, 1.0], // 亮蓝色
      [0.0, 0.6, 0.9], // 青蓝色
      [0.4, 0.7, 1.0]  // 淡蓝色
    ];

    for (let i = 0; i < particleCount; i++) {
      // 大部分粒子在入口区域，但有一些分散在整个场地以增加视觉效果
      const inEntrance = Math.random() < 0.8;
      
      if (inEntrance) {
        // 在入口区域随机分布粒子，更集中在中部区域
        positions[i * 3] = Math.random() * 10; // x
        positions[i * 3 + 1] = 5 + Math.random() * 40; // y - 集中在中间区域
      } else {
        // 少量粒子分散在场地各处
        positions[i * 3] = Math.random() * 100; // x
        positions[i * 3 + 1] = Math.random() * 50; // y
      }
      
      // z位置带有一点随机深度
      positions[i * 3 + 2] = Math.random() * 3 - 1.5; // z
      
      // 从基础颜色中随机选择
      const colorIdx = Math.floor(Math.random() * baseColors.length);
      const [r, g, b] = baseColors[colorIdx];
      
      // 添加一点随机变化
      colors[i * 3] = r * (0.9 + Math.random() * 0.2); // r
      colors[i * 3 + 1] = g * (0.9 + Math.random() * 0.2); // g
      colors[i * 3 + 2] = b * (0.9 + Math.random() * 0.2); // b
      
      // 设置粒子大小，正态分布 + 基于z位置的变化
      const depth = Math.abs(positions[i * 3 + 2]);
      const depthFactor = 1 - Math.min(1, depth / 1.5);
      
      sizes[i] = (0.3 + Math.random() * 0.4) * depthFactor;
    }

    setParticles({ positions, colors, sizes });
  }, [flowSpeed]);

  // 更新粒子动画
  useFrame((state, delta) => {
    if (!particles || !particlesRef.current) return;

    setTime(prev => prev + delta);

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
    const sizes = particlesRef.current.geometry.attributes.size.array as Float32Array;

    // 用于计算仿真数据的变量
    let totalVorticity = 0;
    let maxVorticity = 0;
    let totalVelocity = 0;
    let velocityCount = 0;
    let totalPressure = 0;

    for (let i = 0; i < positions.length / 3; i++) {
      const i3 = i * 3;
      
      // 当前位置
      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];

      // 计算与圆柱体障碍物的距离（仅在XY平面）
      const obstacleX = 25;
      const obstacleY = 25;
      const obstacleRadius = obstacleSize * 3;

      const dx = x - obstacleX;
      const dy = y - obstacleY;
      // 圆柱体碰撞检测：只考虑XY平面的距离，忽略Z轴
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 计算速度场
      let vx = flowSpeed;
      let vy = 0;
      let vz = 0;
      let vorticity = 0;

      // 圆柱绕流效果
      if (distance < obstacleRadius + 5) {
        // 障碍物附近的流场扰动
        const angle = Math.atan2(dy, dx);
        const strength = Math.max(0, (obstacleRadius + 5 - distance) / 5);
        
        vx = flowSpeed * (1 - strength) + Math.cos(angle + Math.PI/2) * strength * flowSpeed;
        vy = Math.sin(angle + Math.PI/2) * strength * flowSpeed;
        
        // 卡门涡街效果
        if (x > obstacleX) {
          const vortexFreq = reynoldsNumber * 0.02;
          const vortexStrength = 1.0;
          const phaseShift = y * 0.3;
          vy += Math.sin(time * vortexFreq + phaseShift) * vortexStrength;
          vorticity = Math.cos(time * vortexFreq + phaseShift) * vortexStrength;
        }
      }

      // 收集仿真数据
      const speed = Math.sqrt(vx*vx + vy*vy + vz*vz);
      const absVorticity = Math.abs(vorticity);
      const pressure = -0.5 * speed * speed; // 简化的伯努利压力
      
      totalVorticity += absVorticity;
      maxVorticity = Math.max(maxVorticity, absVorticity);
      totalVelocity += speed;
      velocityCount++;
      totalPressure += pressure;

      // 更新位置 - 使用更精确的积分
      const speedFactor = Math.min(8, 3 + speed * 5);
      
      positions[i3] += vx * delta * speedFactor;
      positions[i3 + 1] += vy * delta * speedFactor;
      positions[i3 + 2] += vz * delta * speedFactor;

      // 为粒子添加轻微的随机运动，模拟湍流
      positions[i3] += (Math.random() - 0.5) * 0.05 * delta;
      positions[i3 + 1] += (Math.random() - 0.5) * 0.05 * delta;

      // 边界处理
      if (x > 100 || x < 0 || y > 50 || y < 0 || distance < obstacleRadius) {
        // 在入口附近随机位置重生
        positions[i3] = Math.random() * 5;
        positions[i3 + 1] = 10 + Math.random() * 30; // 集中在中间区域
        positions[i3 + 2] = Math.random() * 2 - 1;
        
        // 重置颜色到默认
        colors[i3] = 0.2;
        colors[i3 + 1] = 0.5;
        colors[i3 + 2] = 1.0;
      } else {
        // 根据涡量和压力更新颜色，使用HSL颜色模型增强视觉效果
        if (vorticity > 0.01) { // 正涡量：红色系
          colors[i3] = Math.min(1, 0.5 + vorticity * 0.8); // r
          colors[i3 + 1] = Math.max(0, 0.4 - absVorticity * 0.3); // g
          colors[i3 + 2] = Math.max(0, 0.4 - absVorticity * 0.3); // b
        } else if (vorticity < -0.01) { // 负涡量：蓝色系
          colors[i3] = Math.max(0, 0.4 - absVorticity * 0.3); // r
          colors[i3 + 1] = Math.max(0, 0.4 - absVorticity * 0.3); // g
          colors[i3 + 2] = Math.min(1, 0.5 + absVorticity * 0.8); // b
        } else { // 低涡量：白色到青色
          const speedNorm = Math.min(1, speed / 2); // 归一化速度
          colors[i3] = 0.2 + (1 - speedNorm) * 0.3; // r
          colors[i3 + 1] = 0.5 + (1 - speedNorm) * 0.2; // g
          colors[i3 + 2] = 0.8; // b
        }
        
        // 根据速度调整粒子大小
        sizes[i] = 0.2 + speed * 0.1 + absVorticity * 0.2;
      }
    }

    // 更新几何体
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.geometry.attributes.color.needsUpdate = true;
    particlesRef.current.geometry.attributes.size.needsUpdate = true;

    // 计算平均值并回调仿真数据
    if (onSimulationData && velocityCount > 0) {
      const simulationData = {
        time: time,
        maxVorticity: maxVorticity,
        avgVelocity: totalVelocity / velocityCount,
        pressure: totalPressure / velocityCount
      };
      onSimulationData(simulationData);
    }
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
          // 创建圆形粒子
          float r = distance(gl_PointCoord, vec2(0.5, 0.5));
          if (r > 0.5) {
            discard;
          }
          
          // 柔和的边缘和亮度变化
          float intensity = 1.0 - 2.0 * r;
          intensity = pow(intensity, 0.75);
          
          // 添加亮边光晕效果
          float haloFactor = 1.0 - smoothstep(0.4, 0.5, r);
          vec3 halo = vColor + vec3(0.3, 0.3, 0.3) * haloFactor;
          
          gl_FragColor = vec4(halo * intensity, intensity * (1.0 - r * 0.5));
        }
      `
    });
  }, []);

  return (
    <group>
      {/* 圆柱体障碍物 */}
      <mesh 
        ref={cylinderRef} 
        position={[25, 25, 0]} 
        rotation={[Math.PI / 2, 0, 0]}
        castShadow 
        receiveShadow
      >
        <cylinderGeometry args={[obstacleSize * 3, obstacleSize * 3, 10, 32]} />
        <meshStandardMaterial color="#444" roughness={0.7} metalness={0.3} />
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
      
      {/* 流线组 */}
      <group ref={streamlinesRef} />
      
      {/* 涡量场可视化 */}
      <mesh 
        ref={vorticityMeshRef} 
        position={[50, 25, -0.5]} 
        rotation={[-Math.PI / 2, 0, 0]}
        visible={showVorticity}
      >
        <planeGeometry args={[100, 50, 1, 1]} />
      </mesh>
      
      {/* 坐标轴和网格辅助 */}
      <gridHelper args={[100, 50, '#222', '#111']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.6]} />
      
      {/* 说明文本 - 使用HTML覆盖层代替Text组件 */}
      {/* <Text
        position={[50, 5, 10]}
        color="white"
        fontSize={3}
        anchorX="center"
        anchorY="middle"
      >
        卡门涡街模拟
      </Text> */}
      
      {/* 环境光照 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={0.8} castShadow />
      <pointLight position={[25, 25, 5]} intensity={1.5} color="#ffaa88" distance={20} />
    </group>
  );
};

export default KarmanVortexStreet; 