/**
 * FluidSolverVisual.ts
 * 实现流体求解器的可视化和数据导出功能
 */

import { FluidField, BoundaryType, BoundaryConditions } from './FluidSolver';

/**
 * 流体场可视化数据
 */
export interface FluidVisualizationData {
  // 网格尺寸
  width: number;
  height: number;
  dx: number;
  
  // 速度场 - 用于绘制矢量场
  velocityField: Array<{
    x: number;
    y: number;
    u: number;
    v: number;
    magnitude: number;
  }>;
  
  // 压力场 - 用于绘制标量场
  pressureField: Array<{
    x: number;
    y: number;
    value: number;
  }>;
  
  // 涡量场 - 用于绘制标量场
  vorticityField: Array<{
    x: number;
    y: number;
    value: number;
  }>;
  
  // 温度场 - 用于绘制标量场
  temperatureField: Array<{
    x: number;
    y: number;
    value: number;
  }>;
  
  // 边界数据 - 用于绘制障碍物
  boundaries: Array<{
    x: number;
    y: number;
    type: BoundaryType;
  }>;
  
  // 流线起点 - 用于绘制流线
  streamlineSeeds: Array<{
    x: number;
    y: number;
  }>;
}

/**
 * 计算涡量场 (内部使用)
 */
function calculateVorticity(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height, dx } = field;
  
  for (let j = 1; j < height - 1; j++) {
    for (let i = 1; i < width - 1; i++) {
      if (boundary.type[j][i] === BoundaryType.SOLID) {
        field.vorticity[j][i] = 0;
        continue;
      }
      
      // 计算du/dy (中心差分)
      const du_dy = (field.u[j+1][i] - field.u[j-1][i]) / (2 * dx);
      
      // 计算dv/dx (中心差分)
      const dv_dx = (field.v[j][i+1] - field.v[j][i-1]) / (2 * dx);
      
      // 涡量 = dv/dx - du/dy
      field.vorticity[j][i] = dv_dx - du_dy;
    }
  }
  
  // 应用边界条件
  for (let i = 0; i < width; i++) {
    field.vorticity[0][i] = field.vorticity[1][i];
    field.vorticity[height-1][i] = field.vorticity[height-2][i];
  }
  
  for (let j = 0; j < height; j++) {
    field.vorticity[j][0] = field.vorticity[j][1];
    field.vorticity[j][width-1] = field.vorticity[j][width-2];
  }
}

/**
 * 生成流体场可视化数据
 */
export function generateVisualizationData(
  field: FluidField,
  boundary: BoundaryConditions,
  streamlineDensity: number = 0.05
): FluidVisualizationData {
  const { width, height, dx } = field;
  
  // 确保涡量场是最新的
  calculateVorticity(field, boundary);
  
  // 生成场数据
  const velocityField: FluidVisualizationData['velocityField'] = [];
  const pressureField: FluidVisualizationData['pressureField'] = [];
  const vorticityField: FluidVisualizationData['vorticityField'] = [];
  const temperatureField: FluidVisualizationData['temperatureField'] = [];
  const boundaries: FluidVisualizationData['boundaries'] = [];
  
  // 遍历所有单元格
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x = i * dx;
      const y = j * dx;
      
      // 添加边界数据
      boundaries.push({
        x,
        y,
        type: boundary.type[j][i]
      });
      
      // 对于流体单元格，添加场数据
      if (boundary.type[j][i] !== BoundaryType.SOLID) {
        // 插值速度 (从错位网格)
        const u = (field.u[j][i] + field.u[j][i+1]) * 0.5;
        const v = (field.v[j][i] + field.v[j+1][i]) * 0.5;
        const magnitude = Math.sqrt(u*u + v*v);
        
        velocityField.push({ x, y, u, v, magnitude });
        pressureField.push({ x, y, value: field.pressure[j][i] });
        vorticityField.push({ x, y, value: field.vorticity[j][i] });
        temperatureField.push({ x, y, value: field.temperature[j][i] });
      }
    }
  }
  
  // 生成流线种子点
  const streamlineSeeds = generateStreamlineSeeds(field, boundary, streamlineDensity);
  
  return {
    width,
    height,
    dx,
    velocityField,
    pressureField,
    vorticityField,
    temperatureField,
    boundaries,
    streamlineSeeds
  };
}

/**
 * 生成流线种子点
 */
function generateStreamlineSeeds(
  field: FluidField,
  boundary: BoundaryConditions,
  density: number
): Array<{ x: number, y: number }> {
  const { width, height, dx } = field;
  const seeds: Array<{ x: number, y: number }> = [];
  
  // 计算种子点间距
  const spacing = Math.max(1, Math.floor(1 / density));
  
  // 在流体区域均匀分布种子点
  for (let j = 0; j < height; j += spacing) {
    for (let i = 0; i < width; i += spacing) {
      if (boundary.type[j][i] !== BoundaryType.SOLID) {
        seeds.push({
          x: i * dx,
          y: j * dx
        });
      }
    }
  }
  
  // 在入口处添加额外种子点
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      if (boundary.type[j][i] === BoundaryType.INFLOW) {
        seeds.push({
          x: i * dx,
          y: j * dx
        });
      }
    }
  }
  
  return seeds;
}

