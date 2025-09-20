import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Sphere, Cone } from '@react-three/drei';
import * as THREE from 'three';

// 伯努利悬浮器实验接口
interface BernoulliLevitatorSimulationProps {
  airSpeed?: number;          // 气流速度 (m/s)
  nozzleDiameter?: number;    // 喷嘴直径 (m)
  ballMass?: number;          // 小球质量 (kg)
  ballDiameter?: number;      // 小球直径 (m)
  airDensity?: number;        // 空气密度 (kg/m³)
  className?: string;
  autoRotate?: boolean;
}

// 力学计算结果接口
interface LevitationData {
  bernoulliForce: number;     // 伯努利力
  gravityForce: number;       // 重力
  dragForce: number;          // 阻力
  equilibriumHeight: number;  // 平衡高度
  stabilityFactor: number;    // 稳定性因子
  pressureDifference: number; // 压力差
}

// 伯努利悬浮计算
const calculateLevitationForces = (
  airSpeed: number,
  nozzleDiameter: number,
  ballMass: number,
  ballDiameter: number,
  airDensity: number
): LevitationData => {
  const gravity = 9.81;
  const ballRadius = ballDiameter / 2;
  const nozzleRadius = nozzleDiameter / 2;
  const ballArea = Math.PI * ballRadius ** 2;
  
  // 重力
  const gravityForce = ballMass * gravity;
  
  // 伯努利压力差 (简化模型)
  // 在球的底部：高速气流，低压
  // 在球的周围：相对静止空气，高压
  const dynamicPressure = 0.5 * airDensity * airSpeed ** 2;
  const pressureDifference = dynamicPressure * 0.7; // 效率因子
  
  // 伯努利上升力
  const bernoulliForce = pressureDifference * ballArea;
  
  // 阻力 (简化)
  const dragCoefficient = 0.47; // 球体阻力系数
  const dragForce = 0.5 * dragCoefficient * airDensity * airSpeed ** 2 * ballArea;
  
  // 平衡高度估算
  const equilibriumHeight = nozzleRadius * 2 + ballRadius;
  
  // 稳定性因子
  const stabilityFactor = bernoulliForce / (gravityForce + dragForce);
  
  return {
    bernoulliForce,
    gravityForce,
    dragForce,
    equilibriumHeight,
    stabilityFactor,
    pressureDifference
  };
};

