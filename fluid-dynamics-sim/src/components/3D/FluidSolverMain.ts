/**
 * FluidSolverMain.ts
 * 主流体求解器模块，整合所有物理计算功能
 * 实现完整的Navier-Stokes方程求解流程
 */

import { 
  FluidField, 
  BoundaryType, 
  BoundaryConditions, 
  createFluidField, 
  createDefaultBoundaryConditions, 
  addCircularObstacle,
  addRectangularObstacle,
  initializeFluidField
} from './FluidSolver';

import { 
  diffuse, 
  advect,
  applyVorticityConfinement,
  computeVorticity
} from './FluidSolverDynamics';

import { 
  project,
  checkDivergenceConvergence,
  adaptivePressureSolve
} from './FluidSolverPressure';

/**
 * 流体模拟配置接口
 */
export interface FluidSimulationConfig {
  // 网格参数
  width: number;              // 网格宽度
  height: number;             // 网格高度
  dx: number;                 // 网格间距 (m)
  
  // 物理参数
  density: number;            // 流体密度 (kg/m³)
  viscosity: number;          // 动力粘性系数 (Pa·s)
  timeStep: number;           // 时间步长 (s)
  
  // 求解器参数
  diffusionIterations: number;  // 扩散迭代次数
  pressureIterations: number;   // 压力求解迭代次数
  enableVorticityConfinement: boolean; // 是否启用涡量增强
  vorticityStrength: number;    // 涡量增强强度
  
  // 边界条件
  inflow: {
    velocity: [number, number]; // 入口速度 [u, v] (m/s)
    temperature: number;        // 入口温度 (K)
  };
  outflow: {
    pressure: number;           // 出口压力 (Pa)
  };
  
  // 模拟控制
  maxSimulationTime: number;    // 最大模拟时间 (s)
  outputInterval: number;       // 输出时间间隔 (s)
}

/**
 * 流体模拟状态
 */
export interface FluidSimulationState {
  currentTime: number;
  stepCount: number;
  isRunning: boolean;
  convergenceHistory: number[];
  averageDivergence: number;
  maxVelocity: number;
  maxVorticity: number;
  reynoldsNumber: number;
}

/**
 * 可视化数据接口
 */
export interface FluidVisualizationData {
  // 网格信息
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  
  // 速度场数据
  velocityField: {
    u: number[][];
    v: number[][];
    magnitude: number[][];
  };
  
  // 标量场数据
  pressureField: number[][];
  vorticityField: number[][];
  temperatureField: number[][];
  
  // 边界信息
  boundaryMask: number[][];
  
  // 流线种子点
  streamlineSeeds: Array<{ x: number, y: number }>;
  
  // 统计信息
  statistics: {
    maxVelocity: number;
    minPressure: number;
    maxPressure: number;
    maxVorticity: number;
    averageDivergence: number;
  };
}

/**
 * 主流体求解器类
 */
export class FluidSimulator {
  private field: FluidField;
  private boundary: BoundaryConditions;
  private config: FluidSimulationConfig;
  private state: FluidSimulationState;
  private obstacles: Array<{ type: string, params: any }>;
  
  constructor(config: FluidSimulationConfig) {
    this.config = config;
    this.obstacles = [];
    
    // 创建流体场
    this.field = createFluidField(
      config.width,
      config.height,
      config.density,
      config.viscosity,
      config.dx,
      config.timeStep
    );
    
    // 创建边界条件
    this.boundary = createDefaultBoundaryConditions(config.width, config.height);
    this.boundary.inflow = config.inflow;
    this.boundary.outflow = config.outflow;
    
    // 初始化模拟状态
    this.state = {
      currentTime: 0,
      stepCount: 0,
      isRunning: false,
      convergenceHistory: [],
      averageDivergence: 0,
      maxVelocity: 0,
      maxVorticity: 0,
      reynoldsNumber: this.calculateReynoldsNumber()
    };
    
    // 初始化流体场
    this.reset();
  }
  
  /**
   * 重置模拟
   */
  public reset(): void {
    // 重置时间和状态
    this.state.currentTime = 0;
    this.state.stepCount = 0;
    this.state.isRunning = false;
    this.state.convergenceHistory = [];
    
    // 重新初始化流体场
    initializeFluidField(this.field, this.config.inflow.velocity, this.config.inflow.temperature);
    
    // 重新创建边界条件
    this.boundary = createDefaultBoundaryConditions(this.config.width, this.config.height);
    this.boundary.inflow = this.config.inflow;
    this.boundary.outflow = this.config.outflow;
    
    // 重新应用障碍物
    this.applyObstacles();
  }
  
