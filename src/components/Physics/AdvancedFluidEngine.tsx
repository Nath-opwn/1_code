import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Cpu, 
  Wind,
  Thermometer
} from 'lucide-react';

// 流体单元格接口
interface FluidCell {
  density: number;
  pressure: number;
  velocityX: number;
  velocityY: number;
  temperature: number;
  vorticity: number;
  viscosity: number;
  turbulentKineticEnergy: number;
  turbulentDissipation: number;
  divergence: number;
  residual: number;
  isBoundary: boolean;
  boundaryType: 'wall' | 'inlet' | 'outlet' | 'symmetry' | 'none';
}

// 物理配置接口
interface PhysicsConfig {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  fluidDensity: number;
  dynamicViscosity: number;
  thermalConductivity: number;
  specificHeat: number;
  timeStep: number;
  cflNumber: number;
  maxIterations: number;
  convergenceTolerance: number;
  turbulenceModel: 'laminar' | 'k-epsilon' | 'k-omega' | 'les';
  turbulenceIntensity: number;
  inletVelocity: number;
  inletTemperature: number;
  outletPressure: number;
  wallTemperature: number;
  pressureSolver: 'jacobi' | 'gauss-seidel' | 'sor' | 'multigrid';
  advectionScheme: 'upwind' | 'central' | 'quick' | 'muscl';
  timeIntegration: 'euler' | 'runge-kutta' | 'adams-bashforth';
}

// 高级流体引擎类
export class FluidEngineCore {
  private grid: FluidCell[][] = [];
  private config: PhysicsConfig;
  private time: number = 0;
  private iteration: number = 0;
  
  // 临时数组用于数值计算
  private tempVelocityX: number[][] = [];
  private tempVelocityY: number[][] = [];
  private tempPressure: number[][] = [];
  private tempTemperature: number[][] = [];
  
  // 湍流变量
  private turbulentViscosity: number[][] = [];
  private kineticEnergy: number[][] = [];
  private dissipationRate: number[][] = [];
  
  constructor(config: PhysicsConfig) {
    this.config = config;
    this.initializeGrid();
    this.initializeTempArrays();
  }
  
  private initializeGrid(): void {
    const { gridWidth, gridHeight } = this.config;
    this.grid = Array(gridHeight).fill(null).map(() =>
      Array(gridWidth).fill(null).map(() => ({
        density: this.config.fluidDensity,
        pressure: 101325,
        velocityX: 0,
        velocityY: 0,
        temperature: this.config.inletTemperature,
        vorticity: 0,
        viscosity: this.config.dynamicViscosity,
        turbulentKineticEnergy: 0,
        turbulentDissipation: 0,
        divergence: 0,
        residual: 0,
        isBoundary: false,
        boundaryType: 'none' as const
      }))
    );
    
    this.setupBoundaryConditions();
  }
  
