import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, RotateCcw, Activity, Gauge, ArrowUp, ArrowDown } from 'lucide-react';

interface FluidParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pressure: number;
  speed: number;
}

interface ExperimentData {
  point1: { pressure: number; velocity: number; height: number };
  point2: { pressure: number; velocity: number; height: number };
  point3: { pressure: number; velocity: number; height: number };
  totalEnergy: number;
  energyLoss: number;
}

const BernoulliExperiment: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const [isRunning, setIsRunning] = useState(false);
  const [inletVelocity, setInletVelocity] = useState([2.0]);
  const [fluidDensity, setFluidDensity] = useState([1000]);
  const [pipeDiameter1, setPipeDiameter1] = useState([0.05]);
  const [pipeDiameter2, setPipeDiameter2] = useState([0.03]);
  const [particles, setParticles] = useState<FluidParticle[]>([]);
  const [experimentData, setExperimentData] = useState<ExperimentData | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // 管道几何参数
  const pipe = {
    section1: { x: 50, y: 200, width: 100, height: 60 },
    transition: { x: 150, y: 220, width: 100, height: 20 },
    section2: { x: 250, y: 210, width: 100, height: 40 },
    section3: { x: 350, y: 200, width: 100, height: 60 }
  };

  // 初始化粒子
  const initializeParticles = () => {
    const newParticles: FluidParticle[] = [];
    for (let i = 0; i < 200; i++) {
      newParticles.push({
        x: Math.random() * 500,
        y: 200 + Math.random() * 60,
        vx: inletVelocity[0] * (0.8 + Math.random() * 0.4),
        vy: (Math.random() - 0.5) * 0.5,
        pressure: 101325,
        speed: inletVelocity[0]
      });
    }
    setParticles(newParticles);
  };

  // 计算伯努利方程
  const calculateBernoulli = () => {
    const rho = fluidDensity[0];
    const g = 9.81;
    const v1 = inletVelocity[0];
    const d1 = pipeDiameter1[0];
    const d2 = pipeDiameter2[0];
    
    // 连续性方程：A1*v1 = A2*v2
    const A1 = Math.PI * (d1/2) ** 2;
    const A2 = Math.PI * (d2/2) ** 2;
    const v2 = v1 * (A1 / A2);
    const v3 = v1; // 恢复到原始直径
    
    // 伯努利方程计算压力
    const h1 = 0.2, h2 = 0.25, h3 = 0.2; // 高度差
    const p1 = 101325; // 大气压
    
    // P1 + ½ρv1² + ρgh1 = P2 + ½ρv2² + ρgh2
    const p2 = p1 + 0.5 * rho * (v1**2 - v2**2) + rho * g * (h1 - h2);
    const p3 = p1 + 0.5 * rho * (v1**2 - v3**2) + rho * g * (h1 - h3);
    
    const totalEnergy = p1 + 0.5 * rho * v1**2 + rho * g * h1;
    const energyLoss = Math.abs(totalEnergy - (p3 + 0.5 * rho * v3**2 + rho * g * h3));
    
    setExperimentData({
      point1: { pressure: p1, velocity: v1, height: h1 },
      point2: { pressure: p2, velocity: v2, height: h2 },
      point3: { pressure: p3, velocity: v3, height: h3 },
      totalEnergy,
      energyLoss
    });
  };

  // 更新粒子位置
  const updateParticles = () => {
    setParticles(prevParticles => 
      prevParticles.map(particle => {
        let newX = particle.x + particle.vx;
        let newY = particle.y + particle.vy;
        let newVx = particle.vx;
        let newVy = particle.vy;
        let newPressure = particle.pressure;
        let newSpeed = particle.speed;

        // 边界处理和流速计算
        if (newX >= 150 && newX <= 250) {
          // 收缩段
          const contractionFactor = 1 + (newX - 150) / 100 * 1.5;
          newVx = inletVelocity[0] * contractionFactor;
          newSpeed = newVx;
          // 伯努利效应：速度增加，压力降低
          newPressure = 101325 - 0.5 * fluidDensity[0] * (newVx**2 - inletVelocity[0]**2);
          
          // 流线收缩
          const centerY = 230;
          newY = centerY + (particle.y - 230) * (0.6 - (newX - 150) / 100 * 0.3);
        } else if (newX > 250 && newX <= 350) {
          // 扩张段
          const expansionFactor = 2.5 - (newX - 250) / 100 * 1.5;
          newVx = inletVelocity[0] * expansionFactor;
          newSpeed = newVx;
          newPressure = 101325 - 0.5 * fluidDensity[0] * (newVx**2 - inletVelocity[0]**2);
          
          // 流线扩张
          const centerY = 230;
          newY = centerY + (particle.y - 230) * (0.6 + (newX - 250) / 100 * 0.4);
        } else {
          // 正常段
          newVx = inletVelocity[0];
          newSpeed = newVx;
          newPressure = 101325;
        }

        // 重置出界粒子
        if (newX > 500) {
          newX = 0;
          newY = 200 + Math.random() * 60;
          newVx = inletVelocity[0];
          newVy = (Math.random() - 0.5) * 0.5;
          newPressure = 101325;
          newSpeed = inletVelocity[0];
        }

        // 管道边界约束
        if (newY < 180) newY = 180;
        if (newY > 260) newY = 260;

        return {
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          pressure: newPressure,
          speed: newSpeed
        };
      })
    );
  };

  // 绘制函数
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制管道
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    
    // 管道轮廓
    ctx.beginPath();
    // 顶部轮廓
    ctx.moveTo(50, 200);
    ctx.lineTo(150, 200);
    ctx.lineTo(250, 210);
    ctx.lineTo(350, 210);
    ctx.lineTo(450, 200);
    // 底部轮廓
    ctx.lineTo(450, 260);
    ctx.lineTo(350, 250);
    ctx.lineTo(250, 230);
    ctx.lineTo(150, 260);
    ctx.lineTo(50, 260);
    ctx.closePath();
    
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    ctx.stroke();

    // 绘制测量点
    const measurePoints = [
      { x: 100, y: 230, label: 'P1' },
      { x: 200, y: 220, label: 'P2' },
      { x: 400, y: 230, label: 'P3' }
    ];

    measurePoints.forEach(point => {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#1f2937';
      ctx.font = '14px Arial';
      ctx.fillText(point.label, point.x - 10, point.y - 15);
    });

    // 绘制粒子
    particles.forEach(particle => {
      const speedRatio = particle.speed / (inletVelocity[0] * 2.5);
      const hue = Math.max(0, Math.min(240, 240 - speedRatio * 120)); // 蓝色到红色
      
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // 绘制压力指示器
    if (experimentData) {
      const pressures = [experimentData.point1.pressure, experimentData.point2.pressure, experimentData.point3.pressure];
      const positions = [{ x: 100, y: 180 }, { x: 200, y: 190 }, { x: 400, y: 180 }];
      
      pressures.forEach((pressure, i) => {
        const height = (pressure - 100000) / 1000; // 标准化高度
        ctx.fillStyle = pressure > 101325 ? '#22c55e' : '#ef4444';
        ctx.fillRect(positions[i].x - 5, positions[i].y - Math.abs(height), 10, Math.abs(height));
        
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Arial';
        ctx.fillText(`${(pressure/1000).toFixed(1)}kPa`, positions[i].x - 20, positions[i].y - Math.abs(height) - 5);
      });
    }

    // 绘制流线
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    for (let i = 0; i < 5; i++) {
      const y = 210 + i * 10;
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.quadraticCurveTo(200, y - 5, 250, y);
      ctx.quadraticCurveTo(300, y + 5, 450, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  };

  // 动画循环
  const animate = () => {
    if (isRunning) {
      updateParticles();
      draw();
      setCurrentTime(prev => prev + 0.1);
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  // 效果钩子
  useEffect(() => {
    initializeParticles();
    calculateBernoulli();
  }, [inletVelocity, fluidDensity, pipeDiameter1, pipeDiameter2]);

  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    draw();
  }, [particles, experimentData]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setCurrentTime(0);
    initializeParticles();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">伯努利实验</h1>
          <p className="text-xl text-gray-600">流体力学基本原理：压力、速度与能量守恒</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主实验区域 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  管道流动可视化
                </CardTitle>
                <CardDescription>
                  观察流体通过变截面管道时的压力和速度变化
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={300}
                    className="border border-gray-300 rounded-lg w-full"
                  />
                  
                  <div className="flex justify-center gap-4">
                    <Button onClick={handleStart} disabled={isRunning} className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      开始
                    </Button>
                    <Button onClick={handlePause} disabled={!isRunning} variant="outline" className="flex items-center gap-2">
                      <Pause className="h-4 w-4" />
                      暂停
                    </Button>
                    <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      重置
                    </Button>
                  </div>

                  <div className="text-center">
                    <Badge variant="outline">运行时间: {currentTime.toFixed(1)}s</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 参数控制 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>实验参数</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium">入口流速 (m/s)</label>
                  <Slider
                    value={inletVelocity}
                    onValueChange={setInletVelocity}
                    max={5}
                    min={0.5}
                    step={0.1}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">{inletVelocity[0].toFixed(1)} m/s</div>
                </div>

                <div>
                  <label className="text-sm font-medium">流体密度 (kg/m³)</label>
                  <Slider
                    value={fluidDensity}
                    onValueChange={setFluidDensity}
                    max={1200}
                    min={800}
                    step={10}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">{fluidDensity[0]} kg/m³</div>
                </div>

                <div>
                  <label className="text-sm font-medium">大管径 (m)</label>
                  <Slider
                    value={pipeDiameter1}
                    onValueChange={setPipeDiameter1}
                    max={0.08}
                    min={0.03}
                    step={0.005}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">{pipeDiameter1[0].toFixed(3)} m</div>
                </div>

                <div>
                  <label className="text-sm font-medium">小管径 (m)</label>
                  <Slider
                    value={pipeDiameter2}
                    onValueChange={setPipeDiameter2}
                    max={0.05}
                    min={0.02}
                    step={0.001}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">{pipeDiameter2[0].toFixed(3)} m</div>
                </div>
              </CardContent>
            </Card>

            {/* 实验结果 */}
            {experimentData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    测量结果
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium">测点 P1 (入口)</div>
                      <div className="text-sm text-gray-600">
                        压力: {(experimentData.point1.pressure/1000).toFixed(1)} kPa<br/>
                        流速: {experimentData.point1.velocity.toFixed(2)} m/s
                      </div>
                    </div>
                    
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="font-medium">测点 P2 (收缩段)</div>
                      <div className="text-sm text-gray-600">
                        压力: {(experimentData.point2.pressure/1000).toFixed(1)} kPa<br/>
                        流速: {experimentData.point2.velocity.toFixed(2)} m/s
                      </div>
                      <div className="flex items-center text-sm">
                        <ArrowDown className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">压力降低</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium">测点 P3 (出口)</div>
                      <div className="text-sm text-gray-600">
                        压力: {(experimentData.point3.pressure/1000).toFixed(1)} kPa<br/>
                        流速: {experimentData.point3.velocity.toFixed(2)} m/s
                      </div>
                      <div className="flex items-center text-sm">
                        <ArrowUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">压力恢复</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="text-sm">
                      <div>总能量: {(experimentData.totalEnergy/1000).toFixed(1)} kJ/m³</div>
                      <div>能量损失: {(experimentData.energyLoss/1000).toFixed(2)} kJ/m³</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 理论说明 */}
        <Card>
          <CardHeader>
            <CardTitle>伯努利方程理论</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">基本原理</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>伯努利方程：</strong></p>
                  <p className="font-mono bg-gray-100 p-2 rounded">P + ½ρv² + ρgh = 常数</p>
                  <p>其中：</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>P - 静压力</li>
                    <li>½ρv² - 动压力</li>
                    <li>ρgh - 位压力</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">实验现象</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>管径收缩处：</strong>流速增加，压力降低</li>
                    <li><strong>管径扩张处：</strong>流速减少，压力升高</li>
                    <li><strong>连续性方程：</strong>A₁v₁ = A₂v₂</li>
                    <li><strong>能量守恒：</strong>总机械能保持不变（理想情况）</li>
                  </ul>
                </div>
              </div>
            </div>

            <Alert className="mt-4">
              <AlertDescription>
                <strong>实验验证：</strong>通过改变管径比例和入口流速，观察压力和速度的变化关系，验证伯努利方程的正确性。
                颜色变化表示流速：蓝色（低速）→ 绿色（中速）→ 红色（高速）。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BernoulliExperiment; 