// 气流粒子组件
const AirFlowParticles: React.FC<{
  count: number;
  airSpeed: number;
  nozzleDiameter: number;
  ballPosition: THREE.Vector3;
  ballRadius: number;
}> = ({ count, airSpeed, nozzleDiameter, ballPosition, ballRadius }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [time, setTime] = useState(0);

  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // 在喷嘴出口圆形分布
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * (nozzleDiameter / 2) * 0.9;
      
      positions[i3] = radius * Math.cos(angle);     // x
      positions[i3 + 1] = radius * Math.sin(angle); // y  
      positions[i3 + 2] = -2;                       // z: 喷嘴位置

      // 初始速度（向上）
      velocities[i3] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 2] = airSpeed + (Math.random() - 0.5) * 1;

      // 根据速度设置颜色
      const speed = Math.abs(velocities[i3 + 2]);
      const normalizedSpeed = Math.min(speed / airSpeed, 1);
      
      // 浅蓝到深蓝渐变
      colors[i3] = 0.3 + normalizedSpeed * 0.4;     // R
      colors[i3 + 1] = 0.6 + normalizedSpeed * 0.3; // G
      colors[i3 + 2] = 0.9 + normalizedSpeed * 0.1; // B
    }

    return { positions, velocities, colors };
  }, [count, airSpeed, nozzleDiameter]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    setTime(prev => prev + delta);
    
    const tempObject = new THREE.Object3D();
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];

      // 检查与球的碰撞
      const dx = x - ballPosition.x;
      const dy = y - ballPosition.y;
      const dz = z - ballPosition.z;
      const distanceToBall = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distanceToBall < ballRadius + 0.1) {
        // 粒子撞击球体，产生绕流效应
        const angle = Math.atan2(dy, dx);
        const deflectionStrength = 1.5;
        
        // 切向速度分量
        velocities[i3] += Math.cos(angle + Math.PI/2) * deflectionStrength;
        velocities[i3 + 1] += Math.sin(angle + Math.PI/2) * deflectionStrength;
        velocities[i3 + 2] *= 0.7; // 速度减小
        
        // 颜色变化表示碰撞
        colors[i3] = 1.0;   // 红色
        colors[i3 + 1] = 0.5;
        colors[i3 + 2] = 0.2;
      } else {
        // 伯努利效应：靠近球体时加速
        const influence = Math.max(0, (ballRadius * 3 - distanceToBall) / (ballRadius * 3));
        if (influence > 0 && z < ballPosition.z) {
          // 在球体下方时，气流向球体汇聚
          const convergenceFactor = influence * 0.5;
          velocities[i3] += (ballPosition.x - x) * convergenceFactor * delta;
          velocities[i3 + 1] += (ballPosition.y - y) * convergenceFactor * delta;
          
          // 速度增加（伯努利效应）
          velocities[i3 + 2] += influence * airSpeed * 0.3 * delta;
        }
      }

      // 扩散效应（距离喷嘴越远，扩散越明显）
      const heightFromNozzle = z + 2;
      if (heightFromNozzle > 0) {
        const spreadFactor = heightFromNozzle * 0.1;
        velocities[i3] += (Math.random() - 0.5) * spreadFactor * delta;
        velocities[i3 + 1] += (Math.random() - 0.5) * spreadFactor * delta;
      }

      // 更新位置
      positions[i3] += velocities[i3] * delta * 2;
      positions[i3 + 1] += velocities[i3 + 1] * delta * 2;
      positions[i3 + 2] += velocities[i3 + 2] * delta * 2;

      // 重置离开范围的粒子
      if (z > 8 || Math.sqrt(x*x + y*y) > 5) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * (nozzleDiameter / 2) * 0.9;
        
        positions[i3] = radius * Math.cos(angle);
        positions[i3 + 1] = radius * Math.sin(angle);
        positions[i3 + 2] = -2;
        
        velocities[i3] = (Math.random() - 0.5) * 0.2;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
        velocities[i3 + 2] = airSpeed + (Math.random() - 0.5) * 1;
        
        // 恢复原始颜色
        const speed = Math.abs(velocities[i3 + 2]);
        const normalizedSpeed = Math.min(speed / airSpeed, 1);
        colors[i3] = 0.3 + normalizedSpeed * 0.4;
        colors[i3 + 1] = 0.6 + normalizedSpeed * 0.3;
        colors[i3 + 2] = 0.9 + normalizedSpeed * 0.1;
      }

      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.02, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.6} />
    </instancedMesh>
  );
};

