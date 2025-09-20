import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Scroll, 
  Calculator, 
  TrendingUp, 
  ChevronRight,
  Quote,
  Users,
  Award,
  FileText
} from 'lucide-react';

interface ResearchPaper {
  title: string;
  authors: string[];
  institution: string;
  year: number;
  journal: string;
  abstract: string;
  keyFindings: string[];
  equations?: string[];
}

interface TheorySection {
  id: string;
  title: string;
  content: string;
  formula?: string;
  explanation?: string;
}

const BoatDriftingTheory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'poetry' | 'theory' | 'papers' | 'experiments'>('poetry');
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);

  // 研究文献数据
  const researchPapers: ResearchPaper[] = [
    {
      title: "野渡无人舟自横现象的数值研究",
      authors: ["余勇飞", "陈沉", "斯铁冬", "胡婷", "魏家望"],
      institution: "中国电建集团华东勘测设计研究院有限公司",
      year: 2020,
      journal: "力学与实践",
      abstract: "为了研究\"野渡无人舟自横\"这一自然现象，本文采用数值仿真技术模拟研究了小船在水流作用下的运动特性，得出：顺于水流以及横于水流都属于小船平衡位置。但顺于水流属于非稳定平衡位置，受扰动后将失去平衡，并再也恢复不到原平衡位置；而横于水流属于稳定平衡位置，此时即使小船受到扰动失去平衡，最终也能在自身力矩作用下重新恢复到原平衡位置。",
      keyFindings: [
        "数值模拟重现了\"野渡无人舟自横\"现象",
        "小船顺流和横流都是平衡位置，但稳定性不同",
        "横流位置是稳定平衡，顺流位置是不稳定平衡",
        "仿真结果与理论分析完全吻合"
      ],
      equations: ["M(α) = (1/2)πρ(a² - b²)v² sin(2α)"]
    },
    {
      title: "春潮带雨晚来急——\"野渡无人舟自横\"的写作札记",
      authors: ["王振东"],
      institution: "天津大学力学系",
      year: 2006,
      journal: "力学与实践",
      abstract: "常有人问笔者，你怎么会在力学的学习和研究中，想起将唐宋诗词与力学现象联系起来呢？本文叙述省悟唐宋诗词中有关力学现象和知识的经过，力学诗话文章的北大渊源，以及40余年来多次写\"野渡无人舟自横\"文章过程中遇到的一些趣事。",
      keyFindings: [
        "追溯了力学诗话研究的学术渊源",
        "记录了跨学科研究的发展历程",
        "展现了传统文化与现代科学的融合",
        "体现了科普教育的重要性"
      ]
    },
    {
      title: "野渡无人舟自横——谈流体流动中物体的稳定性",
      authors: ["王振东"],
      institution: "天津大学力学系",
      year: 1992,
      journal: "力学与实践",
      abstract: "从古诗\"春潮带雨晚来急，野渡无人舟自横\"出发，用现代流体力学理论分析了船只在水流中的稳定性问题。通过复变函数方法推导了椭圆柱在平行来流中的受力情况，证明了横流摆放是稳定平衡位置。",
      keyFindings: [
        "首次用现代流体力学解释古诗现象",
        "推导了椭圆柱绕流的力矩公式",
        "分析了两种平衡状态的稳定性",
        "建立了诗词与科学的桥梁"
      ],
      equations: [
        "M(α) = (1/2)πρ(a² - b²)v² sin(2α)",
        "dM/dα|α=0 = πρ(a² - b²)v² > 0 (不稳定)",
        "dM/dα|α=π/2 = -πρ(a² - b²)v² < 0 (稳定)"
      ]
    }
  ];

  // 理论章节
  const theorySections: TheorySection[] = [
    {
      id: 'basic',
      title: '基本概念',
      content: '这个现象本质上是一个流体力学中的稳定性问题。我们需要理解两个关键概念：稳定平衡（物体受到小的扰动后，会自动回到原来的位置）和不稳定平衡（物体受到小的扰动后，会远离原来的位置，无法自动恢复）。'
    },
    {
      id: 'states',
      title: '船只的两种状态',
      content: '小船在水流中理论上有两个平衡位置：状态A为顺流摆放（船头指向水流方向，看起来很"顺理成章"但实际不稳定）；状态B为横流摆放（船身垂直于水流方向，这就是我们实际观察到的稳定状态）。'
    },
    {
      id: 'torque',
      title: '力矩分析',
      content: '关键在于流体对船体产生的力矩。当船受到扰动时，产生的力矩决定了船只的稳定性。',
      formula: 'M(α) = (1/2)πρ(a² - b²)v² sin(2α)',
      explanation: '其中M是作用力矩，α是船长轴与水流方向夹角，ρ是水密度，a、b是船的长短半轴，v是水流速度。'
    },
    {
      id: 'stability',
      title: '稳定性判断',
      content: '当α=0°（顺流）时，受扰动后力矩与扰动方向相同，导致不稳定；当α=90°（横流）时，受扰动后力矩与扰动方向相反，恢复稳定。这解释了为什么船只最终总是横着停在水面上。'
    }
  ];

  const tabs = [
    { id: 'poetry', label: '古诗文化', icon: Scroll },
    { id: 'theory', label: '物理原理', icon: Calculator },
    { id: 'papers', label: '研究文献', icon: FileText },
    { id: 'experiments', label: '实验验证', icon: TrendingUp }
  ];

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            野渡无人舟自横
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            探索千年古诗中蕴含的流体力学智慧，从诗意观察到科学验证
          </p>
        </div>

        {/* Tab导航 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-2 shadow-lg">
            <div className="flex space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* 古诗文化 */}
            {activeTab === 'poetry' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                  <div className="text-center mb-8">
                    <Quote className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">《滁州西涧》</h2>
                    <p className="text-sm text-gray-500 mb-6">唐·韦应物</p>
                    
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 max-w-md mx-auto">
                      <div className="text-lg leading-relaxed text-gray-700 font-serif">
                        <p>独怜幽草涧边生，</p>
                        <p>上有黄鹂深树鸣。</p>
                        <p className="text-amber-600 font-bold">春潮带雨晚来急，</p>
                        <p className="text-amber-600 font-bold">野渡无人舟自横。</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">诗词赏析</h3>
                      <div className="space-y-3 text-gray-600">
                        <p>这首诗描绘了一个春雨绵绵的傍晚，郊外小河因春潮和雨水而水流湍急的场景。</p>
                        <p>诗人细致观察到：一艘无人看管的小船被绳索拴在岸边，无论水流如何冲击，它总是横着停在水面上。</p>
                        <p>这看似简单的描述，实际上蕴含着深刻的物理学原理。</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">文化价值</h3>
                      <div className="space-y-3 text-gray-600">
                        <p>古代诗人凭借敏锐的观察力，用寥寥数字记录下了一个重要的物理现象。</p>
                        <p>这体现了中华文化中蕴含的科学智慧，展现了感性认识与理性分析的完美结合。</p>
                        <p>一千多年后，现代科学用精确的数学公式验证了诗人的观察。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 物理原理 */}
            {activeTab === 'theory' && (
              <div className="max-w-4xl mx-auto space-y-6">
                {theorySections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-lg p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      {index + 1}. {section.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {section.content}
                    </p>
                    
                    {section.formula && (
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <div className="text-center font-mono text-lg text-blue-800 mb-2">
                          {section.formula}
                        </div>
                        {section.explanation && (
                          <p className="text-sm text-blue-600 text-center">
                            {section.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* 研究文献 */}
            {activeTab === 'papers' && (
              <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-3 gap-6">
                  {researchPapers.map((paper, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                      onClick={() => setSelectedPaper(paper)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                        <span className="text-sm text-gray-500">{paper.year}</span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                        {paper.title}
                      </h3>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {paper.authors.slice(0, 2).join(', ')}
                          {paper.authors.length > 2 && ' 等'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-4">
                        <Award className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{paper.journal}</span>
                      </div>
                      
                      <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                        {paper.abstract}
                      </p>
                      
                      <div className="flex items-center text-blue-600 text-sm font-medium">
                        阅读详情 <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 实验验证 */}
            {activeTab === 'experiments' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">实验验证</h2>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">数值模拟</h3>
                      <div className="space-y-3 text-gray-600">
                        <p><strong>模型设置：</strong>椭圆形船体，长半轴5cm，短半轴2.5cm</p>
                        <p><strong>计算方法：</strong>标准k-ε湍流模型，SIMPLE算法</p>
                        <p><strong>边界条件：</strong>速度入口，压力出口，无滑移壁面</p>
                        <p><strong>网格：</strong>结构化网格，约23,320个节点</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">实验结果</h3>
                      <div className="space-y-3 text-gray-600">
                        <p><strong>收敛时间：</strong>约60秒达到稳定状态</p>
                        <p><strong>最终角度：</strong>无论初始角度如何，最终都收敛到90°</p>
                        <p><strong>振荡特性：</strong>呈现阻尼振荡，力矩逐渐衰减为零</p>
                        <p><strong>验证结果：</strong>数值模拟完全验证理论分析</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 bg-green-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-green-800 mb-3">关键发现</h4>
                    <ul className="space-y-2 text-green-700">
                      <li>• 数值仿真成功重现了"野渡无人舟自横"现象</li>
                      <li>• 验证了理论分析的正确性：横流是稳定平衡位置</li>
                      <li>• 展现了古代观察与现代科学的完美融合</li>
                      <li>• 为科普教育提供了生动的案例</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 论文详情模态框 */}
        <AnimatePresence>
          {selectedPaper && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedPaper(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 pr-4">
                      {selectedPaper.title}
                    </h2>
                    <button
                      onClick={() => setSelectedPaper(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">作者信息</h3>
                      <p className="text-gray-600">
                        {selectedPaper.authors.join(', ')} 
                        <span className="block text-sm text-gray-500 mt-1">
                          {selectedPaper.institution} · {selectedPaper.journal} · {selectedPaper.year}
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">摘要</h3>
                      <p className="text-gray-600 leading-relaxed">{selectedPaper.abstract}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">主要发现</h3>
                      <ul className="space-y-2">
                        {selectedPaper.keyFindings.map((finding, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {selectedPaper.equations && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">关键公式</h3>
                        <div className="space-y-2">
                          {selectedPaper.equations.map((equation, index) => (
                            <div key={index} className="bg-blue-50 rounded-lg p-3 font-mono text-center text-blue-800">
                              {equation}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BoatDriftingTheory; 