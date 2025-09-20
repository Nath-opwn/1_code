import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Sphere, Cone, Plane } from '@react-three/drei';
import * as THREE from 'three';

// 激波实验接口
interface ShockWaveSimulationProps {
  machNumber?: number;          // 马赫数
  wedgeAngle?: number;          // 楔形角度 (度)
  gasGamma?: number;            // 比热比
  inletPressure?: number;       // 进口压力 (Pa)
  inletTemperature?: number;    // 进口温度 (K)
  className?: string;
  autoRotate?: boolean;
}

// 激波计算结果接口
interface ShockWaveData {
  shockAngle: number;           // 激波角度
  deflectionAngle: number;      // 偏转角度
  pressureRatio: number;        // 压力比
  densityRatio: number;         // 密度比
  temperatureRatio: number;     // 温度比
  velocityRatio: number;        // 速度比
  machNumberDownstream: number; // 下游马赫数
  totalPressureLoss: number;    // 总压损失
}

// 激波理论计算
const calculateShockWaveData = (
  machNumber: number,
  wedgeAngle: number,
  gamma: number
): ShockWaveData => {
  const theta = wedgeAngle * Math.PI / 180; // 楔形角度转弧度
  
  // 使用θ-β-M关系求解激波角度β
  // 这里使用迭代方法求解激波角度
  let beta = Math.PI / 4; // 初始猜测45度
  let iterations = 0;
  const maxIterations = 100;
  const tolerance = 1e-6;
  
  while (iterations < maxIterations) {
    const tanTheta = 2 * (1 / Math.tan(beta)) * 
      ((Math.pow(machNumber * Math.sin(beta), 2) - 1) / 
       (Math.pow(machNumber, 2) * (gamma + Math.cos(2 * beta)) + 2));
    
    const calculatedTheta = Math.atan(tanTheta);
    const error = Math.abs(calculatedTheta - theta);
    
    if (error < tolerance) break;
    
    // 调整β值
    if (calculatedTheta > theta) {
      beta -= 0.001;
    } else {
      beta += 0.001;
    }
    
    iterations++;
  }
  
  const shockAngle = beta * 180 / Math.PI;
  
  // 计算激波后参数
  const M1n = machNumber * Math.sin(beta); // 激波前法向马赫数
  
  // Rankine-Hugoniot关系
  const pressureRatio = 1 + (2 * gamma / (gamma + 1)) * (M1n * M1n - 1);
  const densityRatio = ((gamma + 1) * M1n * M1n) / ((gamma - 1) * M1n * M1n + 2);
  const temperatureRatio = pressureRatio / densityRatio;
  
  // 激波后法向马赫数
  const M2n = Math.sqrt((M1n * M1n + 2 / (gamma - 1)) / (2 * gamma * M1n * M1n / (gamma - 1) - 1));
  
  // 激波后马赫数
  const machNumberDownstream = M2n / Math.sin(beta - theta);
  
  const velocityRatio = densityRatio / (densityRatio);
  
  // 总压损失
  const totalPressureLoss = 1 - Math.pow(pressureRatio * Math.pow(temperatureRatio, -gamma / (gamma - 1)), 1);
  
  return {
    shockAngle,
    deflectionAngle: wedgeAngle,
    pressureRatio,
    densityRatio,
    temperatureRatio,
    velocityRatio,
    machNumberDownstream,
    totalPressureLoss
  };
};

// 楔形体组件
const WedgeGeometry: React.FC<{
  angle: number;
  position: THREE.Vector3;
  size: number;
}> = ({ angle, position, size }) => {
  const wedgeRef = useRef<THREE.Group>(null);
  
  // 创建楔形几何体
  const wedgeGeometry = useMemo(() => {
    const geometry = new THREE.ConeGeometry(size, size * 2, 3);
    geometry.rotateZ(-Math.PI / 2);
    geometry.rotateY(angle * Math.PI / 180);
    return geometry;
  }, [angle, size]);
  
  return (
    <group ref={wedgeRef} position={position}>
      <mesh geometry={wedgeGeometry} castShadow>
        <meshStandardMaterial 
          color="#666666"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* 楔形标签 */}
      <Text
        position={[0, size + 0.5, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {`楔形角: ${angle.toFixed(1)}°`}
      </Text>
    </group>
  );
};

// 激波面组件
const ShockWave: React.FC<{
  angle: number;
  position: THREE.Vector3;
  length: number;
  intensity: number;
}> = ({ angle, position, length, intensity }) => {
  const shockRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (shockRef.current) {
      // 激波面闪烁效果
      const opacity = 0.6 + 0.4 * Math.sin(state.clock.elapsedTime * 3);
      const material = (shockRef.current.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity = opacity;
    }
  });
  
  return (
    <group ref={shockRef} position={position}>
      <mesh rotation={[0, 0, -angle * Math.PI / 180]}>
        <planeGeometry args={[0.1, length]} />
        <meshBasicMaterial 
          color="#ff4444"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 激波标签 */}
      <Text
        position={[0, length/2 + 0.5, 0]}
        fontSize={0.25}
        color="#ff4444"
        anchorX="center"
        anchorY="middle"
      >
        {`激波角: ${angle.toFixed(1)}°`}
      </Text>
    </group>
  );
};

