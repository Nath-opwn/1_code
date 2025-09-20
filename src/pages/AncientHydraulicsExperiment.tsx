import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, Play, Pause, RotateCcw, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 真实的水力学计算
const calculateFlow = (flowRate: number, channelWidth: number, channelDepth: number) => {
  const crossSectionArea = channelWidth * channelDepth;
  const velocity = flowRate / crossSectionArea; // m/s
  const hydraulicRadius = crossSectionArea / (channelWidth + 2 * channelDepth);
  const reynoldsNumber = velocity * hydraulicRadius * 1000 / 0.001; // Re = ρvR/μ
  return { velocity, hydraulicRadius, reynoldsNumber, crossSectionArea };
};

// 基于Manning公式计算流速
const calculateManningVelocity = (hydraulicRadius: number, slope: number, roughness: number) => {
  return (1 / roughness) * Math.pow(hydraulicRadius, 2/3) * Math.pow(slope, 0.5);
};

// 计算沉降速度（Stokes定律）
const calculateSettlingVelocity = (particleSize: number, particleDensity: number, fluidDensity: number, viscosity: number) => {
  const g = 9.81;
  return (2 * g * Math.pow(particleSize, 2) * (particleDensity - fluidDensity)) / (18 * viscosity);
};

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  type: 'water' | 'sediment' | 'floating';
  age: number;
  settled: boolean;
}

