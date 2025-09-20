import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  BarChart3, 
  Download, 
  BookOpen,
  Cpu,
  Eye,
  Target,
  Info,
  ChevronRight
} from 'lucide-react';
import { DataExportManager, ExportData } from '@/components/DataVisualization/DataExportManager';
import { AdvancedCharts } from '@/components/DataVisualization/AdvancedCharts';
import { InteractiveControls, ExperimentParameters } from '@/components/Controls/InteractiveControls';
import { CaseStudyLibrary } from '@/components/Education/CaseStudyLibrary';
import { AdvancedFluidEngine, FluidEngineCore } from '@/components/Physics/AdvancedFluidEngine';

// 模拟数据生成函数
const generateMockFluidData = (params: ExperimentParameters, time: number) => {
  const { meshResolution, inletVelocity, obstacleSize, obstaclePosition } = params;
  const width = meshResolution;
  const height = Math.floor(meshResolution / 2);
  
  const data = Array(height).fill(null).map((_, j) =>
    Array(width).fill(null).map((_, i) => {
      const x = i / width;
      const y = j / height;
      
      // 计算距离障碍物的距离
      const dx = x - obstaclePosition.x;
      const dy = y - obstaclePosition.y;
      const distanceToObstacle = Math.sqrt(dx * dx + dy * dy);
      
      // 基础流场
      let u = inletVelocity;
      let v = 0;
      let p = 101325;
      let vorticity = 0;
      
      // 障碍物影响
      if (params.obstacleType !== 'none' && distanceToObstacle < obstacleSize) {
        u = 0;
        v = 0;
        p += 1000;
      } else if (distanceToObstacle < obstacleSize * 3) {
        // 绕流效应
        const angle = Math.atan2(dy, dx);
        const influence = Math.exp(-distanceToObstacle / obstacleSize);
        
        u *= (1 + 0.5 * influence * Math.cos(angle + time * 2));
        v += 0.3 * influence * Math.sin(angle + time * 2) * inletVelocity;
        
        // 卡门涡街效应
        if (params.obstacleType === 'cylinder' && params.reynoldsNumber > 40) {
          const strouhal = 0.2;
          const frequency = strouhal * inletVelocity / obstacleSize;
          vorticity = 10 * influence * Math.sin(2 * Math.PI * frequency * time + angle * 2);
        }
      }
      
      return {
        x,
        y,
        u,
        v,
        p,
        vorticity,
        temperature: params.temperature
      };
    })
  );
  
  return data;
};

const EnhancedExperimentPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'experiment' | 'casestudy' | 'analysis'>('experiment');
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [fluidData, setFluidData] = useState<any[][]>([]);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  
  // 实验参数状态
  const [experimentParams, setExperimentParams] = useState<ExperimentParameters>({
    fluidType: 'air',
    density: 1.225,
    viscosity: 1.8e-5,
    temperature: 293,
    inletVelocity: 10,
    outletPressure: 101325,
    reynoldsNumber: 100,
    obstacleType: 'cylinder',
    obstacleSize: 0.1,
    obstaclePosition: { x: 0.3, y: 0.5 },
    obstacleRotation: 0,
    wallType: 'no-slip',
    wallVelocity: 0,
    inletProfile: 'uniform',
    visualizationType: 'vorticity',
    colorScheme: 'viridis',
    showVectors: true,
    showStreamlines: false,
    showParticles: true,
    particleCount: 1000,
    meshResolution: 100,
    timeStep: 0.01,
    turbulenceModel: 'laminar',
    probeEnabled: true,
    probePosition: { x: 0.7, y: 0.5 },
    measurementType: 'all'
  });

  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);

  // 模拟循环
  const simulationLoop = useCallback(() => {
    if (isRunning) {
      timeRef.current += experimentParams.timeStep;
      setCurrentTime(timeRef.current);
      
      // 生成模拟数据
      const newData = generateMockFluidData(experimentParams, timeRef.current);
      setFluidData(newData);
      
      // 更新导出数据
      const velocityField = newData.map(row => row.map(cell => cell.u));
      const pressureField = newData.map(row => row.map(cell => cell.p));
      const vorticityField = newData.map(row => row.map(cell => cell.vorticity));
      
      setExportData({
        experimentType: `${experimentParams.obstacleType}-flow`,
        timestamp: new Date().toISOString(),
        parameters: {
          reynoldsNumber: experimentParams.reynoldsNumber,
          inletVelocity: experimentParams.inletVelocity,
          obstacleSize: experimentParams.obstacleSize,
          fluidType: experimentParams.fluidType
        },
        results: {
          velocity: velocityField,
          pressure: pressureField,
          vorticity: vorticityField
        },
        metadata: {
          reynoldsNumber: experimentParams.reynoldsNumber,
          meshResolution: [experimentParams.meshResolution, Math.floor(experimentParams.meshResolution / 2)],
          timeStep: experimentParams.timeStep,
          simulationTime: timeRef.current
        }
      });
      
      animationRef.current = requestAnimationFrame(simulationLoop);
    }
  }, [isRunning, experimentParams]);

  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(simulationLoop);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, simulationLoop]);

  // 控制函数
  const handleStartSimulation = () => {
    setIsRunning(true);
  };

  const handlePauseSimulation = () => {
    setIsRunning(false);
  };

  const handleResetSimulation = () => {
    setIsRunning(false);
    timeRef.current = 0;
    setCurrentTime(0);
    setFluidData([]);
  };

  const handleParametersChange = (newParams: ExperimentParameters) => {
    setExperimentParams(newParams);
  };

  const handleSaveConfiguration = (name: string, config: ExperimentParameters) => {
    // 实现配置保存逻辑
    localStorage.setItem(`experiment-config-${name}`, JSON.stringify(config));
  };

  const handleLoadConfiguration = (config: ExperimentParameters) => {
    setExperimentParams(config);
  };

  // 模拟数据
  const simulationData = {
    currentTime,
    maxVelocity: Math.max(...(fluidData.flat().map(cell => 
      cell ? Math.sqrt(cell.u * cell.u + cell.v * cell.v) : 0
    )), 0),
    averagePressure: fluidData.length > 0 ? 
      fluidData.flat().reduce((sum, cell) => sum + (cell?.p || 0), 0) / fluidData.flat().length : 
      101325,
    dragCoefficient: 0.47 + 0.1 * Math.sin(currentTime * 0.5),
    liftCoefficient: 0.1 * Math.sin(currentTime * 2)
  };

  const sections = [
    { 
      id: 'experiment', 
      label: '交互实验', 
      icon: Cpu, 
      description: '实时参数调节和高级物理仿真' 
    },
    { 
      id: 'casestudy', 
      label: '案例学习', 
      icon: BookOpen, 
      description: '经典流体力学案例深度分析' 
    },
    { 
      id: 'analysis', 
      label: '数据分析', 
      icon: BarChart3, 
      description: '高级可视化和数据导出' 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Cpu className="h-8 w-8 text-white" />
                </div>
                增强版流体力学实验室
              </CardTitle>
              <CardDescription className="text-blue-100 text-lg">
                集成高级物理引擎、交互控制、数据可视化和教学案例的综合实验平台
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        {/* 导航标签 */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? 'default' : 'ghost'}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`flex items-center gap-2 ${
                    activeSection === section.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-100 hover:bg-white/20'
                  }`}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </Button>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-black/20 rounded-lg">
              <p className="text-blue-100 text-sm">
                {sections.find(s => s.id === activeSection)?.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 内容区域 */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 交互实验部分 */}
          {activeSection === 'experiment' && (
            <div className="space-y-6">
              {/* 交互控制面板 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-1">
                <InteractiveControls
                  parameters={experimentParams}
                  onParametersChange={handleParametersChange}
                  onStartSimulation={handleStartSimulation}
                  onPauseSimulation={handlePauseSimulation}
                  onResetSimulation={handleResetSimulation}
                  onSaveConfiguration={handleSaveConfiguration}
                  onLoadConfiguration={handleLoadConfiguration}
                  isRunning={isRunning}
                  simulationData={simulationData}
                />
              </div>

              {/* 高级物理引擎 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-1">
                <AdvancedFluidEngine
                  width={800}
                  height={400}
                  onDataUpdate={(data) => {
                    // 处理引擎数据更新
                    console.log('Engine data updated:', data.length);
                  }}
                />
              </div>
            </div>
          )}

          {/* 案例学习部分 */}
          {activeSection === 'casestudy' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-1">
              <CaseStudyLibrary />
            </div>
          )}

          {/* 数据分析部分 */}
          {activeSection === 'analysis' && (
            <div className="space-y-6">
              {/* 高级图表 */}
              {fluidData.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-1">
                  <AdvancedCharts
                    data={fluidData}
                    width={experimentParams.meshResolution}
                    height={Math.floor(experimentParams.meshResolution / 2)}
                    reynoldsNumber={experimentParams.reynoldsNumber}
                    timeStep={experimentParams.timeStep}
                    currentTime={currentTime}
                  />
                </div>
              )}

              {/* 数据导出管理器 */}
              {exportData && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-1">
                  <DataExportManager
                    data={exportData}
                    onExport={(format, data) => {
                      console.log(`Exported ${format}:`, data);
                    }}
                  />
                </div>
              )}

              {/* 提示信息 */}
              {(!fluidData.length || !exportData) && (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-8 text-center">
                    <Info className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">开始实验以查看数据分析</h3>
                    <p className="text-blue-200">
                      切换到"交互实验"标签页，启动模拟后返回此处查看详细的数据可视化和导出选项
                    </p>
                    <Button 
                      onClick={() => setActiveSection('experiment')}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <ChevronRight className="h-4 w-4 mr-2" />
                      前往实验页面
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </motion.div>

        {/* 功能特性展示 */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5" />
              平台特性
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-500/20 p-4 rounded-lg">
                <Eye className="h-8 w-8 text-blue-400 mb-2" />
                <h4 className="font-semibold text-white">高级可视化</h4>
                <p className="text-blue-200 text-sm">多种颜色映射、等高线、矢量场显示</p>
              </div>
              
              <div className="bg-green-500/20 p-4 rounded-lg">
                <Download className="h-8 w-8 text-green-400 mb-2" />
                <h4 className="font-semibold text-white">数据导出</h4>
                <p className="text-green-200 text-sm">CSV、JSON、VTK、PNG等多格式导出</p>
              </div>
              
              <div className="bg-purple-500/20 p-4 rounded-lg">
                <BookOpen className="h-8 w-8 text-purple-400 mb-2" />
                <h4 className="font-semibold text-white">教学案例</h4>
                <p className="text-purple-200 text-sm">经典实验深度分析和理论讲解</p>
              </div>
              
              <div className="bg-orange-500/20 p-4 rounded-lg">
                <Cpu className="h-8 w-8 text-orange-400 mb-2" />
                <h4 className="font-semibold text-white">物理引擎</h4>
                <p className="text-orange-200 text-sm">基于Navier-Stokes方程的精确仿真</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 使用提示 */}
        <Alert className="bg-blue-500/20 border-blue-400/30">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-100">
            <strong>使用提示：</strong> 
            在交互实验中，您可以实时调节参数观察流体行为变化。
            支持拖拽调整障碍物位置，多种湍流模型选择，以及实时数据探针测量。
            所有实验数据都可以导出为多种格式用于进一步分析。
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default EnhancedExperimentPage; 