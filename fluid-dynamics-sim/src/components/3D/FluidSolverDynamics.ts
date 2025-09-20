/**
 * FluidSolverDynamics.ts
 * 实现流体求解器的动力学计算模块
 * 包含扩散、平流、涡量增强等核心物理过程
 */

import { FluidField, BoundaryType, BoundaryConditions } from './FluidSolver';

/**
 * 扩散步骤 - 求解扩散方程（处理粘性效应）
 * 使用隐式有限差分方法求解：∂u/∂t = ν∇²u
 * @param field 流体场
 * @param boundary 边界条件
 * @param iterations 迭代次数
 */
export function diffuse(field: FluidField, boundary: BoundaryConditions, iterations: number = 20): void {
  const { width, height, viscosity, dt, dx } = field;
  const alpha = dt * viscosity / (dx * dx);
  
  // 扩散u速度分量
  diffuseVelocityComponent(field.u, field.u_prev, width + 1, height, alpha, iterations, 'u', boundary);
  
  // 扩散v速度分量
  diffuseVelocityComponent(field.v, field.v_prev, width, height + 1, alpha, iterations, 'v', boundary);
  
  // 扩散温度场
  diffuseScalarField(field.temperature, width, height, alpha * 0.1, iterations, boundary);
}

/**
 * 速度分量扩散
 * @param current 当前速度场
 * @param previous 前一时刻速度场
 * @param w 宽度
 * @param h 高度
 * @param alpha 扩散系数
 * @param iterations 迭代次数
 * @param component 速度分量类型
 * @param boundary 边界条件
 */
function diffuseVelocityComponent(
  current: number[][], 
  previous: number[][], 
  w: number, 
  h: number, 
  alpha: number, 
  iterations: number,
  component: 'u' | 'v',
  boundary: BoundaryConditions
): void {
  // 复制当前场到previous
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      previous[y][x] = current[y][x];
    }
  }
  
  // Gauss-Seidel迭代求解
  for (let k = 0; k < iterations; k++) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        // 检查是否在固体边界内
        const cellX = component === 'u' ? Math.floor(x - 0.5) : x;
        const cellY = component === 'v' ? Math.floor(y - 0.5) : y;
        
        if (cellX >= 0 && cellX < boundary.type[0].length && 
            cellY >= 0 && cellY < boundary.type.length &&
            boundary.type[cellY][cellX] === BoundaryType.SOLID) {
          current[y][x] = 0; // 固体内部速度为零
          continue;
        }
        
        // 扩散方程：u = (u_prev + α(u_left + u_right + u_bottom + u_top)) / (1 + 4α)
        current[y][x] = (previous[y][x] + alpha * (
          current[y][x-1] + current[y][x+1] + 
          current[y-1][x] + current[y+1][x]
        )) / (1 + 4 * alpha);
      }
    }
    
    // 应用边界条件
    applyVelocityBoundary(current, w, h, component, boundary);
  }
}

/**
 * 标量场扩散（温度、密度等）
 * @param field 标量场
 * @param width 宽度
 * @param height 高度
 * @param alpha 扩散系数
 * @param iterations 迭代次数
 * @param boundary 边界条件
 */
function diffuseScalarField(
  field: number[][], 
  width: number, 
  height: number, 
  alpha: number, 
  iterations: number,
  boundary: BoundaryConditions
): void {
  const temp: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
  
  // 复制当前场
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      temp[y][x] = field[y][x];
    }
  }
  
  // Gauss-Seidel迭代
  for (let k = 0; k < iterations; k++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (boundary.type[y][x] === BoundaryType.SOLID) continue;
        
        field[y][x] = (temp[y][x] + alpha * (
          field[y][x-1] + field[y][x+1] + 
          field[y-1][x] + field[y+1][x]
        )) / (1 + 4 * alpha);
      }
    }
    
    // 应用边界条件
    applyScalarBoundary(field, width, height, boundary);
  }
}

/**
 * 平流步骤 - 求解平流方程（处理对流传输）
 * 使用半拉格朗日方法求解：∂u/∂t + u·∇u = 0
 * @param field 流体场
 * @param boundary 边界条件
 */
export function advect(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height, dt, dx } = field;
  
  // 平流u速度分量
  advectVelocityComponent(field.u, field.u_prev, field.u, field.v, width + 1, height, dt, dx, 'u', boundary);
  
  // 平流v速度分量
  advectVelocityComponent(field.v, field.v_prev, field.u, field.v, width, height + 1, dt, dx, 'v', boundary);
  
  // 平流温度场
  advectScalarField(field.temperature, field.u, field.v, width, height, dt, dx, boundary);
}

/**
 * 速度分量平流
 * @param current 当前速度场
 * @param previous 前一时刻速度场
 * @param u_field u速度场（用于平流计算）
 * @param v_field v速度场（用于平流计算）
 * @param w 宽度
 * @param h 高度
 * @param dt 时间步长
 * @param dx 网格间距
 * @param component 速度分量类型
 * @param boundary 边界条件
 */
