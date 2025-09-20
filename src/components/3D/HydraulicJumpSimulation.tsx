import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Plane } from '@react-three/drei';
import * as THREE from 'three';

// 水跃实验接口
interface HydraulicJumpSimulationProps {
  inletVelocity?: number;     // 入口流速 (m/s)
  inletDepth?: number;        // 入口水深 (m)
  channelWidth?: number;      // 渠道宽度 (m)
  gravity?: number;           // 重力加速度 (m/s²)
  className?: string;
  autoRotate?: boolean;
}

// 水跃参数接口
interface HydraulicJumpData {
  froudeNumber1: number;      // 上游弗劳德数
  froudeNumber2: number;      // 下游弗劳德数
  conjugateDepth: number;     // 共轭水深
  energyLoss: number;         // 能量损失
  jumpLength: number;         // 水跃长度
  jumpType: string;           // 水跃类型
}

// 水跃计算
const calculateHydraulicJump = (
  velocity1: number,
  depth1: number,
  gravity: number
): HydraulicJumpData => {
  // 弗劳德数计算: Fr = v/√(gh)
  const froudeNumber1 = velocity1 / Math.sqrt(gravity * depth1);
  
  // 共轭水深计算 (Belanger方程)
  // h2/h1 = 0.5 * (-1 + √(1 + 8*Fr1²))
  const ratio = 0.5 * (-1 + Math.sqrt(1 + 8 * froudeNumber1 ** 2));
  const conjugateDepth = depth1 * ratio;
  
  // 下游流速 (连续性方程)
  const velocity2 = velocity1 * depth1 / conjugateDepth;
  const froudeNumber2 = velocity2 / Math.sqrt(gravity * conjugateDepth);
  
  // 能量损失
  const E1 = depth1 + velocity1 ** 2 / (2 * gravity);
  const E2 = conjugateDepth + velocity2 ** 2 / (2 * gravity);
  const energyLoss = E1 - E2;
  
  // 水跃长度 (经验公式)
  const jumpLength = 6 * (conjugateDepth - depth1);
  
  // 水跃类型判断
  let jumpType;
  if (froudeNumber1 < 1) {
    jumpType = "亚临界流 (无水跃)";
  } else if (froudeNumber1 < 1.7) {
    jumpType = "波状水跃";
  } else if (froudeNumber1 < 2.5) {
    jumpType = "弱水跃";
  } else if (froudeNumber1 < 4.5) {
    jumpType = "振荡水跃";
  } else if (froudeNumber1 < 9.0) {
    jumpType = "稳定水跃";
  } else {
    jumpType = "强水跃";
  }
  
  return {
    froudeNumber1,
    froudeNumber2,
    conjugateDepth,
    energyLoss,
    jumpLength,
    jumpType
  };
};

// 水面形状生成
const generateWaterSurface = (
  length: number,
  width: number,
  depth1: number,
  depth2: number,
  jumpLength: number,
  jumpStart: number
) => {
  const geometry = new THREE.PlaneGeometry(length, width, 50, 20);
  const vertices = geometry.attributes.position.array as Float32Array;
  
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const y = vertices[i + 1];
    
    // x坐标转换为沿水流方向的位置
    const position = x + length / 2;
    
    let height;
    if (position < jumpStart) {
      // 上游段：恒定深度
      height = depth1 / 2;
    } else if (position < jumpStart + jumpLength) {
      // 水跃段：平滑过渡
      const t = (position - jumpStart) / jumpLength;
      // 使用三次样条插值创建平滑的水面形状
      const smoothT = 3 * t ** 2 - 2 * t ** 3;
      height = depth1 / 2 + (depth2 - depth1) / 2 * smoothT;
      
      // 添加湍流波动
      const turbulence = Math.sin(t * Math.PI * 4) * 0.1 * (depth2 - depth1) * (1 - smoothT);
      height += turbulence;
    } else {
      // 下游段：恒定深度
      height = depth2 / 2;
    }
    
    vertices[i + 2] = height;
  }
  
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
  
  return geometry;
};

