/**
 * FluidSolverPressure.ts
 * 实现流体求解器的压力投影模块
 * 基于Helmholtz-Hodge分解确保速度场无散度
 */

import { FluidField, BoundaryType, BoundaryConditions } from './FluidSolver';

/**
 * 压力投影步骤 - 确保速度场无散度
 * 基于Helmholtz-Hodge分解：v = v_solenoidal + ∇φ
 * 求解泊松方程：∇²p = ρ∇·v/Δt
 * @param field 流体场
 * @param boundary 边界条件
 * @param iterations 压力求解迭代次数
 */
export function project(field: FluidField, boundary: BoundaryConditions, iterations: number = 40): void {
  const { width, height, dx, dt, density } = field;
  
  // 第一步：计算速度场的散度
  computeDivergence(field, boundary);
  
  // 第二步：初始化压力场
  initializePressure(field, boundary);
  
  // 第三步：求解压力泊松方程 ∇²p = ρ∇·v/Δt
  solvePressurePoisson(field, boundary, iterations);
  
  // 第四步：根据压力梯度修正速度场，使其无散度
  correctVelocityField(field, boundary);
}

/**
 * 计算速度场的散度 ∇·v = ∂u/∂x + ∂v/∂y
 * @param field 流体场
 * @param boundary 边界条件
 */
function computeDivergence(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height, dx } = field;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (boundary.type[y][x] === BoundaryType.SOLID) {
        field.divergence[y][x] = 0;
        continue;
      }
      
      // 使用错位网格计算散度
      // ∂u/∂x: 使用u速度在x边界上的值
      const dudx = (field.u[y][x+1] - field.u[y][x]) / dx;
      
      // ∂v/∂y: 使用v速度在y边界上的值
      const dvdy = (field.v[y+1][x] - field.v[y][x]) / dx;
      
      // 散度 = ∂u/∂x + ∂v/∂y
      field.divergence[y][x] = dudx + dvdy;
    }
  }
  
  // 应用散度场的边界条件
  applyDivergenceBoundary(field, boundary);
}

/**
 * 初始化压力场
 * @param field 流体场
 * @param boundary 边界条件
 */
function initializePressure(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height } = field;
  
  // 将压力场初始化为零（或保持前一时刻的值作为初始猜测）
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 对于固体边界内部，压力可以设为周围流体的平均值
      if (boundary.type[y][x] === BoundaryType.SOLID) {
        let sum = 0;
        let count = 0;
        
        // 检查周围的流体单元
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
                boundary.type[ny][nx] !== BoundaryType.SOLID) {
              sum += field.pressure[ny][nx];
              count++;
            }
          }
        }
        
        if (count > 0) {
          field.pressure[y][x] = sum / count;
        }
      }
    }
  }
}

/**
 * 求解压力泊松方程 ∇²p = ρ∇·v/Δt
 * 使用Gauss-Seidel迭代方法求解
 * @param field 流体场
 * @param boundary 边界条件
 * @param iterations 迭代次数
 */
function solvePressurePoisson(field: FluidField, boundary: BoundaryConditions, iterations: number): void {
  const { width, height, dx, dt, density } = field;
  const alpha = dx * dx;
  const beta = density / dt;
  
  // Gauss-Seidel迭代求解泊松方程
  for (let iter = 0; iter < iterations; iter++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (boundary.type[y][x] === BoundaryType.SOLID) continue;
        
        // 标准的五点差分格式求解泊松方程
        // ∇²p = (p[i+1,j] + p[i-1,j] + p[i,j+1] + p[i,j-1] - 4*p[i,j]) / dx²
        // p[i,j] = (p[i+1,j] + p[i-1,j] + p[i,j+1] + p[i,j-1] - α*β*div[i,j]) / 4
        
        const source = alpha * beta * field.divergence[y][x];
        
        field.pressure[y][x] = (
          field.pressure[y][x+1] + field.pressure[y][x-1] +
          field.pressure[y+1][x] + field.pressure[y-1][x] -
          source
        ) * 0.25;
      }
    }
    
    // 应用压力边界条件
    applyPressureBoundary(field, boundary);
  }
}

/**
 * 根据压力梯度修正速度场，使其满足无散度条件
 * v_new = v_old - (Δt/ρ)∇p
 * @param field 流体场
 * @param boundary 边界条件
 */