// 流场粒子系统
const FlowParticles: React.FC<{
  count: number;
  machNumber: number;
  shockAngle: number;
  wedgePosition: THREE.Vector3;
  pressureRatio: number;
  velocityRatio: number;
}> = ({ count, machNumber, shockAngle, wedgePosition, pressureRatio, velocityRatio }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const [time, setTime] = useState(0);
  
  // 初始化粒子位置和属性
  const particleData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const states = new Float32Array(count); // 0: 上游, 1: 下游
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // 随机分布在流场中
      positions[i3] = -8 + Math.random() * 16;
      positions[i3 + 1] = -3 + Math.random() * 6;
      positions[i3 + 2] = -1 + Math.random() * 2;
      
      // 初始速度
      velocities[i3] = machNumber * 0.5; // x方向
      velocities[i3 + 1] = 0; // y方向
      velocities[i3 + 2] = 0; // z方向
      
      // 初始颜色（蓝色表示上游）
      colors[i3] = 0.3;     // R
      colors[i3 + 1] = 0.6; // G
      colors[i3 + 2] = 1.0; // B
      
      states[i] = 0; // 上游状态
    }
    
    return { positions, velocities, colors, states };
  }, [count, machNumber]);
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    setTime(prev => prev + delta);
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // 更新粒子位置
      positions[i3] += particleData.velocities[i3] * delta;
      positions[i3 + 1] += particleData.velocities[i3 + 1] * delta;
      
      // 检查是否通过激波面
      const x = positions[i3];
      const y = positions[i3 + 1];
      const shockX = wedgePosition.x - Math.abs(y) / Math.tan(shockAngle * Math.PI / 180);
      
      if (x > shockX && particleData.states[i] === 0) {
        // 粒子通过激波面
        particleData.states[i] = 1;
        
        // 改变速度（激波后减速）
        particleData.velocities[i3] *= velocityRatio;
        
        // 改变颜色（红色表示下游高压区）
        colors[i3] = 1.0;     // R
        colors[i3 + 1] = 0.3; // G
        colors[i3 + 2] = 0.3; // B
      }
      
      // 边界条件：粒子出界后重新生成
      if (positions[i3] > 8) {
        positions[i3] = -8;
        positions[i3 + 1] = -3 + Math.random() * 6;
        particleData.states[i] = 0;
        particleData.velocities[i3] = machNumber * 0.5;
        colors[i3] = 0.3;
        colors[i3 + 1] = 0.6;
        colors[i3 + 2] = 1.0;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.geometry.attributes.color.needsUpdate = true;
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particleData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particleData.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
      />
    </points>
  );
};

// 压力场可视化
const PressureField: React.FC<{
  shockAngle: number;
  wedgePosition: THREE.Vector3;
  pressureRatio: number;
}> = ({ shockAngle, wedgePosition, pressureRatio }) => {
  const fieldRef = useRef<THREE.Group>(null);
  
  return (
    <group ref={fieldRef}>
      {/* 上游压力区域 */}
      <mesh position={[-4, 0, -0.5]}>
        <boxGeometry args={[6, 4, 1]} />
        <meshBasicMaterial 
          color="#0066cc"
          transparent
          opacity={0.2}
        />
      </mesh>
      
      {/* 下游高压区域 */}
      <mesh position={[4, -1, -0.5]}>
        <boxGeometry args={[6, 2, 1]} />
        <meshBasicMaterial 
          color="#cc0000"
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* 压力标签 */}
      <Text
        position={[-4, 2.5, 0]}
        fontSize={0.3}
        color="#0066cc"
        anchorX="center"
        anchorY="middle"
      >
        {`P₁ = ${100}%`}
      </Text>
      
      <Text
        position={[4, 1.5, 0]}
        fontSize={0.3}
        color="#cc0000"
        anchorX="center"
        anchorY="middle"
      >
        {`P₂ = ${(pressureRatio * 100).toFixed(0)}%`}
      </Text>
    </group>
  );
};