const WaterFlowSimulation: React.FC<{
  flowRate: number;
  channelSlope: number;
  fishMouthAngle: number;
  weirHeight: number;
  isRunning: boolean;
  showVectors: boolean;
}> = ({ flowRate, channelSlope, fishMouthAngle, weirHeight, isRunning, showVectors }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const arrowsRef = useRef<THREE.Group>(null);
  
  const particles = useMemo(() => {
    const particleArray: Particle[] = [];
    
    // 主河道水流粒子
    for (let i = 0; i < 200; i++) {
      particleArray.push({
        position: new THREE.Vector3(
          Math.random() * 20 - 10,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        ),
        velocity: new THREE.Vector3(
          2 + Math.random() * flowRate * 0.1,
          0,
          0
        ),
        size: 0.1 + Math.random() * 0.05,
        type: 'water',
        age: 0,
        settled: false
      });
    }
    
    // 泥沙粒子
    for (let i = 0; i < 100; i++) {
      const particleSize = 0.001 + Math.random() * 0.005; // 1-6mm
      const settlingVel = calculateSettlingVelocity(particleSize, 2650, 1000, 0.001);
      
      particleArray.push({
        position: new THREE.Vector3(
          Math.random() * 20 - 10,
          -0.8 + Math.random() * 0.5,
          Math.random() * 2 - 1
        ),
        velocity: new THREE.Vector3(
          1 + Math.random() * flowRate * 0.05,
          -settlingVel * 100, // 放大效果
          0
        ),
        size: particleSize * 1000, // 放大显示
        type: 'sediment',
        age: 0,
        settled: false
      });
    }
    
    return particleArray;
  }, [flowRate]);

  useFrame((state, delta) => {
    if (!isRunning || !particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
    
    particles.forEach((particle, i) => {
      if (particle.settled) return;
      
      // 更新粒子位置
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));
      particle.age += delta;
      
      // 边界条件处理
      if (particle.position.x > 10) {
        particle.position.x = -10;
        particle.age = 0;
      }
      
      // 鱼嘴分流计算
      if (particle.position.x > -2 && particle.position.x < 2) {
        const angleRad = (fishMouthAngle * Math.PI) / 180;
        const diversionFactor = Math.sin(angleRad);
        
        if (particle.position.z > 0) {
          // 内江（宝瓶口方向）
          particle.velocity.z = diversionFactor * 0.5;
          particle.velocity.x *= (0.6 + diversionFactor * 0.4); // 60-100%流量
        } else {
          // 外江（岷江下游）
          particle.velocity.z = -diversionFactor * 0.3;
          particle.velocity.x *= (0.4 - diversionFactor * 0.2); // 40-20%流量
        }
      }
      
             // 飞沙堰排沙效果 - 增强视觉效果
       if (particle.type === 'sediment' && particle.position.x > 2 && particle.position.x < 4 && particle.position.z > -2 && particle.position.z < 0) {
         const currentWeirHeight = weirHeight;
         // 模拟泥沙在堰前的聚集和跃过过程
         if (particle.position.y > currentWeirHeight - 0.2) {
           // 泥沙跃过飞沙堰，排入外江
           particle.velocity.y = 1.5 + Math.random() * 1.5; // 向上跃起
           particle.velocity.z = -2 - Math.random(); // 强力排向外江
           particle.velocity.x = 0.5; // 减缓前进速度
           particle.type = 'floating'; // 标记为被排出的泥沙
         } else {
           // 泥沙在堰前减速聚集
           particle.velocity.x *= 0.3;
           particle.velocity.y -= 0.5; // 下沉
         }
       }
      
             // 宝瓶口控流效果 - 收缩断面控制流量
       if (particle.position.x > 5.5 && particle.position.x < 6.5 && particle.position.z > 0) {
         const bottleneckRadius = 0.8; // 宝瓶口半径
         const distanceFromCenter = Math.abs(particle.position.z - 1);
         
         if (distanceFromCenter > bottleneckRadius) {
           // 超出宝瓶口范围的水流被阻挡
           particle.velocity.x = 0;
           particle.velocity.z = particle.position.z > 1 ? -0.5 : 0.5; // 向中心收缩
         } else {
           // 通过宝瓶口的水流加速
           const contractionFactor = 1 + (bottleneckRadius - distanceFromCenter) / bottleneckRadius;
           particle.velocity.x *= contractionFactor;
         }
       }
       
       // 沉降计算
       if (particle.type === 'sediment') {
         const currentVelocity = particle.velocity.length();
         const criticalVelocity = Math.sqrt(2 * 9.81 * particle.size * 0.001); // 临界流速
         
         if (currentVelocity < criticalVelocity) {
           particle.velocity.y -= 9.81 * delta * 0.1; // 沉降
         }
         
         if (particle.position.y < -1) {
           particle.settled = true;
         }
       }
      
      // 更新渲染位置
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
      
             // 更新颜色 - 区分不同状态
       if (particle.type === 'water') {
         colors[i * 3] = 0.2;     // R
         colors[i * 3 + 1] = 0.6; // G
         colors[i * 3 + 2] = 1.0; // B
       } else if (particle.type === 'floating') {
         colors[i * 3] = 1.0;     // R (红色 - 被排出的泥沙)
         colors[i * 3 + 1] = 0.6; // G
         colors[i * 3 + 2] = 0.0; // B
       } else {
         colors[i * 3] = 0.8;     // R (棕色 - 普通泥沙)
         colors[i * 3 + 1] = 0.4; // G
         colors[i * 3 + 2] = 0.1; // B
       }
    });
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.geometry.attributes.color.needsUpdate = true;
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 3);
    const sizes = new Float32Array(particles.length);
    
    particles.forEach((particle, i) => {
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
      
      if (particle.type === 'water') {
        colors[i * 3] = 0.2;
        colors[i * 3 + 1] = 0.6;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 0.8;
        colors[i * 3 + 1] = 0.4;
        colors[i * 3 + 2] = 0.1;
      }
      
      sizes[i] = particle.size * 10;
    });
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geo;
  }, [particles]);

  // 流向箭头
  const FlowArrows = () => {
    if (!showVectors) return null;
    
    return (
      <group ref={arrowsRef}>
        {/* 主河道流向 */}
        <mesh position={[-5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.2, 1, 8]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
        
        {/* 内江流向 */}
        <mesh position={[2, 0, 1]} rotation={[0, Math.PI / 4, Math.PI / 2]}>
          <coneGeometry args={[0.15, 0.8, 8]} />
          <meshBasicMaterial color="cyan" />
        </mesh>
        
        {/* 外江流向 */}
        <mesh position={[2, 0, -1]} rotation={[0, -Math.PI / 4, Math.PI / 2]}>
          <coneGeometry args={[0.15, 0.8, 8]} />
          <meshBasicMaterial color="blue" />
        </mesh>
      </group>
    );
  };

  return (
    <>
      <points ref={particlesRef} geometry={geometry}>
        <pointsMaterial 
          vertexColors 
          size={0.1} 
          sizeAttenuation 
          transparent 
          opacity={0.8} 
        />
      </points>
      <FlowArrows />
    </>
  );
};

