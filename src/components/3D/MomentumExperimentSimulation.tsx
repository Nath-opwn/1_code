import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Sphere, Cone } from '@react-three/drei';
import * as THREE from 'three';

// 动量定律实验接口
interface MomentumExperimentSimulationProps {
  jetVelocity?: number;       // 射流速度 (m/s)
  jetDiameter?: number;       // 射流直径 (m)
  plateType?: 'flat' | 'curved'; // 挡板类型
  plateAngle?: number;        // 挡板角度 (度)
  fluidDensity?: number;      // 流体密度 (kg/m³)
  className?: string;
  autoRotate?: boolean;
}

// 动量计算结果接口
interface MomentumData {
  jetArea: number;           // 射流截面积
  massFlowRate: number;      // 质量流量
  momentumFlowRate: number;  // 动量流量
  force: number;             // 作用力
  pressure: number;          // 动压
  powerLoss: number;         // 功率损失
}

// 动量定律计算
const calculateMomentumForce = (
  velocity: number,
  diameter: number,
  density: number,
  plateType: 'flat' | 'curved',
  angle: number = 90
): MomentumData => {
  const area = Math.PI * (diameter / 2) ** 2;
  const massFlowRate = density * area * velocity;
  const momentumFlowRate = massFlowRate * velocity;
  
  let force: number;
  let powerLoss: number;
  
  if (plateType === 'flat') {
    // 平板：F = ρAv²cos(θ)
    const angleRad = (angle * Math.PI) / 180;
    force = density * area * velocity ** 2 * Math.cos(angleRad);
    // 功率损失：P = Fv(1 - cos(θ))
    powerLoss = force * velocity * (1 - Math.cos(angleRad));
  } else {
    // 弯曲板（180°偏转）：F = 2ρAv²
    force = 2 * density * area * velocity ** 2;
    // 功率损失：P = 2Fv
    powerLoss = force * velocity;
  }
  
  const pressure = 0.5 * density * velocity ** 2; // 动压
  
  return {
    jetArea: area,
    massFlowRate,
    momentumFlowRate,
    force,
    pressure,
    powerLoss
  };
};

// 射流粒子组件
const JetParticles: React.FC<{
  count: number;
  velocity: number;
  diameter: number;
  platePosition: THREE.Vector3;
  plateType: 'flat' | 'curved';
  plateAngle: number;
}> = ({ count, velocity, diameter, platePosition, plateType, plateAngle }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [time, setTime] = useState(0);

  const { positions, velocities, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // 在喷嘴出口处圆形分布
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * (diameter / 2) * 0.9;
      
      positions[i3] = -8; // x: 射流起始位置
      positions[i3 + 1] = radius * Math.cos(angle); // y: 圆形分布
      positions[i3 + 2] = radius * Math.sin(angle); // z: 圆形分布

      // 初始速度（主要沿x方向）
      velocities[i3] = velocity + (Math.random() - 0.5) * 0.3;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;

      // 根据速度设置颜色（蓝色到红色渐变）
      const speedRatio = velocities[i3] / velocity;
      colors[i3] = speedRatio * 0.8;           // R
      colors[i3 + 1] = 0.3 + speedRatio * 0.4; // G
      colors[i3 + 2] = 1.0 - speedRatio * 0.3; // B

      // 粒子大小
      sizes[i] = 0.03 + Math.random() * 0.02;
    }

    return { positions, velocities, colors, sizes };
  }, [count, velocity, diameter]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    setTime(prev => prev + delta);
    
    const tempObject = new THREE.Object3D();
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];

      // 检查是否撞击挡板
      const distanceToPlate = x - platePosition.x;
      
      if (distanceToPlate >= -0.2 && !hasHitPlate(i)) {
        // 粒子撞击挡板
        markAsHit(i);
        
        if (plateType === 'flat') {
          // 平板反射
          const angleRad = (plateAngle * Math.PI) / 180;
          const normalX = Math.cos(angleRad);
          const normalY = Math.sin(angleRad);
          
          // 反射速度计算
          const dot = velocities[i3] * normalX + velocities[i3 + 1] * normalY;
          velocities[i3] -= 2 * dot * normalX;
          velocities[i3 + 1] -= 2 * dot * normalY;
          
          // 能量损失
          velocities[i3] *= 0.8;
          velocities[i3 + 1] *= 0.8;
          velocities[i3 + 2] *= 0.8;
        } else {
          // 弯曲板：180度偏转
          velocities[i3] = -Math.abs(velocities[i3]) * 0.7;
          velocities[i3 + 1] *= 0.5;
          velocities[i3 + 2] *= 0.5;
        }
        
        // 更新颜色表示撞击
        colors[i3] = 1.0;     // 红色
        colors[i3 + 1] = 0.3;
        colors[i3 + 2] = 0.1;
      }

      // 添加重力效应（轻微）
      velocities[i3 + 2] -= 0.5 * delta;

      // 更新位置
      positions[i3] += velocities[i3] * delta * 3;
      positions[i3 + 1] += velocities[i3 + 1] * delta * 3;
      positions[i3 + 2] += velocities[i3 + 2] * delta * 3;

      // 重置离开范围的粒子
      if (x > 12 || x < -12 || Math.abs(y) > 8 || z < -5) {
        // 重新初始化粒子
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * (diameter / 2) * 0.9;
        
        positions[i3] = -8;
        positions[i3 + 1] = radius * Math.cos(angle);
        positions[i3 + 2] = radius * Math.sin(angle);
        
        velocities[i3] = velocity + (Math.random() - 0.5) * 0.3;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
        
        // 恢复原始颜色
        const speedRatio = velocities[i3] / velocity;
        colors[i3] = speedRatio * 0.8;
        colors[i3 + 1] = 0.3 + speedRatio * 0.4;
        colors[i3 + 2] = 1.0 - speedRatio * 0.3;
        
        unmarkHit(i);
      }

      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      tempObject.scale.setScalar(sizes[i]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // 简单的撞击状态管理
  const hitStatus = useRef(new Set<number>());
  
  const hasHitPlate = (index: number) => hitStatus.current.has(index);
  const markAsHit = (index: number) => hitStatus.current.add(index);
  const unmarkHit = (index: number) => hitStatus.current.delete(index);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.8} />
    </instancedMesh>
  );
};

