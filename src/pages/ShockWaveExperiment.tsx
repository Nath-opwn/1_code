import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import ShockWaveSimulation from '@/components/3D/ShockWaveSimulation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ShockWaveData {
  shockAngle: number;
  deflectionAngle: number;
  pressureRatio: number;
  densityRatio: number;
  temperatureRatio: number;
  velocityRatio: number;
  machNumberDownstream: number;
  totalPressureLoss: number;
}

const ShockWaveExperiment: React.FC = () => {
  // 实验参数
  const [machNumber, setMachNumber] = useState(2.5);
  const [wedgeAngle, setWedgeAngle] = useState(15);
  const [gasGamma, setGasGamma] = useState(1.4);
  const [inletPressure, setInletPressure] = useState(101325);
  const [inletTemperature, setInletTemperature] = useState(288);
  const [isRunning, setIsRunning] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);

  // 计算激波理论数据
  const calculateShockWaveData = (
    M1: number,
    theta: number,
    gamma: number
  ): ShockWaveData => {
    const thetaRad = theta * Math.PI / 180;
    
    // 使用θ-β-M关系求解激波角度β
    let beta = Math.PI / 4; // 初始猜测45度
    let iterations = 0;
    const maxIterations = 100;
    const tolerance = 1e-6;
    
    while (iterations < maxIterations) {
      const tanTheta = 2 * (1 / Math.tan(beta)) * 
        ((Math.pow(M1 * Math.sin(beta), 2) - 1) / 
         (Math.pow(M1, 2) * (gamma + Math.cos(2 * beta)) + 2));
      
      const calculatedTheta = Math.atan(tanTheta);
      const error = Math.abs(calculatedTheta - thetaRad);
      
      if (error < tolerance) break;
      
      // 调整β值
      if (calculatedTheta > thetaRad) {
        beta -= 0.001;
      } else {
        beta += 0.001;
      }
      
      iterations++;
    }
    
    const shockAngle = beta * 180 / Math.PI;

  // 计算激波后参数
    const M1n = M1 * Math.sin(beta); // 激波前法向马赫数
    
    // Rankine-Hugoniot关系
    const pressureRatio = 1 + (2 * gamma / (gamma + 1)) * (M1n * M1n - 1);
    const densityRatio = ((gamma + 1) * M1n * M1n) / ((gamma - 1) * M1n * M1n + 2);
    const temperatureRatio = pressureRatio / densityRatio;
    
    // 激波后法向马赫数
    const M2n = Math.sqrt((M1n * M1n + 2 / (gamma - 1)) / (2 * gamma * M1n * M1n / (gamma - 1) - 1));
    
    // 激波后马赫数
    const machNumberDownstream = M2n / Math.sin(beta - thetaRad);
    
    const velocityRatio = 1 / densityRatio;
    
    // 总压损失
    const totalPressureLoss = 1 - Math.pow(pressureRatio * Math.pow(temperatureRatio, -gamma / (gamma - 1)), 1);
    
    return {
      shockAngle,
      deflectionAngle: theta,
      pressureRatio,
      densityRatio,
      temperatureRatio,
      velocityRatio,
      machNumberDownstream,
      totalPressureLoss
    };
  };

  // 实时计算激波数据
  const shockData = useMemo(() => {
    if (machNumber <= 1 || wedgeAngle <= 0) return null;
    return calculateShockWaveData(machNumber, wedgeAngle, gasGamma);
  }, [machNumber, wedgeAngle, gasGamma]);

  // 控制函数
  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setMachNumber(2.5);
    setWedgeAngle(15);
    setGasGamma(1.4);
    setAutoRotate(false);
  };

  // 准备图表数据
  const chartData = shockData ? [
    { parameter: '激波角', value: shockData.shockAngle, unit: '°' },
    { parameter: '压力比', value: shockData.pressureRatio, unit: '' },
    { parameter: '密度比', value: shockData.densityRatio, unit: '' },
    { parameter: '温度比', value: shockData.temperatureRatio, unit: '' },
    { parameter: '下游马赫数', value: shockData.machNumberDownstream, unit: '' }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">激波实验</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            探索超声速流动中的激波现象，理解激波的形成机制和参数变化规律
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="secondary">超声速流动</Badge>
            <Badge variant="secondary">激波理论</Badge>
            <Badge variant="secondary">3D可视化</Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 控制面板 */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-gray-800/50 border-gray-700 text-white">
              <CardHeader>
                <CardTitle className="text-white">实验参数</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 马赫数控制 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    马赫数: {machNumber.toFixed(2)}
                  </label>
                  <Slider
                    value={[machNumber]}
                    onValueChange={(value) => setMachNumber(value[0])}
                    min={1.1}
                    max={5.0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    范围: 1.1 - 5.0
                  </div>
                </div>

                {/* 楔形角度 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    楔形角度: {wedgeAngle.toFixed(1)}°
                  </label>
                  <Slider
                    value={[wedgeAngle]}
                    onValueChange={(value) => setWedgeAngle(value[0])}
                    min={5}
                    max={40}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    范围: 5° - 40°
                  </div>
                </div>

                {/* 比热比 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    比热比: {gasGamma.toFixed(2)}
                  </label>
                  <Slider
                    value={[gasGamma]}
                    onValueChange={(value) => setGasGamma(value[0])}
                    min={1.1}
                    max={1.8}
                    step={0.01}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    空气: 1.4, 氦气: 1.67
                  </div>
                </div>

                {/* 进口压力 */}
              <div>
                  <label className="block text-sm font-medium mb-2">
                    进口压力: {(inletPressure / 1000).toFixed(1)} kPa
                </label>
                  <Slider
                    value={[inletPressure]}
                    onValueChange={(value) => setInletPressure(value[0])}
                    min={50000}
                    max={500000}
                    step={1000}
                    className="w-full"
                />
              </div>

                {/* 进口温度 */}
              <div>
                  <label className="block text-sm font-medium mb-2">
                    进口温度: {inletTemperature.toFixed(0)} K
                </label>
                  <Slider
                    value={[inletTemperature]}
                    onValueChange={(value) => setInletTemperature(value[0])}
                    min={200}
                    max={400}
                    step={1}
                    className="w-full"
                />
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
                      checked={autoRotate}
                      onChange={(e) => setAutoRotate(e.target.checked)}
                    />
                    <span className="text-sm">自动旋转</span>
                  </label>
              </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 主要可视化区域 */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>激波3D可视化</span>
                  {isRunning && (
                    <Badge className="bg-green-500 text-white">
                      运行中
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] relative">
                  <ShockWaveSimulation
                    machNumber={machNumber}
                    wedgeAngle={wedgeAngle}
                    gasGamma={gasGamma}
                    inletPressure={inletPressure}
                    inletTemperature={inletTemperature}
                    autoRotate={autoRotate}
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 参数变化图表 */}
            {shockData && (
              <Card className="mt-4 bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">激波参数分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="parameter" 
                        stroke="#9CA3AF"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value, name) => [
                          typeof value === 'number' ? value.toFixed(3) : value, 
                          '数值'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 8, fill: '#60A5FA' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* 数据面板 */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="bg-gray-800/50 border-gray-700 text-white">
              <CardHeader>
                <CardTitle className="text-white">计算结果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shockData ? (
                  <>
                    <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-700">
                      <div className="text-sm text-blue-300">激波角</div>
                      <div className="text-lg font-semibold text-white">
                        {shockData.shockAngle.toFixed(2)}°
                      </div>
                    </div>

                    <div className="p-3 bg-green-900/30 rounded-lg border border-green-700">
                      <div className="text-sm text-green-300">压力比 P₂/P₁</div>
                      <div className="text-lg font-semibold text-white">
                        {shockData.pressureRatio.toFixed(3)}
                </div>
              </div>
              
                    <div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-700">
                      <div className="text-sm text-yellow-300">密度比 ρ₂/ρ₁</div>
                      <div className="text-lg font-semibold text-white">
                        {shockData.densityRatio.toFixed(3)}
                </div>
              </div>
              
                    <div className="p-3 bg-red-900/30 rounded-lg border border-red-700">
                      <div className="text-sm text-red-300">温度比 T₂/T₁</div>
                      <div className="text-lg font-semibold text-white">
                        {shockData.temperatureRatio.toFixed(3)}
                </div>
              </div>
              
                    <div className="p-3 bg-purple-900/30 rounded-lg border border-purple-700">
                      <div className="text-sm text-purple-300">下游马赫数</div>
                      <div className="text-lg font-semibold text-white">
                        {shockData.machNumberDownstream.toFixed(3)}
              </div>
            </div>

                    <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                      <div className="text-sm text-gray-300">总压损失</div>
                      <div className="text-lg font-semibold text-white">
                        {(shockData.totalPressureLoss * 100).toFixed(2)}%
              </div>
            </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <p>请设置马赫数 &gt; 1 以查看激波数据</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 理论说明 */}
            <Card className="mt-4 bg-gray-800/50 border-gray-700 text-white">
              <CardHeader>
                <CardTitle className="text-white">理论基础</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-300 space-y-2">
                  <p><strong>激波关系式:</strong></p>
                  <p className="font-mono text-xs">
                    θ-β-M 关系<br/>
                    Rankine-Hugoniot 方程
                  </p>
                  
                  <p><strong>关键参数:</strong></p>
                  <ul className="text-xs space-y-1">
                                         <li>• 激波角 β</li>
                     <li>• 偏转角 θ</li>
                     <li>• 马赫数 M</li>
                     <li>• 比热比 γ</li>
                  </ul>
                  
                  <p><strong>应用领域:</strong></p>
                  <ul className="text-xs space-y-1">
                    <li>• 超声速飞行器设计</li>
                    <li>• 激波风洞实验</li>
                    <li>• 火箭发动机喷管</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ShockWaveExperiment; 