import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface FlowData {
  position: number;
  velocity: number;
  pressure: number;
  area: number;
}

const VenturiExperiment: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flowRate, setFlowRate] = useState(50);
  const [inletPressure, setInletPressure] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [particles, setParticles] = useState<Array<{x: number, y: number, vx: number, vy: number}>>([]);
  const [flowData, setFlowData] = useState<FlowData[]>([]);

  // 文丘里管几何参数
  const venturiGeometry = {
    inletDiameter: 60,
    throatDiameter: 30,
    outletDiameter: 60,
    length: 400,
    throatPosition: 200
  };

  // 计算管道半径
  const getRadius = (x: number): number => {
    const { inletDiameter, throatDiameter, length, throatPosition } = venturiGeometry;
    
    if (x < throatPosition) {
      // 收缩段
      const ratio = x / throatPosition;
      return (inletDiameter - (inletDiameter - throatDiameter) * ratio) / 2;
    } else {
      // 扩张段
      const ratio = (x - throatPosition) / (length - throatPosition);
      return (throatDiameter + (inletDiameter - throatDiameter) * ratio) / 2;
    }
  };

  // 计算流体参数
  const calculateFlowParameters = () => {
    const data: FlowData[] = [];
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * venturiGeometry.length;
      const radius = getRadius(x);
      const area = Math.PI * radius * radius;
      
      // 根据连续性方程计算速度：A1*V1 = A2*V2
      const inletArea = Math.PI * (venturiGeometry.inletDiameter / 2) ** 2;
      const velocity = (flowRate * inletArea) / area;
      
      // 根据伯努利方程计算压力
      const inletVelocity = flowRate;
      const pressure = inletPressure + 0.5 * 1.225 * (inletVelocity ** 2 - velocity ** 2) / 1000;
      
      data.push({
        position: x,
        velocity: velocity,
        pressure: pressure,
        area: area
      });
    }
    
    setFlowData(data);
  };

  // 初始化粒子
  const initializeParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 100; i++) {
      const y = 150 + (Math.random() - 0.5) * venturiGeometry.inletDiameter;
      newParticles.push({
        x: Math.random() * 50,
        y: y,
        vx: flowRate / 10,
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
      if (newX > venturiGeometry.length + 50) {
        newX = -20;
        newY = 150 + (Math.random() - 0.5) * venturiGeometry.inletDiameter;
      }
      
      // 根据管道形状调整速度
      const radius = getRadius(newX);
      const inletRadius = venturiGeometry.inletDiameter / 2;
      const velocityFactor = (inletRadius / radius) ** 2;
      
      return {
        ...particle,
        x: newX,
        y: newY,
        vx: (flowRate / 10) * velocityFactor,
        vy: particle.vy * 0.95 // 阻尼
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
    
    // 绘制文丘里管
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    // 上边界
    for (let x = 0; x <= venturiGeometry.length; x += 2) {
      const radius = getRadius(x);
      const y = 150 - radius;
      if (x === 0) ctx.moveTo(x + 50, y);
      else ctx.lineTo(x + 50, y);
    }
    
    // 下边界
    for (let x = venturiGeometry.length; x >= 0; x -= 2) {
      const radius = getRadius(x);
      const y = 150 + radius;
      ctx.lineTo(x + 50, y);
    }
    
    ctx.closePath();
    ctx.stroke();
    
    // 填充管道内部
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fill();
    
    // 绘制流线
    if (flowData.length > 0) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 1;
      
      for (let streamline = -2; streamline <= 2; streamline++) {
        ctx.beginPath();
        flowData.forEach((data, i) => {
          const x = data.position + 50;
          const y = 150 + streamline * getRadius(data.position) * 0.7;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    }
    
    // 绘制粒子
    particles.forEach(particle => {
      const radius = getRadius(particle.x);
      if (Math.abs(particle.y - 150) < radius) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(particle.x + 50, particle.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
    
    // 绘制压力指示器
    if (flowData.length > 0) {
      const positions = [0.2, 0.5, 0.8];
      positions.forEach(pos => {
        const dataIndex = Math.floor(pos * (flowData.length - 1));
        const data = flowData[dataIndex];
        const x = data.position + 50;
        const radius = getRadius(data.position);
        
        // 压力计管
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 150 - radius - 5);
        ctx.lineTo(x, 150 - radius - 30);
        ctx.stroke();
        
        // 压力值显示
        const pressureHeight = (data.pressure - 50) * 0.5;
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x - 3, 150 - radius - 30, 6, -pressureHeight);
        
        // 压力数值
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${data.pressure.toFixed(1)} kPa`, x, 150 - radius - 35 - pressureHeight);
      });
    }
    
    // 绘制标签
    ctx.fillStyle = '#1f2937';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('入口', 20, 140);
    ctx.fillText('喉部', venturiGeometry.throatPosition + 30, 140);
    ctx.fillText('出口', venturiGeometry.length + 30, 140);
  };

  useEffect(() => {
    calculateFlowParameters();
    initializeParticles();
  }, [flowRate, inletPressure]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateParticles();
      draw();
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, particles, flowData]);

  useEffect(() => {
    draw();
  }, [flowData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">文丘里管实验</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            观察流体通过收缩-扩张管道时压力和速度的变化关系，验证伯努利方程和连续性方程
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
                  流量 (m/s): {flowRate}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={flowRate}
                  onChange={(e) => setFlowRate(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  入口压力 (kPa): {inletPressure}
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={inletPressure}
                  onChange={(e) => setInletPressure(Number(e.target.value))}
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
                <p><strong>连续性方程:</strong> A₁V₁ = A₂V₂</p>
                <p><strong>伯努利方程:</strong> P₁ + ½ρV₁² = P₂ + ½ρV₂²</p>
                <p><strong>文丘里效应:</strong> 流速增加时压力降低</p>
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
            <h3 className="text-xl font-semibold mb-4 text-gray-800">实验可视化</h3>
            <canvas
              ref={canvasRef}
              width={500}
              height={300}
              className="border border-gray-200 rounded-lg w-full"
            />
            
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>流体粒子</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-green-400"></div>
                  <span>流线</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500"></div>
                  <span>压力计</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 数据分析 */}
        {flowData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">实验数据分析</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.max(...flowData.map(d => d.velocity)).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">最大流速 (m/s)</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.min(...flowData.map(d => d.pressure)).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">最小压力 (kPa)</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {((venturiGeometry.inletDiameter / venturiGeometry.throatDiameter) ** 2).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">面积比</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">实验结论</h4>
              <p className="text-sm text-yellow-700">
                在喉部（最窄处），流速达到最大值，压力降到最低。这验证了伯努利方程：
                当流体速度增加时，压力相应减小，总能量保持守恒。
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VenturiExperiment; 