function advectVelocityComponent(
  current: number[][], 
  previous: number[][], 
  u_field: number[][], 
  v_field: number[][],
  w: number, 
  h: number, 
  dt: number, 
  dx: number,
  component: 'u' | 'v',
  boundary: BoundaryConditions
): void {
  // 复制当前场到previous
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      previous[y][x] = current[y][x];
    }
  }
  
  const dtOverDx = dt / dx;
  
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      // 检查是否在固体边界内
      const cellX = component === 'u' ? Math.floor(x - 0.5) : x;
      const cellY = component === 'v' ? Math.floor(y - 0.5) : y;
      
      if (cellX >= 0 && cellX < boundary.type[0].length && 
          cellY >= 0 && cellY < boundary.type.length &&
          boundary.type[cellY][cellX] === BoundaryType.SOLID) {
        current[y][x] = 0;
        continue;
      }
      
      // 获取当前位置的速度（用于回溯）
      let u_vel: number, v_vel: number;
      
      if (component === 'u') {
        // u速度位于x边界，需要插值获取中心速度
        u_vel = current[y][x];
        v_vel = 0.25 * (v_field[y][x-1] + v_field[y][x] + v_field[y+1][x-1] + v_field[y+1][x]);
      } else {
        // v速度位于y边界，需要插值获取中心速度
        u_vel = 0.25 * (u_field[y-1][x] + u_field[y][x] + u_field[y-1][x+1] + u_field[y][x+1]);
        v_vel = current[y][x];
      }
      
      // 回溯粒子路径（半拉格朗日方法）
      const traceX = x - dtOverDx * u_vel;
      const traceY = y - dtOverDx * v_vel;
      
      // 确保回溯点在计算域内
      const clampX = Math.max(0.5, Math.min(w - 1.5, traceX));
      const clampY = Math.max(0.5, Math.min(h - 1.5, traceY));
      
      // 双线性插值获取回溯点的值
      const i0 = Math.floor(clampX);
      const i1 = i0 + 1;
      const j0 = Math.floor(clampY);
      const j1 = j0 + 1;
      
      const s1 = clampX - i0;
      const s0 = 1 - s1;
      const t1 = clampY - j0;
      const t0 = 1 - t1;
      
      current[y][x] = 
        s0 * (t0 * previous[j0][i0] + t1 * previous[j1][i0]) +
        s1 * (t0 * previous[j0][i1] + t1 * previous[j1][i1]);
    }
  }
  
  // 应用边界条件
  applyVelocityBoundary(current, w, h, component, boundary);
}

/**
 * 标量场平流
 * @param field 标量场
 * @param u_field u速度场
 * @param v_field v速度场
 * @param width 宽度
 * @param height 高度
 * @param dt 时间步长
 * @param dx 网格间距
 * @param boundary 边界条件
 */
function advectScalarField(
  field: number[][], 
  u_field: number[][], 
  v_field: number[][],
  width: number, 
  height: number, 
  dt: number, 
  dx: number,
  boundary: BoundaryConditions
): void {
  const temp: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
  
  // 复制当前场
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      temp[y][x] = field[y][x];
    }
  }
  
  const dtOverDx = dt / dx;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (boundary.type[y][x] === BoundaryType.SOLID) continue;
      
      // 插值获得中心位置的速度
      const u_vel = 0.5 * (u_field[y][x] + u_field[y][x+1]);
      const v_vel = 0.5 * (v_field[y][x] + v_field[y+1][x]);
      
      // 回溯粒子路径
      const traceX = x - dtOverDx * u_vel;
      const traceY = y - dtOverDx * v_vel;
      
      // 边界处理
      const clampX = Math.max(0.5, Math.min(width - 1.5, traceX));
      const clampY = Math.max(0.5, Math.min(height - 1.5, traceY));
      
      // 双线性插值
      const i0 = Math.floor(clampX);
      const i1 = i0 + 1;
      const j0 = Math.floor(clampY);
      const j1 = j0 + 1;
      
      const s1 = clampX - i0;
      const s0 = 1 - s1;
      const t1 = clampY - j0;
      const t0 = 1 - t1;
      
      field[y][x] = 
        s0 * (t0 * temp[j0][i0] + t1 * temp[j1][i0]) +
        s1 * (t0 * temp[j0][i1] + t1 * temp[j1][i1]);
    }
  }
  
  // 应用边界条件
  applyScalarBoundary(field, width, height, boundary);
}

/**
 * 涡量增强 - 减少数值耗散，保持涡旋结构
 * @param field 流体场
 * @param boundary 边界条件
 * @param dt 时间步长
 * @param epsilon 涡量增强强度
 */