  /**
   * 添加圆形障碍物
   */
  public addCircularObstacle(centerX: number, centerY: number, radius: number): void {
    this.obstacles.push({
      type: 'circle',
      params: { centerX, centerY, radius }
    });
    
    addCircularObstacle(this.boundary, centerX, centerY, radius);
  }
  
  /**
   * 添加矩形障碍物
   */
  public addRectangularObstacle(x1: number, y1: number, x2: number, y2: number): void {
    this.obstacles.push({
      type: 'rectangle',
      params: { x1, y1, x2, y2 }
    });
    
    addRectangularObstacle(this.boundary, x1, y1, x2, y2);
  }
  
  /**
   * 清除所有障碍物
   */
  public clearObstacles(): void {
    this.obstacles = [];
    this.boundary = createDefaultBoundaryConditions(this.config.width, this.config.height);
    this.boundary.inflow = this.config.inflow;
    this.boundary.outflow = this.config.outflow;
  }
  
  /**
   * 应用所有障碍物
   */
  private applyObstacles(): void {
    for (const obstacle of this.obstacles) {
      if (obstacle.type === 'circle') {
        const { centerX, centerY, radius } = obstacle.params;
        addCircularObstacle(this.boundary, centerX, centerY, radius);
      } else if (obstacle.type === 'rectangle') {
        const { x1, y1, x2, y2 } = obstacle.params;
        addRectangularObstacle(this.boundary, x1, y1, x2, y2);
      }
    }
  }
  
  /**
   * 执行一个时间步的模拟
   */
  public step(): void {
    if (!this.state.isRunning) return;
    
    // Navier-Stokes方程求解流程
    this.solveNavierStokes();
    
    // 更新模拟状态
    this.updateSimulationState();
    
    // 检查停止条件
    if (this.state.currentTime >= this.config.maxSimulationTime) {
      this.state.isRunning = false;
    }
  }
  
  /**
   * 求解Navier-Stokes方程
   */
  private solveNavierStokes(): void {
    // 第一步：扩散步骤（处理粘性）
    // ∂u/∂t = ν∇²u
    diffuse(this.field, this.boundary, this.config.diffusionIterations);
    
    // 第二步：压力投影（确保无散度）
    // 求解 ∇²p = ρ∇·v/Δt
    project(this.field, this.boundary, this.config.pressureIterations);
    
    // 第三步：平流步骤（处理对流）
    // ∂u/∂t + u·∇u = 0
    advect(this.field, this.boundary);
    
    // 第四步：再次压力投影（保证数值稳定性）
    project(this.field, this.boundary, this.config.pressureIterations);
    
    // 第五步：涡量增强（可选，减少数值耗散）
    if (this.config.enableVorticityConfinement) {
      applyVorticityConfinement(
        this.field, 
        this.boundary, 
        this.config.timeStep,
        this.config.vorticityStrength
      );
    }
    
    // 第六步：计算涡量场（用于可视化和分析）
    computeVorticity(this.field, this.boundary);
    
    // 第七步：应用外力（如果需要）
    this.applyExternalForces();
  }
  