// 工程结构组件
const EngineeringStructures: React.FC<{
  fishMouthAngle: number;
  weirHeight: number;
}> = ({ fishMouthAngle, weirHeight }) => {
  return (
    <group>
      {/* 河道底部 */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 4]} />
        <meshStandardMaterial color="#8B4513" transparent opacity={0.3} />
      </mesh>
      
             {/* 分水鱼嘴 */}
       <group position={[0, -0.5, 0]} rotation={[0, fishMouthAngle * Math.PI / 180, 0]}>
         <mesh>
           <coneGeometry args={[1, 3, 3]} />
           <meshStandardMaterial color="#666666" />
      </mesh>
       </group>
      
             {/* 飞沙堰 - 增强可视性 */}
       <group position={[3, 0, -1]}>
         <mesh position={[0, -1 + weirHeight / 2, 0]}>
           <boxGeometry args={[0.8, weirHeight, 2]} />
           <meshStandardMaterial color="#888888" />
         </mesh>
         {/* 堰顶水流指示 */}
         <mesh position={[0, weirHeight - 0.5, 0]}>
           <boxGeometry args={[0.1, 0.1, 2]} />
           <meshStandardMaterial color="#00FFFF" transparent opacity={0.7} />
         </mesh>
       </group>
       
       {/* 宝瓶口 - 改进结构展示控流效果 */}
       <group position={[6, -0.5, 1]}>
         {/* 外壁 */}
         <mesh>
           <cylinderGeometry args={[1.2, 1.2, 2, 8]} />
           <meshStandardMaterial color="#444444" />
         </mesh>
         {/* 内部通道 */}
         <mesh>
           <cylinderGeometry args={[0.8, 0.8, 2.1, 8]} />
           <meshStandardMaterial color="#001122" transparent opacity={0.3} />
         </mesh>
         {/* 收缩指示环 */}
         <mesh position={[0, 0, 0]}>
           <torusGeometry args={[0.8, 0.05, 8, 16]} />
           <meshStandardMaterial color="#00FFFF" />
      </mesh>
       </group>
      
             {/* 标注 - 调整到边缘位置 */}
      <Text
         position={[-8, -2, 0]} 
        fontSize={0.3}
         color="white"
        anchorX="center"
      >
         岷江上游
      </Text>

      <Text
         position={[8, -2, 1.5]} 
         fontSize={0.25} 
         color="cyan"
        anchorX="center"
      >
         内江
      </Text>

      <Text
         position={[8, -2, -1.5]} 
        fontSize={0.25}
         color="blue"
        anchorX="center"
      >
         外江
      </Text>
    </group>
  );
};

