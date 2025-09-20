import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// 沿程阻力实验接口
interface FrictionLossSimulationProps {
  pipeLength?: number;        // 管道长度 (m)
  pipeDiameter?: number;      // 管道直径 (m)
  flowVelocity?: number;      // 流速 (m/s)
  fluidDensity?: number;      // 流体密度 (kg/m³)
  fluidViscosity?: number;    // 流体粘度 (Pa·s)
  pipeRoughness?: number;     // 管道粗糙度 (m)
  className?: string;
  autoRotate?: boolean;
}

// 沿程阻力计算结果接口
interface FrictionLossData {
  reynoldsNumber: number;     // 雷诺数
  frictionFactor: number;     // 摩擦系数
  pressureDrop: number;       // 压力降
  headLoss: number;           // 水头损失
  frictionForce: number;      // 摩擦力
  flowRegime: string;         // 流动状态
  velocityProfile: number[];  // 速度分布
}

// 沿程阻力计算
const calculateFrictionLoss = (
  length: number,
  diameter: number,
  velocity: number,
  density: number,
  viscosity: number,
  roughness: number
): FrictionLossData => {
  // 雷诺数计算
  const reynoldsNumber = (density * velocity * diameter) / viscosity;
  
  // 判断流动状态
  let flowRegime: string;
  if (reynoldsNumber < 2300) {
    flowRegime = "层流";
  } else if (reynoldsNumber < 4000) {
    flowRegime = "过渡流";
  } else {
    flowRegime = "湍流";
  }
  
  // 摩擦系数计算
  let frictionFactor: number;
  if (reynoldsNumber < 2300) {
    // 层流：Hagen-Poiseuille方程
    frictionFactor = 64 / reynoldsNumber;
  } else {
    // 湍流：Colebrook-White方程简化
    const relativeRoughness = roughness / diameter;
    // 使用Swamee-Jain方程近似
    frictionFactor = 0.25 / Math.pow(
      Math.log10(relativeRoughness / 3.7 + 5.74 / Math.pow(reynoldsNumber, 0.9)), 2
    );
  }
  
  // 压力降计算 (Darcy-Weisbach方程)
  const pressureDrop = frictionFactor * (length / diameter) * (density * velocity ** 2) / 2;
  
  // 水头损失
  const headLoss = pressureDrop / (density * 9.81);
  
  // 摩擦力
  const pipeArea = Math.PI * diameter * length;
  const frictionForce = pressureDrop * Math.PI * diameter ** 2 / 4;
  
  // 速度分布（径向）
  const velocityProfile: number[] = [];
  const radius = diameter / 2;
  for (let i = 0; i <= 20; i++) {
    const r = (i / 20) * radius;
    let vr: number;
    
    if (reynoldsNumber < 2300) {
      // 层流：抛物线分布
      vr = 2 * velocity * (1 - (r / radius) ** 2);
    } else {
      // 湍流：1/7次幂律
      vr = velocity * Math.pow(1 - r / radius, 1/7);
    }
    velocityProfile.push(vr);
  }
  
  return {
    reynoldsNumber,
    frictionFactor,
    pressureDrop,
    headLoss,
    frictionForce,
    flowRegime,
    velocityProfile
  };
};