  /**
   * 应用外力（重力、浮力等）
   */
  private applyExternalForces(): void {
    const { width, height } = this.field;
    const gravity = -9.81; // 重力加速度 (m/s²)
    const buoyancyCoeff = 0.0001; // 浮力系数
    const referenceTemp = 298; // 参考温度 (K)
    
    // 应用重力和浮力
    for (let y = 1; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.boundary.type[y-1][x] !== BoundaryType.SOLID && 
            this.boundary.type[y][x] !== BoundaryType.SOLID) {
          
          // 基于温度的浮力计算
          const avgTemp = (this.field.temperature[y-1][x] + this.field.temperature[y][x]) * 0.5;
          const buoyancyForce = buoyancyCoeff * (avgTemp - referenceTemp);
          
          // 应用重力和浮力到v速度分量
          this.field.v[y][x] += (gravity + buoyancyForce) * this.config.timeStep;
        }
      }
    }
  }
  
  /**
   * 更新模拟状态
   */
  private updateSimulationState(): void {
    this.state.currentTime += this.config.timeStep;
    this.state.stepCount++;
    
    // 计算统计信息
    this.state.averageDivergence = checkDivergenceConvergence(this.field, this.boundary);
    this.state.convergenceHistory.push(this.state.averageDivergence);
    
    // 限制历史记录长度
    if (this.state.convergenceHistory.length > 1000) {
      this.state.convergenceHistory.shift();
    }
    
    // 计算最大速度和涡量
    this.state.maxVelocity = this.calculateMaxVelocity();
    this.state.maxVorticity = this.calculateMaxVorticity();
    
    // 更新雷诺数
    this.state.reynoldsNumber = this.calculateReynoldsNumber();
  }
  
  /**
   * 计算最大速度
   */
  private calculateMaxVelocity(): number {
    const { width, height } = this.field;
    let maxVel = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.boundary.type[y][x] !== BoundaryType.SOLID) {
          // 插值获得中心位置的速度
          const u = 0.5 * (this.field.u[y][x] + this.field.u[y][x+1]);
          const v = 0.5 * (this.field.v[y][x] + this.field.v[y+1][x]);
          const magnitude = Math.sqrt(u*u + v*v);
          
          maxVel = Math.max(maxVel, magnitude);
        }
      }
    }
    
    return maxVel;
  }
  
  /**
   * 计算最大涡量
   */
  private calculateMaxVorticity(): number {
    const { width, height } = this.field;
    let maxVort = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.boundary.type[y][x] !== BoundaryType.SOLID) {
          maxVort = Math.max(maxVort, Math.abs(this.field.vorticity[y][x]));
        }
      }
    }
    
    return maxVort;
  }
  
  /**
   * 计算雷诺数
   */
  private calculateReynoldsNumber(): number {
    const characteristicLength = Math.min(this.config.width, this.config.height) * this.config.dx;
    const characteristicVelocity = Math.sqrt(
      this.config.inflow.velocity[0] ** 2 + this.config.inflow.velocity[1] ** 2
    );
    const kinematicViscosity = this.config.viscosity / this.config.density;
    
    return (characteristicVelocity * characteristicLength) / kinematicViscosity;
  }
  
  /**
   * 开始模拟
   */
  public start(): void {
    this.state.isRunning = true;
  }
  
  /**
   * 停止模拟
   */
  public stop(): void {
    this.state.isRunning = false;
  }
  
  /**
   * 暂停/恢复模拟
   */
  public togglePause(): void {
    this.state.isRunning = !this.state.isRunning;
  }
  
  /**
   * 获取模拟状态
   */
  public getState(): FluidSimulationState {
    return { ...this.state };
  }
  
  /**
   * 获取配置
   */
  public getConfig(): FluidSimulationConfig {
    return { ...this.config };
  }
  
  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<FluidSimulationConfig>): void {
    // 更新配置
    this.config = { ...this.config, ...newConfig };
    
    // 更新流体场参数
    if (newConfig.density !== undefined) this.field.density = newConfig.density;
    if (newConfig.viscosity !== undefined) this.field.viscosity = newConfig.viscosity;
    if (newConfig.timeStep !== undefined) this.field.dt = newConfig.timeStep;
    if (newConfig.dx !== undefined) this.field.dx = newConfig.dx;
    
    // 更新边界条件
    if (newConfig.inflow) this.boundary.inflow = newConfig.inflow;
    if (newConfig.outflow) this.boundary.outflow = newConfig.outflow;
    
    // 重新计算雷诺数
    this.state.reynoldsNumber = this.calculateReynoldsNumber();
  }
  
  /**
   * 获取可视化数据
   */
  public getVisualizationData(): FluidVisualizationData {
    const { width, height, dx } = this.field;
    
    // 计算速度大小
    const velocityMagnitude: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = 0.5 * (this.field.u[y][x] + this.field.u[y][x+1]);
        const v = 0.5 * (this.field.v[y][x] + this.field.v[y+1][x]);
        velocityMagnitude[y][x] = Math.sqrt(u*u + v*v);
      }
    }
    
    // 生成流线种子点
    const streamlineSeeds: Array<{ x: number, y: number }> = [];
    const seedSpacing = Math.max(5, Math.floor(width / 20));
    for (let y = seedSpacing; y < height; y += seedSpacing) {
      for (let x = seedSpacing; x < width; x += seedSpacing) {
        if (this.boundary.type[y][x] !== BoundaryType.SOLID) {
          streamlineSeeds.push({ x: x * dx, y: y * dx });
        }
      }
    }
    
    // 计算统计信息
    let maxVel = 0, minPress = Infinity, maxPress = -Infinity, maxVort = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.boundary.type[y][x] !== BoundaryType.SOLID) {
          maxVel = Math.max(maxVel, velocityMagnitude[y][x]);
          minPress = Math.min(minPress, this.field.pressure[y][x]);
          maxPress = Math.max(maxPress, this.field.pressure[y][x]);
          maxVort = Math.max(maxVort, Math.abs(this.field.vorticity[y][x]));
        }
      }
    }
    
    return {
      gridWidth: width,
      gridHeight: height,
      cellSize: dx,
      velocityField: {
        u: this.field.u,
        v: this.field.v,
        magnitude: velocityMagnitude
      },
      pressureField: this.field.pressure,
      vorticityField: this.field.vorticity,
      temperatureField: this.field.temperature,
      boundaryMask: this.boundary.type.map(row => [...row]),
      streamlineSeeds,
      statistics: {
        maxVelocity: maxVel,
        minPressure: minPress,
        maxPressure: maxPress,
        maxVorticity: maxVort,
        averageDivergence: this.state.averageDivergence
      }
    };
  }
  
  /**
   * 获取探针数据
   */
  public getProbeData(x: number, y: number): {
    position: { x: number, y: number };
    velocity: { u: number, v: number, magnitude: number };
    pressure: number;
    vorticity: number;
    temperature: number;
    isValid: boolean;
  } {
    const { width, height, dx } = this.field;
    
    // 转换物理坐标到网格坐标
    const gridX = Math.floor(x / dx);
    const gridY = Math.floor(y / dx);
    
    // 检查边界
    if (gridX < 0 || gridX >= width || gridY < 0 || gridY >= height) {
      return {
        position: { x, y },
        velocity: { u: 0, v: 0, magnitude: 0 },
        pressure: 0,
        vorticity: 0,
        temperature: 0,
        isValid: false
      };
    }
    
    // 检查是否在固体内
    if (this.boundary.type[gridY][gridX] === BoundaryType.SOLID) {
      return {
        position: { x, y },
        velocity: { u: 0, v: 0, magnitude: 0 },
        pressure: this.field.pressure[gridY][gridX],
        vorticity: 0,
        temperature: this.field.temperature[gridY][gridX],
        isValid: false
      };
    }
    
    // 插值获取数据
    const u = 0.5 * (this.field.u[gridY][gridX] + this.field.u[gridY][gridX+1]);
    const v = 0.5 * (this.field.v[gridY][gridX] + this.field.v[gridY+1][gridX]);
    const magnitude = Math.sqrt(u*u + v*v);
    
    return {
      position: { x, y },
      velocity: { u, v, magnitude },
      pressure: this.field.pressure[gridY][gridX],
      vorticity: this.field.vorticity[gridY][gridX],
      temperature: this.field.temperature[gridY][gridX],
      isValid: true
    };
  }
}