// 喷嘴组件
const Nozzle: React.FC<{
  diameter: number;
  velocity: number;
}> = ({ diameter, velocity }) => {
  return (
    <group position={[-8, 0, 0]}>
      {/* 喷嘴主体 */}
      <Cylinder args={[diameter/2 + 0.1, diameter/2, 1, 16]} rotation={[0, 0, Math.PI/2]}>
        <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
      </Cylinder>
      
      {/* 喷嘴出口 */}
      <Cylinder args={[diameter/2, diameter/2, 0.2, 16]} position={[0.6, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <meshStandardMaterial color="#34495e" metalness={0.9} roughness={0.1} />
      </Cylinder>
      
      {/* 速度标识 */}
      <Text
        position={[0, 0, diameter/2 + 0.5]}
        fontSize={0.2}
        color="#e74c3c"
        anchorX="center"
        anchorY="middle"
      >
        {`v = ${velocity.toFixed(1)} m/s`}
      </Text>
    </group>
  );
};

// 挡板组件
const ImpactPlate: React.FC<{
  type: 'flat' | 'curved';
  angle: number;
  position: THREE.Vector3;
  force: number;
}> = ({ type, angle, position, force }) => {
  const plateRef = useRef<THREE.Mesh>(null);
  const [oscillation, setOscillation] = useState(0);

  useFrame((state, delta) => {
    // 根据作用力产生轻微振动
    const amplitude = Math.min(force / 1000, 0.1);
    setOscillation(prev => prev + delta * 10);
    
    if (plateRef.current) {
      plateRef.current.position.x = position.x + Math.sin(oscillation) * amplitude * 0.01;
    }
  });

  if (type === 'flat') {
    return (
      <group position={position} rotation={[0, 0, (angle - 90) * Math.PI / 180]}>
        <Box ref={plateRef} args={[0.2, 2, 2]}>
          <meshStandardMaterial 
            color="#e74c3c" 
            metalness={0.7} 
            roughness={0.3}
          />
        </Box>
        
        {/* 力值显示 */}
        <Text
          position={[0, 0, 1.5]}
          fontSize={0.25}
          color="#c0392b"
          anchorX="center"
          anchorY="middle"
        >
          {`F = ${force.toFixed(1)} N`}
        </Text>
        
        {/* 角度显示 */}
        <Text
          position={[0, 0, -1.5]}
          fontSize={0.2}
          color="#7f8c8d"
          anchorX="center"
          anchorY="middle"
        >
          {`θ = ${angle}°`}
        </Text>
      </group>
    );
  } else {
    return (
      <group position={position}>
        {/* 弯曲挡板（半圆形） */}
        <Cylinder ref={plateRef} args={[1, 1, 0.2, 16, 1, false, 0, Math.PI]} rotation={[0, Math.PI/2, 0]}>
          <meshStandardMaterial 
            color="#3498db" 
            metalness={0.7} 
            roughness={0.3}
            side={THREE.DoubleSide}
          />
        </Cylinder>
        
        {/* 力值显示 */}
        <Text
          position={[0, 0, 1.5]}
          fontSize={0.25}
          color="#2980b9"
          anchorX="center"
          anchorY="middle"
        >
          {`F = ${force.toFixed(1)} N`}
        </Text>
        
        <Text
          position={[0, 0, -1.5]}
          fontSize={0.2}
          color="#7f8c8d"
          anchorX="center"
          anchorY="middle"
        >
          弯曲板 (180°偏转)
        </Text>
      </group>
    );
  }
};

// 力传感器组件
const ForceSensor: React.FC<{
  position: THREE.Vector3;
  force: number;
  maxForce: number;
}> = ({ position, force, maxForce }) => {
  const forceRatio = Math.min(force / maxForce, 1);
  
  return (
    <group position={position}>
      {/* 传感器基座 */}
      <Box args={[0.3, 0.3, 0.1]}>
        <meshStandardMaterial color="#34495e" metalness={0.8} roughness={0.2} />
      </Box>
      
      {/* 力指示器 */}
      <Box args={[0.1, 0.1, forceRatio * 2]} position={[0, 0, forceRatio]}>
        <meshStandardMaterial 
          color={`hsl(${120 * (1 - forceRatio)}, 70%, 50%)`} 
          emissive={`hsl(${120 * (1 - forceRatio)}, 70%, 20%)`}
        />
      </Box>
      
      {/* 数值显示 */}
      <Text
        position={[0, 0, 2.5]}
        fontSize={0.2}
        color="#2c3e50"
        anchorX="center"
        anchorY="middle"
      >
        {`${force.toFixed(1)} N`}
      </Text>
    </group>
  );
};

// 主仿真场景
const MomentumExperimentScene: React.FC<Omit<MomentumExperimentSimulationProps, 'className' | 'autoRotate'>> = ({
  jetVelocity = 10.0,
  jetDiameter = 0.5,
  plateType = 'flat',
  plateAngle = 90,
  fluidDensity = 1000
}) => {
  const { camera } = useThree();

  // 设置相机位置
  useEffect(() => {
    camera.position.set(0, 6, 8);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // 计算动量数据
  const momentumData = useMemo(() => {
    return calculateMomentumForce(jetVelocity, jetDiameter, fluidDensity, plateType, plateAngle);
  }, [jetVelocity, jetDiameter, fluidDensity, plateType, plateAngle]);

  const platePosition = new THREE.Vector3(2, 0, 0);

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
      
      {/* 喷嘴 */}
      <Nozzle diameter={jetDiameter} velocity={jetVelocity} />
      
      {/* 射流粒子 */}
      <JetParticles 
        count={3000}
        velocity={jetVelocity}
        diameter={jetDiameter}
        platePosition={platePosition}
        plateType={plateType}
        plateAngle={plateAngle}
      />
      
      {/* 挡板 */}
      <ImpactPlate 
        type={plateType}
        angle={plateAngle}
        position={platePosition}
        force={momentumData.force}
      />
      
      {/* 力传感器 */}
      <ForceSensor 
        position={new THREE.Vector3(2, -3, 0)}
        force={momentumData.force}
        maxForce={5000}
      />
      
      {/* 标题 */}
      <Text
        position={[0, 4, 0]}
        fontSize={0.6}
        color="#2c3e50"
        anchorX="center"
        anchorY="middle"
      >
        动量定律实验
      </Text>
      
      {/* 公式显示 */}
      <Text
        position={[-6, 2, 0]}
        fontSize={0.3}
        color="#34495e"
        anchorX="center"
        anchorY="middle"
      >
        {plateType === 'flat' ? 'F = ρAv²cos(θ)' : 'F = 2ρAv²'}
      </Text>
      
      {/* 参数显示 */}
      <Text
        position={[6, 2, 0]}
        fontSize={0.25}
        color="#7f8c8d"
        anchorX="center"
        anchorY="middle"
      >
        {`射流速度: ${jetVelocity} m/s\n射流直径: ${jetDiameter} m\n流体密度: ${fluidDensity} kg/m³`}
      </Text>
      
      {/* 计算结果 */}
      <Text
        position={[0, -3, 0]}
        fontSize={0.25}
        color="#27ae60"
        anchorX="center"
        anchorY="middle"
      >
        {`质量流量: ${momentumData.massFlowRate.toFixed(1)} kg/s | 功率损失: ${(momentumData.powerLoss/1000).toFixed(1)} kW`}
      </Text>
    </>
  );
};

// 主组件
const MomentumExperimentSimulation: React.FC<MomentumExperimentSimulationProps> = ({
  className = '',
  autoRotate = true,
  ...props
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 6, 8], fov: 60 }}
        style={{ background: 'linear-gradient(to bottom, #ecf0f1, #bdc3c7)' }}
      >
        <MomentumExperimentScene {...props} />
        <OrbitControls 
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
};

export default MomentumExperimentSimulation; 