// 悬浮小球组件
const LevitatingBall: React.FC<{
  diameter: number;
  mass: number;
  levitationData: LevitationData;
  airSpeed: number;
}> = ({ diameter, mass, levitationData, airSpeed }) => {
  const ballRef = useRef<THREE.Mesh>(null);
  const [position, setPosition] = useState(new THREE.Vector3(0, 0, 2));
  const [velocity, setVelocity] = useState(new THREE.Vector3(0, 0, 0));
  const [oscillation, setOscillation] = useState(0);

  useFrame((state, delta) => {
    if (!ballRef.current) return;
    
    setOscillation(prev => prev + delta);
    
    // 力的计算
    const gravity = 9.81;
    const gravityForce = mass * gravity;
    
    // 根据高度调整伯努利力
    const height = position.z;
    const heightFactor = Math.max(0, 1 - (height - 2) / 5); // 高度越高，力越小
    const bernoulliForce = levitationData.bernoulliForce * heightFactor;
    
    // 净力
    const netForce = bernoulliForce - gravityForce;
    
    // 加速度
    const acceleration = netForce / mass;
    
    // 更新速度（带阻尼）
    setVelocity(prev => {
      const newVel = prev.clone();
      newVel.z += acceleration * delta;
      
      // 阻尼
      newVel.multiplyScalar(0.95);
      
      // 随机扰动（空气湍流）
      newVel.x += (Math.random() - 0.5) * 0.1 * delta;
      newVel.y += (Math.random() - 0.5) * 0.1 * delta;
      
      return newVel;
    });
    
    // 更新位置
    setPosition(prev => {
      const newPos = prev.clone();
      newPos.add(velocity.clone().multiplyScalar(delta));
      
      // 限制边界
      newPos.z = Math.max(0.5, Math.min(newPos.z, 6));
      newPos.x = Math.max(-2, Math.min(newPos.x, 2));
      newPos.y = Math.max(-2, Math.min(newPos.y, 2));
      
      return newPos;
    });
    
    // 应用位置到球体
    ballRef.current.position.copy(position);
    
    // 添加轻微旋转
    ballRef.current.rotation.x += delta * 2;
    ballRef.current.rotation.y += delta * 1.5;
  });

  const ballColor = useMemo(() => {
    // 根据稳定性因子改变颜色
    const stability = levitationData.stabilityFactor;
    if (stability > 1.2) return "#27ae60"; // 稳定悬浮 - 绿色
    if (stability > 0.8) return "#f39c12"; // 临界悬浮 - 橙色
    return "#e74c3c"; // 不稳定 - 红色
  }, [levitationData.stabilityFactor]);

  return (
    <group>
      <Sphere ref={ballRef} args={[diameter/2, 32, 32]} position={position}>
        <meshStandardMaterial 
          color={ballColor}
          metalness={0.1}
          roughness={0.3}
          emissive={ballColor}
          emissiveIntensity={0.1}
        />
      </Sphere>
      
      {/* 力的可视化箭头 */}
      <group position={[position.x + 1, position.y, position.z]}>
        {/* 重力箭头 */}
        <Cone args={[0.1, 0.5, 8]} position={[0, 0, -0.25]} rotation={[Math.PI, 0, 0]}>
          <meshBasicMaterial color="#e74c3c" />
        </Cone>
        <Text
          position={[0, 0, -0.8]}
          fontSize={0.15}
          color="#e74c3c"
          anchorX="center"
          anchorY="middle"
        >
          重力
        </Text>
        
        {/* 伯努利力箭头 */}
        <Cone args={[0.1, 0.7, 8]} position={[0, 0, 0.35]}>
          <meshBasicMaterial color="#3498db" />
        </Cone>
        <Text
          position={[0, 0, 0.8]}
          fontSize={0.15}
          color="#3498db"
          anchorX="center"
          anchorY="middle"
        >
          伯努利力
        </Text>
      </group>
    </group>
  );
};

// 喷嘴组件
const AirNozzle: React.FC<{
  diameter: number;
  airSpeed: number;
}> = ({ diameter, airSpeed }) => {
  return (
    <group position={[0, 0, -2.5]}>
      {/* 喷嘴主体 */}
      <Cylinder args={[diameter/2 + 0.1, diameter/2, 1, 16]}>
        <meshStandardMaterial color="#34495e" metalness={0.8} roughness={0.2} />
      </Cylinder>
      
      {/* 喷嘴出口 */}
      <Cylinder args={[diameter/2, diameter/2, 0.1, 16]} position={[0, 0, 0.55]}>
        <meshStandardMaterial color="#2c3e50" metalness={0.9} roughness={0.1} />
      </Cylinder>
      
      {/* 气流速度显示 */}
      <Text
        position={[0, 0, -0.8]}
        fontSize={0.2}
        color="#3498db"
        anchorX="center"
        anchorY="middle"
      >
        {`气流: ${airSpeed.toFixed(1)} m/s`}
      </Text>
    </group>
  );
};

// 压力计组件
const PressureGauges: React.FC<{
  data: LevitationData;
}> = ({ data }) => {
  return (
    <>
      {/* 高压区指示器 */}
      <group position={[-3, 0, 1]}>
        <Cylinder args={[0.2, 0.2, 0.1, 16]} rotation={[Math.PI/2, 0, 0]}>
          <meshStandardMaterial color="#e74c3c" metalness={0.6} roughness={0.4} />
        </Cylinder>
        <Text
          position={[0, 0, 0.5]}
          fontSize={0.2}
          color="#c0392b"
          anchorX="center"
          anchorY="middle"
        >
          高压区
        </Text>
        <Text
          position={[0, 0, -0.5]}
          fontSize={0.15}
          color="#7f8c8d"
          anchorX="center"
          anchorY="middle"
        >
          {`${(101325 + data.pressureDifference).toFixed(0)} Pa`}
        </Text>
      </group>

      {/* 低压区指示器 */}
      <group position={[3, 0, 1]}>
        <Cylinder args={[0.2, 0.2, 0.1, 16]} rotation={[Math.PI/2, 0, 0]}>
          <meshStandardMaterial color="#3498db" metalness={0.6} roughness={0.4} />
        </Cylinder>
        <Text
          position={[0, 0, 0.5]}
          fontSize={0.2}
          color="#2980b9"
          anchorX="center"
          anchorY="middle"
        >
          低压区
        </Text>
        <Text
          position={[0, 0, -0.5]}
          fontSize={0.15}
          color="#7f8c8d"
          anchorX="center"
          anchorY="middle"
        >
          {`${(101325 - data.pressureDifference).toFixed(0)} Pa`}
        </Text>
      </group>
    </>
  );
};

