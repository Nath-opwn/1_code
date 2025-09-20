import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, RotateCcw, Target, Wind, BarChart3 } from 'lucide-react';

interface FlowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
}

interface DragData {
  dragCoefficient: number;
  dragForce: number;
  pressure: number;
  reynolds: number;
  formDrag: number;
  frictionDrag: number;
}

interface ObjectShape {
  name: string;
  cd: number; // 阻力系数
  description: string;
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void;
}

const DragExperiment: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const [isRunning, setIsRunning] = useState(false);
  const [windSpeed, setWindSpeed] = useState([15]);
  const [fluidDensity, setFluidDensity] = useState([1.225]);
  const [objectSize, setObjectSize] = useState([0.2]);
  const [selectedShape, setSelectedShape] = useState('sphere');
  const [particles, setParticles] = useState<FlowParticle[]>([]);
  const [dragData, setDragData] = useState<DragData | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // 定义不同形状的物体
  const shapes: Record<string, ObjectShape> = {
    sphere: {
      name: '球体',
      cd: 0.47,
      description: '光滑球体，经典的钝体绕流',
      draw: (ctx, x, y, size) => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    },
    cylinder: {
      name: '圆柱体',
      cd: 1.2,
      description: '垂直于轴线的圆柱体，产生卡门涡街',
      draw: (ctx, x, y, size) => {
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x - size, y - size * 1.5, size * 2, size * 3);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size, y - size * 1.5, size * 2, size * 3);
      }
    },
    cube: {
      name: '立方体',
      cd: 1.05,
      description: '正方形截面，尖锐边缘产生分离',
      draw: (ctx, x, y, size) => {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size, y - size, size * 2, size * 2);
      }
    },
    streamlined: {
      name: '流线型',
      cd: 0.04,
      description: '流线型物体，阻力最小',
      draw: (ctx, x, y, size) => {
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.ellipse(x, y, size * 2, size * 0.5, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    },
    flat_plate: {
      name: '平板',
      cd: 1.98,
      description: '垂直平板，最大阻力',
      draw: (ctx, x, y, size) => {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x - size * 0.1, y - size * 1.5, size * 0.2, size * 3);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size * 0.1, y - size * 1.5, size * 0.2, size * 3);
      }
    }
  };

  // 初始化流动粒子
  const initializeParticles = () => {
    const newParticles: FlowParticle[] = [];
    for (let i = 0; i < 300; i++) {
      newParticles.push({
        x: Math.random() * 100,
        y: Math.random() * 400 + 50,
        vx: windSpeed[0] * (0.8 + Math.random() * 0.4),
        vy: (Math.random() - 0.5) * 2,
        age: Math.random() * 100
      });
    }
    setParticles(newParticles);
  };

  // 计算阻力相关数据
  const calculateDrag = () => {
    const rho = fluidDensity[0];
    const v = windSpeed[0];
    const d = objectSize[0];
    const shape = shapes[selectedShape];
    const cd = shape.cd;
    
    // 雷诺数计算（空气的运动粘度约为 1.5e-5 m²/s）
    const kinematicViscosity = 1.5e-5;
    const reynolds = (v * d) / kinematicViscosity;
    
    // 参考面积（假设为圆形截面）
    const area = Math.PI * (d / 2) ** 2;
    
    // 阻力计算
    const dragForce = 0.5 * rho * v ** 2 * cd * area;
    
    // 动压
    const dynamicPressure = 0.5 * rho * v ** 2;
    
    // 形状阻力和摩擦阻力的估算
    const formDragRatio = reynolds > 1000 ? 0.8 : 0.5;
    const formDrag = dragForce * formDragRatio;
    const frictionDrag = dragForce * (1 - formDragRatio);
    
    setDragData({
      dragCoefficient: cd,
      dragForce,
      pressure: dynamicPressure,
      reynolds,
      formDrag,
      frictionDrag
    });
  };

  // 更新粒子位置（考虑物体绕流）
  const updateParticles = () => {
    const objectX = 350;
    const objectY = 250;
    const objectRadius = objectSize[0] * 200; // 转换为像素
    
    setParticles(prevParticles => 
      prevParticles.map(particle => {
        let newX = particle.x + particle.vx * 2;
        let newY = particle.y + particle.vy * 0.5;
        let newVx = particle.vx;
        let newVy = particle.vy;
        let newAge = particle.age + 1;

        // 物体周围的流场扰动
        const dx = newX - objectX;
        const dy = newY - objectY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < objectRadius + 50) {
          // 绕流效应
          const angle = Math.atan2(dy, dx);
          const influence = Math.max(0, 1 - distance / (objectRadius + 50));
          
          if (distance > objectRadius) {
            // 绕流
            newVy += influence * Math.sin(angle) * windSpeed[0] * 0.3;
            newVx *= (1 - influence * 0.3);
            
            // 尾流效应
            if (dx > 0) {
              newVx *= (1 - influence * 0.5);
              newVy += (Math.random() - 0.5) * influence * 10; // 湍流
            }
          } else {
            // 碰撞检测 - 粒子重新定位
            newX = 50 + Math.random() * 50;
            newY = 50 + Math.random() * 400;
            newVx = windSpeed[0] * (0.8 + Math.random() * 0.4);
            newVy = (Math.random() - 0.5) * 2;
            newAge = 0;
          }
        }

        // 边界处理
        if (newX > 600) {
          newX = 0;
          newY = 50 + Math.random() * 400;
          newVx = windSpeed[0] * (0.8 + Math.random() * 0.4);
          newVy = (Math.random() - 0.5) * 2;
          newAge = 0;
        }
        
        if (newY < 50) {
          newY = 50;
          newVy = Math.abs(newVy);
        }
        if (newY > 450) {
          newY = 450;
          newVy = -Math.abs(newVy);
        }

        // 粒子老化
        if (newAge > 200) {
          newX = 0;
          newY = 50 + Math.random() * 400;
          newVx = windSpeed[0] * (0.8 + Math.random() * 0.4);
          newVy = (Math.random() - 0.5) * 2;
          newAge = 0;
        }

        return {
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          age: newAge
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
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制风向指示
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const y = 100 + i * 80;
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(60, y);
      ctx.moveTo(50, y - 5);
      ctx.lineTo(60, y);
      ctx.lineTo(50, y + 5);
      ctx.stroke();
    }

    // 绘制风速标签
    ctx.fillStyle = '#475569';
    ctx.font = '14px Arial';
    ctx.fillText(`风速: ${windSpeed[0]} m/s`, 20, 80);

    // 绘制流动粒子
    particles.forEach(particle => {
      const alpha = Math.max(0.1, 1 - particle.age / 200);
      const speed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
      const speedRatio = speed / (windSpeed[0] * 1.5);
      const hue = Math.max(0, Math.min(240, 240 - speedRatio * 180));
      
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // 绘制流线
      if (particle.age > 0) {
        ctx.strokeStyle = `hsla(${hue}, 70%, 50%, ${alpha * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * 5, particle.y - particle.vy * 5);
        ctx.stroke();
      }
    });

    // 绘制物体
    const objectX = 350;
    const objectY = 250;
    const objectSize_px = objectSize[0] * 200;
    
    shapes[selectedShape].draw(ctx, objectX, objectY, objectSize_px);

    // 绘制阻力箭头
    if (dragData) {
      const arrowLength = Math.min(100, dragData.dragForce * 10);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(objectX, objectY);
      ctx.lineTo(objectX - arrowLength, objectY);
      ctx.stroke();
      
      // 箭头头部
      ctx.beginPath();
      ctx.moveTo(objectX - arrowLength, objectY);
      ctx.lineTo(objectX - arrowLength + 10, objectY - 5);
      ctx.lineTo(objectX - arrowLength + 10, objectY + 5);
      ctx.closePath();
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      
      // 阻力标签
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.fillText(`阻力: ${dragData.dragForce.toFixed(2)} N`, objectX - arrowLength - 50, objectY - 15);
    }

    // 绘制压力分布（简化）
    const numPoints = 20;
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const x = objectX + Math.cos(angle) * (objectSize_px + 20);
      const y = objectY + Math.sin(angle) * (objectSize_px + 20);
      
      // 简化的压力分布（前驻点高压，后方低压）
      const pressureRatio = Math.cos(angle) * 0.5 + 0.5;
      const pressureHeight = pressureRatio * 15;
      
      const px = x + Math.cos(angle) * pressureHeight;
      const py = y + Math.sin(angle) * pressureHeight;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.stroke();
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
    calculateDrag();
  }, [windSpeed, fluidDensity, objectSize, selectedShape]);

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
  }, [particles, dragData]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setCurrentTime(0);
    initializeParticles();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">流体阻力实验</h1>
          <p className="text-xl text-gray-600">不同形状物体的阻力系数测试与绕流可视化</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主实验区域 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wind className="h-5 w-5" />
                  绕流可视化
                </CardTitle>
                <CardDescription>
                  观察不同形状物体在气流中的绕流现象和阻力特性
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={500}
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
                  <label className="text-sm font-medium">物体形状</label>
                  <Select value={shapes[selectedShape]?.name} onValueChange={(shapeName) => {
                    const shapeKey = Object.entries(shapes).find(([_, shape]) => shape.name === shapeName)?.[0];
                    if (shapeKey) setSelectedShape(shapeKey);
                  }}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="选择物体形状" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(shapes).map(([key, shape]) => (
                        <SelectItem key={key} value={shape.name}>
                          {shape.name} (Cd = {shape.cd})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-600 mt-1">
                    {shapes[selectedShape].description}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">风速 (m/s)</label>
                  <Slider
                    value={windSpeed}
                    onValueChange={setWindSpeed}
                    max={30}
                    min={5}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">{windSpeed[0]} m/s</div>
                </div>

                <div>
                  <label className="text-sm font-medium">流体密度 (kg/m³)</label>
                  <Slider
                    value={fluidDensity}
                    onValueChange={setFluidDensity}
                    max={2}
                    min={0.5}
                    step={0.1}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">{fluidDensity[0]} kg/m³</div>
                </div>

                <div>
                  <label className="text-sm font-medium">物体尺寸 (m)</label>
                  <Slider
                    value={objectSize}
                    onValueChange={setObjectSize}
                    max={0.5}
                    min={0.1}
                    step={0.05}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">{objectSize[0]} m</div>
                </div>
              </CardContent>
            </Card>

            {/* 阻力数据 */}
            {dragData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    阻力数据
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium">阻力系数</div>
                      <div className="text-lg text-blue-600">{dragData.dragCoefficient}</div>
                    </div>
                    
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="font-medium">阻力 (N)</div>
                      <div className="text-lg text-red-600">{dragData.dragForce.toFixed(2)}</div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium">雷诺数</div>
                      <div className="text-lg text-green-600">{dragData.reynolds.toExponential(2)}</div>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="font-medium">动压 (Pa)</div>
                      <div className="text-lg text-purple-600">{dragData.pressure.toFixed(1)}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>形状阻力:</span>
                      <span>{dragData.formDrag.toFixed(2)} N</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>摩擦阻力:</span>
                      <span>{dragData.frictionDrag.toFixed(2)} N</span>
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
            <CardTitle>阻力理论与应用</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">阻力计算公式</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>阻力公式：</strong></p>
                  <p className="font-mono bg-gray-100 p-2 rounded">F_D = ½ρv²C_DA</p>
                  <p>其中：</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>F_D - 阻力</li>
                    <li>ρ - 流体密度</li>
                    <li>v - 流速</li>
                    <li>C_D - 阻力系数</li>
                    <li>A - 参考面积</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">典型阻力系数</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>球体:</div><div>0.47</div>
                    <div>圆柱体:</div><div>1.2</div>
                    <div>立方体:</div><div>1.05</div>
                    <div>流线型:</div><div>0.04</div>
                    <div>平板:</div><div>1.98</div>
                  </div>
                </div>
              </div>
            </div>

            <Alert className="mt-4">
              <AlertDescription>
                <strong>观察要点：</strong>流线型物体阻力最小，钝体阻力较大。粒子颜色表示流速：
                蓝色（低速）→ 绿色（中速）→ 红色（高速）。注意观察不同形状物体后方的尾流模式。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DragExperiment; 