function correctVelocityField(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height, dx, dt, density } = field;
  const factor = dt / (density * dx);
  
  // 修正u速度分量
  for (let y = 0; y < height; y++) {
    for (let x = 1; x < width; x++) {
      // u速度位于单元格的x边界上
      // 检查左右两个单元格是否都是流体
      const leftCell = (x-1 >= 0) ? boundary.type[y][x-1] : BoundaryType.SOLID;
      const rightCell = (x < width) ? boundary.type[y][x] : BoundaryType.SOLID;
      
      // 如果有一个单元格是固体，则这个u速度分量应该为0（无滑移边界条件）
      if (leftCell === BoundaryType.SOLID || rightCell === BoundaryType.SOLID) {
        field.u[y][x] = 0;
        continue;
      }
      
      // 计算压力梯度 ∂p/∂x
      const dpdx = (field.pressure[y][x] - field.pressure[y][x-1]) / dx;
      
      // 修正u速度：u_new = u_old - (Δt/ρ)(∂p/∂x)
      field.u[y][x] -= factor * dpdx;
    }
  }
  
  // 修正v速度分量
  for (let y = 1; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // v速度位于单元格的y边界上
      // 检查上下两个单元格是否都是流体
      const bottomCell = (y-1 >= 0) ? boundary.type[y-1][x] : BoundaryType.SOLID;
      const topCell = (y < height) ? boundary.type[y][x] : BoundaryType.SOLID;
      
      // 如果有一个单元格是固体，则这个v速度分量应该为0（无滑移边界条件）
      if (bottomCell === BoundaryType.SOLID || topCell === BoundaryType.SOLID) {
        field.v[y][x] = 0;
        continue;
      }
      
      // 计算压力梯度 ∂p/∂y
      const dpdy = (field.pressure[y][x] - field.pressure[y-1][x]) / dx;
      
      // 修正v速度：v_new = v_old - (Δt/ρ)(∂p/∂y)
      field.v[y][x] -= factor * dpdy;
    }
  }
  
  // 应用速度边界条件
  applyVelocityBoundaryConditions(field, boundary);
}

/**
 * 应用散度场边界条件
 * @param field 流体场
 * @param boundary 边界条件
 */
function applyDivergenceBoundary(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height } = field;
  
  // 周边边界使用零梯度条件
  for (let x = 0; x < width; x++) {
    field.divergence[0][x] = field.divergence[1][x]; // 底边界
    field.divergence[height-1][x] = field.divergence[height-2][x]; // 顶边界
  }
  
  for (let y = 0; y < height; y++) {
    field.divergence[y][0] = field.divergence[y][1]; // 左边界
    field.divergence[y][width-1] = field.divergence[y][width-2]; // 右边界
  }
}

/**
 * 应用压力边界条件
 * @param field 流体场
 * @param boundary 边界条件
 */
function applyPressureBoundary(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height } = field;
  
  // 处理外边界的压力边界条件
  for (let x = 0; x < width; x++) {
    // 底边界和顶边界 - 零梯度条件（Neumann边界条件）
    field.pressure[0][x] = field.pressure[1][x];
    field.pressure[height-1][x] = field.pressure[height-2][x];
  }
  
  for (let y = 0; y < height; y++) {
    // 左边界和右边界 - 零梯度条件
    field.pressure[y][0] = field.pressure[y][1];
    field.pressure[y][width-1] = field.pressure[y][width-2];
  }
  
  // 处理入口和出口的压力边界条件
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (boundary.type[y][x] === BoundaryType.INFLOW) {
        // 入口处使用零梯度条件（让压力由内部流场决定）
        // 或者可以设置为特定值
        continue; // 使用默认的零梯度处理
      } else if (boundary.type[y][x] === BoundaryType.OUTFLOW) {
        // 出口处设置为参考压力（通常为0）
        field.pressure[y][x] = boundary.outflow.pressure;
      }
    }
  }
  
  // 处理固体边界内部的压力
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (boundary.type[y][x] === BoundaryType.SOLID) {
        // 固体边界内部的压力设为周围流体压力的平均值
        let sum = 0;
        let count = 0;
        
        // 检查相邻的流体单元格
        if (x > 0 && boundary.type[y][x-1] !== BoundaryType.SOLID) {
          sum += field.pressure[y][x-1];
          count++;
        }
        if (x < width-1 && boundary.type[y][x+1] !== BoundaryType.SOLID) {
          sum += field.pressure[y][x+1];
          count++;
        }
        if (y > 0 && boundary.type[y-1][x] !== BoundaryType.SOLID) {
          sum += field.pressure[y-1][x];
          count++;
        }
        if (y < height-1 && boundary.type[y+1][x] !== BoundaryType.SOLID) {
          sum += field.pressure[y+1][x];
          count++;
        }
        
        if (count > 0) {
          field.pressure[y][x] = sum / count;
        }
      }
    }
  }
}

/**
 * 应用速度边界条件
 * @param field 流体场
 * @param boundary 边界条件
 */
