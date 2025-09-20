import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Enhanced3DControls from '../components/3D/Enhanced3DControls';
import labService, { LabExperimentType } from '../services/labService';

// 粒子系统组件
const ParticleSystem: React.FC<{ 
  velocity: number; 
  viscosity: number; 
  diameter: number;
  reynoldsNumber: number;
}> = ({ velocity, viscosity, diameter, reynoldsNumber }) => {
  const meshRef = useRef<THREE.Points>(null);
  const particlesRef = useRef<THREE.BufferGeometry>(null);
  
  const particleCount = 1000;
  
  useEffect(() => {
    if (!particlesRef.current) return;
    
    // 创建粒子位置
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // 初始位置（管道入口附近）
      positions[i3] = (Math.random() - 0.5) * 0.5; // x
      positions[i3 + 1] = (Math.random() - 0.5) * diameter; // y
      positions[i3 + 2] = (Math.random() - 0.5) * diameter; // z
      
      // 速度分布（层流或湍流）
      const r = Math.sqrt(positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2);
      const maxRadius = diameter / 2;
      
      if (reynoldsNumber < 2300) {
        // 层流：抛物线速度分布
        const normalizedR = Math.min(r / maxRadius, 1);
        velocities[i3] = velocity * (1 - normalizedR ** 2) * 2;
      } else {
        // 湍流：更平坦的速度分布加扰动
        const baseVel = velocity * (1 - (r / maxRadius) ** 0.14);
        velocities[i3] = baseVel + (Math.random() - 0.5) * velocity * 0.3;
      }
      
      velocities[i3 + 1] = (Math.random() - 0.5) * velocity * 0.1;
      velocities[i3 + 2] = (Math.random() - 0.5) * velocity * 0.1;
      
      // 颜色基于速度
      const speedNorm = velocities[i3] / velocity;
      colors[i3] = 0.2 + speedNorm * 0.8; // R
      colors[i3 + 1] = 0.4 + speedNorm * 0.6; // G
      colors[i3 + 2] = 1.0; // B
    }
    
    particlesRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesRef.current.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    particlesRef.current.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }, [velocity, viscosity, diameter, reynoldsNumber]);
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.attributes.position.array as Float32Array;
    const velocities = particlesRef.current.attributes.velocity.array as Float32Array;
    const colors = particlesRef.current.attributes.color.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // 更新位置
      positions[i3] += velocities[i3] * delta;
      positions[i3 + 1] += velocities[i3 + 1] * delta;
      positions[i3 + 2] += velocities[i3 + 2] * delta;
      
      // 边界处理：如果粒子流出，重新生成
      if (positions[i3] > 5) {
        positions[i3] = -5;
        positions[i3 + 1] = (Math.random() - 0.5) * diameter;
        positions[i3 + 2] = (Math.random() - 0.5) * diameter;
        
        // 重新计算速度
        const r = Math.sqrt(positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2);
        const maxRadius = diameter / 2;
        
        if (reynoldsNumber < 2300) {
          const normalizedR = Math.min(r / maxRadius, 1);
          velocities[i3] = velocity * (1 - normalizedR ** 2) * 2;
        } else {
          const baseVel = velocity * (1 - (r / maxRadius) ** 0.14);
          velocities[i3] = baseVel + (Math.random() - 0.5) * velocity * 0.3;
        }
        
        // 更新颜色
        const speedNorm = velocities[i3] / velocity;
        colors[i3] = 0.2 + speedNorm * 0.8;
        colors[i3 + 1] = 0.4 + speedNorm * 0.6;
        colors[i3 + 2] = 1.0;
      }
    }
    
    particlesRef.current.attributes.position.needsUpdate = true;
    particlesRef.current.attributes.color.needsUpdate = true;
  });
  
  return (
    <points ref={meshRef}>
      <bufferGeometry ref={particlesRef}>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={new Float32Array(particleCount * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
};

// 管道组件
const Pipe: React.FC<{ diameter: number }> = ({ diameter }) => {
  return (
    <group>
      {/* 管道外壁 */}
      <mesh>
        <cylinderGeometry args={[diameter / 2 + 0.02, diameter / 2 + 0.02, 10, 32]} />
        <meshStandardMaterial 
          color="#2563eb" 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 管道内壁（透明） */}
      <mesh>
        <cylinderGeometry args={[diameter / 2, diameter / 2, 10, 32]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};

const ReynoldsExperiment: React.FC = () => {
  const [velocity, setVelocity] = useState(1.0);
  const [diameter, setDiameter] = useState(0.02);
  const [viscosity, setViscosity] = useState(1e-6);
  const [fluidType, setFluidType] = useState('水');
  const [experimentRunning, setExperimentRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  // 计算雷诺数
  const reynoldsNumber = (velocity * diameter) / viscosity;
  const flowRegime = reynoldsNumber < 2300 ? '层流' : reynoldsNumber > 4000 ? '湍流' : '过渡流';
  
  // 根据流体类型更新粘度
  useEffect(() => {
    const viscosityMap: Record<string, number> = {
      '水': 1e-6,
      '空气': 1.5e-5,
      '油': 1e-4
    };
    setViscosity(viscosityMap[fluidType] || 1e-6);
  }, [fluidType]);
  
  // 运行实验
  const runExperiment = async () => {
    setExperimentRunning(true);
    
    try {
      const experimentResults = await labService.generateMockResults(
        LabExperimentType.REYNOLDS,
        {
          流速: velocity,
          管道直径: diameter,
          流体粘度: viscosity,
          流体类型: fluidType
        }
      );
      
      setResults(experimentResults);
    } catch (error) {
      console.error('实验运行失败:', error);
    } finally {
      setExperimentRunning(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 实验标题 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              雷诺实验
            </h1>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              观察层流与湍流现象，理解雷诺数对流动状态的影响
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 参数控制面板 */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold mb-6">实验参数</h3>
                
                <div className="space-y-4">
                  {/* 流速控制 */}
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      流速: {velocity.toFixed(2)} m/s
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="5.0"
                      step="0.1"
                      value={velocity}
                      onChange={(e) => setVelocity(parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  {/* 管道直径 */}
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      管道直径: {(diameter * 1000).toFixed(1)} mm
                    </label>
                    <input
                      type="range"
                      min="0.01"
                      max="0.05"
                      step="0.001"
                      value={diameter}
                      onChange={(e) => setDiameter(parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  {/* 流体类型 */}
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      流体类型
                    </label>
                    <select
                      value={fluidType}
                      onChange={(e) => setFluidType(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="水" className="bg-slate-800">水</option>
                      <option value="空气" className="bg-slate-800">空气</option>
                      <option value="油" className="bg-slate-800">油</option>
                    </select>
                  </div>
                  
                  {/* 计算结果 */}
                  <div className="pt-4 border-t border-white/20">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-200">雷诺数:</span>
                        <span className="font-mono">{reynoldsNumber.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">流动状态:</span>
                        <span className={`font-medium ${
                          flowRegime === '层流' ? 'text-green-400' :
                          flowRegime === '湍流' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {flowRegime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">粘度:</span>
                        <span className="font-mono text-xs">{viscosity.toExponential(1)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 运行实验按钮 */}
                  <motion.button
                    onClick={runExperiment}
                    disabled={experimentRunning}
                    className={`w-full py-3 rounded-lg font-medium transition-all ${
                      experimentRunning
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                    }`}
                    whileHover={!experimentRunning ? { scale: 1.02 } : {}}
                    whileTap={!experimentRunning ? { scale: 0.98 } : {}}
                  >
                    {experimentRunning ? '分析中...' : '生成报告'}
                  </motion.button>
                </div>
              </div>
              
              {/* 理论说明 */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold mb-4">理论基础</h3>
                <div className="text-sm text-blue-200 space-y-2">
                  <p><strong>雷诺数公式:</strong></p>
                  <p className="font-mono bg-white/10 p-2 rounded">Re = ρvd/μ = vd/ν</p>
                  <p><strong>流动判断:</strong></p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• Re &lt; 2300: 层流</li>
                    <li>• 2300 &lt; Re &lt; 4000: 过渡流</li>
                    <li>• Re &gt; 4000: 湍流</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* 3D可视化区域 */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 h-[600px]">
                <h3 className="text-xl font-bold mb-4">流动可视化</h3>
                <div className="w-full h-[520px] bg-black/20 rounded-lg overflow-hidden">
                  <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
                    <ambientLight intensity={0.6} />
                    <pointLight position={[10, 10, 10]} />
                    
                    <Pipe diameter={diameter * 50} />
                    <ParticleSystem 
                      velocity={velocity}
                      viscosity={viscosity}
                      diameter={diameter * 50}
                      reynoldsNumber={reynoldsNumber}
                    />
                    
                    <Enhanced3DControls 
                      enablePan={true}
                      enableZoom={true}
                      enableRotate={true}
                      minDistance={5}
                      maxDistance={50}
                    />
                  </Canvas>
                </div>
                
                {/* 图例 */}
                <div className="mt-4 flex justify-center space-x-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                    <span>慢速流动</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full mr-2"></div>
                    <span>中速流动</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-white rounded-full mr-2"></div>
                    <span>高速流动</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 结果面板 */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold mb-6">实验结果</h3>
                
                {!results ? (
                  <div className="text-center py-8">
                    <div className="text-blue-400 mb-4">
                      <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-blue-200 text-sm">点击"生成报告"获取详细分析结果</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-sm text-blue-300 mb-1">计算雷诺数</div>
                      <div className="text-lg font-mono text-white">
                        {results.results.reynolds_number?.toFixed(0)}
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-sm text-blue-300 mb-1">流动状态</div>
                      <div className={`text-lg font-medium ${
                        results.results.flow_regime === '层流' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {results.results.flow_regime}
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-sm text-blue-300 mb-1">压降 (Pa)</div>
                      <div className="text-lg font-mono text-white">
                        {results.results.pressure_drop?.toFixed(1)}
                      </div>
                    </div>
                    
                    {/* 重新分析按钮 */}
                    <motion.button
                      onClick={runExperiment}
                      className="w-full py-2 bg-blue-600/50 hover:bg-blue-600 rounded-lg text-white text-sm font-medium transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      重新分析
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReynoldsExperiment; 