const AncientHydraulicsExperiment: React.FC = () => {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  
  // 工程参数
  const [flowRate, setFlowRate] = useState(100); // m³/s
  const [channelSlope, setChannelSlope] = useState(0.002); // 无量纲
  const [fishMouthAngle, setFishMouthAngle] = useState(20); // 度
  const [weirHeight, setWeirHeight] = useState(1); // m
  const [roughnessCoeff, setRoughnessCoeff] = useState(0.025); // Manning系数
  
  // 计算水力学参数
  const channelWidth = 10; // m
  const channelDepth = 2; // m
  const hydraulicCalc = calculateFlow(flowRate, channelWidth, channelDepth);
  const manningVelocity = calculateManningVelocity(hydraulicCalc.hydraulicRadius, channelSlope, roughnessCoeff);
  
  // 分流比例计算
  const diversionRatio = Math.sin((fishMouthAngle * Math.PI) / 180) * 0.6 + 0.4; // 40-100%
  const innerFlowRate = flowRate * diversionRatio;
  const outerFlowRate = flowRate * (1 - diversionRatio);
  
  // 排沙效率计算
  const sedimentEfficiency = Math.min(95, (manningVelocity / 2) * 100 + weirHeight * 20);

  const reset = () => {
    setFlowRate(100);
    setChannelSlope(0.002);
    setFishMouthAngle(20);
    setWeirHeight(1);
    setRoughnessCoeff(0.025);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            返回主页
          </button>
          <h1 className="text-3xl font-bold">都江堰水利工程原理分析</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              onClick={reset}
              className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3D可视化 */}
          <div className="lg:col-span-2">
            <div className="bg-black/30 rounded-xl p-4">
              <div className="h-96 rounded-lg overflow-hidden">
                                 <Canvas camera={{ position: [0, 8, 12], fov: 50 }}>
                  <ambientLight intensity={0.3} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <pointLight position={[-10, 10, -10]} intensity={0.5} />
                  
                                     <WaterFlowSimulation
                     flowRate={flowRate}
                     channelSlope={channelSlope}
                     fishMouthAngle={fishMouthAngle}
                     weirHeight={weirHeight}
                     isRunning={isRunning}
                     showVectors={showVectors}
                   />
                  
                  <EngineeringStructures
                    fishMouthAngle={fishMouthAngle}
                    weirHeight={weirHeight}
                  />
                  
                  <OrbitControls enableZoom={true} enablePan={true} />
                </Canvas>
              </div>
              
                             <div className="mt-4 flex gap-4 text-sm">
                 <label className="flex items-center gap-2">
                   <input
                     type="checkbox"
                     checked={showVectors}
                     onChange={(e) => setShowVectors(e.target.checked)}
                     className="rounded"
                   />
                   显示流向箭头
                 </label>
                 <div className="text-gray-300">
                   鼠标拖拽旋转视角，滚轮缩放
            </div>
          </div>
        </div>
      </div>

          {/* 控制面板和数据 */}
          <div className="space-y-6">
            {/* 工程参数控制 */}
            <div className="bg-black/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Info size={20} />
                工程参数
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    上游流量: {flowRate} m³/s
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="300"
                    value={flowRate}
                    onChange={(e) => setFlowRate(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    河道坡度: {(channelSlope * 1000).toFixed(1)}‰
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={channelSlope * 1000}
                    onChange={(e) => setChannelSlope(Number(e.target.value) / 1000)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    鱼嘴角度: {fishMouthAngle}°
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="45"
                    value={fishMouthAngle}
                    onChange={(e) => setFishMouthAngle(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    飞沙堰高度: {weirHeight.toFixed(1)} m
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={weirHeight}
                    onChange={(e) => setWeirHeight(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    糙率系数: {roughnessCoeff.toFixed(3)}
                  </label>
                  <input
                    type="range"
                    min="0.015"
                    max="0.05"
                    step="0.001"
                    value={roughnessCoeff}
                    onChange={(e) => setRoughnessCoeff(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* 水力学计算结果 */}
            <div className="bg-black/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">水力学分析</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>过水断面积:</span>
                  <span>{hydraulicCalc.crossSectionArea.toFixed(1)} m²</span>
                </div>
                
                <div className="flex justify-between">
                  <span>平均流速:</span>
                  <span>{hydraulicCalc.velocity.toFixed(2)} m/s</span>
                </div>
                
                <div className="flex justify-between">
                  <span>水力半径:</span>
                  <span>{hydraulicCalc.hydraulicRadius.toFixed(2)} m</span>
                </div>
                
                <div className="flex justify-between">
                  <span>雷诺数:</span>
                  <span>{(hydraulicCalc.reynoldsNumber / 1000).toFixed(0)}k</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Manning流速:</span>
                  <span>{manningVelocity.toFixed(2)} m/s</span>
                </div>
                
                <hr className="border-gray-600" />
                
                <div className="flex justify-between font-semibold">
                  <span>内江流量:</span>
                  <span className="text-cyan-400">{innerFlowRate.toFixed(1)} m³/s</span>
              </div>

                <div className="flex justify-between font-semibold">
                  <span>外江流量:</span>
                  <span className="text-blue-400">{outerFlowRate.toFixed(1)} m³/s</span>
              </div>

                <div className="flex justify-between">
                  <span>分流比例:</span>
                  <span>{(diversionRatio * 100).toFixed(1)}% : {((1-diversionRatio) * 100).toFixed(1)}%</span>
              </div>

                <div className="flex justify-between">
                  <span>排沙效率:</span>
                  <span className="text-yellow-400">{sedimentEfficiency.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* 工程原理说明 */}
            <div className="bg-black/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">工程原理</h3>
              
                             <div className="space-y-3 text-sm">
                 <div>
                   <h4 className="font-medium text-yellow-400">鱼嘴分水:</h4>
                   <p>利用流体力学原理，将岷江水流按比例分配到内江和外江。角度越大，内江分水越多。</p>
          </div>

                 <div>
                   <h4 className="font-medium text-red-400">飞沙堰排沙:</h4>
                   <p>泥沙在堰前聚集，高流速时跃过堰顶排入外江（红色粒子），自动保持内江清洁。</p>
                 </div>
                 
                 <div>
                   <h4 className="font-medium text-cyan-400">宝瓶口控流:</h4>
                   <p>收缩断面限制通过流量，超出范围的水流被阻挡，通过的水流加速进入成都平原。</p>
                 </div>
                 
                 <div>
                   <h4 className="font-medium text-green-400">视觉提示:</h4>
                   <p>蓝色-清水，棕色-泥沙，红色-被排出泥沙，青色环-宝瓶口收缩断面。</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AncientHydraulicsExperiment; 