function applyVelocityBoundaryConditions(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height } = field;
  
  // 处理入口边界条件
  const [inflowU, inflowV] = boundary.inflow.velocity;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (boundary.type[y][x] === BoundaryType.INFLOW) {
        // 设置入口速度
        if (x < width) field.u[y][x+1] = inflowU;
        if (x > 0) field.u[y][x] = inflowU;
        if (y < height) field.v[y+1][x] = inflowV;
        if (y > 0) field.v[y][x] = inflowV;
      }
    }
  }
  
  // 处理出口边界条件（零梯度）
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (boundary.type[y][x] === BoundaryType.OUTFLOW) {
        // 出口处使用零梯度条件
        if (x > 0 && boundary.type[y][x-1] !== BoundaryType.OUTFLOW) {
          if (x < width) field.u[y][x+1] = field.u[y][x];
          if (y < height) field.v[y+1][x] = field.v[y+1][x-1];
          if (y > 0) field.v[y][x] = field.v[y][x-1];
        }
      }
    }
  }
  
  // 处理固体边界的无滑移条件
  for (let y = 0; y <= height; y++) {
    for (let x = 0; x <= width; x++) {
      // u速度分量的边界条件
      if (x > 0 && x < width && y < height) {
        const leftCell = boundary.type[y][x-1];
        const rightCell = boundary.type[y][x];
        
        if (leftCell === BoundaryType.SOLID || rightCell === BoundaryType.SOLID) {
          field.u[y][x] = 0; // 无滑移边界条件
        }
      }
      
      // v速度分量的边界条件
      if (y > 0 && y < height && x < width) {
        const bottomCell = boundary.type[y-1][x];
        const topCell = boundary.type[y][x];
        
        if (bottomCell === BoundaryType.SOLID || topCell === BoundaryType.SOLID) {
          field.v[y][x] = 0; // 无滑移边界条件
        }
      }
    }
  }
  
  // 处理域边界的速度条件
  for (let x = 0; x <= width; x++) {
    if (x < width) {
      field.u[0][x] = -field.u[1][x]; // 底边界无滑移
      field.u[height-1][x] = -field.u[height-2][x]; // 顶边界无滑移
    }
  }
  
  for (let y = 0; y <= height; y++) {
    if (y < height) {
      field.v[y][0] = -field.v[y][1]; // 左边界无滑移
      field.v[y][width-1] = -field.v[y][width-2]; // 右边界无滑移
    }
  }
}

/**
 * 检查压力求解的收敛性
 * @param field 流体场
 * @param boundary 边界条件
 * @returns 散度的L2范数
 */
export function checkDivergenceConvergence(field: FluidField, boundary: BoundaryConditions): number {
  const { width, height } = field;
  let divergenceNorm = 0;
  let cellCount = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (boundary.type[y][x] !== BoundaryType.SOLID) {
        divergenceNorm += field.divergence[y][x] * field.divergence[y][x];
        cellCount++;
      }
    }
  }
  
  return cellCount > 0 ? Math.sqrt(divergenceNorm / cellCount) : 0;
}

/**
 * 自适应压力求解 - 根据收敛性动态调整迭代次数
 * @param field 流体场
 * @param boundary 边界条件
 * @param maxIterations 最大迭代次数
 * @param tolerance 收敛容差
 */
export function adaptivePressureSolve(
  field: FluidField, 
  boundary: BoundaryConditions, 
  maxIterations: number = 100,
  tolerance: number = 1e-6
): number {
  // 计算初始散度
  computeDivergence(field, boundary);
  initializePressure(field, boundary);
  
  const { width, height, dx, dt, density } = field;
  const alpha = dx * dx;
  const beta = density / dt;
  
  let iteration = 0;
  let convergence = 1.0;
  
  // 迭代求解直到收敛或达到最大迭代次数
  while (iteration < maxIterations && convergence > tolerance) {
    // 执行一次Gauss-Seidel迭代
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (boundary.type[y][x] === BoundaryType.SOLID) continue;
        
        const source = alpha * beta * field.divergence[y][x];
        
        field.pressure[y][x] = (
          field.pressure[y][x+1] + field.pressure[y][x-1] +
          field.pressure[y+1][x] + field.pressure[y-1][x] -
          source
        ) * 0.25;
      }
    }
    
    applyPressureBoundary(field, boundary);
    
    // 每隔一定迭代次数检查收敛性
    if (iteration % 10 === 0) {
      computeDivergence(field, boundary);
      convergence = checkDivergenceConvergence(field, boundary);
    }
    
    iteration++;
  }
  
  // 最终修正速度场
  correctVelocityField(field, boundary);
  
  return convergence;
} 