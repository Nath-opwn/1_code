/**
 * FluidSolverBoundary.ts
 * 实现流体求解器的边界条件处理和特殊物理效应
 */

import { FluidField, BoundaryType, BoundaryConditions } from './FluidSolver';

/**
 * 应用所有边界条件
 */
export function applyAllBoundaryConditions(field: FluidField, boundary: BoundaryConditions): void {
  // 应用入口边界条件
  applyInflowBoundary(field, boundary);
  
  // 应用出口边界条件
  applyOutflowBoundary(field, boundary);
  
  // 应用固体边界条件
  applySolidBoundary(field, boundary);
  
  // 应用周期性边界条件
  applyPeriodicBoundary(field, boundary);
  
  // 应用温度边界条件
  applyTemperatureBoundary(field, boundary);
}

/**
 * 应用入口边界条件
 */
function applyInflowBoundary(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height } = field;
  const [inflow_u, inflow_v] = boundary.inflow.velocity;
  
  // 遍历所有单元格
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      if (boundary.type[j][i] === BoundaryType.INFLOW) {
        // 设置入口速度
        field.u[j][i] = inflow_u;
        field.u[j][i+1] = inflow_u;
        field.v[j][i] = inflow_v;
        field.v[j+1][i] = inflow_v;
        
        // 设置入口温度
        field.temperature[j][i] = boundary.inflow.temperature;
      }
    }
  }
}

/**
 * 应用出口边界条件
 */
function applyOutflowBoundary(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height } = field;
  
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      if (boundary.type[j][i] === BoundaryType.OUTFLOW) {
        // 零梯度边界条件 - 使用相邻单元格的值
        if (i > 0) {
          field.u[j][i] = field.u[j][i-1];
          field.u[j][i+1] = field.u[j][i];
          field.v[j][i] = field.v[j][i-1];
          field.v[j+1][i] = field.v[j+1][i-1];
          field.temperature[j][i] = field.temperature[j][i-1];
        } else if (i < width - 1) {
          field.u[j][i] = field.u[j][i+1];
          field.u[j][i+1] = field.u[j][i+2];
          field.v[j][i] = field.v[j][i+1];
          field.v[j+1][i] = field.v[j+1][i+1];
          field.temperature[j][i] = field.temperature[j][i+1];
        }
        
        // 设置出口压力
        field.pressure[j][i] = boundary.outflow.pressure;
      }
    }
  }
}

/**
 * 应用固体边界条件
 */
function applySolidBoundary(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height } = field;
  
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      if (boundary.type[j][i] === BoundaryType.SOLID) {
        // 无滑移边界条件 - 固体表面速度为零
        field.u[j][i] = 0;
        field.u[j][i+1] = 0;
        field.v[j][i] = 0;
        field.v[j+1][i] = 0;
        
        // 固体内部压力 - 使用相邻流体单元格的平均值
        let pressureSum = 0;
        let pressureCount = 0;
        
        if (i > 0 && boundary.type[j][i-1] !== BoundaryType.SOLID) {
          pressureSum += field.pressure[j][i-1];
          pressureCount++;
        }
        if (i < width - 1 && boundary.type[j][i+1] !== BoundaryType.SOLID) {
          pressureSum += field.pressure[j][i+1];
          pressureCount++;
        }
        if (j > 0 && boundary.type[j-1][i] !== BoundaryType.SOLID) {
          pressureSum += field.pressure[j-1][i];
          pressureCount++;
        }
        if (j < height - 1 && boundary.type[j+1][i] !== BoundaryType.SOLID) {
          pressureSum += field.pressure[j+1][i];
          pressureCount++;
        }
        
        if (pressureCount > 0) {
          field.pressure[j][i] = pressureSum / pressureCount;
        }
      }
    }
  }
}

/**
 * 应用周期性边界条件
 */
function applyPeriodicBoundary(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height } = field;
  
  // 检查是否有周期性边界
  let hasPeriodicX = false;
  let hasPeriodicY = false;
  
  // 检查x方向
  for (let j = 0; j < height; j++) {
    if (boundary.type[j][0] === BoundaryType.PERIODIC && 
        boundary.type[j][width-1] === BoundaryType.PERIODIC) {
      hasPeriodicX = true;
      break;
    }
  }
  
  // 检查y方向
  for (let i = 0; i < width; i++) {
    if (boundary.type[0][i] === BoundaryType.PERIODIC && 
        boundary.type[height-1][i] === BoundaryType.PERIODIC) {
      hasPeriodicY = true;
      break;
    }
  }
  
  // 应用x方向周期性边界
  if (hasPeriodicX) {
    for (let j = 0; j < height; j++) {
      // 速度u
      field.u[j][0] = field.u[j][width];
      field.u[j][width] = field.u[j][0];
      
      // 速度v
      field.v[j][0] = field.v[j][width-1];
      field.v[j][width-1] = field.v[j][0];
      
      // 压力和温度
      field.pressure[j][0] = field.pressure[j][width-1];
      field.pressure[j][width-1] = field.pressure[j][0];
      field.temperature[j][0] = field.temperature[j][width-1];
      field.temperature[j][width-1] = field.temperature[j][0];
    }
  }
  
  // 应用y方向周期性边界
  if (hasPeriodicY) {
    for (let i = 0; i < width; i++) {
      // 速度u
      field.u[0][i] = field.u[height-1][i];
      field.u[height-1][i] = field.u[0][i];
      
      // 速度v
      field.v[0][i] = field.v[height][i];
      field.v[height][i] = field.v[0][i];
      
      // 压力和温度
      field.pressure[0][i] = field.pressure[height-1][i];
      field.pressure[height-1][i] = field.pressure[0][i];
      field.temperature[0][i] = field.temperature[height-1][i];
      field.temperature[height-1][i] = field.temperature[0][i];
    }
  }
}