// 流体粒子组件
const FlowParticles: React.FC<{
  count: number;
  pipeLength: number;
  pipeDiameter: number;
  velocity: number;
  velocityProfile: number[];
  reynoldsNumber: number;
}> = ({ count, pipeLength, pipeDiameter, velocity, velocityProfile, reynoldsNumber }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [time, setTime] = useState(0);

  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const radius = pipeDiameter / 2;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // 在管道入口处随机分布
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.sqrt(Math.random()) * radius * 0.95;
      
      positions[i3] = -pipeLength / 2; // x: 管道入口
      positions[i3 + 1] = r * Math.cos(angle); // y: 径向分布
      positions[i3 + 2] = r * Math.sin(angle); // z: 径向分布

      // 根据径向位置计算初始速度
      const normalizedR = r / radius;
      const profileIndex = Math.floor(normalizedR * (velocityProfile.length - 1));
      const localVelocity = velocityProfile[profileIndex] || velocity;
      
      velocities[i3] = localVelocity + (Math.random() - 0.5) * 0.2;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      // 根据速度和流动状态设置颜色
      const speedRatio = localVelocity / velocity;
      if (reynoldsNumber < 2300) {
        // 层流：蓝色渐变
        colors[i3] = 0.2 + speedRatio * 0.3;
        colors[i3 + 1] = 0.4 + speedRatio * 0.4;
        colors[i3 + 2] = 0.8 + speedRatio * 0.2;
      } else {
        // 湍流：红色渐变
        colors[i3] = 0.6 + speedRatio * 0.4;
        colors[i3 + 1] = 0.2 + speedRatio * 0.3;
        colors[i3 + 2] = 0.1 + speedRatio * 0.2;
      }
    }

    return { positions, velocities, colors };
  }, [count, pipeLength, pipeDiameter, velocity, velocityProfile, reynoldsNumber]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    setTime(prev => prev + delta);
    
    const tempObject = new THREE.Object3D();
    const radius = pipeDiameter / 2;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];

      // 检查是否在管道内
      const radialDistance = Math.sqrt(y * y + z * z);
      
      if (radialDistance < radius) {
        // 根据径向位置调整速度
        const normalizedR = radialDistance / radius;
        const profileIndex = Math.floor(normalizedR * (velocityProfile.length - 1));
        const targetVelocity = velocityProfile[profileIndex] || velocity;
        
        // 速度调整（考虑粘性效应）
        velocities[i3] = targetVelocity + (Math.random() - 0.5) * 0.1;
        
        // 湍流混合效应
        if (reynoldsNumber > 4000) {
          const turbulenceIntensity = 0.05 * (1 - normalizedR);
          velocities[i3 + 1] += (Math.random() - 0.5) * turbulenceIntensity;
          velocities[i3 + 2] += (Math.random() - 0.5) * turbulenceIntensity;
        }
        
        // 壁面约束
        if (radialDistance > radius * 0.9) {
          const wallNormalX = y / radialDistance;
          const wallNormalY = z / radialDistance;
          
          // 反射回管道内
          velocities[i3 + 1] -= wallNormalX * 0.5;
          velocities[i3 + 2] -= wallNormalY * 0.5;
          
          // 壁面摩擦
          velocities[i3] *= 0.9;
        }
      } else {
        // 粒子离开管道，重新定位到入口
        const angle = Math.random() * 2 * Math.PI;
        const r = Math.sqrt(Math.random()) * radius * 0.95;
        
        positions[i3] = -pipeLength / 2;
        positions[i3 + 1] = r * Math.cos(angle);
        positions[i3 + 2] = r * Math.sin(angle);
        
        const normalizedR = r / radius;
        const profileIndex = Math.floor(normalizedR * (velocityProfile.length - 1));
        const localVelocity = velocityProfile[profileIndex] || velocity;
        
        velocities[i3] = localVelocity;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
      }

      // 更新位置
      positions[i3] += velocities[i3] * delta * 2;
      positions[i3 + 1] += velocities[i3 + 1] * delta;
      positions[i3 + 2] += velocities[i3 + 2] * delta;

      // 重置离开管道的粒子
      if (x > pipeLength / 2) {
        const angle = Math.random() * 2 * Math.PI;
        const r = Math.sqrt(Math.random()) * radius * 0.95;
        
        positions[i3] = -pipeLength / 2;
        positions[i3 + 1] = r * Math.cos(angle);
        positions[i3 + 2] = r * Math.sin(angle);
      }

      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.7} />
    </instancedMesh>
  );
};

// 管道组件
const Pipe: React.FC<{
  length: number;
  diameter: number;
  frictionData: FrictionLossData;
}> = ({ length, diameter, frictionData }) => {
  return (
    <>
      {/* 管道壁 */}
      <Cylinder 
        args={[diameter/2 + 0.05, diameter/2 + 0.05, length, 32]}
        rotation={[0, 0, Math.PI/2]}
      >
        <meshStandardMaterial 
          color="#95a5a6" 
          transparent 
          opacity={0.3}
          metalness={0.5}
          roughness={0.5}
        />
      </Cylinder>
      
      {/* 管道内壁（显示粗糙度） */}
      <Cylinder 
        args={[diameter/2, diameter/2, length, 32]}
        rotation={[0, 0, Math.PI/2]}
      >
        <meshStandardMaterial 
          color="#7f8c8d" 
          transparent 
          opacity={0.1}
          roughness={0.8}
        />
      </Cylinder>
      
      {/* 压力测量点 */}
      {Array.from({ length: 5 }, (_, i) => {
        const x = -length/2 + (i * length/4);
        const pressure = 101325 - (frictionData.pressureDrop * i / 4);
        
        return (
          <group key={i} position={[x, 0, diameter/2 + 0.3]}>
            <Cylinder args={[0.05, 0.05, 0.2, 8]}>
              <meshStandardMaterial color="#e74c3c" metalness={0.8} roughness={0.2} />
            </Cylinder>
            <Text
              position={[0, 0, 0.5]}
              fontSize={0.15}
              color="#c0392b"
              anchorX="center"
              anchorY="middle"
            >
              {`${(pressure/1000).toFixed(1)} kPa`}
            </Text>
          </group>
        );
      })}
    </>
  );
};

