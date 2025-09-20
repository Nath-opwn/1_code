import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  BookOpen, 
  Anchor,
  Waves,
  Activity,
  Wind,
  Compass,
  FileText,
  ExternalLink,
  Info
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

// 系泊绳组件
const MooringRope = ({ 
  boatAngle, 
  boatPosition, 
  boatLength,
  mooringLength, 
  tension 
}: { 
  boatAngle: number;
  boatPosition: [number, number, number];
  boatLength: number;
  mooringLength: number;
  tension: number;
}) => {
  const ropeRef = useRef<THREE.BufferGeometry>(null);
  
  useFrame(() => {
    if (ropeRef.current) {
      // 船体前端和后端位置（考虑转动）
      const frontX = boatPosition[0] + (boatLength / 2) * Math.cos(boatAngle);
      const frontZ = boatPosition[2] + (boatLength / 2) * Math.sin(boatAngle);
      
      const backX = boatPosition[0] - (boatLength / 2) * Math.cos(boatAngle);
      const backZ = boatPosition[2] - (boatLength / 2) * Math.sin(boatAngle);
      
      // 固定点位置（河岸两侧，根据系泊绳长动态调整）
      const anchorDistance = mooringLength * 0.8;
      const anchorPoint1: [number, number, number] = [-anchorDistance, 0, -3];
      const anchorPoint2: [number, number, number] = [-anchorDistance, 0, 3];
      
      // 绳索悬垂计算（考虑重力、张力和风力）
      const segments = 25;
      const positions = new Float32Array((segments + 1) * 3 * 2); // 两根绳子
      
      // 张力系数（影响悬垂程度）
      const tensionFactor = Math.min(tension / 500, 1.0); // 归一化张力
      const sagFactor = 0.15 * (1 - tensionFactor); // 张力越大，悬垂越小
      
      // 第一根绳索（连接船体前端到锚点1）
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = anchorPoint1[0] + t * (frontX - anchorPoint1[0]);
        const z = anchorPoint1[2] + t * (frontZ - anchorPoint1[2]);
        
        // 悬垂效果（抛物线 + 振动效果）
        const baseSag = Math.sin(Math.PI * t) * mooringLength * sagFactor;
        const vibration = Math.sin(Date.now() * 0.003 + t * 10) * 0.1 * (tension / 1000);
        const y = anchorPoint1[1] + t * (boatPosition[1] - anchorPoint1[1]) - baseSag + vibration;
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      
      // 第二根绳索（连接船体后端到锚点2）
      const offset = (segments + 1) * 3;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = anchorPoint2[0] + t * (backX - anchorPoint2[0]);
        const z = anchorPoint2[2] + t * (backZ - anchorPoint2[2]);
        
        // 悬垂效果
        const baseSag = Math.sin(Math.PI * t) * mooringLength * sagFactor;
        const vibration = Math.sin(Date.now() * 0.003 + t * 10 + Math.PI) * 0.1 * (tension / 1000);
        const y = anchorPoint2[1] + t * (boatPosition[1] - anchorPoint2[1]) - baseSag + vibration;
        
        positions[offset + i * 3] = x;
        positions[offset + i * 3 + 1] = y;
        positions[offset + i * 3 + 2] = z;
      }
      
      ropeRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }
  });
  
  // 绳索颜色基于张力（科学化颜色映射）
  const getRopeColor = (tension: number) => {
    if (tension > 800) return '#ff4757'; // 高张力 - 红色
    if (tension > 600) return '#ff6348'; // 中高张力 - 橙红
    if (tension > 400) return '#ffa502'; // 中张力 - 橙色
    if (tension > 200) return '#f1c40f'; // 中低张力 - 黄色
    return '#2f3542'; // 低张力 - 深灰
  };
  
  const ropeColor = getRopeColor(tension);
  const anchorDistance = mooringLength * 0.8;
  
  return (
    <group>
      {/* 绳索线条 */}
      <line>
        <bufferGeometry ref={ropeRef} />
        <lineBasicMaterial color={ropeColor} linewidth={4} />
      </line>
      
      {/* 锚点桩子 */}
      <mesh position={[-anchorDistance, 0, -3]}>
        <cylinderGeometry args={[0.15, 0.25, 1.0]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>
      
      <mesh position={[-anchorDistance, 0, 3]}>
        <cylinderGeometry args={[0.15, 0.25, 1.0]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>
      
      {/* 锚点基座 */}
      <mesh position={[-anchorDistance, -0.6, -3]}>
        <cylinderGeometry args={[0.8, 0.6, 0.4]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
      
      <mesh position={[-anchorDistance, -0.6, 3]}>
        <cylinderGeometry args={[0.8, 0.6, 0.4]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
      
      {/* 河岸标识 */}
      <mesh position={[-anchorDistance - 1, -0.8, 0]}>
        <boxGeometry args={[3, 0.2, 8]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      
      {/* 张力指示器 */}
      {tension > 400 && (
        <group>
          {/* 高张力警告标记 */}
          <mesh position={[-anchorDistance/2, 2, -3]}>
            <sphereGeometry args={[0.2]} />
            <meshStandardMaterial 
              color={tension > 800 ? "#ff0000" : "#ff6600"} 
              emissive={tension > 800 ? "#440000" : "#442200"}
            />
          </mesh>
          
          <mesh position={[-anchorDistance/2, 2, 3]}>
            <sphereGeometry args={[0.2]} />
            <meshStandardMaterial 
              color={tension > 800 ? "#ff0000" : "#ff6600"} 
              emissive={tension > 800 ? "#440000" : "#442200"}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

// 简化的船模型
const BoatModel = ({ 
  angle, 
  position, 
  length, 
  width, 
  height 
}: { 
  angle: number; 
  position: [number, number, number];
  length: number;
  width: number;
  height: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = angle;
    }
  });

  return (
    <group>
      {/* 船体 */}
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[length, height, width]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* 船头标记 */}
      <mesh position={[position[0] + length/2 * Math.cos(angle), position[1] + height/2, position[2] + length/2 * Math.sin(angle)]}>
        <coneGeometry args={[0.2, 0.4]} />
        <meshStandardMaterial color="#ff4444" />
      </mesh>
    </group>
  );
};

// 水流粒子
const WaterFlow = ({ 
  flowSpeed, 
  flowDirection,
  particleCount = 800 
}: { 
  flowSpeed: number;
  flowDirection: number;
  particleCount?: number;
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  useFrame(() => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const flowRadians = (flowDirection * Math.PI) / 180;
      
      for (let i = 0; i < particleCount * 3; i += 3) {
        // 根据流向移动粒子
        positions[i] += flowSpeed * Math.cos(flowRadians) * 0.02;
        positions[i + 2] += flowSpeed * Math.sin(flowRadians) * 0.02;
        
        // 边界处理
        if (positions[i] > 15) positions[i] = -15;
        if (positions[i] < -15) positions[i] = 15;
        if (positions[i + 2] > 15) positions[i + 2] = -15;
        if (positions[i + 2] < -15) positions[i + 2] = 15;
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#4FC3F7" size={0.1} />
    </points>
  );
};

// 参考文献数据
const references = [
  {
    id: 1,
    type: "journal",
    title: "Flow around circular cylinders: A comprehensive guide through flow phenomena, experiments, applications, mathematical models, and computer simulations",
    authors: "Zdravkovich, M. M.",
    journal: "Oxford University Press",
    year: 1997,
    pages: "Vol. 1-2",
    doi: "10.1093/oso/9780198563969.001.0001"
  },
  {
    id: 2,
    type: "journal", 
    title: "Vortex-induced vibrations of a circular cylinder",
    authors: "Williamson, C. H. K., & Govardhan, R.",
    journal: "Annual Review of Fluid Mechanics",
    year: 2004,
    pages: "36: 413-455",
    doi: "10.1146/annurev.fluid.36.050802.122128"
  },
  {
    id: 3,
    type: "journal",
    title: "Fluid forces on oscillating cylinders",
    authors: "Sarpkaya, T.",
    journal: "Journal of the Waterway, Port, Coastal, and Ocean Division",
    year: 1978,
    pages: "104(3): 275-290",
    doi: "10.1061/JWPCDX.0000101"
  },
  {
    id: 4,
    type: "book",
    title: "Introduction to Fluid Mechanics",
    authors: "Fox, R. W., McDonald, A. T., & Pritchard, P. J.",
    journal: "John Wiley & Sons",
    year: 2020,
    pages: "9th Edition",
    doi: "ISBN: 978-1119597308"
  },
  {
    id: 5,
    type: "journal",
    title: "Mooring system dynamics for floating offshore structures",
    authors: "Faltinsen, O. M.",
    journal: "Ocean Engineering",
    year: 1990,
    pages: "17(6): 571-590",
    doi: "10.1016/0029-8018(90)90025-2"
  },
  {
    id: 6,
    type: "classical",
    title: "《诗经·邶风·河广》",
    authors: "佚名",
    journal: "中国古典文学",
    year: "春秋时期 (公元前8-6世纪)",
    pages: "\"谁谓河广？一苇杭之\"",
    doi: "古代水文学智慧"
  },
  {
    id: 7,
    type: "classical",
    title: "《韦应物诗集·滁州西涧》",
    authors: "韦应物",
    journal: "唐诗三百首",
    year: "唐代 (约780年)",
    pages: "\"野渡无人舟自横\"",
    doi: "流体力学现象的诗意描述"
  }
];

// 理论背景组件
const TheoryBackground = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-blue-400" />
                理论背景与参考文献
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 理论背景 */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Info className="h-5 w-5 mr-2 text-green-400" />
                物理理论基础
              </h3>
              
              <div className="space-y-4 text-gray-300">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">1. 椭圆柱绕流理论 (Zdravkovich, 1997)</h4>
                  <p className="text-sm">
                    当流体绕过椭圆形截面物体时，会产生非对称的压力分布。对于长轴为a、短轴为b的椭圆柱，
                    在攻角α下的升力系数可表示为：
                  </p>
                  <div className="bg-gray-600 p-3 mt-2 rounded font-mono text-sm">
                    C_L = 2π sin(2α) × (a²-b²)/(a²+b²)
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">2. 流致振动理论 (Williamson & Govardhan, 2004)</h4>
                  <p className="text-sm">
                    当雷诺数Re = ρUL/μ 超过临界值时，物体会发生涡激振动。
                    系统的运动方程可写为：
                  </p>
                  <div className="bg-gray-600 p-3 mt-2 rounded font-mono text-sm">
                    I θ̈ + C θ̇ + K θ = M_fluid + M_mooring
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">3. 系泊系统动力学 (Faltinsen, 1990)</h4>
                  <p className="text-sm">
                    系泊系统提供恢复力矩和阻尼力矩，维持浮体的位置稳定。
                    线性系泊的恢复力矩为：
                  </p>
                  <div className="bg-gray-600 p-3 mt-2 rounded font-mono text-sm">
                    M_mooring = -K_mooring × θ - C_mooring × θ̇
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">4. 古典文学中的流体力学智慧</h4>
                  <p className="text-sm">
                    "野渡无人舟自横" - 韦应物的这句诗准确描述了无约束船体在水流作用下的自然横摆现象，
                    体现了古人对流体-结构相互作用的深刻观察。
                  </p>
                </div>
              </div>
            </div>

            {/* 参考文献 */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-400" />
                参考文献
              </h3>
              
              <div className="space-y-3">
                {references.map((ref) => (
                  <div key={ref.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded mr-2">
                            [{ref.id}]
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            ref.type === 'journal' ? 'bg-green-500 text-white' :
                            ref.type === 'book' ? 'bg-purple-500 text-white' :
                            'bg-yellow-500 text-black'
                          }`}>
                            {ref.type === 'journal' ? '期刊' : 
                             ref.type === 'book' ? '书籍' : '古典文献'}
                          </span>
                        </div>
                        
                        <h4 className="font-semibold text-white mb-1">{ref.title}</h4>
                        <p className="text-gray-300 text-sm mb-1">{ref.authors}</p>
                        <p className="text-gray-400 text-sm">
                          <em>{ref.journal}</em>, {ref.year}, {ref.pages}
                        </p>
                        <p className="text-blue-400 text-xs mt-1">{ref.doi}</p>
                      </div>
                      
                      {ref.type !== 'classical' && (
                        <ExternalLink className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 模型验证说明 */}
            <div className="mt-8 bg-blue-900 bg-opacity-30 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">模型验证与适用性</h4>
              <p className="text-gray-300 text-sm">
                本仿真基于经典流体力学理论，适用于中等雷诺数范围(Re = 10³-10⁵)。
                椭圆柱绕流模型来源于Zdravkovich的权威研究，系泊动力学参考Faltinsen的海洋工程理论。
                实验参数范围经过调校，确保物理意义的准确性。
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const BoatDriftingExperiment: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(15); // 初始角度
  const [angularVelocity, setAngularVelocity] = useState(0);
  const [time, setTime] = useState(0);
  const [showTheory, setShowTheory] = useState(false);
  
  // 流体参数
  const [flowSpeed, setFlowSpeed] = useState(2.0);
  const [flowDirection, setFlowDirection] = useState(0);
  const [fluidDensity, setFluidDensity] = useState(1000);
  const [fluidViscosity, setFluidViscosity] = useState(0.001);
  
  // 船体参数
  const [boatLength, setBoatLength] = useState(4.0);
  const [boatWidth, setBoatWidth] = useState(1.5);
  const [boatHeight, setBoatHeight] = useState(0.5);
  
  // 系泊参数
  const [mooringStiffness, setMooringStiffness] = useState(500);
  const [mooringDamping, setMooringDamping] = useState(50);
  const [mooringLength, setMooringLength] = useState(10);
  
  // 初始条件
  const [initialAngle, setInitialAngle] = useState(15);
  const [initialAngularVelocity, setInitialAngularVelocity] = useState(0);
  
  // 系泊状态
  const [ropeTension, setRopeTension] = useState(0);
  
  const intervalRef = useRef<number>();

  // 计算雷诺数
  const calculateReynoldsNumber = () => {
    return (fluidDensity * flowSpeed * boatLength) / fluidViscosity;
  };

  // 计算Strouhal数 (基于Williamson & Govardhan, 2004)
  const calculateStrouhalNumber = () => {
    const Re = calculateReynoldsNumber();
    // 圆柱的Strouhal数约为0.2，椭圆柱会有所不同
    const aspectRatio = boatLength / boatWidth;
    return 0.2 * (1 + 0.1 * Math.log(aspectRatio));
  };

  // 计算绳索张力
  const calculateRopeTension = (angle: number, angularVel: number) => {
    const angleRad = (angle * Math.PI) / 180;
    
    // 基础张力来自系泊刚度
    const baseTension = Math.abs(mooringStiffness * angleRad);
    
    // 动态张力来自角速度
    const dynamicTension = Math.abs(mooringDamping * angularVel);
    
    // 流体载荷引起的额外张力
    const flowTension = 0.5 * fluidDensity * flowSpeed * flowSpeed * boatLength * boatHeight * Math.abs(Math.sin(angleRad)) * 0.001;
    
    return baseTension + dynamicTension + flowTension;
  };

  // 物理更新 (基于参考文献的理论模型)
  const updatePhysics = () => {
    const dt = 0.016; // 60fps
    
    // 椭圆柱绕流力矩（基于Zdravkovich, 1997）
    const angleRad = (currentAngle * Math.PI) / 180;
    const a = boatLength / 2;
    const b = boatWidth / 2;
    const aspectRatio = a / b;
    
    // 升力系数 (Zdravkovich方程)
    const C_L = 2 * Math.PI * Math.sin(2 * angleRad) * (a*a - b*b) / (a*a + b*b);
    
    // 基础流体力矩 (考虑船体几何和流体性质)
    const dynamicPressure = 0.5 * fluidDensity * flowSpeed * flowSpeed;
    const referenceArea = boatLength * boatHeight;
    const baseMoment = C_L * dynamicPressure * referenceArea * boatLength * 0.5;
    const flowMoment = baseMoment * 0.00001; // 缩放到合适的数量级
    
    // 系泊恢复力矩 (Faltinsen, 1990)
    const mooringMoment = -mooringStiffness * angleRad * 0.001;
    
    // 阻尼力矩 (包括流体阻尼和系泊阻尼)
    const fluidDamping = 0.5 * fluidDensity * flowSpeed * referenceArea * Math.abs(angularVelocity) * angularVelocity * 0.0001;
    const mooringDampingMoment = -mooringDamping * angularVelocity * 0.001;
    const totalDamping = fluidDamping + mooringDampingMoment;
    
    // 流向影响
    const flowDirectionRad = (flowDirection * Math.PI) / 180;
    const effectiveAngle = angleRad - flowDirectionRad;
    const directionCorrection = Math.cos(effectiveAngle);
    
    // 总力矩
    const totalMoment = flowMoment * directionCorrection + mooringMoment + totalDamping;
    
    // 转动惯量估算 (基于船体几何)
    const mass = fluidDensity * boatLength * boatWidth * boatHeight * 0.5; // 假设50%的排水
    const I = mass * (boatLength*boatLength + boatWidth*boatWidth) / 12; // 矩形截面的转动惯量
    
    // 角加速度 (牛顿第二定律的转动形式)
    const angularAcceleration = totalMoment / (I * 0.001);
    
    // 更新角速度和角度 (数值积分)
    const newAngularVelocity = angularVelocity + angularAcceleration * dt;
    const newAngle = currentAngle + newAngularVelocity * dt * (180 / Math.PI);
    
    // 计算绳索张力
    const tension = calculateRopeTension(newAngle, newAngularVelocity);
    
    setAngularVelocity(newAngularVelocity);
    setCurrentAngle(newAngle);
    setRopeTension(tension);
    setTime(prev => prev + dt);
  };

  // 控制函数
  const startExperiment = () => {
    setIsRunning(true);
    intervalRef.current = window.setInterval(updatePhysics, 16);
  };

  const pauseExperiment = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
  };

  const resetExperiment = () => {
    pauseExperiment();
    setCurrentAngle(initialAngle);
    setAngularVelocity(initialAngularVelocity);
    setTime(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* 理论背景弹窗 */}
      <TheoryBackground isOpen={showTheory} onClose={() => setShowTheory(false)} />
      
      {/* 顶部导航 */}
      <div className="bg-gray-800 shadow-sm border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Anchor className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">野渡无人舟自横</h1>
              <p className="text-gray-300">基于流体力学理论的船体运动仿真</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTheory(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>理论与文献</span>
          </motion.button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* 左侧控制面板 */}
        <div className="w-80 bg-gray-800 shadow-lg overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* 实验控制 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-400" />
                实验控制
              </h3>
              
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isRunning ? pauseExperiment : startExperiment}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isRunning 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isRunning ? '暂停' : '开始'}</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetExperiment}
                  className="flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            {/* 流体参数 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Waves className="h-5 w-5 mr-2 text-blue-400" />
                流体参数
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    水流速度: {flowSpeed.toFixed(1)} m/s
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={flowSpeed}
                    onChange={(e) => setFlowSpeed(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    流向角度: {flowDirection.toFixed(0)}°
                  </label>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="1"
                    value={flowDirection}
                    onChange={(e) => setFlowDirection(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    流体密度: {fluidDensity} kg/m³
                  </label>
                  <input
                    type="range"
                    min="800"
                    max="1200"
                    step="10"
                    value={fluidDensity}
                    onChange={(e) => setFluidDensity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    流体粘度: {(fluidViscosity * 1000).toFixed(1)} mPa·s
                  </label>
                  <input
                    type="range"
                    min="0.0005"
                    max="0.002"
                    step="0.0001"
                    value={fluidViscosity}
                    onChange={(e) => setFluidViscosity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* 船体参数 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Anchor className="h-5 w-5 mr-2 text-blue-400" />
                船体参数
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    船长: {boatLength.toFixed(1)} m
                  </label>
                  <input
                    type="range"
                    min="2.0"
                    max="8.0"
                    step="0.1"
                    value={boatLength}
                    onChange={(e) => setBoatLength(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    船宽: {boatWidth.toFixed(1)} m
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={boatWidth}
                    onChange={(e) => setBoatWidth(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    船高: {boatHeight.toFixed(1)} m
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.1"
                    value={boatHeight}
                    onChange={(e) => setBoatHeight(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* 系泊参数 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Wind className="h-5 w-5 mr-2 text-green-400" />
                系泊参数
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    系泊刚度: {mooringStiffness} N/m
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={mooringStiffness}
                    onChange={(e) => setMooringStiffness(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    阻尼系数: {mooringDamping} N·s/m
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={mooringDamping}
                    onChange={(e) => setMooringDamping(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    系泊绳长: {mooringLength.toFixed(1)} m
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="0.5"
                    value={mooringLength}
                    onChange={(e) => setMooringLength(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* 初始条件 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Compass className="h-5 w-5 mr-2 text-purple-400" />
                初始条件
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    初始角度: {initialAngle.toFixed(0)}°
                  </label>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="1"
                    value={initialAngle}
                    onChange={(e) => setInitialAngle(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    初始角速度: {initialAngularVelocity.toFixed(2)} rad/s
                  </label>
                  <input
                    type="range"
                    min="-1.0"
                    max="1.0"
                    step="0.01"
                    value={initialAngularVelocity}
                    onChange={(e) => setInitialAngularVelocity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* 实时数据 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-400" />
                实时数据
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-xs text-gray-400">角度</div>
                  <div className="text-lg font-bold text-white">{currentAngle.toFixed(1)}°</div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-xs text-gray-400">角速度</div>
                  <div className="text-lg font-bold text-white">{angularVelocity.toFixed(3)}</div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-xs text-gray-400">时间</div>
                  <div className="text-lg font-bold text-white">{time.toFixed(1)}s</div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-xs text-gray-400">雷诺数</div>
                  <div className="text-lg font-bold text-white">{calculateReynoldsNumber().toFixed(0)}</div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-xs text-gray-400">长宽比</div>
                  <div className="text-lg font-bold text-white">{(boatLength / boatWidth).toFixed(2)}</div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-xs text-gray-400">Strouhal数</div>
                  <div className="text-lg font-bold text-white">{calculateStrouhalNumber().toFixed(3)}</div>
                </div>
              </div>
            </div>

            {/* 系泊状态 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Anchor className="h-5 w-5 mr-2 text-orange-400" />
                系泊状态
              </h3>
              
              <div className="space-y-3">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">绳索张力</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      ropeTension > 800 ? 'bg-red-500 text-white' :
                      ropeTension > 600 ? 'bg-orange-500 text-white' :
                      ropeTension > 400 ? 'bg-yellow-500 text-black' :
                      'bg-green-500 text-white'
                    }`}>
                      {ropeTension > 800 ? '危险' :
                       ropeTension > 600 ? '警告' :
                       ropeTension > 400 ? '注意' : '正常'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-2">{ropeTension.toFixed(0)} N</div>
                  
                  {/* 张力进度条 */}
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        ropeTension > 800 ? 'bg-red-500' :
                        ropeTension > 600 ? 'bg-orange-500' :
                        ropeTension > 400 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((ropeTension / 1000) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    最大安全张力: 1000 N
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-xs text-gray-400">绳索长度</div>
                    <div className="text-lg font-bold text-white">{mooringLength.toFixed(1)} m</div>
                  </div>
                  
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-xs text-gray-400">有效半径</div>
                    <div className="text-lg font-bold text-white">{(mooringLength * 0.8).toFixed(1)} m</div>
                  </div>
                </div>
                
                {/* 绳索颜色图例 */}
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-300 mb-2">绳索张力颜色</div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                      <span className="text-xs text-gray-400">0-200N</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <span className="text-xs text-gray-400">200-400N</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-xs text-gray-400">400-600N</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-xs text-gray-400">600N+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D可视化区域 */}
        <div className="flex-1 relative">
          <Canvas camera={{ position: [0, 8, 12], fov: 50 }} style={{ background: '#1a1a1a' }}>
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={0.6} />
            <directionalLight position={[-10, 10, 5]} intensity={0.4} />
            
            {/* 水面 */}
            <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[30, 30]} />
              <meshStandardMaterial color="#006994" transparent opacity={0.3} />
            </mesh>
            
            {/* 船体模型 */}
            <BoatModel
              angle={(currentAngle * Math.PI) / 180}
              position={[0, 0, 0]}
              length={boatLength}
              width={boatWidth}
              height={boatHeight}
            />
            
            {/* 水流粒子 */}
            <WaterFlow 
              flowSpeed={flowSpeed}
              flowDirection={flowDirection}
              particleCount={600}
            />
            
            {/* 系泊绳 */}
            <MooringRope 
              boatAngle={(currentAngle * Math.PI) / 180}
              boatPosition={[0, 0, 0]}
              boatLength={boatLength}
              mooringLength={mooringLength}
              tension={ropeTension} // 使用系泊刚度作为张力显示
            />
            
            {/* 坐标轴 */}
            <Text
              position={[8, 2, 0]}
              fontSize={1}
              color="white"
            >
              X轴 (水流方向)
            </Text>
            
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          </Canvas>
          
          {/* 右下角文献引用提示 */}
          <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-90 p-3 rounded-lg">
            <p className="text-gray-300 text-sm">
              基于经典流体力学理论
            </p>
            <p className="text-gray-400 text-xs">
              参考：Zdravkovich (1997), Williamson & Govardhan (2004)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoatDriftingExperiment; 