import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Sphere, Cone } from '@react-three/drei';
import * as THREE from 'three';

// 皮托管实验接口
interface PitotTubeSimulationProps {
  flowVelocity?: number;        // 流速 (m/s)
  fluidDensity?: number;        // 流体密度 (kg/m³)
  staticPressure?: number;      // 静压 (Pa)
  tubeAngle?: number;           // 皮托管角度 (度)
  showPressureField?: boolean;  // 显示压力场
  className?: string;
  autoRotate?: boolean;
}

// 皮托管数据接口
interface PitotTubeData {
  dynamicPressure: number;      // 动压 (Pa)
  totalPressure: number;        // 总压 (Pa)
  staticPressure: number;       // 静压 (Pa)
  measuredVelocity: number;     // 测量速度 (m/s)
  pressureDifference: number;   // 压差 (Pa)
  machNumber: number;           // 马赫数
  compressibilityFactor: number; // 压缩性修正系数
}

// 计算皮托管数据
const calculatePitotTubeData = (
  velocity: number,
  density: number,
  staticPressure: number,
  temperature: number = 288 // 标准温度K
): PitotTubeData => {
  // 声速计算 (空气)
  const gamma = 1.4; // 比热比
  const R = 287; // 气体常数 J/(kg·K)
  const soundSpeed = Math.sqrt(gamma * R * temperature);
  
  // 马赫数
  const machNumber = velocity / soundSpeed;
  
  // 动压
  const dynamicPressure = 0.5 * density * velocity * velocity;
  
  // 压缩性修正
  let compressibilityFactor = 1;
  if (machNumber > 0.3) {
    // 高亚声速修正
    compressibilityFactor = Math.pow(1 + (gamma - 1) / 2 * machNumber * machNumber, gamma / (gamma - 1));
  }
  
  // 总压
  const totalPressure = staticPressure + dynamicPressure * compressibilityFactor;
  
  // 压差
  const pressureDifference = totalPressure - staticPressure;
  
  // 根据压差计算的速度
  const measuredVelocity = Math.sqrt(2 * pressureDifference / density);
  
  return {
    dynamicPressure,
    totalPressure,
    staticPressure,
    measuredVelocity,
    pressureDifference,
    machNumber,
    compressibilityFactor
  };
};

