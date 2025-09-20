import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BoundaryLayerData {
  reynoldsNumber: number;
  boundaryLayerThickness: number;
  wallShearStress: number;
  dragCoefficient: number;
  velocityProfile: number[];
}

const Enhanced3DBoundaryLayerExperiment: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 仿真参数
  const [flowVelocity, setFlowVelocity] = useState(5.0);
  const [plateLength, setPlateLength] = useState(3.0);
  const [fluidViscosity, setFluidViscosity] = useState(0.000001);
  const [fluidDensity, setFluidDensity] = useState(1.225);
  const [visualizationType, setVisualizationType] = useState<'velocity' | 'streamlines' | 'boundary'>('velocity');
  const [isRunning, setIsRunning] = useState(false);
  const [showVelocityProfile, setShowVelocityProfile] = useState(true);
  const [animationFrame, setAnimationFrame] = useState(0);

  // 计算边界层参数
  const calculateBoundaryLayerData = useCallback((): BoundaryLayerData => {
    const reynoldsNumber = (fluidDensity * flowVelocity * plateLength) / fluidViscosity;
    
    // 布拉修斯边界层厚度 (δ = 5x/√Rex)
    const boundaryLayerThickness = 5 * plateLength / Math.sqrt(reynoldsNumber);
    
    // 壁面剪切应力 τw = 0.332 * ρ * U² / √Rex
    const wallShearStress = 0.332 * fluidDensity * Math.pow(flowVelocity, 2) / Math.sqrt(reynoldsNumber);
    
    // 阻力系数 Cd = 1.328 / √Rex
    const dragCoefficient = 1.328 / Math.sqrt(reynoldsNumber);
    
    // 速度分布 (布拉修斯解的近似)
    const velocityProfile = Array.from({ length: 20 }, (_, i) => {
      const eta = (i / 19) * 5; // η = y√(U/νx)
      if (eta <= 0) return 0;
      if (eta >= 5) return 1;
      
      // Blasius velocity profile approximation
      const f_prime = 2 * eta / (eta + 2);
      return Math.min(f_prime, 1);
    });
    
    return {
      reynoldsNumber,
      boundaryLayerThickness,
      wallShearStress,
      dragCoefficient,
      velocityProfile
    };
  }, [flowVelocity, plateLength, fluidViscosity, fluidDensity]);

  const boundaryLayerData = calculateBoundaryLayerData();

  // 绘制边界层可视化
  const drawBoundaryLayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 设置画布尺寸
    const width = canvas.width;
    const height = canvas.height;
    const plateY = height * 0.7; // 平板位置
    const plateStartX = width * 0.1;
    const plateEndX = width * 0.9;
    
    // 绘制平板
    ctx.fillStyle = '#333';
    ctx.fillRect(plateStartX, plateY, plateEndX - plateStartX, 4);
    
    // 绘制边界层
    const boundaryLayerHeight = Math.min(boundaryLayerData.boundaryLayerThickness * 100, height * 0.3);
    
    if (visualizationType === 'boundary') {
      // 绘制边界层轮廓
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(plateStartX, plateY);
      
      for (let x = plateStartX; x <= plateEndX; x += 2) {
        const localThickness = boundaryLayerHeight * Math.sqrt((x - plateStartX) / (plateEndX - plateStartX));
        ctx.lineTo(x, plateY - localThickness);
      }
      ctx.stroke();
      
      // 填充边界层区域
      ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
      ctx.beginPath();
      ctx.moveTo(plateStartX, plateY);
      for (let x = plateStartX; x <= plateEndX; x += 2) {
        const localThickness = boundaryLayerHeight * Math.sqrt((x - plateStartX) / (plateEndX - plateStartX));
        ctx.lineTo(x, plateY - localThickness);
      }
      ctx.lineTo(plateEndX, plateY);
      ctx.closePath();
      ctx.fill();
    }
    
    if (visualizationType === 'velocity' || visualizationType === 'streamlines') {
      // 绘制速度场或流线
      const gridSize = 20;
      
      for (let x = plateStartX; x <= plateEndX; x += gridSize) {
        for (let y = plateY - boundaryLayerHeight * 2; y <= plateY; y += gridSize) {
          if (y >= plateY - 2) continue; // 不在平板内部绘制
          
          const distanceFromWall = plateY - y;
          const localBoundaryThickness = boundaryLayerHeight * Math.sqrt((x - plateStartX) / (plateEndX - plateStartX));
          
          let velocityRatio = 1;
          if (distanceFromWall < localBoundaryThickness) {
            // 在边界层内，使用布拉修斯速度分布
            const eta = (distanceFromWall / localBoundaryThickness) * 5;
            velocityRatio = Math.min(2 * eta / (eta + 2), 1);
          }
          
          if (visualizationType === 'velocity') {
            // 绘制速度矢量
            const arrowLength = velocityRatio * 15;
            const alpha = velocityRatio;
            
            ctx.strokeStyle = `rgba(74, 144, 226, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + arrowLength, y);
            ctx.stroke();
            
            // 箭头头部
            if (arrowLength > 5) {
              ctx.beginPath();
              ctx.moveTo(x + arrowLength, y);
              ctx.lineTo(x + arrowLength - 3, y - 2);
              ctx.lineTo(x + arrowLength - 3, y + 2);
              ctx.closePath();
              ctx.fillStyle = `rgba(74, 144, 226, ${alpha})`;
              ctx.fill();
            }
          } else {
            // 绘制流线点
            const alpha = velocityRatio;
            const size = 2 + velocityRatio * 2;
            
            ctx.fillStyle = `rgba(74, 144, 226, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x + (animationFrame * velocityRatio * 0.5) % 20, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    
    // 绘制速度剖面图（如果启用）
    if (showVelocityProfile) {
      const profileX = plateEndX - 50;
      const profileScale = 40;
      
      ctx.strokeStyle = '#4a90e2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      boundaryLayerData.velocityProfile.forEach((velocity, i) => {
        const y = plateY - (i / (boundaryLayerData.velocityProfile.length - 1)) * boundaryLayerHeight;
        const x = profileX + velocity * profileScale;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // 绘制坐标轴
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(profileX, plateY);
      ctx.lineTo(profileX, plateY - boundaryLayerHeight);
      ctx.moveTo(profileX, plateY);
      ctx.lineTo(profileX + profileScale, plateY);
      ctx.stroke();
      
      // 标签
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.fillText('u/U∞', profileX + profileScale + 5, plateY + 5);
      ctx.fillText('y', profileX - 15, plateY - boundaryLayerHeight - 5);
    }
    
    // 绘制说明文字
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.fillText(`Reynolds Number: ${boundaryLayerData.reynoldsNumber.toExponential(2)}`, 10, 30);
    ctx.fillText(`Boundary Layer Thickness: ${(boundaryLayerData.boundaryLayerThickness * 1000).toFixed(2)} mm`, 10, 50);
    ctx.fillText(`Wall Shear Stress: ${boundaryLayerData.wallShearStress.toFixed(4)} Pa`, 10, 70);
    
  }, [boundaryLayerData, visualizationType, showVelocityProfile, animationFrame]);

  // 动画循环
  useEffect(() => {
    let animationId: number;
    
    if (isRunning) {
      const animate = () => {
        setAnimationFrame(prev => prev + 1);
        animationId = requestAnimationFrame(animate);
      };
      animationId = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isRunning]);

  // 重绘画布
  useEffect(() => {
    drawBoundaryLayer();
  }, [drawBoundaryLayer]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setAnimationFrame(0);
  };

  // 准备图表数据
  const velocityProfileData = boundaryLayerData.velocityProfile.map((velocity, index) => ({
    height: index / (boundaryLayerData.velocityProfile.length - 1),
    velocity: velocity,
    dimensionlessHeight: (index / (boundaryLayerData.velocityProfile.length - 1)) * 5
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">边界层实验</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            研究流体在平板表面形成的边界层现象，理解粘性流动的基本特征和边界层理论
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 控制面板 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>实验参数</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 流速控制 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    流速: {flowVelocity.toFixed(1)} m/s
                  </label>
                  <Slider
                    value={[flowVelocity]}
                    onValueChange={(value) => setFlowVelocity(value[0])}
                    min={1}
                    max={20}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* 平板长度 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    平板长度: {plateLength.toFixed(1)} m
                  </label>
                  <Slider
                    value={[plateLength]}
                    onValueChange={(value) => setPlateLength(value[0])}
                    min={0.5}
                    max={10}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* 流体粘度 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    动力粘度: {fluidViscosity.toExponential(1)} Pa·s
                  </label>
                  <Slider
                    value={[Math.log10(fluidViscosity * 1e6)]}
                    onValueChange={(value) => setFluidViscosity(Math.pow(10, value[0]) / 1e6)}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* 流体密度 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    流体密度: {fluidDensity.toFixed(2)} kg/m³
                  </label>
                  <Slider
                    value={[fluidDensity]}
                    onValueChange={(value) => setFluidDensity(value[0])}
                    min={0.5}
                    max={2.0}
                    step={0.01}
                    className="w-full"
                  />
                </div>

                {/* 可视化类型 */}
                <div>
                  <label className="block text-sm font-medium mb-2">可视化类型</label>
                                     <Select value={visualizationType} onValueChange={(value) => setVisualizationType(value as 'velocity' | 'streamlines' | 'boundary')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="velocity">速度场</SelectItem>
                      <SelectItem value="streamlines">流线</SelectItem>
                      <SelectItem value="boundary">边界层轮廓</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 控制按钮 */}
                <div className="flex gap-2">
                  <Button 
                    onClick={handleStart} 
                    disabled={isRunning}
                    className="flex-1"
                  >
                    开始
                  </Button>
                  <Button 
                    onClick={handleStop} 
                    disabled={!isRunning}
                    variant="outline"
                    className="flex-1"
                  >
                    停止
                  </Button>
                  <Button 
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1"
                  >
                    重置
                  </Button>
                </div>

                {/* 显示选项 */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showVelocityProfile}
                      onChange={(e) => setShowVelocityProfile(e.target.checked)}
                    />
                    <span className="text-sm">显示速度剖面</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 主要可视化区域 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>边界层可视化</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={400}
                    className="w-full border rounded-lg bg-white"
                  />
                  {isRunning && (
                    <Badge className="absolute top-2 right-2 bg-green-500">
                      运行中
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 速度剖面图表 */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>速度剖面分布</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={velocityProfileData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="velocity" 
                      label={{ value: 'u/U∞', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      dataKey="dimensionlessHeight"
                      label={{ value: 'η = y√(U∞/νx)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        typeof value === 'number' ? value.toFixed(3) : value, 
                        name === 'velocity' ? 'u/U∞' : 'η'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="velocity" 
                      stroke="#4a90e2" 
                      strokeWidth={2}
                      dot={{ fill: '#4a90e2', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 数据面板 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>计算结果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">雷诺数</div>
                  <div className="text-lg font-semibold">
                    {boundaryLayerData.reynoldsNumber.toExponential(2)}
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">边界层厚度</div>
                  <div className="text-lg font-semibold">
                    {(boundaryLayerData.boundaryLayerThickness * 1000).toFixed(2)} mm
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-gray-600">壁面剪切应力</div>
                  <div className="text-lg font-semibold">
                    {boundaryLayerData.wallShearStress.toFixed(4)} Pa
                  </div>
                </div>

                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-sm text-gray-600">阻力系数</div>
                  <div className="text-lg font-semibold">
                    {boundaryLayerData.dragCoefficient.toFixed(4)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 理论说明 */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>理论基础</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>边界层厚度:</strong></p>
                  <p>δ = 5x/√Re_x</p>
                  
                  <p><strong>壁面剪切应力:</strong></p>
                  <p>τ_w = 0.332ρU²/√Re_x</p>
                  
                  <p><strong>阻力系数:</strong></p>
                  <p>C_d = 1.328/√Re_L</p>
                  
                  <p><strong>速度分布:</strong></p>
                  <p>布拉修斯解的近似</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enhanced3DBoundaryLayerExperiment; 