  private initializeTempArrays(): void {
    const { gridWidth, gridHeight } = this.config;
    
    this.tempVelocityX = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));
    this.tempVelocityY = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));
    this.tempPressure = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));
    this.tempTemperature = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));
    
    this.turbulentViscosity = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));
    this.kineticEnergy = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));
    this.dissipationRate = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));
  }
  
  private setupBoundaryConditions(): void {
    const { gridWidth, gridHeight } = this.config;
    
    for (let i = 0; i < gridHeight; i++) {
      for (let j = 0; j < gridWidth; j++) {
        // 上下边界
        if (i === 0 || i === gridHeight - 1) {
          this.grid[i][j].isBoundary = true;
          this.grid[i][j].boundaryType = 'wall';
        }
        // 左边界（入口）
        else if (j === 0) {
          this.grid[i][j].isBoundary = true;
          this.grid[i][j].boundaryType = 'inlet';
          this.grid[i][j].velocityX = this.config.inletVelocity;
          this.grid[i][j].temperature = this.config.inletTemperature;
        }
        // 右边界（出口）
        else if (j === gridWidth - 1) {
          this.grid[i][j].isBoundary = true;
          this.grid[i][j].boundaryType = 'outlet';
          this.grid[i][j].pressure = this.config.outletPressure;
        }
      }
    }
  }
  
  // 主求解步骤
  public solve(): void {
    this.iteration++;
    
    // 1. 更新湍流属性
    if (this.config.turbulenceModel !== 'laminar') {
      this.solveTurbulence();
    }
    
    // 2. 求解动量方程
    this.solveMomentum();
    
    // 3. 求解连续性方程（压力修正）
    this.solvePressureCorrection();
    
    // 4. 求解能量方程
    this.solveEnergy();
    
    // 5. 更新边界条件
    this.updateBoundaryConditions();
    
    // 6. 计算派生量
    this.computeDerivedQuantities();
    
    // 7. 更新时间
    this.time += this.config.timeStep;
  }
  
  private solveTurbulence(): void {
    // 简化的k-ε湍流模型实现
    const { gridWidth, gridHeight, timeStep } = this.config;
    
    if (this.config.turbulenceModel === 'k-epsilon') {
      for (let i = 1; i < gridHeight - 1; i++) {
        for (let j = 1; j < gridWidth - 1; j++) {
          if (this.grid[i][j].isBoundary) continue;
          
          const cell = this.grid[i][j];
          
          // 计算应变率
          const dudx = (this.grid[i][j + 1].velocityX - this.grid[i][j - 1].velocityX) / (2 * this.config.cellSize);
          const dvdy = (this.grid[i + 1][j].velocityY - this.grid[i - 1][j].velocityY) / (2 * this.config.cellSize);
          const dudy = (this.grid[i + 1][j].velocityX - this.grid[i - 1][j].velocityX) / (2 * this.config.cellSize);
          const dvdx = (this.grid[i][j + 1].velocityY - this.grid[i][j - 1].velocityY) / (2 * this.config.cellSize);
          
          const strainRate = Math.sqrt(2 * (dudx * dudx + dvdy * dvdy) + (dudy + dvdx) * (dudy + dvdx));
          
          // 计算湍流生成项
          const turbulentViscosity = this.turbulentViscosity[i][j];
          const production = turbulentViscosity * strainRate * strainRate;
          
          // 求解k方程
          const kOld = cell.turbulentKineticEnergy;
          const kNew = kOld + timeStep * (production - cell.turbulentDissipation);
          cell.turbulentKineticEnergy = Math.max(kNew, 1e-10);
          
          // 求解ε方程
          const epsilonOld = cell.turbulentDissipation;
          const C1 = 1.44, C2 = 1.92;
          const epsilonNew = epsilonOld + timeStep * (
            C1 * production * epsilonOld / Math.max(kOld, 1e-10) - 
            C2 * epsilonOld * epsilonOld / Math.max(kOld, 1e-10)
          );
          cell.turbulentDissipation = Math.max(epsilonNew, 1e-10);
          
          // 更新湍流粘度
          const Cmu = 0.09;
          this.turbulentViscosity[i][j] = Cmu * kNew * kNew / Math.max(epsilonNew, 1e-10);
        }
      }
    }
  }
  
  private solveMomentum(): void {
    const { gridWidth, gridHeight, cellSize, timeStep } = this.config;
    
    // 求解x方向动量方程
    for (let i = 1; i < gridHeight - 1; i++) {
      for (let j = 1; j < gridWidth - 1; j++) {
        if (this.grid[i][j].isBoundary) continue;
        
        const cell = this.grid[i][j];
        const u = cell.velocityX;
        const v = cell.velocityY;
        
        // 对流项（一阶迎风格式）
        let convectionX = 0;
        if (u > 0) {
          convectionX = u * (u - this.grid[i][j - 1].velocityX) / cellSize;
        } else {
          convectionX = u * (this.grid[i][j + 1].velocityX - u) / cellSize;
        }
        
        if (v > 0) {
          convectionX += v * (u - this.grid[i - 1][j].velocityX) / cellSize;
        } else {
          convectionX += v * (this.grid[i + 1][j].velocityX - u) / cellSize;
        }
        
        // 扩散项
        const effectiveViscosity = cell.viscosity + this.turbulentViscosity[i][j];
        const diffusionX = effectiveViscosity * (
          (this.grid[i][j + 1].velocityX - 2 * u + this.grid[i][j - 1].velocityX) / (cellSize * cellSize) +
          (this.grid[i + 1][j].velocityX - 2 * u + this.grid[i - 1][j].velocityX) / (cellSize * cellSize)
        );
        
        // 压力梯度
        const pressureGradientX = -(this.grid[i][j + 1].pressure - this.grid[i][j - 1].pressure) / (2 * cellSize);
        
        // 更新x速度
        this.tempVelocityX[i][j] = u + timeStep * (
          -convectionX + diffusionX / cell.density + pressureGradientX / cell.density
        );
      }
    }
    
    // 求解y方向动量方程
    for (let i = 1; i < gridHeight - 1; i++) {
      for (let j = 1; j < gridWidth - 1; j++) {
        if (this.grid[i][j].isBoundary) continue;
        
        const cell = this.grid[i][j];
        const u = cell.velocityX;
        const v = cell.velocityY;
        
        // 对流项
        let convectionY = 0;
        if (u > 0) {
          convectionY = u * (v - this.grid[i][j - 1].velocityY) / cellSize;
        } else {
          convectionY = u * (this.grid[i][j + 1].velocityY - v) / cellSize;
        }
        
        if (v > 0) {
          convectionY += v * (v - this.grid[i - 1][j].velocityY) / cellSize;
        } else {
          convectionY += v * (this.grid[i + 1][j].velocityY - v) / cellSize;
        }
        
        // 扩散项
        const effectiveViscosity = cell.viscosity + this.turbulentViscosity[i][j];
        const diffusionY = effectiveViscosity * (
          (this.grid[i][j + 1].velocityY - 2 * v + this.grid[i][j - 1].velocityY) / (cellSize * cellSize) +
          (this.grid[i + 1][j].velocityY - 2 * v + this.grid[i - 1][j].velocityY) / (cellSize * cellSize)
        );
        
        // 压力梯度
        const pressureGradientY = -(this.grid[i + 1][j].pressure - this.grid[i - 1][j].pressure) / (2 * cellSize);
        
        // 更新y速度
        this.tempVelocityY[i][j] = v + timeStep * (
          -convectionY + diffusionY / cell.density + pressureGradientY / cell.density
        );
      }
    }
    
    // 复制临时速度到主数组
    for (let i = 0; i < gridHeight; i++) {
      for (let j = 0; j < gridWidth; j++) {
        if (!this.grid[i][j].isBoundary) {
          this.grid[i][j].velocityX = this.tempVelocityX[i][j];
          this.grid[i][j].velocityY = this.tempVelocityY[i][j];
        }
      }
    }
  }
  
  private solvePressureCorrection(): void {
    const { gridWidth, gridHeight, cellSize, maxIterations, convergenceTolerance } = this.config;
    
    // 计算速度散度
    for (let i = 1; i < gridHeight - 1; i++) {
      for (let j = 1; j < gridWidth - 1; j++) {
        const dudx = (this.grid[i][j + 1].velocityX - this.grid[i][j - 1].velocityX) / (2 * cellSize);
        const dvdy = (this.grid[i + 1][j].velocityY - this.grid[i - 1][j].velocityY) / (2 * cellSize);
        this.grid[i][j].divergence = dudx + dvdy;
      }
    }
    
    // 迭代求解压力修正方程
    for (let iter = 0; iter < maxIterations; iter++) {
      let maxResidual = 0;
      
      for (let i = 1; i < gridHeight - 1; i++) {
        for (let j = 1; j < gridWidth - 1; j++) {
          if (this.grid[i][j].isBoundary) continue;
          
          const pE = this.tempPressure[i][j + 1];
          const pW = this.tempPressure[i][j - 1];
          const pN = this.tempPressure[i + 1][j];
          const pS = this.tempPressure[i - 1][j];
          
          const source = -this.grid[i][j].density * this.grid[i][j].divergence / this.config.timeStep;
          
          const newPressure = (pE + pW + pN + pS + cellSize * cellSize * source) / 4;
          
          const residual = Math.abs(newPressure - this.tempPressure[i][j]);
          maxResidual = Math.max(maxResidual, residual);
          
          this.tempPressure[i][j] = newPressure;
          this.grid[i][j].residual = residual;
        }
      }
      
      if (maxResidual < convergenceTolerance) break;
    }
    
    // 更新压力
    for (let i = 0; i < gridHeight; i++) {
      for (let j = 0; j < gridWidth; j++) {
        this.grid[i][j].pressure = this.tempPressure[i][j];
      }
    }
  }
  
  private solveEnergy(): void {
    const { gridWidth, gridHeight, cellSize, timeStep, thermalConductivity, specificHeat } = this.config;
    
    for (let i = 1; i < gridHeight - 1; i++) {
      for (let j = 1; j < gridWidth - 1; j++) {
        if (this.grid[i][j].isBoundary) continue;
        
        const cell = this.grid[i][j];
        const T = cell.temperature;
        const u = cell.velocityX;
        const v = cell.velocityY;
        
        // 对流项
        const dTdx = (this.grid[i][j + 1].temperature - this.grid[i][j - 1].temperature) / (2 * cellSize);
        const dTdy = (this.grid[i + 1][j].temperature - this.grid[i - 1][j].temperature) / (2 * cellSize);
        const convection = u * dTdx + v * dTdy;
        
        // 扩散项
        const d2Tdx2 = (this.grid[i][j + 1].temperature - 2 * T + this.grid[i][j - 1].temperature) / (cellSize * cellSize);
        const d2Tdy2 = (this.grid[i + 1][j].temperature - 2 * T + this.grid[i - 1][j].temperature) / (cellSize * cellSize);
        const diffusion = thermalConductivity / (cell.density * specificHeat) * (d2Tdx2 + d2Tdy2);
        
        // 更新温度
        this.tempTemperature[i][j] = T + timeStep * (-convection + diffusion);
      }
    }
    
    // 复制临时温度到主数组
    for (let i = 0; i < gridHeight; i++) {
      for (let j = 0; j < gridWidth; j++) {
        if (!this.grid[i][j].isBoundary) {
          this.grid[i][j].temperature = this.tempTemperature[i][j];
        }
      }
    }
  }
  
  private updateBoundaryConditions(): void {
    const { gridWidth, gridHeight } = this.config;
    
    for (let i = 0; i < gridHeight; i++) {
      for (let j = 0; j < gridWidth; j++) {
        const cell = this.grid[i][j];
        
        if (cell.isBoundary) {
          switch (cell.boundaryType) {
            case 'wall':
              cell.velocityX = 0;
              cell.velocityY = 0;
              cell.temperature = this.config.wallTemperature;
              break;
              
            case 'inlet':
              cell.velocityX = this.config.inletVelocity;
              cell.velocityY = 0;
              cell.temperature = this.config.inletTemperature;
              cell.turbulentKineticEnergy = 1.5 * Math.pow(this.config.inletVelocity * this.config.turbulenceIntensity, 2);
              break;
              
            case 'outlet':
              if (j > 0) {
                cell.velocityX = this.grid[i][j - 1].velocityX;
                cell.velocityY = this.grid[i][j - 1].velocityY;
                cell.temperature = this.grid[i][j - 1].temperature;
              }
              cell.pressure = this.config.outletPressure;
              break;
          }
        }
      }
    }
  }
  
  private computeDerivedQuantities(): void {
    const { gridWidth, gridHeight, cellSize } = this.config;
    
    // 计算涡量
    for (let i = 1; i < gridHeight - 1; i++) {
      for (let j = 1; j < gridWidth - 1; j++) {
        const dudy = (this.grid[i + 1][j].velocityX - this.grid[i - 1][j].velocityX) / (2 * cellSize);
        const dvdx = (this.grid[i][j + 1].velocityY - this.grid[i][j - 1].velocityY) / (2 * cellSize);
        this.grid[i][j].vorticity = dvdx - dudy;
      }
    }
  }
  
  // 公共接口方法
  public getGrid(): FluidCell[][] {
    return this.grid;
  }
  
  public getCurrentTime(): number {
    return this.time;
  }
  
  public getIteration(): number {
    return this.iteration;
  }
  
  public reset(): void {
    this.time = 0;
    this.iteration = 0;
    this.initializeGrid();
  }
  
  public updateConfig(newConfig: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.setupBoundaryConditions();
  }
  
  public addObstacle(centerX: number, centerY: number, radius: number): void {
    const { cellSize } = this.config;
    
    for (let i = 0; i < this.config.gridHeight; i++) {
      for (let j = 0; j < this.config.gridWidth; j++) {
        const x = j * cellSize;
        const y = i * cellSize;
        const distance = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
        
        if (distance <= radius) {
          this.grid[i][j].isBoundary = true;
          this.grid[i][j].boundaryType = 'wall';
          this.grid[i][j].velocityX = 0;
          this.grid[i][j].velocityY = 0;
        }
      }
    }
  }
}