// 主仿真场景
const BernoulliLevitatorScene: React.FC<Omit<BernoulliLevitatorSimulationProps, 'className' | 'autoRotate'>> = ({
  airSpeed = 15.0,
  nozzleDiameter = 0.3,
  ballMass = 0.002,
  ballDiameter = 0.15,
  airDensity = 1.225
}) => {
  const { camera } = useThree();

  // 设置相机位置
  useEffect(() => {
    camera.position.set(5, 5, 3);
    camera.lookAt(0, 0, 2);
  }, [camera]);

  // 计算悬浮数据
  const levitationData = useMemo(() => {
    return calculateLevitationForces(airSpeed, nozzleDiameter, ballMass, ballDiameter, airDensity);
  }, [airSpeed, nozzleDiameter, ballMass, ballDiameter, airDensity]);

  const ballPosition = new THREE.Vector3(0, 0, levitationData.equilibriumHeight);

  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.6} />
      
      {/* 定向光 */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* 点光源 */}
      <pointLight position={[-5, 5, 5]} intensity={0.3} />
      
      {/* 喷嘴 */}
      <AirNozzle diameter={nozzleDiameter} airSpeed={airSpeed} />
      
      {/* 气流粒子 */}
      <AirFlowParticles 
        count={2500}
        airSpeed={airSpeed}
        nozzleDiameter={nozzleDiameter}
        ballPosition={ballPosition}
        ballRadius={ballDiameter/2}
      />
      
      {/* 悬浮小球 */}
      <LevitatingBall 
        diameter={ballDiameter}
        mass={ballMass}
        levitationData={levitationData}
        airSpeed={airSpeed}
      />
      
      {/* 压力计 */}
      <PressureGauges data={levitationData} />
      
      {/* 标题 */}
      <Text
        position={[0, 0, 6]}
        fontSize={0.6}
        color="#2c3e50"
        anchorX="center"
        anchorY="middle"
      >
        伯努利悬浮器实验
      </Text>
      
      {/* 原理说明 */}
      <Text
        position={[0, 0, 5]}
        fontSize={0.25}
        color="#7f8c8d"
        anchorX="center"
        anchorY="middle"
      >
        高速气流产生低压，周围静止空气为高压
      </Text>
      
      {/* 稳定性指示 */}
      <Text
        position={[0, 0, 4.5]}
        fontSize={0.3}
        color={levitationData.stabilityFactor > 1 ? "#27ae60" : "#e74c3c"}
        anchorX="center"
        anchorY="middle"
      >
        {`稳定性: ${levitationData.stabilityFactor.toFixed(2)} ${levitationData.stabilityFactor > 1 ? '(稳定)' : '(不稳定)'}`}
      </Text>
      
      {/* 力平衡显示 */}
      <Text
        position={[-4, 0, -1]}
        fontSize={0.2}
        color="#34495e"
        anchorX="center"
        anchorY="middle"
      >
        {`重力: ${(levitationData.gravityForce * 1000).toFixed(1)} mN\n伯努利力: ${(levitationData.bernoulliForce * 1000).toFixed(1)} mN\n压力差: ${levitationData.pressureDifference.toFixed(1)} Pa`}
      </Text>
    </>
  );
};

// 主组件
const BernoulliLevitatorSimulation: React.FC<BernoulliLevitatorSimulationProps> = ({
  className = '',
  autoRotate = true,
  ...props
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [5, 5, 3], fov: 60 }}
        style={{ background: 'linear-gradient(to bottom, #f8f9fa, #e9ecef)' }}
      >
        <BernoulliLevitatorScene {...props} />
        <OrbitControls 
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
};

export default BernoulliLevitatorSimulation; 