// 流体粒子组件
const FlowParticles: React.FC<{
  count: number;
  velocity1: number;
  depth1: number;
  depth2: number;
  jumpStart: number;
  jumpLength: number;
  channelWidth: number;
}> = ({ count, velocity1, depth1, depth2, jumpStart, jumpLength, channelWidth }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [time, setTime] = useState(0);

  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // 在上游区域随机分布
      positions[i3] = -15 + Math.random() * 5;  // x: 上游入口
      positions[i3 + 1] = (Math.random() - 0.5) * channelWidth * 0.8; // y: 渠道宽度内
      positions[i3 + 2] = Math.random() * depth1; // z: 水深范围内

      // 初始速度
      velocities[i3] = velocity1 + (Math.random() - 0.5) * 0.5;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      // 根据深度设置颜色
      const normalizedDepth = positions[i3 + 2] / Math.max(depth1, depth2);
      colors[i3] = 0.2 + normalizedDepth * 0.3;     // R
      colors[i3 + 1] = 0.5 + normalizedDepth * 0.4; // G
      colors[i3 + 2] = 0.8 + normalizedDepth * 0.2; // B
    }

    return { positions, velocities, colors };
  }, [count, velocity1, depth1, depth2, channelWidth]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    setTime(prev => prev + delta);
    
    const tempObject = new THREE.Object3D();
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];

      // 计算当前位置的水深和流速
      let currentDepth, currentVelocity;
      
      if (x < jumpStart) {
        // 上游段
        currentDepth = depth1;
        currentVelocity = velocity1;
      } else if (x < jumpStart + jumpLength) {
        // 水跃段
        const t = (x - jumpStart) / jumpLength;
        const smoothT = 3 * t ** 2 - 2 * t ** 3;
        currentDepth = depth1 + (depth2 - depth1) * smoothT;
        currentVelocity = velocity1 * depth1 / currentDepth; // 连续性方程
        
        // 水跃区域的湍流效应
        velocities[i3 + 1] += (Math.random() - 0.5) * 2.0 * delta;
        velocities[i3 + 2] += (Math.random() - 0.5) * 1.0 * delta;
      } else {
        // 下游段
        currentDepth = depth2;
        currentVelocity = velocity1 * depth1 / depth2;
      }

      // 更新速度
      velocities[i3] = currentVelocity + (Math.random() - 0.5) * 0.3;
      
      // 限制粒子在水深范围内
      if (z > currentDepth) {
        positions[i3 + 2] = currentDepth * 0.9;
        velocities[i3 + 2] = -Math.abs(velocities[i3 + 2]);
      } else if (z < 0) {
        positions[i3 + 2] = 0.1;
        velocities[i3 + 2] = Math.abs(velocities[i3 + 2]);
      }

      // 限制在渠道宽度内
      if (Math.abs(y) > channelWidth / 2) {
        positions[i3 + 1] = Math.sign(y) * channelWidth / 2 * 0.9;
        velocities[i3 + 1] = -velocities[i3 + 1] * 0.5;
      }

      // 更新位置
      positions[i3] += velocities[i3] * delta * 2;
      positions[i3 + 1] += velocities[i3 + 1] * delta;
      positions[i3 + 2] += velocities[i3 + 2] * delta;

      // 重置离开渠道的粒子
      if (x > 15) {
        positions[i3] = -15 + Math.random() * 5;
        positions[i3 + 1] = (Math.random() - 0.5) * channelWidth * 0.8;
        positions[i3 + 2] = Math.random() * depth1;
        velocities[i3] = velocity1 + (Math.random() - 0.5) * 0.5;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
      }

      // 更新颜色（基于湍流强度）
      const turbulenceIntensity = Math.sqrt(
        velocities[i3 + 1] ** 2 + velocities[i3 + 2] ** 2
      ) / 2;
      const normalizedTurbulence = Math.min(turbulenceIntensity, 1);
      
      colors[i3] = 0.2 + normalizedTurbulence * 0.6;
      colors[i3 + 1] = 0.5 + normalizedTurbulence * 0.3;
      colors[i3 + 2] = 0.8 - normalizedTurbulence * 0.3;

      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.6} />
    </instancedMesh>
  );
};

// 渠道组件
const Channel: React.FC<{
  length: number;
  width: number;
  depth1: number;
  depth2: number;
  jumpStart: number;
  jumpLength: number;
}> = ({ length, width, depth1, depth2, jumpStart, jumpLength }) => {
  const waterGeometry = useMemo(() => 
    generateWaterSurface(length, width, depth1, depth2, jumpLength, jumpStart),
    [length, width, depth1, depth2, jumpLength, jumpStart]
  );

  return (
    <>
      {/* 渠道底部 */}
      <Box args={[length, width, 0.2]} position={[0, 0, -0.1]}>
        <meshStandardMaterial color="#8B4513" />
      </Box>
      
      {/* 渠道侧壁 */}
      <Box args={[length, 0.2, Math.max(depth1, depth2) + 1]} 
           position={[0, width/2 + 0.1, Math.max(depth1, depth2) / 2]}>
        <meshStandardMaterial color="#696969" transparent opacity={0.3} />
      </Box>
      
      <Box args={[length, 0.2, Math.max(depth1, depth2) + 1]} 
           position={[0, -width/2 - 0.1, Math.max(depth1, depth2) / 2]}>
        <meshStandardMaterial color="#696969" transparent opacity={0.3} />
      </Box>
      
      {/* 水面 */}
      <primitive object={new THREE.Mesh(waterGeometry)}>
        <meshStandardMaterial 
          color="#4A90E2" 
          transparent 
          opacity={0.7}
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.1}
        />
      </primitive>
    </>
  );
};

