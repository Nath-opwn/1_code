import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FlaskConical, 
  Waves, 
  Wind, 
  Gauge, 
  Droplets, 
  Zap, 
  BarChart3, 
  BookOpen,
  Play,
  Settings,
  Target,
  Ship
} from 'lucide-react';

const HomePage: React.FC = () => {
  const experiments = [
    {
      id: 'bernoulli',
      title: '伯努利原理实验',
      description: '探索流体速度与压力的关系，理解升力产生机制',
      icon: <Wind className="w-8 h-8" />,
      difficulty: '初级',
      category: '流体力学基础'
    },
    {
      id: 'reynolds',
      title: '雷诺数实验',
      description: '观察层流与湍流的转换，理解雷诺数的物理意义',
      icon: <Waves className="w-8 h-8" />,
      difficulty: '中级',
      category: '流动状态'
    },
    {
      id: 'drag',
      title: '阻力系数实验',
      description: '测量不同形状物体的阻力系数，优化流线型设计',
      icon: <Target className="w-8 h-8" />,
      difficulty: '中级',
      category: '阻力分析'
    },
    {
      id: 'venturi',
      title: '文丘里管实验',
      description: '利用文丘里效应测量流量，理解连续性方程',
      icon: <FlaskConical className="w-8 h-8" />,
      difficulty: '初级',
      category: '流量测量'
    },
    {
      id: 'pitot',
      title: '皮托管实验',
      description: '使用皮托管测量流体速度，应用于航空航天',
      icon: <Gauge className="w-8 h-8" />,
      difficulty: '中级',
      category: '速度测量'
    },
    {
      id: 'boundary',
      title: '边界层实验',
      description: '研究壁面附近的边界层现象，理解粘性效应',
      icon: <Droplets className="w-8 h-8" />,
      difficulty: '高级',
      category: '粘性流动'
    },
    {
      id: 'shock',
      title: '激波实验',
      description: '观察超声速流动中的激波现象',
      icon: <Zap className="w-8 h-8" />,
      difficulty: '高级',
      category: '超声速流动'
    },
    {
      id: 'karman',
      title: '卡门涡街实验',
      description: '观察圆柱绕流的卡门涡街现象',
      icon: <Waves className="w-8 h-8" />,
      difficulty: '中级',
      category: '涡流现象'
    },
    {
      id: 'boat',
      title: '船舶漂移实验',
      description: '模拟船舶在流体中的运动和漂移',
      icon: <Ship className="w-8 h-8" />,
      difficulty: '高级',
      category: '船舶工程'
    },
    {
      id: 'ancient',
      title: '古代水利实验',
      description: '重现古代水利工程的工作原理',
      icon: <Droplets className="w-8 h-8" />,
      difficulty: '中级',
      category: '历史文化'
    }
  ];

  const features = [
    {
      icon: <Settings className="w-6 h-6" />,
      title: '参数可调',
      description: '实时调整实验参数，观察不同条件下的物理现象'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: '数据可视化',
      description: '多种图表形式展示实验数据和分析结果'
    },
    {
      icon: <Play className="w-6 h-6" />,
      title: '实时仿真',
      description: '基于物理原理的实时计算和动画演示'
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: '理论学习',
      description: '详细的物理原理说明和公式推导'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '初级': return 'bg-green-100 text-green-800';
      case '中级': return 'bg-yellow-100 text-yellow-800';
      case '高级': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 英雄区域 */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            物理仿真实验平台
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            交互式物理实验仿真系统，支持参数调节、实时可视化和定量分析。
            涵盖流体力学、热力学、电磁学等多个领域的经典实验。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/lab"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              开始实验
            </Link>
            <Link
              to="/knowledge"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              学习理论
            </Link>
          </div>
        </div>
      </section>

      {/* 特性介绍 */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            平台特色
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 实验列表 */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            实验模块
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiments.map((experiment) => (
              <Link
                key={experiment.id}
                to={`/experiments/${experiment.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
                    {experiment.icon}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(experiment.difficulty)}`}>
                    {experiment.difficulty}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {experiment.title}
                </h3>
                <p className="text-gray-600 mb-3">
                  {experiment.description}
                </p>
                <div className="text-sm text-blue-600 font-medium">
                  {experiment.category}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 使用说明 */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            使用指南
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                系统要求
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 现代浏览器（Chrome 80+, Firefox 75+, Safari 13+）</li>
                <li>• 推荐内存：4GB 以上</li>
                <li>• 推荐显卡：支持 WebGL 2.0</li>
                <li>• 网络要求：宽带连接</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                操作说明
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 点击实验卡片进入具体实验</li>
                <li>• 使用控制面板调节实验参数</li>
                <li>• 观察实时的可视化效果</li>
                <li>• 查看数据图表和分析结果</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 