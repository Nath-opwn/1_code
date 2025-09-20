import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Sphere, Cone } from '@react-three/drei';
import * as THREE from 'three';

// 阻力系数实验接口
interface DragCoefficientSimulationProps {
  objectShape?: 'sphere' | 'cylinder' | 'cube' | 'streamlined';
  objectSize?: number;          // 物体特征尺寸 (m)
  flowVelocity?: number;        // 流速 (m/s)
  fluidDensity?: number;        // 流体密度 (kg/m³)
  fluidViscosity?: number;      // 流体粘度 (Pa·s)
  className?: string;
  autoRotate?: boolean;
}

// 阻力数据接口
interface DragData {
  reynoldsNumber: number;       // 雷诺数
  dragCoefficient: number;      // 阻力系数
  dragForce: number;           // 阻力 (N)
  frontalArea: number;         // 正面投影面积 (m²)
  wakeWidth: number;           // 尾流宽度
  separationAngle: number;     // 分离角
  flowRegime: string;          // 流动状态
}

// 计算阻力系数和相关参数
const calculateDragData = (
  shape: string,
  size: number,
  velocity: number,
  density: number,
  viscosity: number
): DragData => {
  // 计算特征长度和面积
  let characteristicLength: number;
  let frontalArea: number;
  
  switch (shape) {
    case 'sphere':
      characteristicLength = size; // 直径
      frontalArea = Math.PI * (size / 2) ** 2; // π * r²
      break;
    case 'cylinder':
      characteristicLength = size; // 直径
      frontalArea = size * size; // 假设单位长度
      break;
    case 'cube':
      characteristicLength = size; // 边长
      frontalArea = size ** 2;
      break;
    case 'streamlined':
      characteristicLength = size; // 长度
      frontalArea = Math.PI * (size / 4) ** 2; // 假设椭圆形截面
      break;
    default:
      characteristicLength = size;
      frontalArea = size ** 2;
  }
  
  // 计算雷诺数
  const reynoldsNumber = (density * velocity * characteristicLength) / viscosity;
  
  // 根据形状和雷诺数确定阻力系数
  let dragCoefficient: number;
  let separationAngle: number;
  let flowRegime: string;
  
  switch (shape) {
    case 'sphere':
      if (reynoldsNumber < 1) {
        dragCoefficient = 24 / reynoldsNumber; // Stokes流
        flowRegime = 'Stokes流';
        separationAngle = 180;
      } else if (reynoldsNumber < 1000) {
        dragCoefficient = 24 / reynoldsNumber + 6 / (1 + Math.sqrt(reynoldsNumber)) + 0.4;
        flowRegime = '中等雷诺数';
        separationAngle = 120;
      } else if (reynoldsNumber < 300000) {
        dragCoefficient = 0.47; // 亚临界区
        flowRegime = '亚临界';
        separationAngle = 82;
      } else {
        dragCoefficient = 0.18; // 超临界区
        flowRegime = '超临界';
        separationAngle = 120;
      }
      break;
      
    case 'cylinder':
      if (reynoldsNumber < 1) {
        dragCoefficient = 8 * Math.PI / (reynoldsNumber * (2 - Math.log(reynoldsNumber)));
        flowRegime = 'Stokes流';
        separationAngle = 180;
      } else if (reynoldsNumber < 40) {
        dragCoefficient = 1.2;
        flowRegime = '稳定分离';
        separationAngle = 90;
      } else if (reynoldsNumber < 200000) {
        dragCoefficient = 1.2; // 亚临界区
        flowRegime = '卡门涡街';
        separationAngle = 82;
      } else {
        dragCoefficient = 0.3; // 超临界区
        flowRegime = '超临界';
        separationAngle = 120;
      }
      break;
      
    case 'cube':
      dragCoefficient = 1.05; // 正方形截面
      flowRegime = '分离流';
      separationAngle = 90;
      break;
      
    case 'streamlined':
      dragCoefficient = 0.04; // 流线型
      flowRegime = '附着流';
      separationAngle = 160;
      break;
      
    default:
      dragCoefficient = 1.0;
      flowRegime = '未知';
      separationAngle = 90;
  }
  
  // 计算阻力
  const dragForce = 0.5 * density * velocity ** 2 * frontalArea * dragCoefficient;
  
  // 尾流宽度估算
  const wakeWidth = size * (1 + Math.sin((180 - separationAngle) * Math.PI / 180));
  
  return {
    reynoldsNumber,
    dragCoefficient,
    dragForce,
    frontalArea,
    wakeWidth,
    separationAngle,
    flowRegime
  };
};