// 皮托管几何组件
const PitotTubeGeometry: React.FC<{
  angle: number;
  position: THREE.Vector3;
  pitotData: PitotTubeData;
}> = ({ angle, position, pitotData }) => {
  const pitotRef = useRef<THREE.Group>(null);
  
  return (
    <group ref={pitotRef} position={position} rotation={[0, 0, angle * Math.PI / 180]}>
      {/* 主管 */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6]} />
        <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* 总压孔 */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.1]} />
        <meshStandardMaterial color="#ff6666" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* 静压孔 */}
      <mesh position={[0.05, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.05]} />
        <meshStandardMaterial color="#6666ff" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* 支撑杆 */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.6]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* 压力表示 */}
      <group position={[0.3, 0.5, 0]}>
        {/* 总压表 */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.02]} />
          <meshStandardMaterial color="#ff6666" />
        </mesh>
        <Text
          position={[0, 0.2, 0]}
          fontSize={0.08}
          color="#ff6666"
          anchorX="center"
          anchorY="middle"
        >
          {`P₀ = ${(pitotData.totalPressure / 1000).toFixed(1)} kPa`}
        </Text>
        
        {/* 静压表 */}
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.02]} />
          <meshStandardMaterial color="#6666ff" />
        </mesh>
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.08}
          color="#6666ff"
          anchorX="center"
          anchorY="middle"
        >
          {`P = ${(pitotData.staticPressure / 1000).toFixed(1)} kPa`}
        </Text>
        
        {/* 压差显示 */}
        <Text
          position={[0, 0, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {`ΔP = ${pitotData.pressureDifference.toFixed(1)} Pa`}
        </Text>
      </group>
      
      {/* 标签 */}
      <Text
        position={[0, -0.4, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        皮托管
      </Text>
    </group>
  );
};

// 流线和驻点可视化
const FlowStreamlines: React.FC<{
  pitotPosition: THREE.Vector3;
  velocity: number;
  pitotAngle: number;
}> = ({ pitotPosition, velocity, pitotAngle }) => {
  const streamlineRef = useRef<THREE.Group>(null);
  
  // 创建流线
  const streamlines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    const angleRad = pitotAngle * Math.PI / 180;
    
    // 皮托管头部位置
    const pitotHeadX = pitotPosition.x + 0.6 * Math.sin(angleRad);
    const pitotHeadY = pitotPosition.y + 0.6 * Math.cos(angleRad);
    
    // 创建多条流线
    for (let i = -2; i <= 2; i += 0.3) {
      for (let j = -1; j <= 1; j += 0.5) {
        const line: THREE.Vector3[] = [];
        const startX = -3;
        const startY = i;
        const startZ = j;
        
        // 检查是否会撞到皮托管
        const distanceToTube = Math.sqrt((startY - pitotHeadY) ** 2 + (startZ - 0) ** 2);
        if (distanceToTube < 0.1) continue; // 跳过会撞到管子的流线
        
        const steps = 100;
        for (let k = 0; k <= steps; k++) {
          const t = k / steps;
          let x = startX + t * 6; // 流线长度
          let y = startY;
          let z = startZ;
          
          // 计算到皮托管头部的距离
          const dx = x - pitotHeadX;
          const dy = y - pitotHeadY;
          const dz = z - 0;
          const distance = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
          
          // 在皮托管附近偏转流线
          if (distance < 0.5 && dx < 0.1) {
            const influence = Math.exp(-distance * 5);
            const deflectionAngle = Math.atan2(dy, dx);
            
            y += Math.sin(deflectionAngle) * influence * 0.3;
            z += Math.cos(deflectionAngle) * influence * 0.1;
          }
          
          // 驻点效应：流线在皮托管头部前方汇聚
          if (Math.abs(dx) < 0.05 && distance < 0.1) {
            // 这是驻点，流线终止
            break;
          }
          
          line.push(new THREE.Vector3(x, y, z));
        }
        
        if (line.length > 10) { // 只保留足够长的流线
          lines.push(line);
        }
      }
    }
    
    return lines;
  }, [pitotPosition, pitotAngle]);
  
  return (
    <group ref={streamlineRef}>
      {streamlines.map((line, index) => (
        <line key={index}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={line.length}
              array={new Float32Array(line.flatMap(p => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color="#44ff44" 
            transparent 
            opacity={0.6} 
            linewidth={2}
          />
        </line>
      ))}
      
      {/* 驻点标记 */}
      <Sphere 
        args={[0.03]} 
        position={[
          pitotPosition.x + 0.6 * Math.sin(pitotAngle * Math.PI / 180), 
          pitotPosition.y + 0.6 * Math.cos(pitotAngle * Math.PI / 180), 
          0
        ]}
      >
        <meshBasicMaterial color="#ff0000" />
      </Sphere>
      
      <Text
        position={[
          pitotPosition.x + 0.6 * Math.sin(pitotAngle * Math.PI / 180) + 0.2, 
          pitotPosition.y + 0.6 * Math.cos(pitotAngle * Math.PI / 180), 
          0
        ]}
        fontSize={0.08}
        color="#ff0000"
        anchorX="left"
        anchorY="middle"
      >
        驻点
      </Text>
    </group>
  );
};

// 压力场可视化
const PressureField: React.FC<{
  pitotPosition: THREE.Vector3;
  pitotData: PitotTubeData;
  showField: boolean;
}> = ({ pitotPosition, pitotData, showField }) => {
  const fieldRef = useRef<THREE.Group>(null);
  
  if (!showField) return null;
  
  // 创建压力等值面
  const pressureContours = useMemo(() => {
    const contours: { position: THREE.Vector3; pressure: number; color: string }[] = [];
    
    // 在皮托管周围创建压力等值点
    for (let x = -2; x <= 2; x += 0.3) {
      for (let y = -2; y <= 2; y += 0.3) {
        for (let z = -1; z <= 1; z += 0.5) {
          const dx = x - pitotPosition.x;
          const dy = y - pitotPosition.y;
          const dz = z - pitotPosition.z;
          const distance = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
          
          // 跳过太靠近皮托管的点
          if (distance < 0.2) continue;
          
          // 计算该点的压力
          let localPressure = pitotData.staticPressure;
          
          // 在驻点附近压力增加
          if (distance < 1) {
            const stagnationEffect = Math.exp(-distance * 2);
            localPressure += pitotData.dynamicPressure * stagnationEffect;
          }
          
          // 根据压力选择颜色
          const pressureRatio = (localPressure - pitotData.staticPressure) / pitotData.dynamicPressure;
          const red = Math.min(255, Math.max(0, Math.floor(255 * pressureRatio)));
          const blue = Math.min(255, Math.max(0, Math.floor(255 * (1 - pressureRatio))));
          const color = `rgb(${red}, 100, ${blue})`;
          
          contours.push({
            position: new THREE.Vector3(x, y, z),
            pressure: localPressure,
            color
          });
        }
      }
    }
    
    return contours;
  }, [pitotPosition, pitotData]);
  
  return (
    <group ref={fieldRef}>
      {pressureContours.map((contour, index) => (
        <Sphere key={index} args={[0.05]} position={contour.position}>
          <meshBasicMaterial 
            color={contour.color}
            transparent
            opacity={0.6}
          />
        </Sphere>
      ))}
      
      {/* 压力图例 */}
      <group position={[2.5, 1, 0]}>
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          压力场
        </Text>
        
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <Text
          position={[0.2, 0.2, 0]}
          fontSize={0.08}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
        >
          高压
        </Text>
        
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#0000ff" />
        </mesh>
        <Text
          position={[0.2, 0, 0]}
          fontSize={0.08}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
        >
          低压
        </Text>
      </group>
    </group>
  );
};

// 流体粒子系统
const FlowParticles: React.FC<{
  count: number;
  velocity: number;
  pitotPosition: THREE.Vector3;
  pitotAngle: number;
}> = ({ count, velocity, pitotPosition, pitotAngle }) => {
  const particlesRef = useRef<THREE.Points>(null);
  
  // 初始化粒子数据
  const particleData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // 在上游区域随机分布
      positions[i3] = -3 + Math.random() * 1;        // x
      positions[i3 + 1] = -2 + Math.random() * 4;    // y
      positions[i3 + 2] = -1 + Math.random() * 2;    // z
      
      // 初始速度
      velocities[i3] = velocity;  // x方向
      velocities[i3 + 1] = 0;     // y方向
      velocities[i3 + 2] = 0;     // z方向
      
      // 初始颜色
      colors[i3] = 0.3;     // R
      colors[i3 + 1] = 0.6; // G
      colors[i3 + 2] = 1.0; // B
    }
    
    return { positions, velocities, colors };
  }, [count, velocity]);
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
    
    const angleRad = pitotAngle * Math.PI / 180;
    const pitotHeadX = pitotPosition.x + 0.6 * Math.sin(angleRad);
    const pitotHeadY = pitotPosition.y + 0.6 * Math.cos(angleRad);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      // 计算到皮托管头部的距离
      const dx = x - pitotHeadX;
      const dy = y - pitotHeadY;
      const dz = z - 0;
      const distance = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
      
      // 皮托管影响
      if (distance < 0.3 && dx < 0) {
        // 粒子接近皮托管，减速并偏转
        const influence = (0.3 - distance) / 0.3;
        particleData.velocities[i3] *= (1 - influence * 0.8);
        particleData.velocities[i3 + 1] += Math.sign(dy) * influence * velocity * 0.3;
        particleData.velocities[i3 + 2] += Math.sign(dz) * influence * velocity * 0.1;
        
        // 改变颜色表示受到影响
        colors[i3] = 1.0;     // R
        colors[i3 + 1] = 0.5; // G
        colors[i3 + 2] = 0.3; // B
      } else {
        // 恢复正常流动
        particleData.velocities[i3] = velocity;
        particleData.velocities[i3 + 1] *= 0.95;
        particleData.velocities[i3 + 2] *= 0.95;
        
        colors[i3] = 0.3;
        colors[i3 + 1] = 0.6;
        colors[i3 + 2] = 1.0;
      }
      
      // 更新位置
      positions[i3] += particleData.velocities[i3] * delta;
      positions[i3 + 1] += particleData.velocities[i3 + 1] * delta;
      positions[i3 + 2] += particleData.velocities[i3 + 2] * delta;
      
      // 重置出界粒子
      if (positions[i3] > 3 || Math.abs(positions[i3 + 1]) > 3) {
        positions[i3] = -3 + Math.random() * 1;
        positions[i3 + 1] = -2 + Math.random() * 4;
        positions[i3 + 2] = -1 + Math.random() * 2;
        
        particleData.velocities[i3] = velocity;
        particleData.velocities[i3 + 1] = 0;
        particleData.velocities[i3 + 2] = 0;
        
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
        size={0.03}
        vertexColors
        transparent
        opacity={0.8}
      />
    </points>
  );
};