// 马赫锥可视化
const MachCone: React.FC<{
  machNumber: number;
  position: THREE.Vector3;
}> = ({ machNumber, position }) => {
  const coneAngle = Math.asin(1 / machNumber) * 180 / Math.PI;
  
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[2, 4, 16, 1, true]} />
        <meshBasicMaterial 
          color="#ffff00"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>
      
      <Text
        position={[0, -3, 0]}
        fontSize={0.25}
        color="#ffff00"
        anchorX="center"
        anchorY="middle"
      >
        {`马赫角: ${(90 - coneAngle).toFixed(1)}°`}
      </Text>
    </group>
  );
};

// 主仿真场景
const ShockWaveScene: React.FC<Omit<ShockWaveSimulationProps, 'className' | 'autoRotate'>> = ({
  machNumber = 2.0,
  wedgeAngle = 15,
  gasGamma = 1.4,
  inletPressure = 101325,
  inletTemperature = 288
}) => {
  const { camera } = useThree();
  
  // 设置相机位置
  useEffect(() => {
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  // 计算激波数据
  const shockData = useMemo(() => {
    return calculateShockWaveData(machNumber, wedgeAngle, gasGamma);
  }, [machNumber, wedgeAngle, gasGamma]);
  
  const wedgePosition = new THREE.Vector3(2, 0, 0);
  const shockPosition = new THREE.Vector3(0, 0, 0);
  
  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.4} />
      
      {/* 定向光 */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* 点光源 */}
      <pointLight position={[-10, 5, 5]} intensity={0.3} />
      
      {/* 楔形体 */}
      <WedgeGeometry 
        angle={wedgeAngle}
        position={wedgePosition}
        size={1}
      />
      
      {/* 激波面 */}
      <ShockWave 
        angle={shockData.shockAngle}
        position={shockPosition}
        length={6}
        intensity={1}
      />
      
      {/* 流场粒子 */}
      <FlowParticles 
        count={2000}
        machNumber={machNumber}
        shockAngle={shockData.shockAngle}
        wedgePosition={wedgePosition}
        pressureRatio={shockData.pressureRatio}
        velocityRatio={shockData.velocityRatio}
      />
      
      {/* 压力场可视化 */}
      <PressureField 
        shockAngle={shockData.shockAngle}
        wedgePosition={wedgePosition}
        pressureRatio={shockData.pressureRatio}
      />
      
      {/* 马赫锥 */}
      {machNumber > 1 && (
        <MachCone 
          machNumber={machNumber}
          position={new THREE.Vector3(-6, 0, 0)}
        />
      )}
      
      {/* 标题和说明 */}
      <Text
        position={[0, 5, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        激波实验 - 超声速流动
      </Text>
      
      <Text
        position={[0, -4, 0]}
        fontSize={0.25}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
      >
        {`马赫数: ${machNumber.toFixed(1)} | 激波角: ${shockData.shockAngle.toFixed(1)}° | 压力比: ${shockData.pressureRatio.toFixed(2)}`}
      </Text>
      
      {/* 坐标轴 */}
      <group>
        {/* X轴 */}
        <mesh position={[0, -3.5, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <Cone position={[4, -3.5, 0]} args={[0.1, 0.2]} rotation={[0, 0, -Math.PI/2]}>
          <meshBasicMaterial color="#ffffff" />
        </Cone>
        
        {/* Y轴 */}
        <mesh position={[-7, 0, 0]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.02, 0.02, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <Cone position={[-7, 3, 0]} args={[0.1, 0.2]}>
          <meshBasicMaterial color="#ffffff" />
        </Cone>
      </group>
    </>
  );
};

// 主组件
const ShockWaveSimulation: React.FC<ShockWaveSimulationProps> = ({
  machNumber = 2.0,
  wedgeAngle = 15,
  gasGamma = 1.4,
  inletPressure = 101325,
  inletTemperature = 288,
  className = '',
  autoRotate = false
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas shadows camera={{ position: [0, 8, 12], fov: 60 }}>
        <color attach="background" args={['#001122']} />
        
        <ShockWaveScene
          machNumber={machNumber}
          wedgeAngle={wedgeAngle}
          gasGamma={gasGamma}
          inletPressure={inletPressure}
          inletTemperature={inletTemperature}
        />
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1}
          minDistance={5}
          maxDistance={30}
        />
      </Canvas>
    </div>
  );
};

export default ShockWaveSimulation; 