// 物体几何组件
const TestObject: React.FC<{
  shape: string;
  size: number;
  position: THREE.Vector3;
  dragForce: number;
}> = ({ shape, size, position, dragForce }) => {
  const objectRef = useRef<THREE.Group>(null);
  
  // 根据阻力添加轻微振动
  useFrame((state) => {
    if (objectRef.current) {
      const vibration = dragForce * 0.0001;
      objectRef.current.position.x = position.x + Math.sin(state.clock.elapsedTime * 10) * vibration;
    }
  });
  
  const renderObject = () => {
    switch (shape) {
      case 'sphere':
        return (
          <Sphere args={[size / 2]} castShadow>
            <meshStandardMaterial 
              color="#ff6b6b"
              metalness={0.3}
              roughness={0.4}
            />
          </Sphere>
        );
      case 'cylinder':
        return (
          <Cylinder args={[size / 2, size / 2, size]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <meshStandardMaterial 
              color="#4ecdc4"
              metalness={0.3}
              roughness={0.4}
            />
          </Cylinder>
        );
      case 'cube':
        return (
          <Box args={[size, size, size]} castShadow>
            <meshStandardMaterial 
              color="#45b7d1"
              metalness={0.3}
              roughness={0.4}
            />
          </Box>
        );
      case 'streamlined':
        return (
          <group>
            {/* 简化的流线型：椭球体 */}
            <mesh scale={[2, 1, 1]} castShadow>
              <sphereGeometry args={[size / 2]} />
              <meshStandardMaterial 
                color="#f39c12"
                metalness={0.3}
                roughness={0.4}
              />
            </mesh>
          </group>
        );
      default:
        return (
          <Box args={[size, size, size]} castShadow>
            <meshStandardMaterial color="#666666" />
          </Box>
        );
    }
  };
  
  return (
    <group ref={objectRef} position={position}>
      {renderObject()}
      
      {/* 物体标签 */}
      <Text
        position={[0, size + 0.3, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {shape === 'sphere' ? '球体' :
         shape === 'cylinder' ? '圆柱' :
         shape === 'cube' ? '立方体' : '流线型'}
      </Text>
      
      {/* 阻力矢量 */}
      <group position={[size / 2, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, dragForce * 0.1]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <Cone position={[dragForce * 0.05, 0, 0]} args={[0.05, 0.1]} rotation={[0, 0, -Math.PI / 2]}>
          <meshBasicMaterial color="#ff0000" />
        </Cone>
        
        <Text
          position={[dragForce * 0.08, 0.15, 0]}
          fontSize={0.08}
          color="#ff0000"
          anchorX="center"
          anchorY="middle"
        >
          {`F_D = ${dragForce.toFixed(2)} N`}
        </Text>
      </group>
    </group>
  );
};

// 流场粒子系统
const FlowField: React.FC<{
  count: number;
  velocity: number;
  objectShape: string;
  objectSize: number;
  objectPosition: THREE.Vector3;
  dragData: DragData;
}> = ({ count, velocity, objectShape, objectSize, objectPosition, dragData }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const [time, setTime] = useState(0);
  
  // 初始化粒子数据
  const particleData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // 在上游区域随机分布
      positions[i3] = -4 + Math.random() * 2;        // x
      positions[i3 + 1] = -2 + Math.random() * 4;    // y
      positions[i3 + 2] = -1 + Math.random() * 2;    // z
      
      // 初始速度
      velocities[i3] = velocity;  // x方向
      velocities[i3 + 1] = 0;     // y方向
      velocities[i3 + 2] = 0;     // z方向
      
      // 初始颜色（蓝色表示高速）
      colors[i3] = 0.3;     // R
      colors[i3 + 1] = 0.6; // G
      colors[i3 + 2] = 1.0; // B
    }
    
    return { positions, velocities, colors };
  }, [count, velocity]);
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    setTime(prev => prev + delta);
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      // 检查是否接近物体
      const dx = x - objectPosition.x;
      const dy = y - objectPosition.y;
      const dz = z - objectPosition.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // 物体影响半径
      const influenceRadius = objectSize;
      
      if (distance < influenceRadius && dx < 0) {
        // 粒子接近物体前方，绕流
        const angle = Math.atan2(dy, dx);
        const deflection = (influenceRadius - distance) / influenceRadius;
        
        particleData.velocities[i3] = velocity * (1 - deflection * 0.5);
        particleData.velocities[i3 + 1] = velocity * deflection * Math.sin(angle) * 2;
        particleData.velocities[i3 + 2] = velocity * deflection * Math.sin(angle) * 0.5;
        
        // 改变颜色表示受到影响
        colors[i3] = 1.0;     // R
        colors[i3 + 1] = 0.5; // G
        colors[i3 + 2] = 0.3; // B
      } else if (dx > 0 && Math.abs(dy) < dragData.wakeWidth && Math.abs(dz) < objectSize) {
        // 粒子在尾流区域
        const wakeIntensity = 1 - Math.abs(dy) / dragData.wakeWidth;
        
        // 尾流中的速度减小和扰动
        particleData.velocities[i3] = velocity * (0.3 + 0.4 * (1 - wakeIntensity));
        particleData.velocities[i3 + 1] += (Math.random() - 0.5) * wakeIntensity * velocity * 0.3;
        particleData.velocities[i3 + 2] += (Math.random() - 0.5) * wakeIntensity * velocity * 0.2;
        
        // 尾流颜色（红色表示低速）
        colors[i3] = 0.8 + 0.2 * wakeIntensity;     // R
        colors[i3 + 1] = 0.2;                       // G
        colors[i3 + 2] = 0.2;                       // B
      } else {
        // 自由流区域
        particleData.velocities[i3] = velocity;
        particleData.velocities[i3 + 1] *= 0.98; // 逐渐衰减横向速度
        particleData.velocities[i3 + 2] *= 0.98;
        
        // 恢复原始颜色
        colors[i3] = 0.3;
        colors[i3 + 1] = 0.6;
        colors[i3 + 2] = 1.0;
      }
      
      // 更新位置
      positions[i3] += particleData.velocities[i3] * delta;
      positions[i3 + 1] += particleData.velocities[i3 + 1] * delta;
      positions[i3 + 2] += particleData.velocities[i3 + 2] * delta;
      
      // 重置出界粒子
      if (positions[i3] > 4 || positions[i3 + 1] > 3 || positions[i3 + 1] < -3) {
        positions[i3] = -4 + Math.random() * 2;
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

// 流线可视化
const Streamlines: React.FC<{
  objectPosition: THREE.Vector3;
  objectSize: number;
  velocity: number;
  dragData: DragData;
}> = ({ objectPosition, objectSize, velocity, dragData }) => {
  const streamlineRef = useRef<THREE.Group>(null);
  
  // 创建流线
  const streamlines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    const startX = -3;
    const endX = 3;
    
    // 创建多条流线
    for (let i = -3; i <= 3; i += 0.5) {
      if (Math.abs(i) < objectSize * 0.6) continue; // 避开物体
      
      const line: THREE.Vector3[] = [];
      const steps = 100;
      
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const x = startX + t * (endX - startX);
        let y = i;
        
        // 在物体附近偏转流线
        const dx = x - objectPosition.x;
        const dy = y - objectPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < objectSize * 2 && dx < 0) {
          // 物体前方的偏转
          const deflection = Math.exp(-distance / objectSize) * objectSize;
          y += Math.sign(dy) * deflection * Math.sin(Math.PI * t);
        } else if (dx > 0 && Math.abs(dy) < dragData.wakeWidth) {
          // 尾流区域的扰动
          y += Math.sin(x * 2) * 0.1 * (1 - Math.abs(dy) / dragData.wakeWidth);
        }
        
        line.push(new THREE.Vector3(x, y, 0));
      }
      
      lines.push(line);
    }
    
    return lines;
  }, [objectPosition, objectSize, dragData]);
  
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
          <lineBasicMaterial color="#44ff44" transparent opacity={0.6} />
        </line>
      ))}
    </group>
  );
};

