import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ShockData {
  x: number;
  y: number;
  angle: number;
  machBefore: number;
  machAfter: number;
  pressureRatio: number;
  temperatureRatio: number;
}

const ShockWaveExperiment: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [machNumber, setMachNumber] = useState(2.5);
  const [wedgeAngle, setWedgeAngle] = useState(15);
  const [isRunning, setIsRunning] = useState(false);
  const [particles, setParticles] = useState<Array<{x: number, y: number, vx: number, vy: number, mach: number}>>([]);
  const [shockData, setShockData] = useState<ShockData | null>(null);

  // 气体属性
  const gasProperties = {
    gamma: 1.4, // 比热比
    R: 287, // 气体常数 J/(kg·K)
    T0: 288, // 参考温度 K
    P0: 101325 // 参考压力 Pa
  };

  // 计算斜激波角度
  const calculateShockAngle = (M1: number, theta: number): number => {
    const thetaRad = theta * Math.PI / 180;
    const gamma = gasProperties.gamma;
    
    // 使用迭代法求解激波角β
    let beta = Math.PI / 4; // 初始猜测45度
    
    for (let i = 0; i < 100; i++) {
      const tanBeta = Math.tan(beta);
      const tanTheta = Math.tan(thetaRad);
      
      const f = 2 * (1 / tanBeta) * (M1 * M1 * Math.sin(beta) * Math.sin(beta) - 1) / 
                (M1 * M1 * (gamma + Math.cos(2 * beta)) + 2) - tanTheta;
      
      const df_dbeta = -2 * (Math.cos(beta) * Math.cos(beta)) * 
                       (M1 * M1 * (gamma + Math.cos(2 * beta)) + 2 - 
                        2 * M1 * M1 * Math.sin(beta) * Math.sin(beta)) /
                       (Math.pow(M1 * M1 * (gamma + Math.cos(2 * beta)) + 2, 2));
      
      const newBeta = beta - f / df_dbeta;
      
      if (Math.abs(newBeta - beta) < 1e-6) break;
      beta = newBeta;
    }
    
    return beta * 180 / Math.PI;
  };

  // 计算激波后参数
  const calculateShockProperties = (M1: number, beta: number, theta: number) => {
    const betaRad = beta * Math.PI / 180;
    const gamma = gasProperties.gamma;
    
    const M1n = M1 * Math.sin(betaRad); // 激波法向马赫数
    
    // 激波后法向马赫数
    const M2n = Math.sqrt(
      (M1n * M1n + 2 / (gamma - 1)) / 
      (2 * gamma * M1n * M1n / (gamma - 1) - 1)
    );
    
    // 激波后马赫数
    const M2 = M2n / Math.sin(betaRad - theta * Math.PI / 180);
    
    // 压力比
    const pressureRatio = 1 + 2 * gamma / (gamma + 1) * (M1n * M1n - 1);
    
    // 温度比
    const temperatureRatio = (1 + (gamma - 1) / 2 * M1n * M1n) * 
                            (2 * gamma * M1n * M1n / (gamma - 1) - 1) / 
                            ((gamma + 1) * (gamma + 1) * M1n * M1n / (2 * (gamma - 1)));
    
    return {
      machAfter: M2,
      pressureRatio,
      temperatureRatio
    };
  };

  // 计算激波数据
  const calculateShockData = () => {
    if (machNumber <= 1 || wedgeAngle <= 0) {
      setShockData(null);
      return;
    }
    
    const shockAngle = calculateShockAngle(machNumber, wedgeAngle);
    const shockProps = calculateShockProperties(machNumber, shockAngle, wedgeAngle);
    
    // 激波起始点（楔形前缘）
    const wedgeStart = { x: 200, y: 150 };
    
    setShockData({
      x: wedgeStart.x,
      y: wedgeStart.y,
      angle: shockAngle,
      machBefore: machNumber,
      ...shockProps
    });
  };

  // 初始化粒子
  const initializeParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * 100;
      const y = 100 + Math.random() * 100;
      newParticles.push({
        x,
        y,
        vx: machNumber * 10,
        vy: 0,
        mach: machNumber
      });
    }
    setParticles(newParticles);
  };

  // 检查粒子是否穿过激波
  const checkShockCrossing = (particle: any, newX: number, newY: number) => {
    if (!shockData) return particle;
    
    const wedgeStart = { x: 200, y: 150 };
    const shockAngleRad = shockData.angle * Math.PI / 180;
    
    // 激波线方程
    const shockSlope = -Math.tan(shockAngleRad);
    const shockIntercept = wedgeStart.y - shockSlope * wedgeStart.x;
    
    // 检查粒子是否从激波前方穿越到后方
    const oldY_shock = shockSlope * particle.x + shockIntercept;
    const newY_shock = shockSlope * newX + shockIntercept;
    
    if (particle.y > oldY_shock && newY < newY_shock && newX > wedgeStart.x) {
      // 粒子穿过激波，更新参数
      return {
        ...particle,
        mach: shockData.machAfter,
        vx: shockData.machAfter * 10 * Math.cos(wedgeAngle * Math.PI / 180),
        vy: -shockData.machAfter * 10 * Math.sin(wedgeAngle * Math.PI / 180)
      };
    }
    
    return particle;
  };

  // 更新粒子位置
  const updateParticles = () => {
    if (!isRunning) return;
    
    setParticles(prev => prev.map(particle => {
      let newX = particle.x + particle.vx * 0.5;
      let newY = particle.y + particle.vy * 0.5;
      
      // 重置超出边界的粒子
      if (newX > 500 || newY < 50 || newY > 250) {
        return {
          x: Math.random() * 50,
          y: 100 + Math.random() * 100,
          vx: machNumber * 10,
          vy: 0,
          mach: machNumber
        };
      }
      
      // 检查激波穿越
      const updatedParticle = checkShockCrossing(particle, newX, newY);
      
      // 检查楔形碰撞
      const wedgeStart = { x: 200, y: 150 };
      const wedgeTop = {
        x: wedgeStart.x + 100,
        y: wedgeStart.y - 100 * Math.tan(wedgeAngle * Math.PI / 180)
      };
      
      if (newX > wedgeStart.x && newX < wedgeStart.x + 100) {
        const wedgeY = wedgeStart.y - (newX - wedgeStart.x) * Math.tan(wedgeAngle * Math.PI / 180);
        if (newY > wedgeY) {
          // 粒子撞到楔形，反弹
          return {
            x: Math.random() * 50,
            y: 100 + Math.random() * 100,
            vx: machNumber * 10,
            vy: 0,
            mach: machNumber
          };
        }
      }
      
      return {
        ...updatedParticle,
        x: newX,
        y: newY
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
    
    // 绘制楔形
    const wedgeStart = { x: 200, y: 150 };
    const wedgeLength = 100;
    const wedgeTop = {
      x: wedgeStart.x + wedgeLength,
      y: wedgeStart.y - wedgeLength * Math.tan(wedgeAngle * Math.PI / 180)
    };
    
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.moveTo(wedgeStart.x, wedgeStart.y);
    ctx.lineTo(wedgeTop.x, wedgeTop.y);
    ctx.lineTo(wedgeStart.x + wedgeLength, wedgeStart.y);
    ctx.closePath();
    ctx.fill();
    
    // 绘制激波
    if (shockData) {
      const shockAngleRad = shockData.angle * Math.PI / 180;
      const shockLength = 100;
      
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(shockData.x, shockData.y);
      ctx.lineTo(
        shockData.x - shockLength * Math.cos(shockAngleRad),
        shockData.y - shockLength * Math.sin(shockAngleRad)
      );
      ctx.stroke();
      
      // 激波标签
      ctx.fillStyle = '#ef4444';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `激波角: ${shockData.angle.toFixed(1)}°`,
        shockData.x - 40,
        shockData.y - 20
      );
    }
    
    // 绘制粒子（根据马赫数着色）
    particles.forEach(particle => {
      const colorIntensity = Math.min(1, particle.mach / 3);
      const red = Math.floor(255 * colorIntensity);
      const blue = Math.floor(255 * (1 - colorIntensity));
      ctx.fillStyle = `rgb(${red}, 100, ${blue})`;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // 绘制马赫线
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;
    const machAngle = Math.asin(1 / machNumber) * 180 / Math.PI;
    
    for (let x = 50; x < 200; x += 30) {
      for (let y = 110; y < 190; y += 20) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 20 * Math.cos(machAngle * Math.PI / 180), 
                   y - 20 * Math.sin(machAngle * Math.PI / 180));
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 20 * Math.cos(-machAngle * Math.PI / 180), 
                   y - 20 * Math.sin(-machAngle * Math.PI / 180));
        ctx.stroke();
      }
    }
    
    // 绘制流动方向
    ctx.fillStyle = '#1f2937';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`M = ${machNumber}`, 20, 30);
    ctx.fillText('→', 50, 130);
    
    // 绘制压力等值线（简化）
    if (shockData) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      
      // 激波后高压区
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(wedgeStart.x + 50, wedgeStart.y - 20, 10 + i * 8, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  useEffect(() => {
    calculateShockData();
    initializeParticles();
  }, [machNumber, wedgeAngle]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateParticles();
      draw();
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, particles, shockData]);

  useEffect(() => {
    draw();
  }, [shockData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">激波实验</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            观察超声速流动中的激波现象，理解激波的形成机理和流动参数跳跃
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
                  来流马赫数: {machNumber}
                </label>
                <input
                  type="range"
                  min="1.1"
                  max="5"
                  step="0.1"
                  value={machNumber}
                  onChange={(e) => setMachNumber(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  楔形角度 (°): {wedgeAngle}
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={wedgeAngle}
                  onChange={(e) => setWedgeAngle(Number(e.target.value))}
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
            <div className="mt-6 p-4 bg-red-50 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">理论基础</h4>
              <div className="text-sm text-red-700 space-y-2">
                <p><strong>马赫角:</strong> μ = arcsin(1/M)</p>
                <p><strong>激波角:</strong> β {'>'} μ</p>
                <p><strong>压力跳跃:</strong> P₂/P₁ {'>'} 1</p>
                <p><strong>温度跳跃:</strong> T₂/T₁ {'>'} 1</p>
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
            <h3 className="text-xl font-semibold mb-4 text-gray-800">激波可视化</h3>
            <canvas
              ref={canvasRef}
              width={500}
              height={300}
              className="border border-gray-200 rounded-lg w-full"
            />
            
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-blue-500 rounded-full"></div>
                  <span>流体粒子 (按马赫数着色)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-red-500"></div>
                  <span>激波</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-blue-300"></div>
                  <span>马赫线</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-gray-600"></div>
                  <span>楔形体</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 数据分析 */}
        {shockData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">激波参数分析</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {shockData.angle.toFixed(1)}°
                </div>
                <div className="text-sm text-gray-600">激波角</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {shockData.machAfter.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">激波后马赫数</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {shockData.pressureRatio.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">压力比 P₂/P₁</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {shockData.temperatureRatio.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">温度比 T₂/T₁</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">激波特性</h4>
              <div className="text-sm text-orange-700 space-y-1">
                <p>• 激波是超声速流动中的强间断面，流动参数发生跳跃变化</p>
                <p>• 激波角度随来流马赫数和楔形角度变化</p>
                <p>• 通过激波后，马赫数降低，压力和温度升高</p>
                <p>• 激波过程是不可逆的，总压降低</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ShockWaveExperiment; 