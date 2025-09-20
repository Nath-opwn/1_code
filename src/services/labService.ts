import { apiWrapper } from './api';

/**
 * 实验类型枚举
 */
export enum LabExperimentType {
  STATIC_PRESSURE = 'static_pressure',           // 静水压强实验
  FLUID_STATICS = 'fluid_statics',               // 流体静力学综合实验
  REYNOLDS = 'reynolds',                         // 雷诺实验
  BERNOULLI = 'bernoulli',                       // 伯努利方程验证实验
  VENTURI = 'venturi',                           // 文丘里流量计实验
  FRICTION_LOSS = 'friction_loss',               // 沿程阻力实验
  LOCAL_LOSS = 'local_loss',                     // 局部阻力实验
  MOMENTUM = 'momentum',                         // 动量定律实验
  KARMAN_VORTEX = 'karman_vortex',               // 卡门涡街实验
  BOUNDARY_LAYER = 'boundary_layer',             // 平板边界层速度剖面测量
  HYDRAULIC_JUMP = 'hydraulic_jump',             // 水跃综合实验
  CYLINDER_PRESSURE = 'cylinder_pressure',       // 圆柱绕流表面压力分布实验
  BERNOULLI_LEVITATOR = 'bernoulli_levitator',   // 伯努利悬浮器实验
  HYPERELASTIC = 'hyperelastic',                 // 超弹性现象演示
  DRAG = 'drag',                                  // 阻力实验
  PITOT_TUBE = 'pitot_tube',                      // 毕托管实验
  SHOCK_WAVE = 'shock_wave',                      // 激波实验
  // 传统文化实验
  BOAT_DRIFTING = 'boat_drifting',               // 野渡无人舟自横实验
  ANCIENT_HYDRAULICS = 'ancient_hydraulics',     // 古代水利工程
  SAILING_PRINCIPLES = 'sailing_principles',      // 帆船航行原理
  TRADITIONAL_ARCHITECTURE = 'traditional_architecture' // 传统建筑通风
}

/**
 * 实验参数接口
 */
export interface LabExperimentParams {
  [key: string]: any;
}

/**
 * 实验数据响应接口
 */
export interface LabExperimentData {
  id: string;
  type: LabExperimentType;
  name: string;
  description: string;
  created_at: string;
  parameters: LabExperimentParams;
  results: {
    [key: string]: any;
  };
  visualization_data?: {
    [key: string]: any;
  };
}

/**
 * 实验会话接口
 */
