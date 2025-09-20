import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Sphere, Tube } from '@react-three/drei';
import * as THREE from 'three';

// 雷诺数实验接口
interface ReynoldsExperimentSimulationProps {
  flowVelocity?: number;        // 流速 (m/s)
  pipeRadius?: number;          // 管道半径 (m)
  fluidViscosity?: number;      // 流体粘度 (Pa·s)
  fluidDensity?: number;        // 流体密度 (kg/m³)
  dyeInjectionRate?: number;    // 染料注入率
  className?: string;
  autoRotate?: boolean;
}

// 雷诺数计算结果接口
interface ReynoldsData {
  reynoldsNumber: number;       // 雷诺数
  flowRegime: string;           // 流态
  criticalReynolds: number;     // 临界雷诺数
  transitionProbability: number; // 转换概率
  turbulenceIntensity: number;  // 湍流强度
  frictionFactor: number;       // 摩擦系数
}

// 计算雷诺数和流态
const calculateReynoldsData = (
  velocity: number,
  radius: number,
  density: number,
  viscosity: number
): ReynoldsData => {
  const diameter = radius * 2;
  const reynoldsNumber = (density * velocity * diameter) / viscosity;
  
  // 临界雷诺数
  const criticalReynolds = 2300;
  const turbulentReynolds = 4000;
  
  // 确定流态
  let flowRegime: string;
  let transitionProbability: number;
  let turbulenceIntensity: number;
  
  if (reynoldsNumber < criticalReynolds) {
    flowRegime = '层流';
    transitionProbability = 0;
    turbulenceIntensity = 0;
  } else if (reynoldsNumber < turbulentReynolds) {
    flowRegime = '过渡流';
    transitionProbability = (reynoldsNumber - criticalReynolds) / (turbulentReynolds - criticalReynolds);
    turbulenceIntensity = transitionProbability * 0.1;
  } else {
    flowRegime = '湍流';
    transitionProbability = 1;
    turbulenceIntensity = 0.05 + 0.05 * Math.min((reynoldsNumber - turbulentReynolds) / 10000, 1);
  }
  
  // 摩擦系数 (Darcy-Weisbach)
  let frictionFactor: number;
  if (reynoldsNumber < criticalReynolds) {
    // 层流：f = 64/Re
    frictionFactor = 64 / reynoldsNumber;
  } else {
    // 湍流：使用Blasius公式的近似
    frictionFactor = 0.316 / Math.pow(reynoldsNumber, 0.25);
  }
  
  return {
    reynoldsNumber,
    flowRegime,
    criticalReynolds,
    transitionProbability,
    turbulenceIntensity,
    frictionFactor
  };
};

// 管道组件
const PipeGeometry: React.FC<{
  radius: number;
  length: number;
  position: THREE.Vector3;
}> = ({ radius, length, position }) => {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      {/* 管道外壁 */}
      <mesh>
        <cylinderGeometry args={[radius + 0.05, radius + 0.05, length, 32]} />
        <meshStandardMaterial 
          color="#888888"
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* 管道内壁 */}
      <mesh>
        <cylinderGeometry args={[radius, radius, length, 32]} />
        <meshStandardMaterial 
          color="#ffffff"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 管道标签 */}
      <Text
        position={[0, radius + 0.3, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {`管径: ${(radius * 2 * 1000).toFixed(1)}mm`}
      </Text>
    </group>
  );
};

