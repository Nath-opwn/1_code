import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen,
  Lightbulb,
  Target,
  TrendingUp,
  Zap,
  Wind,
  Droplets,
  Plane,
  Ship,
  Car,
  Building,
  Factory,
  Play,
  Pause,
  RotateCcw,
  Download,
  Eye,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';

interface CaseStudy {
  id: string;
  title: string;
  category: 'aerospace' | 'automotive' | 'marine' | 'civil' | 'industrial' | 'sports';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  description: string;
  objectives: string[];
  theory: {
    principles: string[];
    equations: string[];
    parameters: Array<{
      name: string;
      symbol: string;
      unit: string;
      description: string;
      typical_range: string;
    }>;
  };
  realWorldApplication: {
    industry: string;
    examples: string[];
    challenges: string[];
    solutions: string[];
  };
  experimentalSetup: {
    geometry: string;
    conditions: Record<string, any>;
    measurements: string[];
  };
  results: {
    expected: string[];
    analysis: string[];
    insights: string[];
  };
  resources: {
    papers: string[];
    videos: string[];
    simulations: string[];
  };
}

const caseStudies: CaseStudy[] = [
  {
    id: 'karman-vortex-street',
    title: '卡门涡街：从圆柱绕流到工程应用',
    category: 'civil',
    difficulty: 'intermediate',
    duration: '45-60分钟',
    description: '研究圆柱绕流产生的卡门涡街现象，分析其在桥梁、烟囱等工程结构中的影响',
    objectives: [
      '理解卡门涡街的形成机理',
      '掌握斯特劳哈尔数的计算和应用',
      '分析涡街对结构物的影响',
      '学习涡激振动的控制方法'
    ],
    theory: {
      principles: [
        '不可压缩粘性流体绕圆柱流动',
        '边界层分离与涡的形成',
        '周期性涡脱落机制',
        '流体-结构相互作用'
      ],
      equations: [
        'St = fD/U （斯特劳哈尔数）',
        'Re = ρUD/μ （雷诺数）',
        'Cd = 2F/(ρU²D) （阻力系数）',
        'f_vortex = St × U/D （涡脱落频率）'
      ],
      parameters: [
        {
          name: '雷诺数',
          symbol: 'Re',
          unit: '无量纲',
          description: '惯性力与粘性力的比值',
          typical_range: '40-300（层流涡街）'
        },
        {
          name: '斯特劳哈尔数',
          symbol: 'St',
          unit: '无量纲',
          description: '涡脱落频率的无量纲数',
          typical_range: '0.18-0.22（圆柱）'
        },
        {
          name: '阻力系数',
          symbol: 'Cd',
          unit: '无量纲',
          description: '阻力的无量纲表示',
          typical_range: '1.0-1.2（Re>1000）'
        }
      ]
    },
    realWorldApplication: {
      industry: '土木工程',
      examples: [
        '塔科马海峡大桥的风致振动',
        '高层建筑的涡激振动',
        '海洋平台立柱的涡激振动',
        '输电线路的风致振动'
      ],
      challenges: [
        '结构共振导致的疲劳破坏',
        '涡激振动的准确预测',
        '多柱体相互作用的复杂性',
        '三维效应的影响'
      ],
      solutions: [
        '螺旋形扰流器',
        '导流罩和整流装置',
        '主动控制系统',
        '结构阻尼器'
      ]
    },
    experimentalSetup: {
      geometry: '圆柱直径D=0.02m，长度L=0.5m',
      conditions: {
        velocity: '0.5-3.0 m/s',
        reynoldsNumber: '40-300',
        fluidDensity: '1000 kg/m³',
        kinematicViscosity: '1.0e-6 m²/s'
      },
      measurements: [
        '流场速度分布',
        '涡脱落频率',
        '圆柱表面压力',
        '升力和阻力时程'
      ]
    },
    results: {
      expected: [
        'Re<40: 稳态对称流动',
        '40<Re<200: 周期性涡脱落',
        'Re>200: 三维涡街结构',
        '涡脱落频率与Re的关系'
      ],
      analysis: [
        '涡街形成的物理机制',
        '升力脉动的频谱特性',
        '阻力系数随Re的变化',
        '三维效应的影响'
      ],
      insights: [
        '涡街是边界层分离的结果',
        'St数在宽Re范围内相对稳定',
        '三维效应会影响涡街的规律性',
        '控制涡脱落可减少结构振动'
      ]
    },
    resources: {
      papers: [
        'Williamson, C.H.K. - Vortex dynamics in the cylinder wake',
        'Sarpkaya, T. - A critical review of the intrinsic nature of vortex-induced vibrations',
        'Zdravkovich, M.M. - Flow around circular cylinders'
      ],
      videos: [
        '卡门涡街可视化实验',
        '塔科马海峡大桥坍塌视频',
        'PIV测量涡街流场'
      ],
      simulations: [
        '二维圆柱绕流CFD',
        '涡激振动FSI仿真',
        '多柱体相互作用'
      ]
    }
  },
  {
    id: 'bernoulli-principle-aviation',
    title: '伯努利原理：从理论到飞行器设计',
    category: 'aerospace',
    difficulty: 'beginner',
    duration: '30-40分钟',
    description: '探索伯努利原理在航空工程中的应用，从机翼升力产生到飞机设计优化',
    objectives: [
      '理解伯努利方程的物理意义',
      '掌握升力产生的机理',
      '分析机翼几何对气动性能的影响',
      '了解现代飞机设计中的应用'
    ],
    theory: {
      principles: [
        '能量守恒定律',
        '流体连续性方程',
        '伯努利方程',
        '库塔-儒科夫斯基定理'
      ],
      equations: [
        'p + ½ρv² + ρgh = 常数 （伯努利方程）',
        'L = ρvΓ （升力公式）',
        'Cl = 2πα （薄翼理论）',
        'L/D = Cl/Cd （升阻比）'
      ],
      parameters: [
        {
          name: '攻角',
          symbol: 'α',
          unit: '度',
          description: '机翼弦线与来流的夹角',
          typical_range: '0-15°（失速前）'
        },
        {
          name: '升力系数',
          symbol: 'Cl',
          unit: '无量纲',
          description: '升力的无量纲表示',
          typical_range: '0-1.5（典型机翼）'
        },
        {
          name: '升阻比',
          symbol: 'L/D',
          unit: '无量纲',
          description: '气动效率指标',
          typical_range: '10-50（现代客机）'
        }
      ]
    },
    realWorldApplication: {
      industry: '航空航天',
      examples: [
        '客机机翼设计',
        '战斗机超音速翼型',
        '直升机旋翼气动',
        '风力发电机叶片'
      ],
      challenges: [
        '高升阻比的实现',
        '失速特性的控制',
        '跨音速激波的处理',
        '多学科优化设计'
      ],
      solutions: [
        '超临界翼型技术',
        '自适应机翼技术',
        '涡流发生器',
        '计算流体力学优化'
      ]
    },
    experimentalSetup: {
      geometry: 'NACA0012翼型，弦长c=0.1m',
      conditions: {
        velocity: '10-50 m/s',
        attackAngle: '0-20°',
        reynoldsNumber: '1e5-5e5',
        machNumber: '0.03-0.15'
      },
      measurements: [
        '翼型表面压力分布',
        '升力和阻力系数',
        '边界层厚度',
        '尾流速度剖面'
      ]
    },
    results: {
      expected: [
        '升力系数随攻角线性增长',
        '失速攻角约15°',
        '最大升阻比在4-6°攻角',
        '边界层转捩影响阻力'
      ],
      analysis: [
        '压力分布与升力的关系',
        '粘性效应对性能的影响',
        '雷诺数效应',
        '三维效应的修正'
      ],
      insights: [
        '升力主要由压差产生',
        '粘性阻力随Re数减小',
        '翼型几何强烈影响性能',
        '实际应用需考虑三维效应'
      ]
    },
    resources: {
      papers: [
        'Anderson, J.D. - Fundamentals of Aerodynamics',
        'Abbott, I.H. - Theory of Wing Sections',
        'Bertin, J.J. - Aerodynamics for Engineers'
      ],
      videos: [
        '风洞中的翼型测试',
        '烟线可视化流场',
        '机翼升力演示实验'
      ],
      simulations: [
        '翼型绕流CFD分析',
        '机翼三维流动',
        '高升力装置仿真'
      ]
    }
  },
  {
    id: 'boundary-layer-theory',
    title: '边界层理论：从普朗特到现代CFD',
    category: 'aerospace',
    difficulty: 'advanced',
    duration: '60-75分钟',
    description: '深入研究边界层理论，从经典的布拉修斯解到现代湍流模型',
    objectives: [
      '掌握边界层的基本概念',
      '理解层流边界层的数学描述',
      '分析边界层转捩机制',
      '了解湍流边界层特性'
    ],
    theory: {
      principles: [
        '普朗特边界层理论',
        '布拉修斯层流解',
        '边界层转捩',
        '湍流边界层结构'
      ],
      equations: [
        'δ/x = 5.0/√Rex （层流边界层厚度）',
        'Cf = 0.664/√Rex （层流摩擦系数）',
        'δ/x = 0.37/Rex^0.2 （湍流边界层厚度）',
        'Cf = 0.059/Rex^0.2 （湍流摩擦系数）'
      ],
      parameters: [
        {
          name: '边界层厚度',
          symbol: 'δ',
          unit: 'm',
          description: '速度达到外流99%的距离',
          typical_range: '1-10mm（典型条件）'
        },
        {
          name: '位移厚度',
          symbol: 'δ*',
          unit: 'm',
          description: '质量流量损失的等效厚度',
          typical_range: 'δ*/δ ≈ 0.34（层流）'
        },
        {
          name: '动量厚度',
          symbol: 'θ',
          unit: 'm',
          description: '动量损失的等效厚度',
          typical_range: 'θ/δ ≈ 0.13（层流）'
        }
      ]
    },
    realWorldApplication: {
      industry: '多领域应用',
      examples: [
        '飞机表面摩擦阻力',
        '船舶水动力设计',
        '汽车空气动力学',
        '叶轮机械设计'
      ],
      challenges: [
        '边界层分离的预测',
        '转捩位置的确定',
        '湍流模型的选择',
        '壁面粗糙度的影响'
      ],
      solutions: [
        '边界层控制技术',
        '层流化设计',
        '先进湍流模型',
        '大涡模拟技术'
      ]
    },
    experimentalSetup: {
      geometry: '平板，长度L=1.0m，宽度W=0.5m',
      conditions: {
        velocity: '1-20 m/s',
        reynoldsNumber: '1e4-1e7',
        turbulenceIntensity: '0.1-5%',
        pressureGradient: '零压梯度'
      },
      measurements: [
        '边界层速度剖面',
        '壁面剪应力',
        '边界层厚度发展',
        '转捩位置'
      ]
    },
    results: {
      expected: [
        '层流区符合布拉修斯解',
        '转捩雷诺数约5×10⁵',
        '湍流区遵循1/7次幂律',
        '摩擦系数随Re数变化'
      ],
      analysis: [
        '层流与湍流特性对比',
        '转捩过程的复杂性',
        '压力梯度的影响',
        '三维效应'
      ],
      insights: [
        '边界层控制着粘性效应',
        '转捩强烈影响传热传质',
        '湍流边界层更厚但更稳定',
        '工程应用需要准确预测'
      ]
    },
    resources: {
      papers: [
        'Schlichting, H. - Boundary Layer Theory',
        'White, F.M. - Viscous Fluid Flow',
        'Pope, S.B. - Turbulent Flows'
      ],
      videos: [
        '边界层可视化实验',
        '转捩过程高速摄影',
        'PIV测量边界层'
      ],
      simulations: [
        '平板边界层DNS',
        'LES湍流边界层',
        'RANS模型比较'
      ]
    }
  }
];

