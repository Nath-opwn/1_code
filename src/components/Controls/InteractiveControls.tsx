import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Sliders,
  MousePointer2,
  Eye,
  EyeOff,
  Zap,
  Wind,
  Thermometer,
  Droplets,
  Activity,
  BarChart3,
  Target,
  Move,
  RotateCw,
  Plus,
  Minus,
  Info,
  Save,
  FolderOpen,
  Camera,
  Video
} from 'lucide-react';

// 实验参数接口
export interface ExperimentParameters {
  // 流体属性
  fluidType: 'water' | 'air' | 'oil' | 'custom';
  density: number;
  viscosity: number;
  temperature: number;
  
  // 流动条件
  inletVelocity: number;
  outletPressure: number;
  reynoldsNumber: number;
  
  // 几何参数
  obstacleType: 'none' | 'cylinder' | 'square' | 'airfoil' | 'custom';
  obstacleSize: number;
  obstaclePosition: { x: number; y: number };
  obstacleRotation: number;
  
  // 边界条件
  wallType: 'no-slip' | 'slip' | 'moving-wall';
  wallVelocity: number;
  inletProfile: 'uniform' | 'parabolic' | 'turbulent';
  
  // 可视化设置
  visualizationType: 'velocity' | 'pressure' | 'vorticity' | 'streamlines' | 'particles';
  colorScheme: 'viridis' | 'plasma' | 'jet' | 'coolwarm';
  showVectors: boolean;
  showStreamlines: boolean;
  showParticles: boolean;
  particleCount: number;
  
  // 数值设置
  meshResolution: number;
  timeStep: number;
  turbulenceModel: 'laminar' | 'k-epsilon' | 'les';
  
  // 测量设置
  probeEnabled: boolean;
  probePosition: { x: number; y: number };
  measurementType: 'velocity' | 'pressure' | 'temperature' | 'all';
}

// 预设配置
const presetConfigurations = {
  'karman-vortex': {
    name: '卡门涡街',
    description: '圆柱绕流形成的周期性涡街',
    parameters: {
      fluidType: 'air' as const,
      density: 1.225,
      viscosity: 1.8e-5,
      temperature: 293,
      inletVelocity: 10,
      outletPressure: 101325,
      reynoldsNumber: 100,
      obstacleType: 'cylinder' as const,
      obstacleSize: 0.1,
      obstaclePosition: { x: 0.3, y: 0.5 },
      obstacleRotation: 0,
      wallType: 'no-slip' as const,
      wallVelocity: 0,
      inletProfile: 'uniform' as const,
      visualizationType: 'vorticity' as const,
      colorScheme: 'viridis' as const,
      showVectors: true,
      showStreamlines: false,
      showParticles: true,
      particleCount: 1000,
      meshResolution: 100,
      timeStep: 0.01,
      turbulenceModel: 'laminar' as const,
      probeEnabled: true,
      probePosition: { x: 0.7, y: 0.5 },
      measurementType: 'all' as const
    }
  },
  'boundary-layer': {
    name: '边界层发展',
    description: '平板上的边界层发展过程',
    parameters: {
      fluidType: 'air' as const,
      density: 1.225,
      viscosity: 1.8e-5,
      temperature: 293,
      inletVelocity: 20,
      outletPressure: 101325,
      reynoldsNumber: 1000000,
      obstacleType: 'none' as const,
      obstacleSize: 0,
      obstaclePosition: { x: 0.5, y: 0.5 },
      obstacleRotation: 0,
      wallType: 'no-slip' as const,
      wallVelocity: 0,
      inletProfile: 'uniform' as const,
      visualizationType: 'velocity' as const,
      colorScheme: 'jet' as const,
      showVectors: true,
      showStreamlines: true,
      showParticles: false,
      particleCount: 500,
      meshResolution: 150,
      timeStep: 0.001,
      turbulenceModel: 'k-epsilon' as const,
      probeEnabled: true,
      probePosition: { x: 0.8, y: 0.1 },
      measurementType: 'velocity' as const
    }
  },
  'airfoil-flow': {
    name: '翼型绕流',
    description: '翼型产生升力的流动机理',
    parameters: {
      fluidType: 'air' as const,
      density: 1.225,
      viscosity: 1.8e-5,
      temperature: 293,
      inletVelocity: 50,
      outletPressure: 101325,
      reynoldsNumber: 500000,
      obstacleType: 'airfoil' as const,
      obstacleSize: 0.2,
      obstaclePosition: { x: 0.3, y: 0.5 },
      obstacleRotation: 5,
      wallType: 'slip' as const,
      wallVelocity: 0,
      inletProfile: 'uniform' as const,
      visualizationType: 'pressure' as const,
      colorScheme: 'coolwarm' as const,
      showVectors: false,
      showStreamlines: true,
      showParticles: false,
      particleCount: 200,
      meshResolution: 120,
      timeStep: 0.005,
      turbulenceModel: 'k-epsilon' as const,
      probeEnabled: true,
      probePosition: { x: 0.3, y: 0.6 },
      measurementType: 'pressure' as const
    }
  }
};

