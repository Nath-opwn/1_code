import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, RotateCcw, Gauge, TrendingUp, Zap } from 'lucide-react';

interface FlowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  id: number;
}

interface PitotData {
  staticPressure: number;
  totalPressure: number;
  dynamicPressure: number;
  velocity: number;
  machNumber: number;
  pressureDifference: number;
}

const PitotTubeExperiment: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const [isRunning, setIsRunning] = useState(false);
  const [airSpeed, setAirSpeed] = useState([50]);
  const [altitude, setAltitude] = useState([0]);
  const [temperature, setTemperature] = useState([15]);
  const [particles, setParticles] = useState<FlowParticle[]>([]);
  const [pitotData, setPitotData] = useState<PitotData | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [manometerHeight, setManometerHeight] = useState(0);

  // 大气参数计算
  const getAtmosphericProperties = (altitude: number, temperature: number) => {
    // 标准大气模型
    const seaLevelPressure = 101325; // Pa
    const seaLevelDensity = 1.225; // kg/m³
    const temperatureK = temperature + 273.15;
    const seaLevelTempK = 288.15;
    
    // 高度对压力和密度的影响
    const pressureRatio = Math.pow(1 - 0.0065 * altitude / seaLevelTempK, 5.2561);
    const pressure = seaLevelPressure * pressureRatio;
    const density = seaLevelDensity * pressureRatio * (seaLevelTempK / temperatureK);
    
    // 声速计算
    const gamma = 1.4; // 空气比热比
    const R = 287; // 空气气体常数
    const soundSpeed = Math.sqrt(gamma * R * temperatureK);
    
    return { pressure, density, soundSpeed };
  };

  // 初始化流动粒子
  const initializeParticles = () => {
    const newParticles: FlowParticle[] = [];
    for (let i = 0; i < 150; i++) {
      newParticles.push({
        x: Math.random() * 100,
        y: 200 + Math.random() * 100,
        vx: airSpeed[0] * (0.9 + Math.random() * 0.2),
        vy: (Math.random() - 0.5) * 2,
        id: i
      });
    }
    setParticles(newParticles);
  };

  // 计算毕托管数据
  const calculatePitotData = () => {
    const atmProps = getAtmosphericProperties(altitude[0], temperature[0]);
    const rho = atmProps.density;
    const staticPressure = atmProps.pressure;
    const soundSpeed = atmProps.soundSpeed;
    const velocity = airSpeed[0];
    
    // 动压计算
    const dynamicPressure = 0.5 * rho * velocity ** 2;
    
    // 总压 = 静压 + 动压
    const totalPressure = staticPressure + dynamicPressure;
    
    // 马赫数
    const machNumber = velocity / soundSpeed;
    
    // 压差（毫米汞柱）
    const pressureDifference = dynamicPressure / 133.322; // 转换为mmHg
    
    setPitotData({
      staticPressure,
      totalPressure,
      dynamicPressure,
      velocity,
      machNumber,
      pressureDifference
    });
    
    // 更新压差计高度（用于可视化）
    setManometerHeight(Math.min(100, pressureDifference * 2));
  };

  // 更新粒子位置
  const updateParticles = () => {
    const pitotX = 350;
    const pitotY = 250;
    
    setParticles(prevParticles => 
      prevParticles.map(particle => {
        let newX = particle.x + particle.vx * 0.5;
        let newY = particle.y + particle.vy * 0.2;
        let newVx = particle.vx;
        let newVy = particle.vy;

        // 毕托管影响区域
        const dx = newX - pitotX;
        const dy = newY - pitotY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 驻点效应
        if (distance < 30 && dx < 0) {
          const influence = Math.max(0, 1 - distance / 30);
          newVx *= (1 - influence * 0.8); // 减速
          newVy += (dy / distance) * influence * 5; // 向外偏转
        }

        // 边界处理
        if (newX > 600) {
          newX = 0;
          newY = 200 + Math.random() * 100;
          newVx = airSpeed[0] * (0.9 + Math.random() * 0.2);
          newVy = (Math.random() - 0.5) * 2;
        }
        
        if (newY < 180) {
          newY = 180;
          newVy = Math.abs(newVy);
        }
        if (newY > 320) {
          newY = 320;
          newVy = -Math.abs(newVy);
        }

        return {
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          id: particle.id
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

    // 绘制风向指示
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const y = 190 + i * 30;
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(70, y);
      ctx.moveTo(60, y - 5);
      ctx.lineTo(70, y);
      ctx.lineTo(60, y + 5);
      ctx.stroke();
    }

    // 风速标签
    ctx.fillStyle = '#475569';
    ctx.font = '14px Arial';
    ctx.fillText(`空速: ${airSpeed[0]} m/s`, 30, 170);

    // 绘制流动粒子
    particles.forEach(particle => {
      const speed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
      const speedRatio = speed / (airSpeed[0] * 1.2);
      const hue = Math.max(0, Math.min(240, 240 - speedRatio * 180));
      
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // 流线轨迹
      ctx.strokeStyle = `hsla(${hue}, 70%, 50%, 0.3)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
      ctx.stroke();
    });

    // 绘制毕托管
    const pitotX = 350;
    const pitotY = 250;
    
    // 主管
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pitotX - 40, pitotY);
    ctx.lineTo(pitotX + 40, pitotY);
    ctx.stroke();
    
    // 总压口（正面开口）
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pitotX + 40, pitotY, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // 静压口（侧面小孔）
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(pitotX - 20 + i * 15, pitotY - 8, 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pitotX - 20 + i * 15, pitotY + 8, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 绘制压力线
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    // 总压线
    ctx.beginPath();
    ctx.moveTo(pitotX + 40, pitotY - 6);
    ctx.lineTo(pitotX + 80, pitotY - 6);
    ctx.lineTo(pitotX + 80, 350);
    ctx.stroke();
    
    // 静压线
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(pitotX, pitotY + 8);
    ctx.lineTo(pitotX + 60, pitotY + 8);
    ctx.lineTo(pitotX + 60, 350);
    ctx.stroke();

    // 绘制U型压差计
    const manometerX = 450;
    const manometerY = 350;
    
    // U管
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(manometerX, manometerY);
    ctx.lineTo(manometerX, manometerY + 80);
    ctx.lineTo(manometerX + 40, manometerY + 80);
    ctx.lineTo(manometerX + 40, manometerY);
    ctx.stroke();
    
    // 液体（水银）
    ctx.fillStyle = '#6b7280';
    const leftLevel = manometerY + 60 + manometerHeight / 2;
    const rightLevel = manometerY + 60 - manometerHeight / 2;
    
    ctx.fillRect(manometerX - 2, leftLevel, 6, manometerY + 80 - leftLevel);
    ctx.fillRect(manometerX + 36, rightLevel, 6, manometerY + 80 - rightLevel);
    
    // 压差标注
    if (pitotData) {
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.fillText(`Δh = ${pitotData.pressureDifference.toFixed(1)} mmHg`, manometerX - 20, manometerY - 10);
      
      // 箭头指示压差
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(manometerX + 50, leftLevel);
      ctx.lineTo(manometerX + 50, rightLevel);
      ctx.stroke();
      
      // 箭头头部
      ctx.beginPath();
      ctx.moveTo(manometerX + 50, rightLevel);
      ctx.lineTo(manometerX + 47, rightLevel + 5);
      ctx.lineTo(manometerX + 53, rightLevel + 5);
      ctx.closePath();
      ctx.fillStyle = '#dc2626';
      ctx.fill();
    }

    // 标签
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px Arial';
    ctx.fillText('总压', pitotX + 45, pitotY - 15);
    ctx.fillText('静压', pitotX - 15, pitotY + 25);
    ctx.fillText('压差计', manometerX - 10, manometerY + 100);

    // 驻点标识
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(pitotX + 55, pitotY, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#1f2937';
    ctx.font = '10px Arial';
    ctx.fillText('驻点', pitotX + 60, pitotY + 15);
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
    calculatePitotData();
  }, [airSpeed, altitude, temperature]);

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
  }, [particles, pitotData, manometerHeight]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setCurrentTime(0);
    initializeParticles();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">毕托管实验</h1>
          <p className="text-xl text-gray-600">流速测量原理与压差计算</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主实验区域 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  毕托管测速原理
                </CardTitle>
                <CardDescription>
                  观察气流经过毕托管时的驻点效应和压差变化
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={450}
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
                <CardTitle>测量条件</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium">空速 (m/s)</label>
                  <Slider
                    value={airSpeed}
                    onValueChange={setAirSpeed}
                    max={100}
                    min={10}
                    step={5}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">{airSpeed[0]} m/s</div>
                </div>

                <div>
                  <label className="text-sm font-medium">高度 (m)</label>
                  <Slider
                    value={altitude}
                    onValueChange={setAltitude}
                    max={10000}
                    min={0}
                    step={500}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">{altitude[0]} m</div>
                </div>

                <div>
                  <label className="text-sm font-medium">温度 (°C)</label>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    max={40}
                    min={-20}
                    step={5}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">{temperature[0]}°C</div>
                </div>
              </CardContent>
            </Card>

            {/* 测量结果 */}
            {pitotData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    测量数据
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-sm">静压 (Pa)</div>
                      <div className="text-lg font-bold text-blue-600">
                        {pitotData.staticPressure.toFixed(0)}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="font-medium text-sm">总压 (Pa)</div>
                      <div className="text-lg font-bold text-red-600">
                        {pitotData.totalPressure.toFixed(0)}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-sm">动压 (Pa)</div>
                      <div className="text-lg font-bold text-green-600">
                        {pitotData.dynamicPressure.toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="font-medium text-sm">压差 (mmHg)</div>
                      <div className="text-lg font-bold text-purple-600">
                        {pitotData.pressureDifference.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>计算流速:</span>
                      <span className="font-medium">{pitotData.velocity.toFixed(1)} m/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>马赫数:</span>
                      <span className="font-medium">{pitotData.machNumber.toFixed(3)}</span>
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
            <CardTitle>毕托管测速原理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">工作原理</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>伯努利方程应用：</strong></p>
                  <p className="font-mono bg-gray-100 p-2 rounded">P₀ = P + ½ρv²</p>
                  <p>流速计算：</p>
                  <p className="font-mono bg-gray-100 p-2 rounded">v = √(2Δp/ρ)</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>P₀ - 总压（驻点压力）</li>
                    <li>P - 静压</li>
                    <li>Δp - 动压（压差）</li>
                    <li>ρ - 流体密度</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">应用领域</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>航空航天：</strong>飞机空速测量</li>
                    <li><strong>气象学：</strong>风速监测</li>
                    <li><strong>工业：</strong>管道流速检测</li>
                    <li><strong>汽车：</strong>风洞试验测速</li>
                    <li><strong>环境：</strong>大气流动研究</li>
                  </ul>
                </div>
              </div>
            </div>

            <Alert className="mt-4">
              <AlertDescription>
                <strong>实验观察：</strong>注意观察毕托管前方的驻点（黄色标记），
                流体在此处速度为零，压力最高。压差计显示动压对应的液柱高度差，
                据此可计算实际流速。粒子颜色表示流速变化。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PitotTubeExperiment; 