export const CaseStudyLibrary: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const categories = [
    { value: 'all', label: '全部类别', icon: BookOpen },
    { value: 'aerospace', label: '航空航天', icon: Plane },
    { value: 'automotive', label: '汽车工程', icon: Car },
    { value: 'marine', label: '海洋工程', icon: Ship },
    { value: 'civil', label: '土木工程', icon: Building },
    { value: 'industrial', label: '工业应用', icon: Factory },
    { value: 'sports', label: '体育科学', icon: Target }
  ];

  const difficulties = [
    { value: 'all', label: '全部难度' },
    { value: 'beginner', label: '初级', color: 'bg-green-100 text-green-800' },
    { value: 'intermediate', label: '中级', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'advanced', label: '高级', color: 'bg-red-100 text-red-800' }
  ];

  const filteredCases = useMemo(() => {
    return caseStudies.filter(caseStudy => {
      const categoryMatch = selectedCategory === 'all' || caseStudy.category === selectedCategory;
      const difficultyMatch = selectedDifficulty === 'all' || caseStudy.difficulty === selectedDifficulty;
      return categoryMatch && difficultyMatch;
    });
  }, [selectedCategory, selectedDifficulty]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryInfo = categories.find(c => c.value === category);
    return categoryInfo ? categoryInfo.icon : BookOpen;
  };

  if (selectedCase) {
    const caseStudy = caseStudies.find(c => c.id === selectedCase);
    if (!caseStudy) return null;

    const CategoryIcon = getCategoryIcon(caseStudy.category);

    return (
      <div className="space-y-6">
        {/* 返回按钮 */}
        <Button 
          onClick={() => setSelectedCase(null)}
          variant="outline"
          className="mb-4"
        >
          ← 返回案例库
        </Button>

        {/* 案例标题 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CategoryIcon className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-2xl">{caseStudy.title}</CardTitle>
                </div>
                <CardDescription className="text-lg">
                  {caseStudy.description}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={getDifficultyColor(caseStudy.difficulty)}>
                  {difficulties.find(d => d.value === caseStudy.difficulty)?.label}
                </Badge>
                <Badge variant="outline">
                  {caseStudy.duration}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 学习目标 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              学习目标
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {caseStudy.objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 理论基础 */}
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => toggleSection('theory')}
              className="w-full justify-between p-0"
            >
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                理论基础
              </CardTitle>
              {expandedSections.theory ? <ChevronDown /> : <ChevronRight />}
            </Button>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.theory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="space-y-6">
                  {/* 物理原理 */}
                  <div>
                    <h4 className="font-semibold mb-3">物理原理</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {caseStudy.theory.principles.map((principle, index) => (
                        <div key={index} className="bg-blue-50 p-2 rounded text-sm">
                          {principle}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 关键方程 */}
                  <div>
                    <h4 className="font-semibold mb-3">关键方程</h4>
                    <div className="space-y-2">
                      {caseStudy.theory.equations.map((equation, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded font-mono text-sm">
                          {equation}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 重要参数 */}
                  <div>
                    <h4 className="font-semibold mb-3">重要参数</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">参数名</th>
                            <th className="text-left p-2">符号</th>
                            <th className="text-left p-2">单位</th>
                            <th className="text-left p-2">典型范围</th>
                          </tr>
                        </thead>
                        <tbody>
                          {caseStudy.theory.parameters.map((param, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{param.name}</td>
                              <td className="p-2 font-mono">{param.symbol}</td>
                              <td className="p-2">{param.unit}</td>
                              <td className="p-2">{param.typical_range}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* 实际应用 */}
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => toggleSection('application')}
              className="w-full justify-between p-0"
            >
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                实际应用
              </CardTitle>
              {expandedSections.application ? <ChevronDown /> : <ChevronRight />}
            </Button>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.application && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">应用实例</h4>
                      <ul className="space-y-1">
                        {caseStudy.realWorldApplication.examples.map((example, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">工程挑战</h4>
                      <ul className="space-y-1">
                        {caseStudy.realWorldApplication.challenges.map((challenge, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                            {challenge}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">解决方案</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {caseStudy.realWorldApplication.solutions.map((solution, index) => (
                        <div key={index} className="bg-green-50 p-2 rounded text-sm">
                          {solution}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* 实验分析 */}
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => toggleSection('experiment')}
              className="w-full justify-between p-0"
            >
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                实验分析
              </CardTitle>
              {expandedSections.experiment ? <ChevronDown /> : <ChevronRight />}
            </Button>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.experiment && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">预期结果</h4>
                      <ul className="space-y-1">
                        {caseStudy.results.expected.map((result, index) => (
                          <li key={index} className="text-sm bg-blue-50 p-2 rounded">
                            {result}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">分析要点</h4>
                      <ul className="space-y-1">
                        {caseStudy.results.analysis.map((point, index) => (
                          <li key={index} className="text-sm bg-yellow-50 p-2 rounded">
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">关键洞察</h4>
                      <ul className="space-y-1">
                        {caseStudy.results.insights.map((insight, index) => (
                          <li key={index} className="text-sm bg-green-50 p-2 rounded">
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* 学习资源 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              学习资源
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">参考文献</h4>
                <ul className="space-y-1">
                  {caseStudy.resources.papers.map((paper, index) => (
                    <li key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                      {paper}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">视频资源</h4>
                <ul className="space-y-1">
                  {caseStudy.resources.videos.map((video, index) => (
                    <li key={index} className="text-sm text-green-600 hover:underline cursor-pointer">
                      {video}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">仿真案例</h4>
                <ul className="space-y-1">
                  {caseStudy.resources.simulations.map((simulation, index) => (
                    <li key={index} className="text-sm text-purple-600 hover:underline cursor-pointer">
                      {simulation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            案例研究库
          </CardTitle>
          <CardDescription>
            深入学习经典流体力学案例，理解理论与实际应用的结合
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">应用领域</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <category.icon className="h-4 w-4" />
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">难度等级</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((difficulty) => (
                    <SelectItem key={difficulty.value} value={difficulty.value}>
                      {difficulty.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 案例列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.map((caseStudy) => {
          const CategoryIcon = getCategoryIcon(caseStudy.category);
          
          return (
            <motion.div
              key={caseStudy.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-5 w-5 text-blue-600" />
                      <Badge className={getDifficultyColor(caseStudy.difficulty)}>
                        {difficulties.find(d => d.value === caseStudy.difficulty)?.label}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {caseStudy.duration}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{caseStudy.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {caseStudy.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-1">学习目标</h4>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        {caseStudy.objectives.slice(0, 2).map((objective, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                            <span className="line-clamp-1">{objective}</span>
                          </li>
                        ))}
                        {caseStudy.objectives.length > 2 && (
                          <li className="text-blue-600">+{caseStudy.objectives.length - 2} 更多...</li>
                        )}
                      </ul>
                    </div>
                    
                    <Button 
                      onClick={() => setSelectedCase(caseStudy.id)}
                      className="w-full"
                    >
                      开始学习
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredCases.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">没有找到符合条件的案例研究</p>
            <p className="text-sm text-gray-500 mt-1">请尝试调整筛选条件</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 