export function applyVorticityConfinement(
  field: FluidField, 
  boundary: BoundaryConditions, 
  dt: number,
  epsilon: number = 0.1
): void {
  const { width, height, dx } = field;
  
  // 首先计算涡量场
  computeVorticity(field, boundary);
  
  // 计算涡量梯度的模
  const vorticityGradMag: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (boundary.type[y][x] === BoundaryType.SOLID) continue;
      
      const dwdx = (field.vorticity[y][x+1] - field.vorticity[y][x-1]) * 0.5 / dx;
      const dwdy = (field.vorticity[y+1][x] - field.vorticity[y-1][x]) * 0.5 / dx;
      
      vorticityGradMag[y][x] = Math.sqrt(dwdx * dwdx + dwdy * dwdy);
    }
  }
  
  // 应用涡量增强力
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (boundary.type[y][x] === BoundaryType.SOLID) continue;
      
      const gradMag = vorticityGradMag[y][x];
      if (gradMag < 1e-10) continue;
      
      // 归一化梯度方向
      const dwdx = (field.vorticity[y][x+1] - field.vorticity[y][x-1]) * 0.5 / dx;
      const dwdy = (field.vorticity[y+1][x] - field.vorticity[y-1][x]) * 0.5 / dx;
      
      const nx = dwdx / gradMag;
      const ny = dwdy / gradMag;
      
      // 计算涡量增强力
      const vorticity = field.vorticity[y][x];
      const forceX = epsilon * dx * ny * vorticity;
      const forceY = -epsilon * dx * nx * vorticity;
      
      // 应用力到速度场
      field.u[y][x] += forceX * dt;
      field.u[y][x+1] += forceX * dt;
      field.v[y][x] += forceY * dt;
      field.v[y+1][x] += forceY * dt;
    }
  }
}

/**
 * 计算涡量场 ω = ∇ × v = ∂v/∂x - ∂u/∂y
 * @param field 流体场
 * @param boundary 边界条件
 */
export function computeVorticity(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height, dx } = field;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (boundary.type[y][x] === BoundaryType.SOLID) {
        field.vorticity[y][x] = 0;
        continue;
      }
      
      // 中心差分计算偏导数
      // ∂u/∂y: 使用错位网格上的u速度
      const dudy = (field.u[y+1][x] + field.u[y+1][x+1] - field.u[y-1][x] - field.u[y-1][x+1]) * 0.25 / dx;
      
      // ∂v/∂x: 使用错位网格上的v速度  
      const dvdx = (field.v[y][x+1] + field.v[y+1][x+1] - field.v[y][x-1] - field.v[y+1][x-1]) * 0.25 / dx;
      
      // 涡量 = ∂v/∂x - ∂u/∂y
      field.vorticity[y][x] = dvdx - dudy;
    }
  }
  
  // 应用边界条件
  applyScalarBoundary(field.vorticity, width, height, boundary);
}

/**
 * 应用速度边界条件
 * @param velocity 速度场
 * @param width 宽度
 * @param height 高度
 * @param component 速度分量
 * @param boundary 边界条件
 */
function applyVelocityBoundary(
  velocity: number[][], 
  width: number, 
  height: number, 
  component: 'u' | 'v',
  boundary: BoundaryConditions
): void {
  // 周边边界条件（自由滑移或无滑移）
  for (let x = 0; x < width; x++) {
    velocity[0][x] = component === 'v' ? 0 : velocity[1][x]; // 底边界
    velocity[height-1][x] = component === 'v' ? 0 : velocity[height-2][x]; // 顶边界
  }
  
  for (let y = 0; y < height; y++) {
    velocity[y][0] = component === 'u' ? 0 : velocity[y][1]; // 左边界
    velocity[y][width-1] = component === 'u' ? 0 : velocity[y][width-2]; // 右边界
  }
}

/**
 * 应用标量场边界条件
 * @param scalar 标量场
 * @param width 宽度
 * @param height 高度
 * @param boundary 边界条件
 */
function applyScalarBoundary(
  scalar: number[][], 
  width: number, 
  height: number, 
  boundary: BoundaryConditions
): void {
  // 周边边界条件（零梯度）
  for (let x = 0; x < width; x++) {
    scalar[0][x] = scalar[1][x]; // 底边界
    scalar[height-1][x] = scalar[height-2][x]; // 顶边界
  }
  
  for (let y = 0; y < height; y++) {
    scalar[y][0] = scalar[y][1]; // 左边界
    scalar[y][width-1] = scalar[y][width-2]; // 右边界
  }
  
  // 固体边界的标量场处理
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (boundary.type[y][x] === BoundaryType.SOLID) {
        // 对于固体边界，使用周围流体单元的平均值
        let sum = 0;
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
                boundary.type[ny][nx] !== BoundaryType.SOLID) {
              sum += scalar[ny][nx];
              count++;
            }
          }
        }
        
        if (count > 0) {
          scalar[y][x] = sum / count;
        }
      }
    }
  }
} 