// 流体属性数据库
const fluidProperties = {
  water: { density: 1000, viscosity: 0.001, name: '水' },
  air: { density: 1.225, viscosity: 1.8e-5, name: '空气' },
  oil: { density: 850, viscosity: 0.1, name: '机油' },
  custom: { density: 1000, viscosity: 0.001, name: '自定义' }
};

interface InteractiveControlsProps {
  parameters: ExperimentParameters;
  onParametersChange: (parameters: ExperimentParameters) => void;
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onResetSimulation: () => void;
  onSaveConfiguration: (name: string, config: ExperimentParameters) => void;
  onLoadConfiguration: (config: ExperimentParameters) => void;
  isRunning: boolean;
  simulationData?: {
    currentTime: number;
    maxVelocity: number;
    averagePressure: number;
    dragCoefficient: number;
    liftCoefficient: number;
  };
}

export const InteractiveControls: React.FC<InteractiveControlsProps> = ({
  parameters,
  onParametersChange,
  onStartSimulation,
  onPauseSimulation,
  onResetSimulation,
  onSaveConfiguration,
  onLoadConfiguration,
  isRunning,
  simulationData
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'visualization' | 'measurement'>('basic');
  const [showPresets, setShowPresets] = useState(false);
  const [dragMode, setDragMode] = useState<'obstacle' | 'probe' | 'none'>('none');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 更新参数的辅助函数
  const updateParameter = <K extends keyof ExperimentParameters>(
    key: K,
    value: ExperimentParameters[K]
  ) => {
    onParametersChange({ ...parameters, [key]: value });
  };

  // 计算雷诺数
  const calculateReynoldsNumber = () => {
    const characteristicLength = parameters.obstacleSize || 0.1;
    const Re = (parameters.density * parameters.inletVelocity * characteristicLength) / parameters.viscosity;
    updateParameter('reynoldsNumber', Re);
  };

  // 处理预设配置加载
  const loadPreset = (presetKey: keyof typeof presetConfigurations) => {
    const preset = presetConfigurations[presetKey];
    onLoadConfiguration(preset.parameters);
    setShowPresets(false);
  };

  // 处理流体类型改变
  const handleFluidTypeChange = (value: string) => {
    const fluidType = value as keyof typeof fluidProperties;
    const fluid = fluidProperties[fluidType];
    updateParameter('fluidType', fluidType);
    updateParameter('density', fluid.density);
    updateParameter('viscosity', fluid.viscosity);
  };

  // 鼠标事件处理
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    setMousePosition({ x, y });

    if (dragMode === 'obstacle') {
      updateParameter('obstaclePosition', { x, y });
    } else if (dragMode === 'probe') {
      updateParameter('probePosition', { x, y });
    }
  };

  const handleCanvasClick = () => {
    if (dragMode !== 'none') {
      setDragMode('none');
    }
  };

  // 快捷键处理
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case ' ':
            event.preventDefault();
            isRunning ? onPauseSimulation() : onStartSimulation();
            break;
          case 'r':
            event.preventDefault();
            onResetSimulation();
            break;
          case 's':
            event.preventDefault();
            // 触发保存配置
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning, onStartSimulation, onPauseSimulation, onResetSimulation]);

  const tabs = [
    { id: 'basic', label: '基本参数', icon: Sliders },
    { id: 'advanced', label: '高级设置', icon: Settings },
    { id: 'visualization', label: '可视化', icon: Eye },
    { id: 'measurement', label: '测量分析', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6">
      {/* 主控制面板 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MousePointer2 className="h-5 w-5" />
                交互式实验控制台
              </CardTitle>
              <CardDescription>
                实时调节参数，观察流体行为变化
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPresets(!showPresets)}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                预设
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsRecording(!isRecording)}
                className={isRecording ? 'text-red-600' : ''}
              >
                {isRecording ? <Video className="h-4 w-4 mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                {isRecording ? '录制中' : '录制'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 预设配置面板 */}
          <AnimatePresence>
            {showPresets && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">预设实验配置</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(presetConfigurations).map(([key, preset]) => (
                        <div key={key} className="cursor-pointer" onClick={() => loadPreset(key as keyof typeof presetConfigurations)}>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <h4 className="font-semibold">{preset.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                              <div className="mt-2 flex gap-1">
                                <Badge variant="outline" className="text-xs">
                                  Re = {preset.parameters.reynoldsNumber.toFixed(0)}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {fluidProperties[preset.parameters.fluidType].name}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 基本控制 */}
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={isRunning ? onPauseSimulation : onStartSimulation}
              className={isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}
            >
              {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isRunning ? '暂停' : '开始'}
            </Button>
            
            <Button onClick={onResetSimulation} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">拖拽模式:</span>
              <Button
                variant={dragMode === 'obstacle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDragMode(dragMode === 'obstacle' ? 'none' : 'obstacle')}
              >
                <Move className="h-4 w-4 mr-1" />
                障碍物
              </Button>
              <Button
                variant={dragMode === 'probe' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDragMode(dragMode === 'probe' ? 'none' : 'probe')}
              >
                <Target className="h-4 w-4 mr-1" />
                探针
              </Button>
            </div>
          </div>

          {/* 实时状态显示 */}
          {simulationData && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">模拟时间</div>
                <div className="text-lg font-bold text-blue-900">
                  {simulationData.currentTime.toFixed(2)}s
                </div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-sm text-red-600 font-medium">最大速度</div>
                <div className="text-lg font-bold text-red-900">
                  {simulationData.maxVelocity.toFixed(2)} m/s
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600 font-medium">平均压力</div>
                <div className="text-lg font-bold text-green-900">
                  {simulationData.averagePressure.toFixed(0)} Pa
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">阻力系数</div>
                <div className="text-lg font-bold text-purple-900">
                  {simulationData.dragCoefficient.toFixed(3)}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">升力系数</div>
                <div className="text-lg font-bold text-orange-900">
                  {simulationData.liftCoefficient.toFixed(3)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详细参数控制 */}
      <Card>
        <CardHeader>
          <div className="flex space-x-1 border-b">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 基本参数标签页 */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 流体属性 */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    流体属性
                  </h4>
                  
                  <div>
                    <label className="text-sm font-medium">流体类型</label>
                    <Select 
                      value={parameters.fluidType} 
                      onValueChange={handleFluidTypeChange}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(fluidProperties).map(([key, fluid]) => (
                          <SelectItem key={key} value={key}>
                            {fluid.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">密度 (kg/m³)</label>
                    <Slider
                      value={[parameters.density]}
                      onValueChange={([value]) => updateParameter('density', value)}
                      min={0.1}
                      max={2000}
                      step={0.1}
                      className="mt-2"
                    />
                    <span className="text-xs text-gray-500">{parameters.density.toFixed(1)}</span>
                  </div>

                  <div>
                    <label className="text-sm font-medium">粘度 (Pa·s)</label>
                    <Slider
                      value={[parameters.viscosity * 1000]}
                      onValueChange={([value]) => updateParameter('viscosity', value / 1000)}
                      min={0.001}
                      max={100}
                      step={0.001}
                      className="mt-2"
                    />
                    <span className="text-xs text-gray-500">{(parameters.viscosity * 1000).toFixed(3)} × 10⁻³</span>
                  </div>
                </div>

                {/* 流动条件 */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Wind className="h-4 w-4" />
                    流动条件
                  </h4>

                  <div>
                    <label className="text-sm font-medium">入口速度 (m/s)</label>
                    <Slider
                      value={[parameters.inletVelocity]}
                      onValueChange={([value]) => {
                        updateParameter('inletVelocity', value);
                        calculateReynoldsNumber();
                      }}
                      min={0.1}
                      max={100}
                      step={0.1}
                      className="mt-2"
                    />
                    <span className="text-xs text-gray-500">{parameters.inletVelocity.toFixed(1)}</span>
                  </div>

                  <div>
                    <label className="text-sm font-medium">出口压力 (Pa)</label>
                    <Slider
                      value={[parameters.outletPressure]}
                      onValueChange={([value]) => updateParameter('outletPressure', value)}
                      min={90000}
                      max={120000}
                      step={100}
                      className="mt-2"
                    />
                    <span className="text-xs text-gray-500">{parameters.outletPressure.toFixed(0)}</span>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">雷诺数</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {parameters.reynoldsNumber.toFixed(0)}
                    </div>
                    <div className="text-xs text-blue-700">
                      {parameters.reynoldsNumber < 2300 ? '层流' : 
                       parameters.reynoldsNumber < 4000 ? '过渡流' : '湍流'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 几何参数 */}
              <div className="space-y-4">
                <h4 className="font-semibold">几何参数</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">障碍物类型</label>
                    <Select 
                      value={parameters.obstacleType} 
                      onValueChange={(value: any) => updateParameter('obstacleType', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">无障碍物</SelectItem>
                        <SelectItem value="cylinder">圆柱</SelectItem>
                        <SelectItem value="square">方形</SelectItem>
                        <SelectItem value="airfoil">翼型</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">障碍物尺寸</label>
                    <Slider
                      value={[parameters.obstacleSize]}
                      onValueChange={([value]) => {
                        updateParameter('obstacleSize', value);
                        calculateReynoldsNumber();
                      }}
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      className="mt-2"
                      disabled={parameters.obstacleType === 'none'}
                    />
                    <span className="text-xs text-gray-500">{parameters.obstacleSize.toFixed(2)} m</span>
                  </div>

                  <div>
                    <label className="text-sm font-medium">障碍物角度 (度)</label>
                    <Slider
                      value={[parameters.obstacleRotation]}
                      onValueChange={([value]) => updateParameter('obstacleRotation', value)}
                      min={-45}
                      max={45}
                      step={1}
                      className="mt-2"
                      disabled={parameters.obstacleType === 'none' || parameters.obstacleType === 'cylinder'}
                    />
                    <span className="text-xs text-gray-500">{parameters.obstacleRotation}°</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 高级设置标签页 */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 边界条件 */}
                <div className="space-y-4">
                  <h4 className="font-semibold">边界条件</h4>
                  
                  <div>
                    <label className="text-sm font-medium">壁面类型</label>
                    <Select 
                      value={parameters.wallType} 
                      onValueChange={(value: any) => updateParameter('wallType', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-slip">无滑移壁面</SelectItem>
                        <SelectItem value="slip">滑移壁面</SelectItem>
                        <SelectItem value="moving-wall">运动壁面</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">入口速度分布</label>
                    <Select 
                      value={parameters.inletProfile} 
                      onValueChange={(value: any) => updateParameter('inletProfile', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uniform">均匀分布</SelectItem>
                        <SelectItem value="parabolic">抛物线分布</SelectItem>
                        <SelectItem value="turbulent">湍流分布</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 数值设置 */}
                <div className="space-y-4">
                  <h4 className="font-semibold">数值设置</h4>
                  
                  <div>
                    <label className="text-sm font-medium">网格分辨率</label>
                    <Slider
                      value={[parameters.meshResolution]}
                      onValueChange={([value]) => updateParameter('meshResolution', value)}
                      min={50}
                      max={200}
                      step={10}
                      className="mt-2"
                    />
                    <span className="text-xs text-gray-500">{parameters.meshResolution} × {Math.floor(parameters.meshResolution / 2)}</span>
                  </div>

                  <div>
                    <label className="text-sm font-medium">时间步长 (s)</label>
                    <Slider
                      value={[parameters.timeStep * 1000]}
                      onValueChange={([value]) => updateParameter('timeStep', value / 1000)}
                      min={0.1}
                      max={50}
                      step={0.1}
                      className="mt-2"
                    />
                    <span className="text-xs text-gray-500">{(parameters.timeStep * 1000).toFixed(1)} ms</span>
                  </div>

                  <div>
                    <label className="text-sm font-medium">湍流模型</label>
                    <Select 
                      value={parameters.turbulenceModel} 
                      onValueChange={(value: any) => updateParameter('turbulenceModel', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laminar">层流</SelectItem>
                        <SelectItem value="k-epsilon">k-ε模型</SelectItem>
                        <SelectItem value="les">大涡模拟</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 可视化标签页 */}
          {activeTab === 'visualization' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    可视化类型
                  </h4>

                  <div>
                    <label className="text-sm font-medium">主要显示</label>
                    <Select 
                      value={parameters.visualizationType} 
                      onValueChange={(value: any) => updateParameter('visualizationType', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="velocity">速度场</SelectItem>
                        <SelectItem value="pressure">压力场</SelectItem>
                        <SelectItem value="vorticity">涡量场</SelectItem>
                        <SelectItem value="streamlines">流线</SelectItem>
                        <SelectItem value="particles">粒子轨迹</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">颜色方案</label>
                    <Select 
                      value={parameters.colorScheme} 
                      onValueChange={(value: any) => updateParameter('colorScheme', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viridis">Viridis (蓝绿紫)</SelectItem>
                        <SelectItem value="plasma">Plasma (紫红黄)</SelectItem>
                        <SelectItem value="jet">Jet (蓝青黄红)</SelectItem>
                        <SelectItem value="coolwarm">Cool-Warm (蓝白红)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">显示选项</h4>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">显示速度矢量</label>
                    <Switch
                      checked={parameters.showVectors}
                      onCheckedChange={(checked) => updateParameter('showVectors', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">显示流线</label>
                    <Switch
                      checked={parameters.showStreamlines}
                      onCheckedChange={(checked) => updateParameter('showStreamlines', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">显示粒子</label>
                    <Switch
                      checked={parameters.showParticles}
                      onCheckedChange={(checked) => updateParameter('showParticles', checked)}
                    />
                  </div>

                  {parameters.showParticles && (
                    <div>
                      <label className="text-sm font-medium">粒子数量</label>
                      <Slider
                        value={[parameters.particleCount]}
                        onValueChange={([value]) => updateParameter('particleCount', value)}
                        min={100}
                        max={5000}
                        step={100}
                        className="mt-2"
                      />
                      <span className="text-xs text-gray-500">{parameters.particleCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 测量分析标签页 */}
          {activeTab === 'measurement' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    测量探针
                  </h4>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">启用探针测量</label>
                    <Switch
                      checked={parameters.probeEnabled}
                      onCheckedChange={(checked) => updateParameter('probeEnabled', checked)}
                    />
                  </div>

                  {parameters.probeEnabled && (
                    <>
                      <div>
                        <label className="text-sm font-medium">测量类型</label>
                        <Select 
                          value={parameters.measurementType} 
                          onValueChange={(value: any) => updateParameter('measurementType', value)}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="velocity">速度</SelectItem>
                            <SelectItem value="pressure">压力</SelectItem>
                            <SelectItem value="temperature">温度</SelectItem>
                            <SelectItem value="all">全部参数</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium mb-2">探针位置</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-600">X坐标</label>
                            <div className="text-lg font-mono">{parameters.probePosition.x.toFixed(3)}</div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Y坐标</label>
                            <div className="text-lg font-mono">{parameters.probePosition.y.toFixed(3)}</div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDragMode('probe')}
                            className="w-full"
                          >
                            <Move className="h-4 w-4 mr-2" />
                            拖拽调整位置
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">实时测量值</h4>
                  
                  {parameters.probeEnabled && simulationData ? (
                    <div className="space-y-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium">局部速度</div>
                        <div className="text-xl font-bold text-blue-900">
                          {(simulationData.maxVelocity * 0.8).toFixed(2)} m/s
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-green-600 font-medium">局部压力</div>
                        <div className="text-xl font-bold text-green-900">
                          {(simulationData.averagePressure + 150).toFixed(0)} Pa
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-sm text-purple-600 font-medium">涡量</div>
                        <div className="text-xl font-bold text-purple-900">
                          {(Math.random() * 10 - 5).toFixed(1)} 1/s
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        启用探针测量以查看实时数据
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 交互式画布（用于拖拽操作） */}
      <Card>
        <CardHeader>
          <CardTitle>交互式操作区域</CardTitle>
          <CardDescription>
            点击并拖拽来调整障碍物和探针位置
            {dragMode !== 'none' && (
              <Badge className="ml-2">
                正在拖拽: {dragMode === 'obstacle' ? '障碍物' : '探针'}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            width={800}
            height={300}
            className="w-full border rounded-lg cursor-crosshair"
            onMouseMove={handleCanvasMouseMove}
            onClick={handleCanvasClick}
            style={{ 
              background: 'linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%)',
              cursor: dragMode !== 'none' ? 'move' : 'crosshair'
            }}
          />
          <div className="mt-2 text-xs text-gray-500 flex justify-between">
            <span>鼠标位置: ({mousePosition.x.toFixed(3)}, {mousePosition.y.toFixed(3)})</span>
            <span>提示: 使用空格键暂停/继续，Ctrl+R重置</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 