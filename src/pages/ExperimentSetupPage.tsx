import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Play, Beaker, BarChart3, Zap, Wind, Gauge, Anchor } from 'lucide-react';

interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  features: string[];
}

const ExperimentSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 实验配置数据
  const experiments: ExperimentConfig[] = [
    {
      id: 'reynolds',
      name: '雷诺实验',
      description: '观察层流到湍流的转换，理解雷诺数的物理意义',
      path: '/experiments/reynolds',
      icon: <Wind className="h-6 w-6" />,
      category: 'flow',
      difficulty: 'beginner',
      estimatedTime: '15-20分钟',
      features: ['1000粒子仿真', '实时流态判断', '参数可调节', '3D可视化']
    },
    {
      id: 'bernoulli',
      name: '伯努利实验',
      description: '验证伯努利方程，观察压力与速度的关系',
      path: '/experiments/bernoulli',
      icon: <BarChart3 className="h-6 w-6" />,
      category: 'flow',
      difficulty: 'intermediate',
      estimatedTime: '20-25分钟',
      features: ['压力可视化', '管径变化', '能量守恒验证', '流线显示']
    },
    {
      id: 'drag',
      name: '阻力实验',
      description: '测试不同形状物体的阻力系数和绕流现象',
      path: '/experiments/drag',
      icon: <Zap className="h-6 w-6" />,
      category: 'resistance',
      difficulty: 'intermediate',
      estimatedTime: '18-22分钟',
      features: ['多种物体形状', '阻力系数计算', '绕流可视化', '尾流分析']
    },
    {
      id: 'pitot-tube',
      name: '毕托管实验',
      description: '学习流速测量原理，掌握毕托管的使用方法',
      path: '/experiments/pitot',
      icon: <Gauge className="h-6 w-6" />,
      category: 'measurement',
      difficulty: 'advanced',
      estimatedTime: '25-30分钟',
      features: ['压差测量', '流速计算', '驻点效应', '实际应用']
    },
    {
      id: 'karman-vortex',
      name: '卡门涡街',
      description: '观察圆柱绕流产生的周期性涡街现象',
      path: '/experiments/karman-vortex',
      icon: <Beaker className="h-6 w-6" />,
      category: 'flow',
      difficulty: 'advanced',
      estimatedTime: '20-25分钟',
      features: ['涡街可视化', '频率分析', '斯特劳哈尔数', '周期性现象']
    },
    {
      id: 'boat-drifting',
      name: '野渡无人舟自横',
      description: '探索古代诗词中的流体力学现象，理解船只稳定性原理',
      path: '/experiments/boat',
      icon: <Anchor className="h-6 w-6" />,
      category: 'cultural',
      difficulty: 'intermediate',
      estimatedTime: '15-20分钟',
      features: ['传统文化', '稳定性分析', '古诗词结合', '物理原理']
    },

    {
      id: 'venturi',
      name: '文丘里效应',
      description: '探索文丘里管中的流速和压力变化关系',
      path: '/experiments/venturi',
      icon: <BarChart3 className="h-6 w-6" />,
      category: 'flow',
      difficulty: 'intermediate',
      estimatedTime: '15-20分钟',
      features: ['文丘里管仿真', '压力梯度', '流速变化', '连续性方程']
    },
    {
      id: 'boundary',
      name: '边界层实验',
      description: '观察物体表面附近的边界层发展和分离现象',
      path: '/experiments/boundary',
      icon: <Wind className="h-6 w-6" />,
      category: 'flow',
      difficulty: 'advanced',
      estimatedTime: '20-25分钟',
      features: ['边界层可视化', '分离点检测', '湍流转换', '壁面效应']
    },
    {
      id: 'shock',
      name: '激波实验',
      description: '研究超声速流动中的激波现象和压缩波',
      path: '/experiments/shock',
      icon: <Zap className="h-6 w-6" />,
      category: 'resistance',
      difficulty: 'advanced',
      estimatedTime: '25-30分钟',
      features: ['激波可视化', '马赫数计算', '压力跳跃', '超声速流动']
    },
    {
      id: 'ancient',
      name: '古代水利工程',
      description: '探索中国古代水利工程的流体力学原理',
      path: '/experiments/ancient',
      icon: <Anchor className="h-6 w-6" />,
      category: 'cultural',
      difficulty: 'intermediate',
      estimatedTime: '20-25分钟',
      features: ['古代智慧', '水利原理', '历史文化', '工程应用']
    }
  ];

  // 分类配置
  const categories = [
    { id: 'all', name: '全部实验', icon: <Settings className="h-4 w-4" /> },
    { id: 'flow', name: '流动实验', icon: <Wind className="h-4 w-4" /> },
    { id: 'resistance', name: '阻力实验', icon: <Zap className="h-4 w-4" /> },
    { id: 'measurement', name: '测量实验', icon: <Gauge className="h-4 w-4" /> },
    { id: 'cultural', name: '传统文化', icon: <Anchor className="h-4 w-4" /> }
  ];

  // 难度等级
  const difficulties = [
    { id: 'all', name: '全部难度' },
    { id: 'beginner', name: '初级', color: 'green' },
    { id: 'intermediate', name: '中级', color: 'yellow' },
    { id: 'advanced', name: '高级', color: 'red' }
  ];

  // 过滤实验
  const filteredExperiments = experiments.filter(exp => {
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || exp.difficulty === selectedDifficulty;
    const matchesSearch = exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  // 获取难度颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'flow': return 'bg-blue-100 text-blue-800';
      case 'resistance': return 'bg-purple-100 text-purple-800';
      case 'measurement': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 启动实验
  const startExperiment = (experiment: ExperimentConfig) => {
    navigate(experiment.path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">实验配置中心</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            选择你感兴趣的流体力学实验，配置参数并开始探索
          </p>
        </motion.div>

        {/* 过滤器和搜索 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              实验筛选
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 搜索框 */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">搜索实验</label>
                <input
                  type="text"
                  placeholder="输入实验名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 分类选择 */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">实验分类</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          {category.icon}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 难度选择 */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">难度等级</label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map(difficulty => (
                      <SelectItem key={difficulty.id} value={difficulty.id}>
                        {difficulty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 统计信息 */}
              <div className="flex flex-col justify-center">
                <div className="text-sm text-gray-600">
                  找到 <span className="font-bold text-blue-600">{filteredExperiments.length}</span> 个实验
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  总共 {experiments.length} 个可用实验
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 实验卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperiments.map((experiment, index) => (
            <motion.div
              key={experiment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        {experiment.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{experiment.name}</CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge className={getDifficultyColor(experiment.difficulty)}>
                            {difficulties.find(d => d.id === experiment.difficulty)?.name}
                          </Badge>
                          <Badge className={getCategoryColor(experiment.category)}>
                            {categories.find(c => c.id === experiment.category)?.name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="text-gray-600">
                    {experiment.description}
                  </CardDescription>

                  {/* 预计时间 */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    预计时间: {experiment.estimatedTime}
                  </div>

                  {/* 实验特色 */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">实验特色：</div>
                    <div className="flex flex-wrap gap-1">
                      {experiment.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* 开始按钮 */}
                  <Button
                    onClick={() => startExperiment(experiment)}
                    className="w-full mt-4"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    开始实验
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* 如果没有找到实验 */}
        {filteredExperiments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Beaker className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">没有找到匹配的实验</h3>
            <p className="text-gray-500 mb-4">请尝试调整搜索条件或筛选器</p>
            <Button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
              variant="outline"
            >
              重置筛选器
            </Button>
          </div>
        )}

        {/* 实验指南 */}
        <Alert>
          <Beaker className="h-4 w-4" />
          <AlertDescription>
            <strong>实验指南：</strong>
            建议按难度递进学习：初级实验帮助理解基本概念，中级实验深入探索原理，
            高级实验训练综合分析能力。每个实验都包含详细的理论说明和操作指导。
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default ExperimentSetupPage; 