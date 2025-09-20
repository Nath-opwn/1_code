/**
 * FluidSolver.ts
 * 基于Navier-Stokes方程的二维流体求解器
 * 实现了真实物理模拟的流体动力学
 */

// 流体场类型定义
export interface FluidField {
  // 网格尺寸
  width: number;
  height: number;
  
  // 流体属性
  density: number;     // 流体密度 (kg/m³)
  viscosity: number;   // 运动粘性系数 (m²/s)
  
  // 场数据
  u: number[][];       // x方向速度分量
  v: number[][];       // y方向速度分量
  u_prev: number[][];  // 上一步x方向速度
  v_prev: number[][];  // 上一步y方向速度
  pressure: number[][]; // 压力场
  divergence: number[][]; // 散度场
  vorticity: number[][]; // 涡量场
  temperature: number[][]; // 温度场
  
  // 网格参数
  dx: number;          // 网格间距
  dt: number;          // 时间步长
}

// 边界条件类型
export enum BoundaryType {
  SOLID = 0,           // 固体边界
  FLUID = 1,           // 流体
  INFLOW = 2,          // 入口
  OUTFLOW = 3,         // 出口
  PERIODIC = 4,        // 周期性边界
}

// 边界条件数据
export interface BoundaryConditions {
  type: BoundaryType[][]; // 每个单元格的边界类型
  inflow: {
    velocity: [number, number]; // 入口速度 [u, v]
    temperature: number;        // 入口温度
  };
  outflow: {
    pressure: number;           // 出口压力
  };
}

/**
 * 创建流体场
 * @param width 网格宽度
 * @param height 网格高度
 * @param density 流体密度
 * @param viscosity 流体粘性
 * @param dx 网格间距
 * @param dt 时间步长
 * @returns 初始化的流体场
 */
export function createFluidField(
  width: number,
  height: number,
  density: number = 1.0,
  viscosity: number = 0.01,
  dx: number = 0.1,
  dt: number = 0.01
): FluidField {
  // 创建二维数组辅助函数
  const create2DArray = (w: number, h: number, initialValue: number = 0): number[][] => {
    return Array(h).fill(0).map(() => Array(w).fill(initialValue));
  };
  
  return {
    width,
    height,
    density,
    viscosity,
    u: create2DArray(width + 1, height),     // 错位网格: u在单元格x边界上
    v: create2DArray(width, height + 1),     // 错位网格: v在单元格y边界上
    u_prev: create2DArray(width + 1, height),
    v_prev: create2DArray(width, height + 1),
    pressure: create2DArray(width, height),
    divergence: create2DArray(width, height),
    vorticity: create2DArray(width, height),
    temperature: create2DArray(width, height, 298), // 默认温度298K
    dx,
    dt
  };
}

/**
 * 创建边界条件
 * @param width 网格宽度
 * @param height 网格高度
 * @returns 默认边界条件
 */
export function createDefaultBoundaryConditions(width: number, height: number): BoundaryConditions {
  // 初始化所有单元格为流体
  const type = Array(height).fill(0).map(() => Array(width).fill(BoundaryType.FLUID));
  
  // 设置默认边界 - 上下为固体墙，左侧为入口，右侧为出口
  for (let x = 0; x < width; x++) {
    type[0][x] = BoundaryType.SOLID;         // 底部边界
    type[height - 1][x] = BoundaryType.SOLID; // 顶部边界
  }
  
  for (let y = 0; y < height; y++) {
    type[y][0] = BoundaryType.INFLOW;        // 左侧入口
    type[y][width - 1] = BoundaryType.OUTFLOW; // 右侧出口
  }
  
  return {
    type,
    inflow: {
      velocity: [1.0, 0.0],  // 默认水平入口流速
      temperature: 298       // 默认入口温度
    },
    outflow: {
      pressure: 0            // 默认出口压力
    }
  };
}

/**
 * 添加圆形障碍物
 * @param boundary 边界条件
 * @param centerX 障碍物中心x坐标
 * @param centerY 障碍物中心y坐标
 * @param radius 障碍物半径
 */
export function addCircularObstacle(
  boundary: BoundaryConditions,
  centerX: number,
  centerY: number,
  radius: number
): void {
  const width = boundary.type[0].length;
  const height = boundary.type.length;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distSq = dx * dx + dy * dy;
      
      if (distSq <= radius * radius) {
        boundary.type[y][x] = BoundaryType.SOLID;
      }
    }
  }
}

/**
 * 添加矩形障碍物
 * @param boundary 边界条件
 * @param x1 左上角x坐标
 * @param y1 左上角y坐标
 * @param x2 右下角x坐标
 * @param y2 右下角y坐标
 */
export function addRectangularObstacle(
  boundary: BoundaryConditions,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  const width = boundary.type[0].length;
  const height = boundary.type.length;
  
  for (let y = Math.max(0, y1); y <= Math.min(height - 1, y2); y++) {
    for (let x = Math.max(0, x1); x <= Math.min(width - 1, x2); x++) {
      boundary.type[y][x] = BoundaryType.SOLID;
    }
  }
}

/**
 * 初始化流体场
 * @param field 流体场
 * @param initialVelocity 初始速度 [u, v]
 * @param initialTemperature 初始温度
 */
export function initializeFluidField(
  field: FluidField,
  initialVelocity: [number, number] = [0, 0],
  initialTemperature: number = 298
): void {
  const { width, height } = field;
  
  // 初始化速度场
  for (let y = 0; y < height; y++) {
    for (let x = 0; x <= width; x++) {
      field.u[y][x] = initialVelocity[0];
      field.u_prev[y][x] = initialVelocity[0];
    }
  }
  
  for (let y = 0; y <= height; y++) {
    for (let x = 0; x < width; x++) {
      field.v[y][x] = initialVelocity[1];
      field.v_prev[y][x] = initialVelocity[1];
    }
  }
  
  // 初始化温度场
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      field.temperature[y][x] = initialTemperature;
    }
  }
  
  // 初始化压力场为零
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      field.pressure[y][x] = 0;
    }
  }
} 