import { LabExperimentType } from '../services/labService';

export interface ExperimentBackground {
  title: string;
  subtitle: string;
  overview: string;
  historicalContext?: string;
  scientificPrinciples: string[];
  educationalValue: string[];
  applications: string[];
  keyFeatures: string[];
  culturalSignificance?: string;
}

export const experimentBackgrounds: Record<LabExperimentType, ExperimentBackground> = {
  [LabExperimentType.BOAT_DRIFTING]: {
    title: "野渡无人舟自横",
    subtitle: "古诗词中的流体力学智慧",
    overview: "基于唐诗《滁州西涧》中的著名诗句，通过现代流体力学理论分析船只在水流中的稳定性问题，展现传统文化与现代科学的完美融合。",
    historicalContext: "唐代诗人韦应物在《滁州西涧》中写道：'春潮带雨晚来急，野渡无人舟自横'，千年前的细致观察记录了一个深刻的流体力学现象。",
    scientificPrinciples: [
      "椭圆柱绕流力矩公式：M(α) = (1/2)πρ(a²-b²)v²sin(2α)",
      "稳定性分析：α=0°不稳定，α=90°稳定",
      "力矩平衡与角速度阻尼",
      "系泊力对船只运动的影响"
    ],
    educationalValue: [
      "展现传统文化的科学内涵",
      "培养跨学科思维能力",
      "理解稳定性理论应用",
      "建立文化自信与科学精神"
    ],
    applications: [
      "船舶稳性设计",
      "海洋工程锚泊",
      "古代文献科学解读",
      "STEAM教育实践"
    ],
    keyFeatures: [
      "3D船只运动仿真",
      "古诗词文化背景",
      "实时稳定性分析",
      "文理融合教学"
    ],
    culturalSignificance: "体现了中华文化中蕴含的科学智慧，展现了古代文人敏锐的观察力和朴素的科学认知，为现代科学教育提供了文化底蕴。"
  },

  [LabExperimentType.ANCIENT_HYDRAULICS]: {
    title: "古代水利工程",
    subtitle: "都江堰的千年治水智慧",
    overview: "以都江堰为代表，分析古代水利工程的科学原理，展现古代工程师如何巧妙利用自然规律实现治水目标。",
    historicalContext: "公元前256年，秦国蜀郡太守李冰父子主持修建都江堰，采用'乘势利导、因地制宜'的理念，创造了世界水利史上的奇迹。",
    scientificPrinciples: [
      "鱼嘴分水：利用弯道环流实现自动分流",
      "飞沙堰排沙：二次流作用下的泥沙输运",
      "宝瓶口控流：节流原理控制下游流量",
      "无坝引水：顺应自然的生态水利理念"
    ],
    educationalValue: [
      "理解古代工程智慧",
      "学习生态水利理念",
      "掌握分流排沙原理",
      "培养可持续发展思维"
    ],
    applications: [
      "现代水利工程设计",
      "河道治理技术",
      "生态环境保护",
      "文化遗产传承"
    ],
    keyFeatures: [
      "3D都江堰模型",
      "分流效果仿真",
      "历史文化介绍",
      "工程原理分析"
    ],
    culturalSignificance: "展现了中华民族治水的伟大智慧，体现了'天人合一'的哲学理念，为现代水利工程提供了宝贵的设计思想。"
  },

  [LabExperimentType.SAILING_PRINCIPLES]: {
    title: "古代帆船原理",
    subtitle: "海上丝绸之路的科学基础",
    overview: "研究古代帆船的航行原理，分析不同帆型的流体力学特性，展现古代海上交通工具的科学内涵。",
    historicalContext: "古代海上丝绸之路连接东西方文明，中国的宝船、阿拉伯的三角帆船等不同帆型体现了各民族的航海智慧。",
    scientificPrinciples: [
      "帆面升力公式：L = 0.5ρv²SCL",
      "风帆攻角与升力关系",
      "不同帆型的流体力学特性",
      "逆风航行的科学原理"
    ],
    educationalValue: [
      "理解风帆推进原理",
      "了解古代航海技术",
      "掌握升力产生机制",
      "认识文明交流载体"
    ],
    applications: [
      "现代帆船设计",
      "风能利用技术",
      "海洋交通工具",
      "文化交流研究"
    ],
    keyFeatures: [
      "多种帆型对比",
      "风向风速影响",
      "航行轨迹仿真",
      "历史文化背景"
    ],
    culturalSignificance: "体现了人类利用自然力量的智慧，展现了古代海上丝绸之路的科技基础，促进了东西方文明的交流融合。"
  },

  [LabExperimentType.TRADITIONAL_ARCHITECTURE]: {
    title: "传统建筑通风",
    subtitle: "古代建筑的流体力学智慧",
    overview: "分析四合院、古代宫殿等传统建筑的自然通风设计，揭示古代建筑师如何利用流体力学原理实现室内环境调节。",
    historicalContext: "中国古代建筑充分考虑了自然通风和采光，从四合院的天井设计到紫禁城的空间布局，都体现了对自然规律的深刻理解。",
    scientificPrinciples: [
      "热压通风：Δp = ρgh(Ti-To)/To",
      "风压通风：Δp = 0.5ρv²(Cp1-Cp2)",
      "烟囱效应与拔风原理",
      "院落空间的流场组织"
    ],
    educationalValue: [
      "理解自然通风原理",
      "学习绿色建筑理念",
      "掌握流体环境设计",
      "传承建筑文化智慧"
    ],
    applications: [
      "绿色建筑设计",
      "自然通风系统",
      "古建筑保护",
      "节能环保技术"
    ],
    keyFeatures: [
      "多种建筑类型",
      "通风效果分析",
      "温度场分布",
      "节能效果评估"
    ],
    culturalSignificance: "体现了中国古代建筑'因地制宜、顺应自然'的设计理念，展现了传统建筑的生态智慧和可持续发展思想。"
  },

  // 其他实验的简化版本配置
  [LabExperimentType.STATIC_PRESSURE]: {
    title: "静水压强实验",
    subtitle: "探索流体静力学基本定律",
    overview: "通过测量静止液体内部不同位置的压强，验证帕斯卡定律和流体静力学基本方程，理解压强与深度的关系。",
    scientificPrinciples: ["帕斯卡定律", "静水压强公式：p = ρgh + p₀"],
    educationalValue: ["建立压强概念", "理解流体静力学规律"],
    applications: ["水坝设计", "潜水器设计"],
    keyFeatures: ["多点压强测量", "实时数据记录"]
  },

  [LabExperimentType.FLUID_STATICS]: {
    title: "流体静力学综合实验",
    subtitle: "全面掌握流体静力学原理",
    overview: "综合性实验项目，包括测压管水头线测量、液体容重测定等多个子实验。",
    scientificPrinciples: ["阿基米德浮力原理", "流体静力学基本方程"],
    educationalValue: ["系统性掌握流体静力学", "提高综合实验能力"],
    applications: ["船舶稳性计算", "水工建筑物设计"],
    keyFeatures: ["多实验模块集成", "自动化测量系统"]
  },

  [LabExperimentType.REYNOLDS]: {
    title: "雷诺实验",
    subtitle: "观察层流与湍流转换",
    overview: "通过可视化流动实验，观察流体从层流到湍流的转换过程，测定临界雷诺数。",
    historicalContext: "1883年，奥斯本·雷诺兹首次通过著名的着色实验揭示了流体流动的两种基本状态。",
    scientificPrinciples: ["雷诺数Re = ρvd/μ", "层流与湍流判别准则"],
    educationalValue: ["建立层流湍流概念", "理解无量纲数重要性"],
    applications: ["管道流动设计", "换热器优化"],
    keyFeatures: ["实时流态可视化", "1000粒子仿真"]
  },

  [LabExperimentType.BERNOULLI]: {
    title: "伯努利方程验证实验",
    subtitle: "验证流体能量守恒定律",
    overview: "通过测量流体在不同截面的速度和压强，验证伯努利方程。",
    historicalContext: "1738年，丹尼尔·伯努利提出了著名的伯努利方程。",
    scientificPrinciples: ["伯努利方程", "流体机械能守恒"],
    educationalValue: ["理解能量守恒应用", "掌握伯努利方程意义"],
    applications: ["飞机机翼升力", "流量测量装置"],
    keyFeatures: ["多截面压力测量", "能量转换分析"]
  },

  [LabExperimentType.VENTURI]: {
    title: "文丘里流量计实验",
    subtitle: "基于伯努利原理的流量测量",
    overview: "利用文丘里管的收缩-扩张结构，通过测量压差来确定流量。",
    scientificPrinciples: ["连续性方程", "伯努利方程应用"],
    educationalValue: ["理解流量测量原理", "掌握文丘里管机制"],
    applications: ["工业流量监测", "水处理系统"],
    keyFeatures: ["精确压差测量", "流量系数标定"]
  },

  [LabExperimentType.FRICTION_LOSS]: {
    title: "沿程阻力实验",
    subtitle: "研究管道摩擦损失规律",
    overview: "测量流体在直管中的压力损失，研究摩擦阻力系数与雷诺数的关系。",
    scientificPrinciples: ["达西-魏斯巴赫公式", "摩擦阻力系数"],
    educationalValue: ["理解管道阻力机理", "掌握阻力计算方法"],
    applications: ["供水管网设计", "石油输送管道"],
    keyFeatures: ["多种管径测试", "λ-Re关系图绘制"]
  },

  [LabExperimentType.LOCAL_LOSS]: {
    title: "局部阻力实验",
    subtitle: "研究管件局部损失特性",
    overview: "测量各种管件的局部阻力系数，分析几何形状对阻力的影响。",
    scientificPrinciples: ["局部阻力公式", "阻力系数确定"],
    educationalValue: ["理解局部阻力原因", "掌握阻力系数测定"],
    applications: ["管道系统设计", "阀门性能评估"],
    keyFeatures: ["多种管件测试", "阻力系数数据库"]
  },

  [LabExperimentType.MOMENTUM]: {
    title: "动量定律实验",
    subtitle: "验证流体动量守恒定律",
    overview: "通过测量射流对挡板的冲击力，验证动量定律在流体中的应用。",
    scientificPrinciples: ["动量定律：F = ρQv", "冲量与动量变化"],
    educationalValue: ["理解动量定律含义", "掌握冲击力计算"],
    applications: ["水轮机叶片设计", "喷射器原理"],
    keyFeatures: ["力传感器测量", "流量精确控制"]
  },

  [LabExperimentType.KARMAN_VORTEX]: {
    title: "卡门涡街实验",
    subtitle: "观察周期性涡脱落现象",
    overview: "研究圆柱绕流中的卡门涡街现象，测量涡脱落频率。",
    historicalContext: "1912年，西奥多·冯·卡门首次理论分析了这种周期性涡脱落现象。",
    scientificPrinciples: ["斯特劳哈尔数：St = fD/v ≈ 0.2", "涡街脱落频率"],
    educationalValue: ["理解非定常流动", "掌握涡街产生机理"],
    applications: ["结构抗风设计", "涡街流量计"],
    keyFeatures: ["实时涡街可视化", "频率谱分析"]
  },

  [LabExperimentType.BOUNDARY_LAYER]: {
    title: "边界层实验",
    subtitle: "研究壁面附近流动特性",
    overview: "测量平板边界层内的速度分布，验证布拉修斯解。",
    historicalContext: "1904年，路德维希·普朗特提出了边界层理论。",
    scientificPrinciples: ["边界层概念", "布拉修斯解"],
    educationalValue: ["理解粘性效应", "掌握边界层理论"],
    applications: ["飞机机翼设计", "船舶阻力计算"],
    keyFeatures: ["热线风速仪测量", "边界层参数计算"]
  },

  [LabExperimentType.HYDRAULIC_JUMP]: {
    title: "水跃实验",
    subtitle: "研究急流向缓流转换",
    overview: "观察明渠中的水跃现象，测量共轭水深。",
    scientificPrinciples: ["弗劳德数", "水跃条件"],
    educationalValue: ["理解急流缓流概念", "掌握水跃形成条件"],
    applications: ["溢洪道消能设计", "渠道水流控制"],
    keyFeatures: ["可调节底坡", "水深自动测量"]
  },

  [LabExperimentType.CYLINDER_PRESSURE]: {
    title: "圆柱绕流压力分布实验",
    subtitle: "测量绕流表面压强分布",
    overview: "使用多点压力测量系统，获得圆柱表面压力分布。",
    scientificPrinciples: ["压力系数", "边界层分离"],
    educationalValue: ["理解绕流压力规律", "掌握阻力产生机理"],
    applications: ["桥墩抗冲设计", "建筑物风载计算"],
    keyFeatures: ["64点压力测量", "压力系数分布图"]
  },

  [LabExperimentType.BERNOULLI_LEVITATOR]: {
    title: "伯努利悬浮器实验",
    subtitle: "直观展示伯努利效应",
    overview: "通过气流悬浮小球的演示实验，直观展示伯努利原理。",
    scientificPrinciples: ["伯努利原理应用", "升力产生机制"],
    educationalValue: ["建立伯努利感性认识", "理解升力原理"],
    applications: ["飞机升力原理", "悬浮输送技术"],
    keyFeatures: ["实时悬浮演示", "原理动画解释"]
  },

  [LabExperimentType.HYPERELASTIC]: {
    title: "超弹性现象演示",
    subtitle: "观察材料非线性变形行为",
    overview: "演示橡胶类材料在大变形下的超弹性行为。",
    scientificPrinciples: ["超弹性本构关系", "大变形理论"],
    educationalValue: ["理解材料非线性行为", "掌握大变形分析"],
    applications: ["橡胶制品设计", "减震器设计"],
    keyFeatures: ["实时变形显示", "材料特性分析"]
  },

  [LabExperimentType.DRAG]: {
    title: "阻力实验",
    subtitle: "测量不同形状物体的阻力特性",
    overview: "在风洞中测量不同形状物体的阻力系数。",
    scientificPrinciples: ["阻力系数", "流线型设计原理"],
    educationalValue: ["理解阻力产生机理", "学会流线型设计"],
    applications: ["汽车造型设计", "建筑抗风设计"],
    keyFeatures: ["多种测试模型", "减阻效果分析"]
  },

  [LabExperimentType.PITOT_TUBE]: {
    title: "毕托管实验",
    subtitle: "掌握流速测量基本方法",
    overview: "使用毕托管测量流体速度，理解驻点压力原理。",
    scientificPrinciples: ["伯努利方程测速应用", "驻点压力"],
    educationalValue: ["理解压力测速原理", "掌握毕托管使用"],
    applications: ["飞机空速测量", "风速监测"],
    keyFeatures: ["高精度压力测量", "速度剖面绘制"]
  },

  [LabExperimentType.SHOCK_WAVE]: {
    title: "激波实验",
    subtitle: "研究超声速流动现象",
    overview: "在激波管中观察激波的形成和传播。",
    scientificPrinciples: ["Rankine-Hugoniot关系", "激波强度"],
    educationalValue: ["理解可压缩流动", "掌握激波理论"],
    applications: ["超声速飞机设计", "火箭发动机"],
    keyFeatures: ["高速摄影记录", "激波可视化"]
  }
};

export default experimentBackgrounds; 