// 主仿真场景
const DragCoefficientScene: React.FC<Omit<DragCoefficientSimulationProps, 'className' | 'autoRotate'>> = ({
  objectShape = 'sphere',
  objectSize = 0.5,
  flowVelocity = 2.0,
  fluidDensity = 1.225,
  fluidViscosity = 0.0000181
}) => {
  const { camera } = useThree();
  
  // 设置相机位置
  useEffect(() => {
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  // 计算阻力数据
  const dragData = useMemo(() => {
    return calculateDragData(objectShape, objectSize, flowVelocity, fluidDensity, fluidViscosity);
  }, [objectShape, objectSize, flowVelocity, fluidDensity, fluidViscosity]);
  
  const objectPosition = new THREE.Vector3(0, 0, 0);
  
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
      
      {/* 测试物体 */}
      <TestObject 
        shape={objectShape}
        size={objectSize}
        position={objectPosition}
        dragForce={dragData.dragForce}
      />
      
      {/* 流场粒子 */}
      <FlowField 
        count={2000}
        velocity={flowVelocity}
        objectShape={objectShape}
        objectSize={objectSize}
        objectPosition={objectPosition}
        dragData={dragData}
      />
      
      {/* 流线 */}
      <Streamlines 
        objectPosition={objectPosition}
        objectSize={objectSize}
        velocity={flowVelocity}
        dragData={dragData}
      />
      
      {/* 标题和信息 */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        阻力系数实验
      </Text>
      
      <Text
        position={[0, -2.5, 0]}
        fontSize={0.12}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
      >
        {`Re = ${dragData.reynoldsNumber.toFixed(0)} | Cd = ${dragData.dragCoefficient.toFixed(3)} | ${dragData.flowRegime}`}
      </Text>
      
      {/* 坐标轴和流向指示 */}
      <group position={[-3, -2, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 1]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <Cone position={[0.5, 0, 0]} args={[0.05, 0.1]} rotation={[0, 0, -Math.PI / 2]}>
          <meshBasicMaterial color="#ffffff" />
        </Cone>
        <Text
          position={[0.7, 0, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
        >
          流向
        </Text>
      </group>
    </>
  );
};

// 主组件
const DragCoefficientSimulation: React.FC<DragCoefficientSimulationProps> = ({
  objectShape = 'sphere',
  objectSize = 0.5,
  flowVelocity = 2.0,
  fluidDensity = 1.225,
  fluidViscosity = 0.0000181,
  className = '',
  autoRotate = false
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas shadows camera={{ position: [0, 3, 5], fov: 60 }}>
        <color attach="background" args={['#001122']} />
        
        <DragCoefficientScene
          objectShape={objectShape}
          objectSize={objectSize}
          flowVelocity={flowVelocity}
          fluidDensity={fluidDensity}
          fluidViscosity={fluidViscosity}
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

export default DragCoefficientSimulation; 