// 染料示踪线组件
const DyeTracerLine: React.FC<{
  pipeRadius: number;
  pipeLength: number;
  reynoldsData: ReynoldsData;
  time: number;
}> = ({ pipeRadius, pipeLength, reynoldsData, time }) => {
  const lineRef = useRef<THREE.Group>(null);
  
  // 创建染料轨迹点
  const tracerPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segmentCount = 100;
    
    for (let i = 0; i < segmentCount; i++) {
      const t = i / (segmentCount - 1);
      const x = (t - 0.5) * pipeLength;
      const y = 0;
      
      let z = 0;
      
      // 根据流态添加扰动
      if (reynoldsData.flowRegime === '层流') {
        // 层流：直线流动
        z = 0;
      } else if (reynoldsData.flowRegime === '过渡流') {
        // 过渡流：轻微波动
        const amplitude = reynoldsData.transitionProbability * pipeRadius * 0.3;
        z = amplitude * Math.sin(t * Math.PI * 4 + time * 2) * Math.sin(t * Math.PI * 8);
      } else {
        // 湍流：强烈混合
        const amplitude = pipeRadius * 0.4;
        z = amplitude * (
          Math.sin(t * Math.PI * 6 + time * 3) * 0.5 +
          Math.sin(t * Math.PI * 12 + time * 5) * 0.3 +
          Math.sin(t * Math.PI * 20 + time * 7) * 0.2
        );
        
        // 添加径向扩散
        const radialSpread = t * reynoldsData.turbulenceIntensity * pipeRadius;
        const angle = time * 2 + t * Math.PI * 4;
        z += radialSpread * Math.cos(angle);
      }
      
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return points;
  }, [pipeRadius, pipeLength, reynoldsData, time]);
  
  // 创建染料轨迹的几何体
  const tracerGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(tracerPoints);
    return new THREE.TubeGeometry(curve, 100, 0.01, 8, false);
  }, [tracerPoints]);
  
  return (
    <group ref={lineRef}>
      <mesh geometry={tracerGeometry}>
        <meshBasicMaterial 
          color="#ff4444"
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* 多条染料线以显示流态特征 */}
      {[0.3, 0.6, -0.3, -0.6].map((offset, index) => (
        <mesh key={index} geometry={tracerGeometry} position={[offset * pipeRadius, 0, 0]}>
          <meshBasicMaterial 
            color={index % 2 === 0 ? "#4444ff" : "#44ff44"}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
};

// 流体粒子系统
const FlowParticles: React.FC<{
  count: number;
  pipeRadius: number;
  pipeLength: number;
  velocity: number;
  reynoldsData: ReynoldsData;
}> = ({ count, pipeRadius, pipeLength, velocity, reynoldsData }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const [time, setTime] = useState(0);
  
  // 初始化粒子数据
  const particleData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // 在管道横截面内随机分布
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * pipeRadius;
      
      positions[i3] = -pipeLength / 2;         // x (入口)
      positions[i3 + 1] = r * Math.cos(angle); // y
      positions[i3 + 2] = r * Math.sin(angle); // z
      
      // 初始速度（层流速度分布）
      const radialPosition = r / pipeRadius;
      const velocityProfile = reynoldsData.flowRegime === '层流' ? 
        2 * velocity * (1 - radialPosition * radialPosition) : // 抛物线分布
        velocity * (0.8 + 0.4 * Math.random()); // 湍流中的随机速度
      
      velocities[i3] = velocityProfile;
      velocities[i3 + 1] = 0;
      velocities[i3 + 2] = 0;
      
      // 根据速度着色
      const speedRatio = velocityProfile / (velocity * 2);
      colors[i3] = speedRatio;       // R
      colors[i3 + 1] = 1 - speedRatio; // G
      colors[i3 + 2] = 0.5;          // B
    }
    
    return { positions, velocities, colors };
  }, [count, pipeRadius, pipeLength, velocity, reynoldsData]);
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    setTime(prev => prev + delta);
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // 更新位置
      positions[i3] += particleData.velocities[i3] * delta;
      positions[i3 + 1] += particleData.velocities[i3 + 1] * delta;
      positions[i3 + 2] += particleData.velocities[i3 + 2] * delta;
      
      // 添加湍流扰动
      if (reynoldsData.flowRegime === '湍流' || reynoldsData.flowRegime === '过渡流') {
        const turbulenceStrength = reynoldsData.turbulenceIntensity;
        positions[i3 + 1] += (Math.random() - 0.5) * turbulenceStrength * delta;
        positions[i3 + 2] += (Math.random() - 0.5) * turbulenceStrength * delta;
        
        // 确保粒子保持在管道内
        const r = Math.sqrt(positions[i3 + 1] * positions[i3 + 1] + positions[i3 + 2] * positions[i3 + 2]);
        if (r > pipeRadius) {
          const scale = pipeRadius / r;
          positions[i3 + 1] *= scale;
          positions[i3 + 2] *= scale;
        }
      }
      
      // 重置出界粒子
      if (positions[i3] > pipeLength / 2) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * pipeRadius;
        
        positions[i3] = -pipeLength / 2;
        positions[i3 + 1] = r * Math.cos(angle);
        positions[i3 + 2] = r * Math.sin(angle);
        
        // 重新计算速度和颜色
        const radialPosition = r / pipeRadius;
        const velocityProfile = reynoldsData.flowRegime === '层流' ? 
          2 * velocity * (1 - radialPosition * radialPosition) :
          velocity * (0.8 + 0.4 * Math.random());
        
        particleData.velocities[i3] = velocityProfile;
        particleData.velocities[i3 + 1] = 0;
        particleData.velocities[i3 + 2] = 0;
        
        const speedRatio = velocityProfile / (velocity * 2);
        colors[i3] = speedRatio;
        colors[i3 + 1] = 1 - speedRatio;
        colors[i3 + 2] = 0.5;
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
        size={0.02}
        vertexColors
        transparent
        opacity={0.8}
      />
    </points>
  );
};

