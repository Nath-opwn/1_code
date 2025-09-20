import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import KarmanVortexStreet from '../components/3D/KarmanVortexStreet';
import { DataExportManager } from '../components/DataVisualization/DataExportManager';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Play, Pause, BarChart3, FileText, Camera } from 'lucide-react';

// 数据类型定义
interface SimulationData {
  time: number;
  maxVorticity: number;
  avgVelocity: number;
  pressure: number;
  strouhalNumber?: number;
  dragCoefficient?: number;
  liftCoefficient?: number;
}

interface ExportData {
  experimentType: string;
  timestamp: string;
  parameters: {
    reynoldsNumber: number;
    obstacleSize: number;
    flowSpeed: number;
    duration: number;
  };
  results: {
    timeHistory: SimulationData[];
    statistics: {
      avgStrouhalNumber: number;
      maxVorticity: number;
      avgDragCoefficient: number;
      rmsLiftCoefficient: number;
    };
  };
  metadata: {
    samplingRate: number;
    totalSamples: number;
    experimentDuration: number;
  };
}

const KarmanVortexExperiment: React.FC = () => {
  // 基础参数状态
  const [reynoldsNumber, setReynoldsNumber] = useState<number>(120);
  const [obstacleSize, setObstacleSize] = useState<number>(1.0);
  const [flowSpeed, setFlowSpeed] = useState<number>(1.2);
  const [showVorticity, setShowVorticity] = useState<boolean>(true);
  const [showPressure, setShowPressure] = useState<boolean>(false);
  const [showVelocity, setShowVelocity] = useState<boolean>(true);
  const [showStreamlines, setShowStreamlines] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // 数据记录状态
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [currentData, setCurrentData] = useState<SimulationData>({
    time: 0,
    maxVorticity: 0,
    avgVelocity: 0,
    pressure: 0
  });
  const [dataHistory, setDataHistory] = useState<SimulationData[]>([]);
  const [showDataPanel, setShowDataPanel] = useState<boolean>(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);

  // 引用
  const recordingStartTime = useRef<number>(0);
  const recordingTimer = useRef<number>();

  // 计算衍生参数
  const strouhalNumber = (obstacleSize && flowSpeed) ? 0.2 * flowSpeed / obstacleSize : 0;
  const dragCoefficient = reynoldsNumber > 0 ? 1.2 - 0.002 * reynoldsNumber + 0.000005 * reynoldsNumber * reynoldsNumber : 0;

  // 处理仿真数据
  const handleSimulationData = (data: Omit<SimulationData, 'strouhalNumber' | 'dragCoefficient'>) => {
    const enhancedData: SimulationData = {
      ...data,
      strouhalNumber,
      dragCoefficient,
      liftCoefficient: Math.sin(data.time * 2 * Math.PI * strouhalNumber) * 0.5 // 简化的升力系数计算
    };

    setCurrentData(enhancedData);

    // 如果正在记录，添加到历史数据
    if (isRecording) {
      setDataHistory(prev => [...prev, enhancedData]);
    }
  };

  // 开始/停止录制
  const toggleRecording = () => {
    if (isRecording) {
      // 停止录制
      setIsRecording(false);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      
      // 生成导出数据
      generateExportData();
    } else {
      // 开始录制
      setIsRecording(true);
      setDataHistory([]);
      setRecordingDuration(0);
      recordingStartTime.current = Date.now();
      
      // 启动计时器
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);
    }
  };

  // 生成导出数据
  const generateExportData = () => {
    if (dataHistory.length === 0) return;

    const statistics = {
      avgStrouhalNumber: dataHistory.reduce((sum, d) => sum + (d.strouhalNumber || 0), 0) / dataHistory.length,
      maxVorticity: Math.max(...dataHistory.map(d => d.maxVorticity)),
      avgDragCoefficient: dataHistory.reduce((sum, d) => sum + (d.dragCoefficient || 0), 0) / dataHistory.length,
      rmsLiftCoefficient: Math.sqrt(
        dataHistory.reduce((sum, d) => sum + Math.pow(d.liftCoefficient || 0, 2), 0) / dataHistory.length
      )
    };

    const exportData: ExportData = {
      experimentType: 'karman-vortex-street',
      timestamp: new Date().toISOString(),
      parameters: {
        reynoldsNumber,
        obstacleSize,
        flowSpeed,
        duration: recordingDuration
      },
      results: {
        timeHistory: dataHistory,
        statistics
      },
      metadata: {
        samplingRate: dataHistory.length / recordingDuration,
        totalSamples: dataHistory.length,
        experimentDuration: recordingDuration
      }
    };

    setExportData(exportData);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-blue-900 to-dark">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-display">
            卡门涡街<span className="text-blue-400">实验</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            观察圆柱绕流中周期性涡旋脱落现象的3D动画演示与数据分析
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 控制面板 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="glass-panel p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">实验参数</h2>
              
              {/* 雷诺数 */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  雷诺数: {reynoldsNumber}
                </label>
                <input
                  type="range"
                  min="40"
                  max="300"
                  value={reynoldsNumber}
                  onChange={(e) => setReynoldsNumber(Number(e.target.value))}
                  className="w-full accent-blue-500"
                  disabled={isRecording}
                />
                <div className="text-xs text-blue-300 mt-1">
                  {reynoldsNumber < 150 ? '层流脱落' : 
                   reynoldsNumber < 300 ? '过渡区' : '湍流脱落'}
                </div>
              </div>

              {/* 障碍物尺寸 */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  圆柱直径: {obstacleSize.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={obstacleSize}
                  onChange={(e) => setObstacleSize(Number(e.target.value))}
                  className="w-full accent-blue-500"
                  disabled={isRecording}
                />
              </div>

              {/* 流速 */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  流速: {flowSpeed.toFixed(1)} m/s
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={flowSpeed}
                  onChange={(e) => setFlowSpeed(Number(e.target.value))}
                  className="w-full accent-blue-500"
                  disabled={isRecording}
                />
              </div>

              {/* 可视化选项 */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-blue-200">可视化选项</h3>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showVorticity}
                    onChange={(e) => setShowVorticity(e.target.checked)}
                    className="mr-2 accent-blue-500"
                  />
                  <span className="text-blue-100 text-sm">涡量场</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showPressure}
                    onChange={(e) => setShowPressure(e.target.checked)}
                    className="mr-2 accent-blue-500"
                  />
                  <span className="text-blue-100 text-sm">压力场</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showVelocity}
                    onChange={(e) => setShowVelocity(e.target.checked)}
                    className="mr-2 accent-blue-500"
                  />
                  <span className="text-blue-100 text-sm">速度场</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showStreamlines}
                    onChange={(e) => setShowStreamlines(e.target.checked)}
                    className="mr-2 accent-blue-500"
                  />
                  <span className="text-blue-100 text-sm">流线</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => setAutoRotate(e.target.checked)}
                    className="mr-2 accent-blue-500"
                  />
                  <span className="text-blue-100 text-sm">自动旋转</span>
                </label>
              </div>

              {/* 数据记录控制 */}
              <div className="pt-4 border-t border-blue-800/30 space-y-3">
                <h3 className="text-lg font-medium text-blue-200">数据记录</h3>
                
                <button
                  onClick={toggleRecording}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isRecording ? <Pause size={16} /> : <Play size={16} />}
                  {isRecording ? '停止录制' : '开始录制'}
                </button>

                {isRecording && (
                  <div className="text-center text-blue-200">
                    <div className="text-sm">录制时间</div>
                    <div className="text-lg font-mono">{recordingDuration.toFixed(1)}s</div>
                  </div>
                )}

                <button
                  onClick={() => setShowDataPanel(!showDataPanel)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <BarChart3 size={16} />
                  {showDataPanel ? '隐藏数据面板' : '显示数据面板'}
                </button>
              </div>

              {/* 实时数据显示 */}
              <div className="pt-4 border-t border-blue-800/30">
                <h3 className="text-sm font-medium text-blue-200 mb-3">实时数据</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-300">时间:</span>
                    <span className="text-white font-mono">{currentData.time.toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-300">最大涡量:</span>
                    <span className="text-white font-mono">{currentData.maxVorticity.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-300">平均速度:</span>
                    <span className="text-white font-mono">{currentData.avgVelocity.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-300">斯特劳哈尔数:</span>
                    <span className="text-white font-mono">{strouhalNumber.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-300">阻力系数:</span>
                    <span className="text-white font-mono">{dragCoefficient.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3D演示区域 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-3"
          >
            <div className="glass-panel h-[700px] overflow-hidden">
              <KarmanVortexStreet
                className="w-full h-full"
                reynoldsNumber={reynoldsNumber}
                obstacleSize={obstacleSize}
                flowSpeed={flowSpeed}
                showVorticity={showVorticity}
                showPressure={showPressure}
                showVelocity={showVelocity}
                showStreamlines={showStreamlines}
                autoRotate={autoRotate}
                onSimulationData={handleSimulationData}
              />
            </div>
          </motion.div>
        </div>

        {/* 数据分析面板 */}
        {showDataPanel && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6"
          >
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-cyan-300">数据分析与导出</h3>
                {dataHistory.length > 0 && (
                  <DataExportManager
                    data={{
                      experimentType: 'karman-vortex-street',
                      timestamp: new Date().toISOString(),
                      parameters: {
                        reynoldsNumber,
                        obstacleSize,
                        flowSpeed,
                        duration: recordingDuration
                      },
                      results: {
                        velocity: dataHistory.map(d => [d.avgVelocity]),
                        pressure: dataHistory.map(d => [d.pressure]),
                        vorticity: dataHistory.map(d => [d.maxVorticity])
                      },
                      metadata: {
                        reynoldsNumber: reynoldsNumber,
                        meshResolution: [100, 50],
                        timeStep: 0.1,
                        simulationTime: recordingDuration
                      }
                    }}
                    onExport={(format, data) => {
                      console.log(`Exported ${format}:`, data);
                    }}
                  />
                )}
              </div>

              {dataHistory.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 涡量历史图 */}
                  <div className="bg-black/30 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-blue-200 mb-3">涡量变化</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={dataHistory.slice(-100)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickFormatter={(value) => value.toFixed(1)}
                        />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="maxVorticity" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 升力系数历史图 */}
                  <div className="bg-black/30 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-blue-200 mb-3">升力系数</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={dataHistory.slice(-100)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickFormatter={(value) => value.toFixed(1)}
                        />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="liftCoefficient" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 速度场历史图 */}
                  <div className="bg-black/30 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-blue-200 mb-3">平均速度</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={dataHistory.slice(-100)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickFormatter={(value) => value.toFixed(1)}
                        />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="avgVelocity" 
                          stroke="#F59E0B" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 统计信息 */}
                  <div className="bg-black/30 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-blue-200 mb-3">统计信息</h4>
                    {exportData && (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-300">平均斯特劳哈尔数:</span>
                          <span className="text-white font-mono">
                            {exportData.results.statistics.avgStrouhalNumber.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-300">最大涡量:</span>
                          <span className="text-white font-mono">
                            {exportData.results.statistics.maxVorticity.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-300">平均阻力系数:</span>
                          <span className="text-white font-mono">
                            {exportData.results.statistics.avgDragCoefficient.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-300">升力系数RMS:</span>
                          <span className="text-white font-mono">
                            {exportData.results.statistics.rmsLiftCoefficient.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-300">采样点数:</span>
                          <span className="text-white font-mono">
                            {exportData.metadata.totalSamples}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-300">实验时长:</span>
                          <span className="text-white font-mono">
                            {exportData.metadata.experimentDuration.toFixed(1)}s
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {dataHistory.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="mx-auto mb-4 text-blue-400" size={48} />
                  <p className="text-blue-200 mb-2">暂无数据</p>
                  <p className="text-blue-400 text-sm">点击"开始录制"按钮开始收集实验数据</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 理论解释 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8"
        >
          <div className="glass-panel p-8">
            <h3 className="text-2xl font-semibold text-cyan-300 mb-6">理论背景</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="text-lg font-medium text-blue-200 mb-3">形成机制</h4>
                <p className="text-blue-100 text-sm leading-relaxed">
                  当流体绕过圆柱体时，由于边界层分离，在圆柱后方形成尾流区。
                  在特定雷诺数范围内，尾流会失稳并周期性地脱落涡旋，形成卡门涡街。
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-blue-200 mb-3">频率特性</h4>
                <p className="text-blue-100 text-sm leading-relaxed">
                  涡街的脱落频率由斯特劳哈尔数St = fD/U确定，其中f是脱落频率，
                  D是圆柱直径，U是来流速度。对于圆柱，St ≈ 0.2。
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-blue-200 mb-3">工程意义</h4>
                <p className="text-blue-100 text-sm leading-relaxed">
                  卡门涡街会产生周期性的横向力，可能引起结构振动。
                  在工程设计中需要考虑涡激振动对建筑物、桥梁等结构的影响。
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default KarmanVortexExperiment; 