// 主仿真场景
const PitotTubeScene: React.FC<Omit<PitotTubeSimulationProps, 'className' | 'autoRotate'>> = ({
  flowVelocity = 50,
  fluidDensity = 1.225,
  staticPressure = 101325,
  tubeAngle = 0,
  showPressureField = false
}) => {
  const { camera } = useThree();
  
  // 设置相机位置
  useEffect(() => {
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  // 计算皮托管数据
  const pitotData = useMemo(() => {
    return calculatePitotTubeData(flowVelocity, fluidDensity, staticPressure);
  }, [flowVelocity, fluidDensity, staticPressure]);
  
  const pitotPosition = new THREE.Vector3(0, 0, 0);
  
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
      
      {/* 皮托管 */}
      <PitotTubeGeometry 
        angle={tubeAngle}
        position={pitotPosition}
        pitotData={pitotData}
      />
      
      {/* 流体粒子 */}
      <FlowParticles 
        count={1500}
        velocity={flowVelocity * 0.1} // 缩放显示
        pitotPosition={pitotPosition}
        pitotAngle={tubeAngle}
      />
      
      {/* 流线 */}
      <FlowStreamlines 
        pitotPosition={pitotPosition}
        velocity={flowVelocity}
        pitotAngle={tubeAngle}
      />
      
      {/* 压力场 */}
      <PressureField 
        pitotPosition={pitotPosition}
        pitotData={pitotData}
        showField={showPressureField}
      />
      
      {/* 标题和信息 */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        皮托管测速实验
      </Text>
      
      <Text
        position={[0, -2.5, 0]}
        fontSize={0.12}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
      >
        {`实际速度: ${flowVelocity.toFixed(1)} m/s | 测量速度: ${pitotData.measuredVelocity.toFixed(1)} m/s | 马赫数: ${pitotData.machNumber.toFixed(3)}`}
      </Text>
      
      {/* 流向指示 */}
      <group position={[-2.5, -2, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <Cone position={[0.25, 0, 0]} args={[0.05, 0.1]} rotation={[0, 0, -Math.PI / 2]}>
          <meshBasicMaterial color="#ffffff" />
        </Cone>
        <Text
          position={[0.4, 0, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
        >
          {`V = ${flowVelocity} m/s`}
        </Text>
      </group>
    </>
  );
};

// 主组件
const PitotTubeSimulation: React.FC<PitotTubeSimulationProps> = ({
  flowVelocity = 50,
  fluidDensity = 1.225,
  staticPressure = 101325,
  tubeAngle = 0,
  showPressureField = false,
  className = '',
  autoRotate = false
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas shadows camera={{ position: [0, 3, 5], fov: 60 }}>
        <color attach="background" args={['#001122']} />
        
        <PitotTubeScene
          flowVelocity={flowVelocity}
          fluidDensity={fluidDensity}
          staticPressure={staticPressure}
          tubeAngle={tubeAngle}
          showPressureField={showPressureField}
        />
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1}
          minDistance={3}
          maxDistance={15}
        />
      </Canvas>
    </div>
  );
};

export default PitotTubeSimulation; 