/**
 * 应用温度边界条件
 */
function applyTemperatureBoundary(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height } = field;
  
  // 处理固体边界的温度 - 使用绝热边界条件
  for (let j = 1; j < height - 1; j++) {
    for (let i = 1; i < width - 1; i++) {
      if (boundary.type[j][i] === BoundaryType.SOLID) {
        // 检查周围单元格
        if (i > 0 && boundary.type[j][i-1] !== BoundaryType.SOLID) {
          field.temperature[j][i] = field.temperature[j][i-1];
        } else if (i < width - 1 && boundary.type[j][i+1] !== BoundaryType.SOLID) {
          field.temperature[j][i] = field.temperature[j][i+1];
        } else if (j > 0 && boundary.type[j-1][i] !== BoundaryType.SOLID) {
          field.temperature[j][i] = field.temperature[j-1][i];
        } else if (j < height - 1 && boundary.type[j+1][i] !== BoundaryType.SOLID) {
          field.temperature[j][i] = field.temperature[j+1][i];
        }
      }
    }
  }
}

/**
 * 应用外力
 */
export function applyExternalForces(field: FluidField, boundary: BoundaryConditions, dt: number): void {
  // 应用重力
  applyGravity(field, boundary, dt);
  
  // 应用浮力 (基于温度差异)
  applyBuoyancy(field, boundary, dt);
  
  // 应用涡量增强 (可选)
  applyVorticityConfinement(field, boundary, dt);
}

/**
 * 应用重力
 */
function applyGravity(
  field: FluidField, 
  boundary: BoundaryConditions, 
  dt: number, 
  gravity: [number, number] = [0, -9.81]
): void {
  const { width, height } = field;
  const [gx, gy] = gravity;
  
  for (let j = 1; j < height; j++) {
    for (let i = 1; i < width - 1; i++) {
      if (boundary.type[j][i] !== BoundaryType.SOLID) {
        // 应用y方向重力
        field.v[j][i] += gy * dt;
        
        // 应用x方向重力 (如果有)
        if (gx !== 0) {
          field.u[j][i] += gx * dt;
        }
      }
    }
  }
}

/**
 * 应用浮力 (基于温度差异)
 */
function applyBuoyancy(
  field: FluidField, 
  boundary: BoundaryConditions, 
  dt: number,
  buoyancyFactor: number = 0.00001,
  ambientTemperature: number = 298
): void {
  const { width, height } = field;
  
  for (let j = 1; j < height; j++) {
    for (let i = 1; i < width - 1; i++) {
      if (boundary.type[j][i] !== BoundaryType.SOLID) {
        // 计算温度差
        const tempDiff = field.temperature[j][i] - ambientTemperature;
        
        // 应用浮力 (热流体上升)
        field.v[j][i] += buoyancyFactor * tempDiff * dt;
      }
    }
  }
}

/**
 * 应用涡量增强
 * 增强小尺度涡旋，减少数值耗散
 */
function applyVorticityConfinement(
  field: FluidField, 
  boundary: BoundaryConditions, 
  dt: number,
  vorticityScale: number = 0.1
): void {
  const { width, height, dx } = field;
  
  // 首先计算涡量场
  computeVorticity(field, boundary);
  
  // 计算涡量梯度
  for (let j = 1; j < height - 1; j++) {
    for (let i = 1; i < width - 1; i++) {
      if (boundary.type[j][i] === BoundaryType.SOLID) continue;
      
      // 计算涡量梯度
      const vort_left = field.vorticity[j][Math.max(0, i-1)];
      const vort_right = field.vorticity[j][Math.min(width-1, i+1)];
      const vort_bottom = field.vorticity[Math.max(0, j-1)][i];
      const vort_top = field.vorticity[Math.min(height-1, j+1)][i];
      
      // 计算梯度向量
      const grad_x = (vort_right - vort_left) / (2 * dx);
      const grad_y = (vort_top - vort_bottom) / (2 * dx);
      
      // 梯度长度
      const length = Math.sqrt(grad_x * grad_x + grad_y * grad_y);
      
      if (length > 0.0001) {
        // 归一化梯度
        const nx = grad_x / length;
        const ny = grad_y / length;
        
        // 计算涡量增强力
        const vort = field.vorticity[j][i];
        const force_x = vorticityScale * ny * vort * dx;
        const force_y = -vorticityScale * nx * vort * dx;
        
        // 应用力
        field.u[j][i] += force_x * dt;
        field.u[j][i+1] += force_x * dt;
        field.v[j][i] += force_y * dt;
        field.v[j+1][i] += force_y * dt;
      }
    }
  }
}

/**
 * 计算涡量场
 * 涡量 = 旋度 = ∇ × v = dv/dx - du/dy
 */
export function computeVorticity(field: FluidField, boundary: BoundaryConditions): void {
  const { width, height, dx } = field;
  
  for (let j = 1; j < height - 1; j++) {
    for (let i = 1; i < width - 1; i++) {
      // 跳过固体单元格
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