// React组件接口
interface AdvancedFluidEngineProps {
  width?: number;
  height?: number;
  onDataUpdate?: (data: FluidCell[][]) => void;
}

// 主要的React组件
export const AdvancedFluidEngine: React.FC<AdvancedFluidEngineProps> = ({
  width = 800,
  height = 400,
  onDataUpdate
}) => {
  const [engine, setEngine] = useState<FluidEngineCore | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState<PhysicsConfig>({
    gridWidth: 100,
    gridHeight: 50,
    cellSize: 0.01,
    fluidDensity: 1000,
    dynamicViscosity: 0.001,
    thermalConductivity: 0.6,
    specificHeat: 4180,
    timeStep: 0.001,
    cflNumber: 0.5,
    maxIterations: 100,
    convergenceTolerance: 1e-6,
    turbulenceModel: 'laminar',
    turbulenceIntensity: 0.05,
    inletVelocity: 1.0,
    inletTemperature: 293,
    outletPressure: 101325,
    wallTemperature: 293,
    pressureSolver: 'gauss-seidel',
    advectionScheme: 'upwind',
    timeIntegration: 'euler'
  });
  
  const animationRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 初始化引擎
  useEffect(() => {
    const newEngine = new FluidEngineCore(config);
    setEngine(newEngine);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // 动画循环
  const animate = useCallback(() => {
    if (engine && isRunning) {
      engine.solve();
      
      if (onDataUpdate) {
        onDataUpdate(engine.getGrid());
      }
      
      drawVisualization();
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [engine, isRunning, onDataUpdate]);
  
  useEffect(() => {
    if (isRunning) {
      animate();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [isRunning, animate]);
  
  // 可视化绘制
  const drawVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas || !engine) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const grid = engine.getGrid();
    const cellWidth = width / config.gridWidth;
    const cellHeight = height / config.gridHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    // 绘制速度场
    for (let i = 0; i < config.gridHeight; i++) {
      for (let j = 0; j < config.gridWidth; j++) {
        const cell = grid[i][j];
        const velocity = Math.sqrt(cell.velocityX * cell.velocityX + cell.velocityY * cell.velocityY);
        
        // 颜色映射
        const normalizedVel = Math.min(velocity / 2.0, 1.0);
        const r = Math.floor(normalizedVel * 255);
        const g = Math.floor((1 - normalizedVel) * 255);
        const b = 100;
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        
        if (cell.isBoundary) {
          ctx.fillStyle = 'rgb(50, 50, 50)';
        }
        
        ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
      }
    }
    
    // 绘制速度矢量
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < config.gridHeight; i += 3) {
      for (let j = 0; j < config.gridWidth; j += 3) {
        const cell = grid[i][j];
        if (cell.isBoundary) continue;
        
        const centerX = (j + 0.5) * cellWidth;
        const centerY = (i + 0.5) * cellHeight;
        const scale = 20;
        const endX = centerX + cell.velocityX * scale;
        const endY = centerY + cell.velocityY * scale;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // 箭头
        const angle = Math.atan2(cell.velocityY, cell.velocityX);
        const arrowLength = 3;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowLength * Math.cos(angle - Math.PI / 6),
          endY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowLength * Math.cos(angle + Math.PI / 6),
          endY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    }
  };
  
  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    if (engine) {
      engine.reset();
      drawVisualization();
    }
  };
  
  const updateParameter = (key: keyof PhysicsConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    if (engine) {
      engine.updateConfig({ [key]: value });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            高级流体物理引擎
          </CardTitle>
          <CardDescription>
            基于Navier-Stokes方程的高精度流体力学仿真
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 基本控制 */}
          <div className="flex gap-4">
            <Button onClick={handleStart} disabled={isRunning}>
              <Play className="h-4 w-4 mr-2" />
              开始
            </Button>
            <Button onClick={handlePause} disabled={!isRunning}>
              <Pause className="h-4 w-4 mr-2" />
              暂停
            </Button>
            <Button onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </Button>
          </div>
          
          {/* 物理参数 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Wind className="h-4 w-4" />
                流动参数
              </h4>
              
              <div>
                <label className="text-sm font-medium">入口速度 (m/s)</label>
                <Slider
                  value={[config.inletVelocity]}
                  onValueChange={([value]) => updateParameter('inletVelocity', value)}
                  min={0.1}
                  max={5.0}
                  step={0.1}
                  className="mt-2"
                />
                <span className="text-xs text-gray-500">{config.inletVelocity.toFixed(1)}</span>
              </div>
              
              <div>
                <label className="text-sm font-medium">动力粘度 (Pa·s)</label>
                <Slider
                  value={[config.dynamicViscosity * 1000]}
                  onValueChange={([value]) => updateParameter('dynamicViscosity', value / 1000)}
                  min={0.1}
                  max={10}
                  step={0.1}
                  className="mt-2"
                />
                <span className="text-xs text-gray-500">{(config.dynamicViscosity * 1000).toFixed(1)} × 10⁻³</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                热力学参数
              </h4>
              
              <div>
                <label className="text-sm font-medium">入口温度 (K)</label>
                <Slider
                  value={[config.inletTemperature]}
                  onValueChange={([value]) => updateParameter('inletTemperature', value)}
                  min={273}
                  max={373}
                  step={1}
                  className="mt-2"
                />
                <span className="text-xs text-gray-500">{config.inletTemperature.toFixed(0)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                数值求解
              </h4>
              
              <div>
                <label className="text-sm font-medium">湍流模型</label>
                <Select 
                  value={config.turbulenceModel} 
                  onValueChange={(value: any) => updateParameter('turbulenceModel', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laminar">层流</SelectItem>
                    <SelectItem value="k-epsilon">k-ε模型</SelectItem>
                    <SelectItem value="k-omega">k-ω模型</SelectItem>
                    <SelectItem value="les">大涡模拟</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* 实时信息 */}
          {engine && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">模拟时间</div>
                <div className="text-lg font-bold text-blue-900">
                  {engine.getCurrentTime().toFixed(3)}s
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600 font-medium">迭代次数</div>
                <div className="text-lg font-bold text-green-900">
                  {engine.getIteration()}
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">雷诺数</div>
                <div className="text-lg font-bold text-purple-900">
                  {((config.fluidDensity * config.inletVelocity * 0.1) / config.dynamicViscosity).toFixed(0)}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">时间步长</div>
                <div className="text-lg font-bold text-orange-900">
                  {(config.timeStep * 1000).toFixed(1)}ms
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 可视化区域 */}
      <Card>
        <CardContent className="p-6">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-96 border rounded-lg"
            style={{ imageRendering: 'pixelated' }}
          />
        </CardContent>
      </Card>
    </div>
  );
}; 