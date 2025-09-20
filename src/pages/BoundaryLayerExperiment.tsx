import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface VelocityProfile {
  y: number;
  velocity: number;
}

interface BoundaryLayerData {
  x: number;
  thickness: number;
  velocityProfile: VelocityProfile[];
  shearStress: number;
}

const BoundaryLayerExperiment: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [freeStreamVelocity, setFreeStreamVelocity] = useState(20);
  const [plateLength, setPlateLength] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [particles, setParticles] = useState<Array<{x: number, y: number, vx: number, vy: number}>>([]);
  const [boundaryLayerData, setBoundaryLayerData] = useState<BoundaryLayerData[]>([]);

  // 流体属性
  const fluidProperties = {
    density: 1.225, // kg/m³
    viscosity: 1.8e-5, // Pa·s
    kinematicViscosity: 1.47e-5 // m²/s
  };

  // 计算边界层厚度
  const calculateBoundaryLayerThickness = (x: number): number => {
    if (x <= 0) return 0;
    const Re_x = (freeStreamVelocity * x / 1000) / fluidProperties.kinematicViscosity;
    return Math.sqrt(x / 1000) * 5 / Math.sqrt(Re_x) * 1000; // 转换为像素
  };

  // 计算速度剖面（布拉修斯解）
  const calculateVelocityProfile = (x: number, boundaryLayerThickness: number): VelocityProfile[] => {
    const profile: VelocityProfile[] = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const eta = (i / steps) * 6; // 无量纲坐标
      const y = (eta / 6) * boundaryLayerThickness;
      
      // 布拉修斯速度剖面近似
      let f_eta;
      if (eta <= 2) {
        f_eta = 0.5 * eta * eta;
      } else if (eta <= 4) {
        f_eta = eta - 0.5;
      } else {
        f_eta = 1;
      }
      
      const velocity = freeStreamVelocity * Math.min(1, f_eta);
      profile.push({ y, velocity });
    }
    
    return profile;
  };

  // 计算壁面剪切应力
  const calculateShearStress = (x: number): number => {
    if (x <= 0) return 0;
    const Re_x = (freeStreamVelocity * x / 1000) / fluidProperties.kinematicViscosity;
    return 0.332 * fluidProperties.density * freeStreamVelocity * freeStreamVelocity / Math.sqrt(Re_x);
  };

  // 计算边界层数据
  const calculateBoundaryLayerData = () => {
    const data: BoundaryLayerData[] = [];
    const steps = 30;
    
    for (let i = 1; i <= steps; i++) {
      const x = (i / steps) * plateLength;
      const thickness = calculateBoundaryLayerThickness(x);
      const velocityProfile = calculateVelocityProfile(x, thickness);
      const shearStress = calculateShearStress(x);
      
      data.push({
        x,
        thickness,
        velocityProfile,
        shearStress
      });
    }
    
    setBoundaryLayerData(data);
  };

  // 初始化粒子
  const initializeParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 50;
      const y = 50 + Math.random() * 100;
      newParticles.push({
        x,
        y,
        vx: freeStreamVelocity / 10,
        vy: 0
      });
    }
    setParticles(newParticles);
  };

  // 更新粒子位置
  const updateParticles = () => {
    if (!isRunning) return;
    
    setParticles(prev => prev.map(particle => {
      let newX = particle.x + particle.vx;
      let newY = particle.y + particle.vy;
      
      // 重置超出边界的粒子
      if (newX > plateLength + 100) {
        newX = Math.random() * 30;
        newY = 50 + Math.random() * 100;
      }
      
      // 计算当前位置的边界层影响
      const plateTop = 200;
      if (newX > 50 && newY > plateTop) {
        const distanceFromPlate = newY - plateTop;
        const boundaryLayerThickness = calculateBoundaryLayerThickness(newX - 50);
        
        if (distanceFromPlate < boundaryLayerThickness) {
          // 在边界层内，速度受影响
          const velocityRatio = Math.min(1, distanceFromPlate / boundaryLayerThickness);
          const localVelocity = freeStreamVelocity * velocityRatio;
          
          return {
            ...particle,
            x: newX,
            y: newY,
            vx: localVelocity / 10,
            vy: particle.vy * 0.9
          };
        }
      }
      
      return {
        ...particle,
        x: newX,
        y: newY,
        vx: freeStreamVelocity / 10,
        vy: particle.vy * 0.95
      };
    }));
  };

  // 绘制实验
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制平板
    const plateTop = 200;
    const plateStart = 50;
    ctx.fillStyle = '#374151';
    ctx.fillRect(plateStart, plateTop, plateLength, 10);
    
    // 绘制边界层轮廓
    if (boundaryLayerData.length > 0) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      boundaryLayerData.forEach((data, i) => {
        const x = plateStart + data.x;
        const y = plateTop - data.thickness;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      
      ctx.stroke();
      
      // 填充边界层区域
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.beginPath();
      ctx.moveTo(plateStart, plateTop);
      boundaryLayerData.forEach(data => {
        const x = plateStart + data.x;
        const y = plateTop - data.thickness;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(plateStart + plateLength, plateTop);
      ctx.closePath();
      ctx.fill();
    }
    
    // 绘制速度剖面
    const profilePositions = [0.2, 0.5, 0.8];
    profilePositions.forEach(pos => {
      const dataIndex = Math.floor(pos * (boundaryLayerData.length - 1));
      if (boundaryLayerData[dataIndex]) {
        const data = boundaryLayerData[dataIndex];
        const x = plateStart + data.x;
        
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        data.velocityProfile.forEach((point, i) => {
          const profileX = x + (point.velocity / freeStreamVelocity) * 30;
          const profileY = plateTop - point.y;
          if (i === 0) ctx.moveTo(profileX, profileY);
          else ctx.lineTo(profileX, profileY);
        });
        
        ctx.stroke();
        
        // 绘制速度矢量
        ctx.fillStyle = '#3b82f6';
        data.velocityProfile.forEach(point => {
          if (point.y % 5 < 1) { // 每隔5个像素画一个箭头
            const profileX = x + (point.velocity / freeStreamVelocity) * 30;
            const profileY = plateTop - point.y;
            const arrowLength = (point.velocity / freeStreamVelocity) * 15;
            
            // 箭头主体
            ctx.fillRect(profileX, profileY - 1, arrowLength, 2);
            
            // 箭头头部
            ctx.beginPath();
            ctx.moveTo(profileX + arrowLength, profileY);
            ctx.lineTo(profileX + arrowLength - 3, profileY - 2);
            ctx.lineTo(profileX + arrowLength - 3, profileY + 2);
            ctx.closePath();
            ctx.fill();
          }
        });
      }
    });
    
    // 绘制粒子
    particles.forEach(particle => {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // 绘制流线
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.lineWidth = 1;
    for (let streamY = 60; streamY < 180; streamY += 20) {
      ctx.beginPath();
      ctx.moveTo(0, streamY);
      ctx.lineTo(plateStart, streamY);
      
      if (boundaryLayerData.length > 0) {
        for (let x = 0; x < plateLength; x += 5) {
          const dataIndex = Math.floor((x / plateLength) * (boundaryLayerData.length - 1));
          const data = boundaryLayerData[dataIndex];
          const distanceFromPlate = streamY - plateTop;
          
          if (distanceFromPlate > 0 && distanceFromPlate < data.thickness) {
            const velocityRatio = distanceFromPlate / data.thickness;
            const deflection = (1 - velocityRatio) * 10;
            ctx.lineTo(plateStart + x, streamY + deflection);
          } else {
            ctx.lineTo(plateStart + x, streamY);
          }
        }
      }
      
      ctx.lineTo(plateStart + plateLength + 50, streamY);
      ctx.stroke();
    }
    
    // 绘制标签
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('边界层', plateStart + plateLength/2, plateTop - 50);
    ctx.fillText('平板', plateStart + plateLength/2, plateTop + 25);
    
    // 绘制坐标轴标签
    ctx.fillText('自由流', 10, 50);
    ctx.fillText(`U∞ = ${freeStreamVelocity} m/s`, 10, 65);
  };

  useEffect(() => {
    calculateBoundaryLayerData();
    initializeParticles();
  }, [freeStreamVelocity, plateLength]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateParticles();
      draw();
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, particles, boundaryLayerData]);

  useEffect(() => {
    draw();
  }, [boundaryLayerData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">边界层实验</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            观察流体在平板表面形成的边界层发展过程，理解粘性流动的基本特征
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 控制面板 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">实验控制</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自由流速度 (m/s): {freeStreamVelocity}
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={freeStreamVelocity}
                  onChange={(e) => setFreeStreamVelocity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  平板长度 (mm): {plateLength}
                </label>
                <input
                  type="range"
                  min="100"
                  max="400"
                  value={plateLength}
                  onChange={(e) => setPlateLength(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isRunning
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isRunning ? '停止实验' : '开始实验'}
              </button>
            </div>

            {/* 理论说明 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">理论基础</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p><strong>边界层厚度:</strong> δ ∝ √(x/Re_x)</p>
                <p><strong>雷诺数:</strong> Re_x = U∞x/ν</p>
                <p><strong>壁面剪切:</strong> τ_w ∝ ρU∞²/√Re_x</p>
                <p><strong>布拉修斯解:</strong> 层流边界层理论解</p>
              </div>
            </div>
          </motion.div>

          {/* 实验可视化 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">边界层可视化</h3>
            <canvas
              ref={canvasRef}
              width={500}
              height={300}
              className="border border-gray-200 rounded-lg w-full"
            />
            
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>流体粒子</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-red-500"></div>
                  <span>边界层边界</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-blue-500"></div>
                  <span>速度剖面</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-gray-600"></div>
                  <span>平板表面</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 数据分析 */}
        {boundaryLayerData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">边界层参数分析</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {Math.max(...boundaryLayerData.map(d => d.thickness)).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">最大边界层厚度 (mm)</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {((freeStreamVelocity * plateLength / 1000) / fluidProperties.kinematicViscosity).toExponential(2)}
                </div>
                <div className="text-sm text-gray-600">雷诺数 Re_L</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(...boundaryLayerData.map(d => d.shearStress)).toFixed(3)}
                </div>
                <div className="text-sm text-gray-600">最大壁面剪切 (Pa)</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {boundaryLayerData.length > 0 ? 
                    (boundaryLayerData[boundaryLayerData.length-1].thickness / (plateLength/1000) * 100).toFixed(2) : '0'}
                </div>
                <div className="text-sm text-gray-600">相对厚度 (%)</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">实验观察</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• 边界层厚度沿平板方向逐渐增加，符合 δ ∝ √x 的规律</p>
                <p>• 速度剖面从壁面的零速度平滑过渡到自由流速度</p>
                <p>• 壁面剪切应力随雷诺数增加而减小</p>
                <p>• 流体粒子在边界层内速度明显降低</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BoundaryLayerExperiment; 