export interface LabSession {
  id: string;
  userId: string;
  experimentType: LabExperimentType;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  parameters: LabExperimentParams;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

/**
 * 实验配置参数
 */
export interface ExperimentParameter {
  name: string;
  type: 'number' | 'select' | 'boolean' | 'text';
  default: any;
  range?: [number, number];
  step?: number;
  options?: string[];
  unit?: string;
  description?: string;
}

/**
 * 实验配置接口
 */
export interface ExperimentConfiguration {
  parameters: ExperimentParameter[];
  description: string;
  theory: string;
  applications: string[];
}

/**
 * 实验服务
 */
const labService = {
  /**
   * 获取所有可用实验
   */
  async getAvailableExperiments(): Promise<{ type: LabExperimentType, name: string, description: string }[]> {
    try {
      const response = await apiWrapper.get<{ type: LabExperimentType, name: string, description: string }[]>('/lab/experiments');
      return response;
    } catch (error) {
      console.warn('使用模拟数据作为后备方案');
      return this.getMockExperiments();
    }
  },
  
  /**
   * 创建实验会话
   */
  async createSession(
    experimentType: LabExperimentType,
    name: string,
    description: string,
    parameters: LabExperimentParams
  ): Promise<LabSession> {
    try {
      const response = await apiWrapper.post<LabSession>('/lab/sessions', {
        experimentType,
        name,
        description,
        parameters
      });
      return response;
    } catch (error) {
      // 模拟创建会话
      return {
        id: `session_${Date.now()}`,
        userId: 'user_1',
        experimentType,
        name,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        parameters,
        status: 'pending'
      };
    }
  },
  
  /**
   * 获取用户的实验会话列表
   */
  async getUserSessions(): Promise<LabSession[]> {
    try {
      const response = await apiWrapper.get<LabSession[]>('/lab/sessions/user');
      return response;
    } catch (error) {
      return [];
    }
  },
  
  /**
   * 获取实验会话详情
   */
  async getSession(sessionId: string): Promise<LabSession> {
    try {
      const response = await apiWrapper.get<LabSession>(`/lab/sessions/${sessionId}`);
      return response;
    } catch (error) {
      throw new Error('获取实验会话失败');
    }
  },
  
  /**
   * 更新实验会话参数
   */
  async updateSessionParameters(sessionId: string, parameters: LabExperimentParams): Promise<LabSession> {
    try {
      const response = await apiWrapper.put<LabSession>(`/lab/sessions/${sessionId}/parameters`, parameters);
      return response;
    } catch (error) {
      throw new Error('更新实验参数失败');
    }
  },
  
  /**
   * 运行实验
   */
  async runExperiment(sessionId: string): Promise<{ jobId: string }> {
    try {
      const response = await apiWrapper.post<{ jobId: string }>(`/lab/sessions/${sessionId}/run`);
      return response;
    } catch (error) {
      // 模拟运行实验
      return { jobId: `job_${Date.now()}` };
    }
  },
  
  /**
   * 获取实验结果
   */
  async getExperimentResults(sessionId: string): Promise<LabExperimentData> {
    try {
      const response = await apiWrapper.get<LabExperimentData>(`/lab/sessions/${sessionId}/results`);
      return response;
    } catch (error) {
      throw new Error('获取实验结果失败');
    }
  },
  
  /**
   * 获取实验状态
   */
  async getExperimentStatus(sessionId: string): Promise<{ status: 'pending' | 'running' | 'completed' | 'failed', progress?: number }> {
    try {
      const response = await apiWrapper.get<{ status: 'pending' | 'running' | 'completed' | 'failed', progress?: number }>(`/lab/sessions/${sessionId}/status`);
      return response;
    } catch (error) {
      // 模拟状态返回
      return { status: 'completed', progress: 100 };
    }
  },
  
  /**
   * 取消实验
   */
  async cancelExperiment(sessionId: string): Promise<void> {
    try {
      await apiWrapper.post<void>(`/lab/sessions/${sessionId}/cancel`);
    } catch (error) {
      console.error('取消实验失败:', error);
    }
  },
  
  /**
   * 获取实验配置选项
   */
  async getExperimentConfiguration(experimentType: LabExperimentType): Promise<ExperimentConfiguration> {
    try {
      const response = await apiWrapper.get<ExperimentConfiguration>(`/lab/experiments/${experimentType}/configuration`);
      return response;
    } catch (error) {
      return this.getMockConfiguration(experimentType);
    }
  },

  /**
   * 模拟实验数据
   */
  getMockExperiments(): { type: LabExperimentType, name: string, description: string }[] {
    return [
      {
        type: LabExperimentType.STATIC_PRESSURE,
        name: '静水压强实验',
        description: '验证流体静力学基本方程，测量静止液体内部压强分布。'
      },
      {
        type: LabExperimentType.FLUID_STATICS,
        name: '流体静力学综合实验',
        description: '包括测压管水头线测量、液体容重测定等。'
      },
      {
        type: LabExperimentType.REYNOLDS,
        name: '雷诺实验',
        description: '观察层流与湍流流态，测定临界雷诺数。'
      },
      {
        type: LabExperimentType.BERNOULLI,
        name: '伯努利方程验证实验',
        description: '验证总水头线与测压管水头线的关系，分析动能与势能转化。'
      },
      {
        type: LabExperimentType.VENTURI,
        name: '文丘里流量计实验',
        description: '测定流量系数，验证气-水多管压差计原理。'
      },
      {
        type: LabExperimentType.FRICTION_LOSS,
        name: '沿程阻力实验',
        description: '测定沿程水头损失系数，绘制λ-Re关系曲线。'
      },
      {
        type: LabExperimentType.LOCAL_LOSS,
        name: '局部阻力实验',
        description: '测量突扩管或阀门处的局部水头损失及阻力系数。'
      },
      {
        type: LabExperimentType.MOMENTUM,
        name: '动量定律实验',
        description: '验证不可压缩流体恒定流动量方程，分析射流冲击力。'
      },
      {
        type: LabExperimentType.KARMAN_VORTEX,
        name: '卡门涡街实验',
        description: '观察圆柱绕流中周期性涡旋脱落现象。'
      },
      {
        type: LabExperimentType.BOUNDARY_LAYER,
        name: '平板边界层速度剖面测量',
        description: '通过热线风速仪测量边界层速度分布。'
      },
      {
        type: LabExperimentType.HYDRAULIC_JUMP,
        name: '水跃综合实验',
        description: '验证平坡矩形明槽自由水跃共轭水深理论。'
      },
      {
        type: LabExperimentType.CYLINDER_PRESSURE,
        name: '圆柱绕流表面压力分布实验',
        description: '用多管压力计测量圆柱表面压强分布。'
      },
      {
        type: LabExperimentType.BERNOULLI_LEVITATOR,
        name: '伯努利悬浮器实验',
        description: '直观展示流速与压强的关系（如飞机机翼升力原理）。'
      },
      {
        type: LabExperimentType.HYPERELASTIC,
        name: '超弹性现象演示',
        description: '观察材料在冲击下的形变与恢复特性。'
      },
      {
        type: LabExperimentType.DRAG,
        name: '阻力实验',
        description: '测量不同形状物体在流体中的阻力系数，分析绕流特性。'
      },
      {
        type: LabExperimentType.PITOT_TUBE,
        name: '毕托管实验',
        description: '使用毕托管测量流体速度，理解驻点压力原理。'
      },
      {
        type: LabExperimentType.SHOCK_WAVE,
        name: '激波实验',
        description: '观察超声速流动中的激波现象，分析激波前后参数变化。'
      },
      {
        type: LabExperimentType.BOAT_DRIFTING,
        name: '野渡无人舟自横',
        description: '基于唐诗《滁州西涧》，探索古代诗人观察到的流体力学现象，理解船只在水流中的稳定性问题。'
      },
      {
        type: LabExperimentType.ANCIENT_HYDRAULICS,
        name: '古代水利工程',
        description: '以都江堰为代表，研究古代水利工程的分流、导流原理，体现古代工程师的智慧。'
      },
      {
        type: LabExperimentType.SAILING_PRINCIPLES,
        name: '古代帆船原理',
        description: '探索古代海上丝绸之路帆船的航行原理，理解风帆产生推进力的流体力学机制。'
      },
      {
        type: LabExperimentType.TRADITIONAL_ARCHITECTURE,
        name: '传统建筑通风',
        description: '分析四合院、古代宫殿等传统建筑的自然通风设计，展现古代建筑师的流体力学智慧。'
      }
    ];
  },

  /**
   * 获取模拟配置
   */
  getMockConfiguration(experimentType: LabExperimentType): ExperimentConfiguration {
    const configurations: Partial<Record<LabExperimentType, ExperimentConfiguration>> = {
      [LabExperimentType.REYNOLDS]: {
        parameters: [
          {
            name: '流速',
            type: 'number' as const,
            default: 1.0,
            range: [0.1, 5.0] as [number, number],
            step: 0.1,
            unit: 'm/s',
            description: '管道内平均流速'
          },
          {
            name: '管道直径',
            type: 'number' as const,
            default: 0.02,
            range: [0.01, 0.05] as [number, number],
            step: 0.001,
            unit: 'm',
            description: '圆管内径'
          },
          {
            name: '流体粘度',
            type: 'number' as const,
            default: 1e-6,
            range: [1e-7, 1e-5] as [number, number],
            step: 1e-7,
            unit: 'm²/s',
            description: '运动粘度系数'
          },
          {
            name: '流体类型',
            type: 'select' as const,
            default: '水',
            options: ['水', '空气', '油'],
            description: '实验流体介质'
          }
        ],
        description: '雷诺实验用于观察和研究流体的层流与湍流现象，确定临界雷诺数。',
        theory: '雷诺数Re = ρvd/μ = vd/ν，当Re < 2300时为层流，Re > 4000时为湍流。',
        applications: ['管道设计', '流量控制', '换热器设计']
      },
      
      [LabExperimentType.BERNOULLI]: {
        parameters: [
          {
            name: '入口流速',
            type: 'number' as const,
            default: 2.0,
            range: [0.5, 5.0] as [number, number],
            step: 0.1,
            unit: 'm/s',
            description: '管道入口流速'
          },
          {
            name: '收缩比',
            type: 'number' as const,
            default: 0.5,
            range: [0.3, 0.8] as [number, number],
            step: 0.05,
            unit: '',
            description: '收缩段面积比'
          },
          {
            name: '测量点数',
            type: 'select' as const,
            default: '5',
            options: ['3', '5', '7', '9'],
            description: '压力测量点数量'
          }
        ],
        description: '验证伯努利方程，分析流体在不同截面的能量转换。',
        theory: 'p₁/ρg + v₁²/2g + z₁ = p₂/ρg + v₂²/2g + z₂ + h_loss',
        applications: ['流量测量', '风洞设计', '水力机械']
      },

      [LabExperimentType.KARMAN_VORTEX]: {
        parameters: [
          {
            name: '雷诺数',
            type: 'number' as const,
            default: 100,
            range: [40, 300] as [number, number],
            step: 5,
            unit: '',
            description: '基于圆柱直径的雷诺数'
          },
          {
            name: '圆柱直径',
            type: 'number' as const,
            default: 1.0,
            range: [0.5, 2.0] as [number, number],
            step: 0.1,
            unit: 'scale',
            description: '相对圆柱直径'
          },
          {
            name: '流速',
            type: 'number' as const,
            default: 1.5,
            range: [0.5, 3.0] as [number, number],
            step: 0.1,
            unit: 'm/s',
            description: '来流速度'
          },
          {
            name: '可视化模式',
            type: 'select' as const,
            default: '涡量场',
            options: ['速度场', '压力场', '涡量场', '流线'],
            description: '流场可视化方式'
          }
        ],
        description: '观察和分析圆柱绕流中的卡门涡街现象，研究涡脱落频率。',
        theory: '斯特劳哈尔数St = fD/v，对于圆柱绕流St ≈ 0.2（Re = 40-300）',
        applications: ['结构抗风设计', '流量计原理', '海洋工程']
      },

      [LabExperimentType.BOAT_DRIFTING]: {
        parameters: [
          {
            name: '水流速度',
            type: 'number' as const,
            default: 0.3,
            range: [0.1, 1.0] as [number, number],
            step: 0.1,
            unit: 'm/s',
            description: '河流水流速度'
          },
          {
            name: '船体长度',
            type: 'number' as const,
            default: 5.0,
            range: [3.0, 8.0] as [number, number],
            step: 0.5,
            unit: 'm',
            description: '船体长半轴'
          },
          {
            name: '船体宽度',
            type: 'number' as const,
            default: 2.5,
            range: [1.5, 4.0] as [number, number],
            step: 0.25,
            unit: 'm',
            description: '船体短半轴'
          },
          {
            name: '初始角度',
            type: 'number' as const,
            default: 45,
            range: [0, 90] as [number, number],
            step: 5,
            unit: '度',
            description: '船体与水流方向初始夹角'
          },
          {
            name: '阻尼系数',
            type: 'number' as const,
            default: 0.5,
            range: [0.1, 2.0] as [number, number],
            step: 0.1,
            unit: '',
            description: '水阻尼对船只运动的影响'
          }
        ],
        description: '基于韦应物《滁州西涧》中"野渡无人舟自横"的现象，探索船只在水流中的稳定性问题。',
        theory: '力矩方程：M(α) = (1/2)πρ(a²-b²)v²sin(2α)，当α=90°时达到稳定平衡。',
        applications: ['船舶设计', '海洋工程', '古代文献研究', '跨学科教育']
      },

      [LabExperimentType.ANCIENT_HYDRAULICS]: {
        parameters: [
          {
            name: '进水流量',
            type: 'number' as const,
            default: 100,
            range: [50, 200] as [number, number],
            step: 10,
            unit: 'm³/s',
            description: '岷江进入都江堰的流量'
          },
          {
            name: '分流比例',
            type: 'number' as const,
            default: 0.6,
            range: [0.4, 0.8] as [number, number],
            step: 0.05,
            unit: '',
            description: '内江与外江的分流比例'
          },
          {
            name: '河道倾斜角',
            type: 'number' as const,
            default: 2.0,
            range: [1.0, 5.0] as [number, number],
            step: 0.2,
            unit: '度',
            description: '河道倾斜角度'
          },
          {
            name: '鱼嘴分水堤角度',
            type: 'number' as const,
            default: 30,
            range: [20, 45] as [number, number],
            step: 2.5,
            unit: '度',
            description: '鱼嘴分水堤的分流角度'
          }
        ],
        description: '模拟都江堰水利工程的分流原理，体现古代工程师的流体力学智慧。',
        theory: '利用河床地形和人工建筑物，实现自然分流和自动排沙，体现了古代工程的科学性。',
        applications: ['水利工程设计', '河道治理', '古代工程研究', '可持续发展']
      },

      [LabExperimentType.SAILING_PRINCIPLES]: {
        parameters: [
          {
            name: '风速',
            type: 'number' as const,
            default: 8.0,
            range: [3.0, 15.0] as [number, number],
            step: 0.5,
            unit: 'm/s',
            description: '海面风速'
          },
          {
            name: '风向角',
            type: 'number' as const,
            default: 45,
            range: [0, 180] as [number, number],
            step: 15,
            unit: '度',
            description: '风向与船首方向夹角'
          },
          {
            name: '帆面积',
            type: 'number' as const,
            default: 50,
            range: [20, 100] as [number, number],
            step: 5,
            unit: 'm²',
            description: '帆船总帆面积'
          },
          {
            name: '帆型',
            type: 'select' as const,
            default: '中式帆船',
            options: ['中式帆船', '阿拉伯三角帆', '欧式方帆'],
            description: '不同历史时期的帆型设计'
          }
        ],
        description: '研究古代海上丝绸之路时期帆船的航行原理，理解不同帆型的流体力学特性。',
        theory: '帆面升力：L = 0.5ρv²SCL，通过调节帆面角度和形状，获得最佳推进效果。',
        applications: ['古代航海研究', '风能利用', '船舶设计', '海上丝绸之路文化']
      },

      [LabExperimentType.TRADITIONAL_ARCHITECTURE]: {
        parameters: [
          {
            name: '外部风速',
            type: 'number' as const,
            default: 3.0,
            range: [1.0, 8.0] as [number, number],
            step: 0.5,
            unit: 'm/s',
            description: '建筑外部环境风速'
          },
          {
            name: '温差',
            type: 'number' as const,
            default: 5.0,
            range: [2.0, 15.0] as [number, number],
            step: 1.0,
            unit: '°C',
            description: '室内外温度差'
          },
          {
            name: '院落尺寸',
            type: 'number' as const,
            default: 20,
            range: [10, 40] as [number, number],
            step: 2,
            unit: 'm',
            description: '四合院中庭尺寸'
          },
          {
            name: '建筑类型',
            type: 'select' as const,
            default: '四合院',
            options: ['四合院', '徽派建筑', '岭南建筑', '故宫宫殿'],
            description: '不同地区的传统建筑形式'
          }
        ],
        description: '分析传统建筑的自然通风设计，探索古代建筑师如何利用流体力学原理实现室内环境调节。',
        theory: '热压通风：Δp = ρgh(Ti-To)/To，风压通风：Δp = 0.5ρv²(Cp1-Cp2)',
        applications: ['建筑设计', '节能环保', '古建筑保护', '传统文化传承']
      }
    };

    return configurations[experimentType] || {
      parameters: [],
      description: '实验配置暂未准备',
      theory: '',
      applications: []
    };
  },

  /**
   * 模拟实验结果生成
   */
  async generateMockResults(experimentType: LabExperimentType, parameters: LabExperimentParams): Promise<LabExperimentData> {
    // 模拟异步计算延迟
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockResults: Partial<Record<LabExperimentType, any>> = {
      [LabExperimentType.REYNOLDS]: {
        reynolds_number: (parameters.流速 * parameters.管道直径) / parameters.流体粘度,
        flow_regime: parameters.流速 > 2.0 ? '湍流' : '层流',
        pressure_drop: Math.random() * 1000 + 500,
        velocity_profile: Array.from({ length: 20 }, (_, i) => ({
          position: i / 19,
          velocity: Math.random() * parameters.流速
        }))
      },
      [LabExperimentType.BERNOULLI]: {
        pressure_distribution: Array.from({ length: 5 }, (_, i) => ({
          position: i,
          static_pressure: 1000 - i * 50 + Math.random() * 20,
          dynamic_pressure: Math.pow(parameters.入口流速 * (1 + i * 0.2), 2) * 500 + Math.random() * 10,
          total_pressure: 1500 + Math.random() * 50
        })),
        flow_coefficient: 0.98 + Math.random() * 0.02
      },
      [LabExperimentType.KARMAN_VORTEX]: {
        strouhal_number: 0.2 + Math.random() * 0.05,
        vortex_frequency: (0.2 * parameters.流速) / parameters.圆柱直径,
        lift_coefficient: Math.sin(Date.now() / 1000) * 0.5,
        drag_coefficient: 1.2 + Math.random() * 0.3,
        flow_field: Array.from({ length: 100 }, (_, i) => ({
          x: (i % 10) * 0.1,
          y: Math.floor(i / 10) * 0.1,
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 2 - 1,
          pressure: Math.random() * 1000
        }))
      }
    };

    return {
      id: `result_${Date.now()}`,
      type: experimentType,
      name: this.getMockExperiments().find(exp => exp.type === experimentType)?.name || '',
      description: '模拟实验结果',
      created_at: new Date().toISOString(),
      parameters,
      results: mockResults[experimentType] || {},
      visualization_data: {
        type: '3d_flow_field',
        particles: Array.from({ length: 1000 }, () => ({
          x: Math.random() * 10,
          y: Math.random() * 5,
          z: Math.random() * 2,
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 2 - 1,
          vz: Math.random() * 0.5 - 0.25
        }))
      }
    };
  }
};

export default labService; 