// 速度分布可视化
const VelocityProfile: React.FC<{
  pipeRadius: number;
  velocity: number;
  reynoldsData: ReynoldsData;
  position: THREE.Vector3;
}> = ({ pipeRadius, velocity, reynoldsData, position }) => {
  const profileRef = useRef<THREE.Group>(null);
  
  // 创建速度分布线
  const profilePoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 20;
    
    for (let i = 0; i <= segments; i++) {
      const r = (i / segments) * pipeRadius;
      const radialPosition = r / pipeRadius;
      
      let velocityAtR: number;
      if (reynoldsData.flowRegime === '层流') {
        // 抛物线分布
        velocityAtR = 2 * velocity * (1 - radialPosition * radialPosition);
      } else {
        // 湍流：1/7次幂律近似
        velocityAtR = velocity * Math.pow(1 - radialPosition, 1/7);
      }
      
      const scale = 0.5; // 缩放因子
      points.push(new THREE.Vector3(velocityAtR * scale, 0, r));
      if (r > 0) {
        points.unshift(new THREE.Vector3(velocityAtR * scale, 0, -r));
      }
    }
    
    return points;
  }, [pipeRadius, velocity, reynoldsData]);
  
  return (
    <group ref={profileRef} position={position}>
      {/* 速度分布曲线 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={profilePoints.length}
            array={new Float32Array(profilePoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffff00" linewidth={3} />
      </line>
      
      {/* 坐标轴 */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, pipeRadius * 2]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      <mesh position={[velocity * 0.25, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.01, 0.01, velocity * 0.5]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* 标签 */}
      <Text
        position={[velocity * 0.3, 0, pipeRadius + 0.1]}
        fontSize={0.1}
        color="#ffff00"
        anchorX="center"
        anchorY="middle"
      >
        速度分布
      </Text>
      
      <Text
        position={[velocity * 0.3, 0, -pipeRadius - 0.1]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {reynoldsData.flowRegime}
      </Text>
    </group>
  );
};

// 主仿真场景
const ReynoldsExperimentScene: React.FC<Omit<ReynoldsExperimentSimulationProps, 'className' | 'autoRotate'>> = ({
  flowVelocity = 1.0,
  pipeRadius = 0.05,
  fluidViscosity = 0.001,
  fluidDensity = 1000,
  dyeInjectionRate = 1.0
}) => {
  const { camera } = useThree();
  const [time, setTime] = useState(0);
  
  // 设置相机位置
  useEffect(() => {
    camera.position.set(0, 2, 2);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  // 计算雷诺数数据
  const reynoldsData = useMemo(() => {
    return calculateReynoldsData(flowVelocity, pipeRadius, fluidDensity, fluidViscosity);
  }, [flowVelocity, pipeRadius, fluidDensity, fluidViscosity]);
  
  useFrame((state, delta) => {
    setTime(prev => prev + delta);
  });
  
  const pipeLength = 4;
  
  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.4} />
      
      {/* 定向光 */}
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* 点光源 */}
      <pointLight position={[-5, 0, 5]} intensity={0.3} />
      
      {/* 管道 */}
      <PipeGeometry 
        radius={pipeRadius}
        length={pipeLength}
        position={new THREE.Vector3(0, 0, 0)}
      />
      
      {/* 流体粒子 */}
      <FlowParticles 
        count={1500}
        pipeRadius={pipeRadius}
        pipeLength={pipeLength}
        velocity={flowVelocity}
        reynoldsData={reynoldsData}
      />
      
      {/* 染料示踪线 */}
      <DyeTracerLine 
        pipeRadius={pipeRadius}
        pipeLength={pipeLength}
        reynoldsData={reynoldsData}
        time={time}
      />
      
      {/* 速度分布 */}
      <VelocityProfile 
        pipeRadius={pipeRadius}
        velocity={flowVelocity}
        reynoldsData={reynoldsData}
        position={new THREE.Vector3(1.5, 0, 0)}
      />
      
      {/* 标题和信息 */}
      <Text
        position={[0, 1, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        雷诺数实验 - 流态转换
      </Text>
      
      <Text
        position={[0, -1, 0]}
        fontSize={0.12}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
      >
        {`Re = ${reynoldsData.reynoldsNumber.toFixed(0)} | 流态: ${reynoldsData.flowRegime} | 湍流强度: ${(reynoldsData.turbulenceIntensity * 100).toFixed(1)}%`}
      </Text>
      
      {/* 流态指示器 */}
      <group position={[-2, 0, 0]}>
        <Box args={[0.3, 0.3, 0.1]} position={[0, 0.5, 0]}>
          <meshBasicMaterial 
            color={
              reynoldsData.flowRegime === '层流' ? '#00ff00' :
              reynoldsData.flowRegime === '过渡流' ? '#ffff00' : '#ff0000'
            }
          />
        </Box>
        <Text
          position={[0, 0, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {reynoldsData.flowRegime}
        </Text>
      </group>
    </>
  );
};

// 主组件
const ReynoldsExperimentSimulation: React.FC<ReynoldsExperimentSimulationProps> = ({
  flowVelocity = 1.0,
  pipeRadius = 0.05,
  fluidViscosity = 0.001,
  fluidDensity = 1000,
  dyeInjectionRate = 1.0,
  className = '',
  autoRotate = false
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas shadows camera={{ position: [0, 0, 3], fov: 60 }}>
        <color attach="background" args={['#001122']} />
        
        <ReynoldsExperimentScene
          flowVelocity={flowVelocity}
          pipeRadius={pipeRadius}
          fluidViscosity={fluidViscosity}
          fluidDensity={fluidDensity}
          dyeInjectionRate={dyeInjectionRate}
        />
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
};

export default ReynoldsExperimentSimulation; 