/**
 * 生成流线数据
 */
export function generateStreamline(
  field: FluidField,
  boundary: BoundaryConditions,
  seedPoint: { x: number, y: number },
  steps: number = 100,
  stepSize: number = 0.5
): Array<{ x: number, y: number }> {
  const { width, height, dx } = field;
  const streamline: Array<{ x: number, y: number }> = [{ ...seedPoint }];
  
  let currentPoint = { ...seedPoint };
  
  // 积分路径
  for (let step = 0; step < steps; step++) {
    // 转换到网格坐标
    const i = Math.floor(currentPoint.x / dx);
    const j = Math.floor(currentPoint.y / dx);
    
    // 检查是否在边界内
    if (i < 0 || i >= width - 1 || j < 0 || j >= height - 1) {
      break;
    }
    
    // 检查是否碰到固体边界
    if (boundary.type[j][i] === BoundaryType.SOLID) {
      break;
    }
    
    // 双线性插值获取速度
    const i_frac = (currentPoint.x / dx) - i;
    const j_frac = (currentPoint.y / dx) - j;
    
    // 插值u速度
    const u00 = field.u[j][i];
    const u10 = field.u[j][i+1];
    const u01 = field.u[j+1][i];
    const u11 = field.u[j+1][i+1];
    
    const u0 = u00 * (1 - i_frac) + u10 * i_frac;
    const u1 = u01 * (1 - i_frac) + u11 * i_frac;
    const u = u0 * (1 - j_frac) + u1 * j_frac;
    
    // 插值v速度
    const v00 = field.v[j][i];
    const v10 = field.v[j][i+1];
    const v01 = field.v[j+1][i];
    const v11 = field.v[j+1][i+1];
    
    const v0 = v00 * (1 - i_frac) + v10 * i_frac;
    const v1 = v01 * (1 - i_frac) + v11 * i_frac;
    const v = v0 * (1 - j_frac) + v1 * j_frac;
    
    // 更新位置 (欧拉积分)
    currentPoint.x += u * stepSize;
    currentPoint.y += v * stepSize;
    
    // 添加到流线
    streamline.push({ ...currentPoint });
  }
  
  return streamline;
}

/**
 * 生成探针数据
 */
export function getProbeData(
  field: FluidField,
  boundary: BoundaryConditions,
  position: { x: number, y: number }
): {
  position: { x: number, y: number },
  velocity: { u: number, v: number, magnitude: number },
  pressure: number,
  vorticity: number,
  temperature: number,
  isValid: boolean
} {
  const { width, height, dx } = field;
  
  // 转换到网格坐标
  const i = Math.floor(position.x / dx);
  const j = Math.floor(position.y / dx);
  
  // 检查是否在边界内
  if (i < 0 || i >= width - 1 || j < 0 || j >= height - 1) {
    return {
      position,
      velocity: { u: 0, v: 0, magnitude: 0 },
      pressure: 0,
      vorticity: 0,
      temperature: 0,
      isValid: false
    };
  }
  
  // 检查是否在固体内
  if (boundary.type[j][i] === BoundaryType.SOLID) {
    return {
      position,
      velocity: { u: 0, v: 0, magnitude: 0 },
      pressure: field.pressure[j][i],
      vorticity: 0,
      temperature: field.temperature[j][i],
      isValid: false
    };
  }
  
  // 双线性插值获取数据
  const i_frac = (position.x / dx) - i;
  const j_frac = (position.y / dx) - j;
  
  // 插值所有场变量
  const u = interpolateField(field.u, i, j, i_frac, j_frac);
  const v = interpolateField(field.v, i, j, i_frac, j_frac);
  const pressure = interpolateField(field.pressure, i, j, i_frac, j_frac);
  const vorticity = interpolateField(field.vorticity, i, j, i_frac, j_frac);
  const temperature = interpolateField(field.temperature, i, j, i_frac, j_frac);
  
  return {
    position,
    velocity: { 
      u, 
      v, 
      magnitude: Math.sqrt(u*u + v*v) 
    },
    pressure,
    vorticity,
    temperature,
    isValid: true
  };
}

/**
 * 双线性插值辅助函数
 */
function interpolateField(
  field: number[][], 
  i: number, 
  j: number, 
  i_frac: number, 
  j_frac: number
): number {
  const f00 = field[j][i];
  const f10 = field[j][i+1];
  const f01 = field[j+1][i];
  const f11 = field[j+1][i+1];
  
  const f0 = f00 * (1 - i_frac) + f10 * i_frac;
  const f1 = f01 * (1 - i_frac) + f11 * i_frac;
  
  return f0 * (1 - j_frac) + f1 * j_frac;
} 