// 测量设备组件
const MeasurementDevices: React.FC<{
  jumpData: HydraulicJumpData;
  depth1: number;
  jumpStart: number;
  jumpLength: number;
}> = ({ jumpData, depth1, jumpStart, jumpLength }) => {
  return (
    <>
      {/* 上游测量点 */}
      <group position={[jumpStart - 3, 0, depth1 + 0.5]}>
        <Cylinder args={[0.1, 0.1, 1, 8]}>
          <meshStandardMaterial color="#FF6B6B" />
        </Cylinder>
        <Text
          position={[0, 0, 1]}
          fontSize={0.3}
          color="#FF6B6B"
          anchorX="center"
          anchorY="middle"
        >
          上游
        </Text>
        <Text
          position={[0, 0, 0.5]}
          fontSize={0.2}
          color="#34495e"
          anchorX="center"
          anchorY="middle"
        >
          {`Fr₁ = ${jumpData.froudeNumber1.toFixed(2)}`}
        </Text>
      </group>

      {/* 下游测量点 */}
      <group position={[jumpStart + jumpLength + 3, 0, jumpData.conjugateDepth + 0.5]}>
        <Cylinder args={[0.1, 0.1, 1, 8]}>
          <meshStandardMaterial color="#4ECDC4" />
        </Cylinder>
        <Text
          position={[0, 0, 1]}
          fontSize={0.3}
          color="#4ECDC4"
          anchorX="center"
          anchorY="middle"
        >
          下游
        </Text>
        <Text
          position={[0, 0, 0.5]}
          fontSize={0.2}
          color="#34495e"
          anchorX="center"
          anchorY="middle"
        >
          {`Fr₂ = ${jumpData.froudeNumber2.toFixed(2)}`}
        </Text>
      </group>

      {/* 水跃长度标记 */}
      <group position={[jumpStart + jumpLength/2, 0, Math.max(depth1, jumpData.conjugateDepth) + 1.5]}>
        <Box args={[jumpLength, 0.05, 0.05]}>
          <meshStandardMaterial color="#F39C12" />
        </Box>
        <Text
          position={[0, 0, 0.5]}
          fontSize={0.25}
          color="#F39C12"
          anchorX="center"
          anchorY="middle"
        >
          {`水跃长度: ${jumpData.jumpLength.toFixed(1)}m`}
        </Text>
      </group>
    </>
  );
};

// 主仿真场景
const HydraulicJumpScene: React.FC<Omit<HydraulicJumpSimulationProps, 'className' | 'autoRotate'>> = ({
  inletVelocity = 4.0,
  inletDepth = 0.5,
  channelWidth = 4.0,
  gravity = 9.81
}) => {
  const { camera } = useThree();

  // 设置相机位置
  useEffect(() => {
    camera.position.set(0, 8, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // 计算水跃参数
  const jumpData = useMemo(() => {
    return calculateHydraulicJump(inletVelocity, inletDepth, gravity);
  }, [inletVelocity, inletDepth, gravity]);

  const jumpStart = -2; // 水跃开始位置

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
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
      
      {/* 渠道 */}
      <Channel 
        length={30}
        width={channelWidth}
        depth1={inletDepth}
        depth2={jumpData.conjugateDepth}
        jumpStart={jumpStart}
        jumpLength={jumpData.jumpLength}
      />
      
      {/* 流体粒子 */}
      <FlowParticles 
        count={4000}
        velocity1={inletVelocity}
        depth1={inletDepth}
        depth2={jumpData.conjugateDepth}
        jumpStart={jumpStart}
        jumpLength={jumpData.jumpLength}
        channelWidth={channelWidth}
      />
      
      {/* 测量设备 */}
      <MeasurementDevices 
        jumpData={jumpData}
        depth1={inletDepth}
        jumpStart={jumpStart}
        jumpLength={jumpData.jumpLength}
      />
      
      {/* 标题 */}
      <Text
        position={[0, 0, 8]}
        fontSize={0.6}
        color="#2C3E50"
        anchorX="center"
        anchorY="middle"
      >
        水跃综合实验
      </Text>
      
      {/* 水跃类型显示 */}
      <Text
        position={[0, 0, 6.5]}
        fontSize={0.4}
        color="#E74C3C"
        anchorX="center"
        anchorY="middle"
      >
        {jumpData.jumpType}
      </Text>
      
      {/* 能量损失显示 */}
      <Text
        position={[0, 0, 5.5]}
        fontSize={0.3}
        color="#7F8C8D"
        anchorX="center"
        anchorY="middle"
      >
        {`能量损失: ${jumpData.energyLoss.toFixed(3)} m`}
      </Text>
      
      {/* 公式显示 */}
      <Text
        position={[-8, 0, 4]}
        fontSize={0.25}
        color="#34495E"
        anchorX="center"
        anchorY="middle"
      >
        {`Fr = v/√(gh)\nh₂/h₁ = 0.5(-1+√(1+8Fr₁²))`}
      </Text>
    </>
  );
};

// 主组件
const HydraulicJumpSimulation: React.FC<HydraulicJumpSimulationProps> = ({
  className = '',
  autoRotate = true,
  ...props
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 8, 10], fov: 60 }}
        style={{ background: 'linear-gradient(to bottom, #87CEEB, #E0F6FF)' }}
      >
        <HydraulicJumpScene {...props} />
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

export default HydraulicJumpSimulation; 