/**
 * 创建默认流体模拟配置
 */
export function createDefaultSimulationConfig(): FluidSimulationConfig {
  return {
    width: 100,
    height: 50,
    dx: 0.02, // 2cm网格间距
    density: 1.0, // 水的密度 kg/m³
    viscosity: 0.001, // 水的动力粘性 Pa·s
    timeStep: 0.001, // 1ms时间步长
    diffusionIterations: 20,
    pressureIterations: 40,
    enableVorticityConfinement: true,
    vorticityStrength: 0.1,
    inflow: {
      velocity: [1.0, 0.0], // 1 m/s水平入流
      temperature: 298 // 室温
    },
    outflow: {
      pressure: 0 // 标准大气压
    },
    maxSimulationTime: 10.0, // 10秒
    outputInterval: 0.1 // 100ms输出间隔
  };
}

/**
 * 创建卡门涡街实验配置
 */
export function createKarmanVortexConfig(): FluidSimulationConfig {
  const config = createDefaultSimulationConfig();
  config.width = 120;
  config.height = 60;
  config.inflow.velocity = [1.2, 0.0];
  config.viscosity = 0.01; // 较高粘性以产生稳定涡街
  config.enableVorticityConfinement = true;
  config.vorticityStrength = 0.2;
  return config;
}

/**
 * 创建管道流实验配置
 */
export function createPipeFlowConfig(): FluidSimulationConfig {
  const config = createDefaultSimulationConfig();
  config.width = 80;
  config.height = 20;
  config.inflow.velocity = [0.8, 0.0];
  config.viscosity = 0.001; // 低粘性
  config.enableVorticityConfinement = false; // 管道流不需要涡量增强
  return config;
}

/**
 * 创建翼型绕流实验配置
 */
export function createAirfoilConfig(): FluidSimulationConfig {
  const config = createDefaultSimulationConfig();
  config.width = 150;
  config.height = 80;
  config.density = 1.225; // 空气密度
  config.viscosity = 0.0000181; // 空气动力粘性
  config.inflow.velocity = [20.0, 0.0]; // 20 m/s
  config.enableVorticityConfinement = true;
  config.vorticityStrength = 0.15;
  return config;
} 