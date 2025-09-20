import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import labService, { LabExperimentType } from '../services/labService';

interface Experiment {
  type: LabExperimentType;
  name: string;
  description: string;
}

// 实验分类
const categories = [
  { id: 'all', name: '全部实验' },
  { id: 'static', name: '静力学实验' },
  { id: 'flow', name: '流动特性实验' },
  { id: 'resistance', name: '流动阻力实验' },
  { id: 'momentum', name: '动量定律实验' },
  { id: 'comprehensive', name: '综合应用实验' },
  { id: 'demo', name: '演示类实验' },
  { id: 'cultural', name: '传统文化' }
];

// 获取实验分类
function getExperimentCategory(type: LabExperimentType): string {
  const categoryMap: Record<LabExperimentType, string> = {
    [LabExperimentType.STATIC_PRESSURE]: 'static',
    [LabExperimentType.FLUID_STATICS]: 'static',
    [LabExperimentType.REYNOLDS]: 'flow',
    [LabExperimentType.BERNOULLI]: 'flow',
    [LabExperimentType.VENTURI]: 'flow',
    [LabExperimentType.FRICTION_LOSS]: 'resistance',
    [LabExperimentType.LOCAL_LOSS]: 'resistance',
    [LabExperimentType.MOMENTUM]: 'momentum',
    [LabExperimentType.KARMAN_VORTEX]: 'momentum',
    [LabExperimentType.BOUNDARY_LAYER]: 'comprehensive',
    [LabExperimentType.HYDRAULIC_JUMP]: 'comprehensive',
    [LabExperimentType.CYLINDER_PRESSURE]: 'comprehensive',
    [LabExperimentType.BERNOULLI_LEVITATOR]: 'demo',
    [LabExperimentType.HYPERELASTIC]: 'demo',
    [LabExperimentType.DRAG]: 'resistance',
    [LabExperimentType.PITOT_TUBE]: 'flow',
    [LabExperimentType.SHOCK_WAVE]: 'comprehensive',
    [LabExperimentType.BOAT_DRIFTING]: 'cultural',
    [LabExperimentType.ANCIENT_HYDRAULICS]: 'cultural',
    [LabExperimentType.SAILING_PRINCIPLES]: 'cultural',
    [LabExperimentType.TRADITIONAL_ARCHITECTURE]: 'cultural'
  };
  
  return categoryMap[type] || 'all';
}

// 获取实验图片
function getExperimentImage(type: LabExperimentType): string {
  const imageMap: Record<LabExperimentType, string> = {
    [LabExperimentType.STATIC_PRESSURE]: '/images/experiments/static_pressure.jpg',
    [LabExperimentType.FLUID_STATICS]: '/images/experiments/fluid_statics.jpg',
    [LabExperimentType.REYNOLDS]: '/images/experiments/reynolds.jpg',
    [LabExperimentType.BERNOULLI]: '/images/experiments/bernoulli.jpg',
    [LabExperimentType.VENTURI]: '/images/experiments/venturi.jpg',
    [LabExperimentType.FRICTION_LOSS]: '/images/experiments/friction_loss.jpg',
    [LabExperimentType.LOCAL_LOSS]: '/images/experiments/local_loss.jpg',
    [LabExperimentType.MOMENTUM]: '/images/experiments/momentum.jpg',
    [LabExperimentType.KARMAN_VORTEX]: '/images/experiments/karman_vortex.jpg',
    [LabExperimentType.BOUNDARY_LAYER]: '/images/experiments/boundary_layer.jpg',
    [LabExperimentType.HYDRAULIC_JUMP]: '/images/experiments/hydraulic_jump.jpg',
    [LabExperimentType.CYLINDER_PRESSURE]: '/images/experiments/cylinder_pressure.jpg',
    [LabExperimentType.BERNOULLI_LEVITATOR]: '/images/experiments/bernoulli_levitator.jpg',
    [LabExperimentType.HYPERELASTIC]: '/images/experiments/hyperelastic.jpg',
    [LabExperimentType.DRAG]: '/images/experiments/drag.jpg',
    [LabExperimentType.PITOT_TUBE]: '/images/experiments/pitot_tube.jpg',
    [LabExperimentType.SHOCK_WAVE]: '/images/experiments/shock_wave.jpg',
    [LabExperimentType.BOAT_DRIFTING]: '/images/experiments/boat_drifting.jpg',
    [LabExperimentType.ANCIENT_HYDRAULICS]: '/images/experiments/ancient_hydraulics.jpg',
    [LabExperimentType.SAILING_PRINCIPLES]: '/images/experiments/sailing_principles.jpg',
    [LabExperimentType.TRADITIONAL_ARCHITECTURE]: '/images/experiments/traditional_architecture.jpg'
  };
  
  return imageMap[type] || '/images/experiments/default.jpg';
}

const LabPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 根据分类筛选实验
  const filteredExperiments = selectedCategory === 'all' 
    ? experiments 
    : experiments.filter(exp => getExperimentCategory(exp.type) === selectedCategory);

  // 获取分类名称
  const getCategoryNameById = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '未分类';
  };

  // 获取实验列表
  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const data = await labService.getAvailableExperiments();
      setExperiments(data);
    } catch (err) {
      console.error('Failed to fetch experiments:', err);
      setError('获取实验列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 选择实验
  const selectExperiment = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
  };

  // 返回实验列表
  const goBack = () => {
    setSelectedExperiment(null);
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  if (selectedExperiment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
        <ExperimentDetail 
          experiment={selectedExperiment} 
          onGoBack={goBack}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              流体力学实验室
            </h1>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              通过交互式实验深入理解流体力学原理，探索从基础理论到工程应用的完整知识体系
            </p>
          </div>

          {/* 实验分类选择 */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-full transition-all duration-300 font-medium ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white/10 backdrop-blur-sm text-blue-200 hover:bg-white/20 border border-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {category.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <p className="mt-4 text-blue-200">加载实验列表中...</p>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-400 text-xl">{error}</div>
            </div>
          )}

          {/* 实验卡片网格 */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredExperiments.map((experiment, index) => (
                <motion.div
                  key={experiment.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:border-blue-400/50 transition-all duration-300 cursor-pointer group"
                  onClick={() => selectExperiment(experiment)}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <div className="h-48 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                        {experiment.name}
                      </h3>
                    </div>
                    {/* 科学图标 */}
                    <div className="absolute top-4 right-4 text-white/70">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <p className="text-blue-200 text-sm mb-4 line-clamp-3">
                      {experiment.description}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                        {getCategoryNameById(getExperimentCategory(experiment.type))}
                      </span>
                      
                      <button className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
                        开始实验
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* 无实验数据时显示 */}
          {!loading && !error && filteredExperiments.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-blue-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <p className="text-xl text-blue-200 mb-2">暂无符合条件的实验</p>
              <p className="text-blue-300">请尝试选择其他分类或联系管理员</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// 实验详情组件
interface ExperimentDetailProps {
  experiment: Experiment;
  onGoBack: () => void;
}

const ExperimentDetail: React.FC<ExperimentDetailProps> = ({ experiment, onGoBack }) => {
  const navigate = useNavigate();
  const [configuration, setConfiguration] = useState<any>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [experimentRunning, setExperimentRunning] = useState(false);
  const [experimentResults, setExperimentResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  // 获取实验的专门页面路径
  const getExperimentPagePath = (type: LabExperimentType): string | null => {
    const pathMap: Partial<Record<LabExperimentType, string>> = {
      [LabExperimentType.REYNOLDS]: '/lab/reynolds',
      [LabExperimentType.BERNOULLI]: '/lab/bernoulli',
      [LabExperimentType.DRAG]: '/lab/drag',
      [LabExperimentType.PITOT_TUBE]: '/lab/pitot-tube',
      [LabExperimentType.VENTURI]: '/lab/venturi',
      [LabExperimentType.BOUNDARY_LAYER]: '/lab/boundary-layer',
      [LabExperimentType.SHOCK_WAVE]: '/lab/shock-wave',
      [LabExperimentType.KARMAN_VORTEX]: '/experiments/karman-vortex',
      [LabExperimentType.BOAT_DRIFTING]: '/experiments/boat',
      [LabExperimentType.ANCIENT_HYDRAULICS]: '/experiments/ancient',
    };
    return pathMap[type] || null;
  };

  // 检查是否有专门的实验页面
  const hasSpecializedPage = getExperimentPagePath(experiment.type) !== null;

  // 加载实验配置
  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const config = await labService.getExperimentConfiguration(experiment.type);
      setConfiguration(config);
      
      // 初始化参数
      const initialParams: any = {};
      config.parameters.forEach(param => {
        initialParams[param.name] = param.default;
      });
      setParameters(initialParams);
    } catch (error) {
      console.error('加载配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 运行实验
  const runExperiment = async () => {
    try {
      setExperimentRunning(true);
      setProgress(0);
      
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // 生成模拟结果
      const results = await labService.generateMockResults(experiment.type, parameters);
      
      clearInterval(progressInterval);
      setProgress(100);
      setExperimentResults(results);
    } catch (error) {
      console.error('实验运行失败:', error);
    } finally {
      setExperimentRunning(false);
    }
  };

  // 参数更新处理
  const handleParameterChange = (paramName: string, value: any) => {
    setParameters((prev: Record<string, any>) => ({
      ...prev,
      [paramName]: value
    }));
  };

  useEffect(() => {
    loadConfiguration();
  }, [experiment.type]);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 实验头部 */}
        <div className="mb-8 pb-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{experiment.name}</h2>
              <p className="text-blue-200 text-lg">{experiment.description}</p>
            </div>
            
            <motion.button
              onClick={onGoBack}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm text-blue-200 border border-white/20 rounded-lg hover:bg-white/20 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← 返回列表
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧参数面板 */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-6 text-white">实验参数配置</h3>
              
              {loading ? (
                <div className="py-8 text-center text-blue-200">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
                  加载参数配置中...
                </div>
              ) : configuration ? (
                <div className="space-y-6">
                  {configuration.parameters.map((param: any) => (
                    <div key={param.name} className="space-y-2">
                      <label className="block text-sm font-medium text-blue-200">
                        {param.name} {param.unit && `(${param.unit})`}
                      </label>
                      
                      {param.type === 'number' && (
                        <div className="space-y-2">
                          <input
                            type="range"
                            min={param.range?.[0]}
                            max={param.range?.[1]}
                            step={param.step || 0.01}
                            value={parameters[param.name] || param.default}
                            onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            min={param.range?.[0]}
                            max={param.range?.[1]}
                            step={param.step || 0.01}
                            value={parameters[param.name] || param.default}
                            onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      
                      {param.type === 'select' && (
                        <select
                          value={parameters[param.name] || param.default}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {param.options?.map((option: string) => (
                            <option key={option} value={option} className="bg-slate-800">
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {param.description && (
                        <p className="text-xs text-blue-300">{param.description}</p>
                      )}
                    </div>
                  ))}
                  
                  <div className="pt-6 border-t border-white/20">
                    {hasSpecializedPage ? (
                      <motion.button
                        onClick={() => navigate(getExperimentPagePath(experiment.type)!)}
                        className="w-full py-3 rounded-lg font-medium transition-all bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        进入专门实验页面
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={runExperiment}
                        disabled={experimentRunning}
                        className={`w-full py-3 rounded-lg font-medium transition-all ${
                          experimentRunning
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                        }`}
                        whileHover={!experimentRunning ? { scale: 1.02 } : {}}
                        whileTap={!experimentRunning ? { scale: 0.98 } : {}}
                      >
                        {experimentRunning ? '实验运行中...' : '开始实验'}
                      </motion.button>
                    )}
                    
                    {experimentRunning && (
                      <div className="mt-4">
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-sm text-blue-300 mt-1">{Math.round(progress)}%</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-red-400">
                  配置加载失败
                </div>
              )}
            </div>
          </div>
          
          {/* 右侧结果区域 */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 min-h-[500px]">
              {!experimentResults && !experimentRunning ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-blue-400 mb-4">
                      <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">实验准备就绪</h3>
                    <p className="text-blue-200">请配置左侧参数并点击"开始实验"按钮</p>
                  </div>
                </div>
              ) : experimentRunning ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <h3 className="text-xl font-bold text-white mb-2">实验计算中</h3>
                    <p className="text-blue-200">后端物理引擎正在进行模拟计算</p>
                    <p className="text-sm text-blue-300 mt-2">预计需要10-30秒完成</p>
                  </div>
                </div>
              ) : experimentResults ? (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">实验结果</h3>
                  
                  {/* 结果数据显示 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(experimentResults.results).map(([key, value]) => (
                      <div key={key} className="bg-white/5 rounded-lg p-4">
                        <div className="text-sm text-blue-300 mb-1">{key}</div>
                        <div className="text-lg font-mono text-white">
                          {typeof value === 'number' ? value.toFixed(4) : JSON.stringify(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 重新运行按钮 */}
                  <motion.button
                    onClick={runExperiment}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    重新运行实验
                  </motion.button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LabPage; 