// 速度分布可视化
const VelocityProfileVisualization: React.FC<{
  velocityProfile: number[];
  diameter: number;
  position: THREE.Vector3;
  maxVelocity: number;
}> = ({ velocityProfile, diameter, position, maxVelocity }) => {
  const radius = diameter / 2;
  
  return (
    <group position={position}>
      {velocityProfile.map((velocity, i) => {
        const r = (i / (velocityProfile.length - 1)) * radius;
        const height = (velocity / maxVelocity) * 2;
        
        return (
          <group key={i}>
            {/* 上半部分 */}
            <Box args={[0.02, height, 0.02]} position={[height/2, r, 0]}>
              <meshBasicMaterial color="#3498db" />
            </Box>
            {/* 下半部分 */}
            <Box args={[0.02, height, 0.02]} position={[height/2, -r, 0]}>
              <meshBasicMaterial color="#3498db" />
            </Box>
          </group>
        );
      })}
      
      <Text
        position={[0, radius + 0.5, 0]}
        fontSize={0.2}
        color="#2c3e50"
        anchorX="center"
        anchorY="middle"
      >
        速度分布
      </Text>
    </group>
  );
};

// 主仿真场景
const FrictionLossScene: React.FC<Omit<FrictionLossSimulationProps, 'className' | 'autoRotate'>> = ({
  pipeLength = 10,
  pipeDiameter = 0.5,
  flowVelocity = 2.0,
  fluidDensity = 1000,
  fluidViscosity = 0.001,
  pipeRoughness = 0.00005
}) => {
  const { camera } = useThree();

  // 设置相机位置
  useEffect(() => {
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // 计算摩擦损失数据
  const frictionData = useMemo(() => {
    return calculateFrictionLoss(
      pipeLength, 
      pipeDiameter, 
      flowVelocity, 
      fluidDensity, 
      fluidViscosity, 
      pipeRoughness
    );
  }, [pipeLength, pipeDiameter, flowVelocity, fluidDensity, fluidViscosity, pipeRoughness]);

  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.5} />
      
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
      
      {/* 管道 */}
      <Pipe 
        length={pipeLength}
        diameter={pipeDiameter}
        frictionData={frictionData}
      />
      
      {/* 流体粒子 */}
      <FlowParticles 
        count={3000}
        pipeLength={pipeLength}
        pipeDiameter={pipeDiameter}
        velocity={flowVelocity}
        velocityProfile={frictionData.velocityProfile}
        reynoldsNumber={frictionData.reynoldsNumber}
      />
      
      {/* 速度分布可视化 */}
      <VelocityProfileVisualization 
        velocityProfile={frictionData.velocityProfile}
        diameter={pipeDiameter}
        position={new THREE.Vector3(pipeLength/2 + 2, 0, 0)}
        maxVelocity={Math.max(...frictionData.velocityProfile)}
      />
      
      {/* 标题 */}
      <Text
        position={[0, 3, 0]}
        fontSize={0.6}
        color="#2c3e50"
        anchorX="center"
        anchorY="middle"
      >
        沿程阻力实验
      </Text>
      
      {/* 流动状态显示 */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.4}
        color={frictionData.reynoldsNumber < 2300 ? "#3498db" : "#e74c3c"}
        anchorX="center"
        anchorY="middle"
      >
        {frictionData.flowRegime}
      </Text>
      
      {/* Darcy-Weisbach方程 */}
      <Text
        position={[-6, 1, 0]}
        fontSize={0.25}
        color="#34495e"
        anchorX="center"
        anchorY="middle"
      >
        ΔP = f × (L/D) × (ρv²/2)
      </Text>
      
      {/* 参数显示 */}
      <Text
        position={[6, 1, 0]}
        fontSize={0.2}
        color="#7f8c8d"
        anchorX="center"
        anchorY="middle"
      >
        {`Re = ${frictionData.reynoldsNumber.toFixed(0)}\nf = ${frictionData.frictionFactor.toFixed(4)}\nΔP = ${(frictionData.pressureDrop/1000).toFixed(1)} kPa`}
      </Text>
      
      {/* 计算结果 */}
      <Text
        position={[0, -2, 0]}
        fontSize={0.25}
        color="#27ae60"
        anchorX="center"
        anchorY="middle"
      >
        {`水头损失: ${frictionData.headLoss.toFixed(3)} m | 摩擦力: ${frictionData.frictionForce.toFixed(1)} N`}
      </Text>
    </>
  );
};

// 主组件
const FrictionLossSimulation: React.FC<FrictionLossSimulationProps> = ({
  className = '',
  autoRotate = true,
  ...props
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 5, 8], fov: 60 }}
        style={{ background: 'linear-gradient(to bottom, #ecf0f1, #bdc3c7)' }}
      >
        <FrictionLossScene {...props} />
        <OrbitControls 
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
};

export default FrictionLossSimulation; 