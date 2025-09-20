/**
 * SPHFluidSolver.ts
 * 高性能光滑粒子流体动力学(SPH)求解器
 * 实现完整的Navier-Stokes方程数值求解
 */

import * as THREE from 'three';

// 粒子接口定义
export interface SPHParticle {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  density: number;
  pressure: number;
  force: THREE.Vector3;
  mass: number;
  color: THREE.Color;
  temperature: number;
  age: number;
  life: number;
}

// 仿真参数接口
export interface SPHSimulationParams {
  particleCount: number;
  smoothingRadius: number;        // 光滑半径 h
  restDensity: number;           // 静态密度 ρ₀
  stiffness: number;             // 压力刚度 k
  viscosity: number;             // 粘性系数 μ
  gravity: THREE.Vector3;        // 重力向量
  damping: number;               // 速度阻尼
  boundaryStiffness: number;     // 边界刚度
  timeStep: number;              // 时间步长 Δt
  surfaceTension: number;        // 表面张力系数
  thermalDiffusivity: number;    // 热扩散系数
  enableTemperature: boolean;    // 是否启用温度计算
  maxVelocity: number;          // 最大速度限制
}

// 空间哈希网格
class SpatialHashGrid {
  private cellSize: number;
  private grid: Map<string, SPHParticle[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear(): void {
    this.grid.clear();
  }

  insert(particle: SPHParticle): void {
    const key = this.getKey(particle.position);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(particle);
  }

  getNeighbors(position: THREE.Vector3, radius: number): SPHParticle[] {
    const neighbors: SPHParticle[] = [];
    const cellsToCheck = Math.ceil(radius / this.cellSize);

    const centerCell = this.positionToCell(position);

    for (let dx = -cellsToCheck; dx <= cellsToCheck; dx++) {
      for (let dy = -cellsToCheck; dy <= cellsToCheck; dy++) {
        for (let dz = -cellsToCheck; dz <= cellsToCheck; dz++) {
          const key = `${centerCell.x + dx},${centerCell.y + dy},${centerCell.z + dz}`;
          const particles = this.grid.get(key);
          
          if (particles) {
            for (const particle of particles) {
              const distance = position.distanceTo(particle.position);
              if (distance <= radius) {
                neighbors.push(particle);
              }
            }
          }
        }
      }
    }

    return neighbors;
  }

  private positionToCell(position: THREE.Vector3): { x: number; y: number; z: number } {
    return {
      x: Math.floor(position.x / this.cellSize),
      y: Math.floor(position.y / this.cellSize),
      z: Math.floor(position.z / this.cellSize)
    };
  }

  private getKey(position: THREE.Vector3): string {
    const cell = this.positionToCell(position);
    return `${cell.x},${cell.y},${cell.z}`;
  }
}

// SPH核函数集合
export class SPHKernels {
  // Poly6核函数 - 用于密度计算
  static poly6(r: number, h: number): number {
    if (r >= h) return 0;
    const ratio = h * h - r * r;
    return (315 / (64 * Math.PI * Math.pow(h, 9))) * ratio * ratio * ratio;
  }

  // Spiky核函数梯度 - 用于压力力计算
  static spikyGradient(r: THREE.Vector3, h: number): THREE.Vector3 {
    const length = r.length();
    if (length >= h || length === 0) return new THREE.Vector3(0, 0, 0);
    
    const coefficient = -45 / (Math.PI * Math.pow(h, 6));
    const factor = coefficient * Math.pow(h - length, 2) / length;
    
    return r.clone().multiplyScalar(factor);
  }

  // 粘性拉普拉斯核函数 - 用于粘性力计算
  static viscosityLaplacian(r: number, h: number): number {
    if (r >= h) return 0;
    return (45 / (Math.PI * Math.pow(h, 6))) * (h - r);
  }

  // 表面张力核函数
  static surfaceTensionKernel(r: number, h: number): number {
    if (r >= h) return 0;
    const ratio = r / h;
    if (ratio <= 0.5) {
      return 2 * Math.pow(1 - ratio, 3) * ratio * ratio - 1/64;
    } else {
      return Math.pow(1 - ratio, 3) * ratio * ratio;
    }
  }
}

// 主要的SPH求解器类
export class SPHFluidSolver {
  private particles: SPHParticle[];
  private spatialGrid: SpatialHashGrid;
  private params: SPHSimulationParams;
  private containerBounds: THREE.Box3;
  private time: number;
  private frameCount: number;

  constructor(params: SPHSimulationParams, containerBounds: THREE.Box3) {
    this.params = params;
    this.containerBounds = containerBounds;
    this.spatialGrid = new SpatialHashGrid(params.smoothingRadius);
    this.particles = [];
    this.time = 0;
    this.frameCount = 0;
    
    this.initializeParticles();
  }

  private initializeParticles(): void {
    this.particles = [];
    const spacing = this.params.smoothingRadius * 0.5;
    const particlesPerDim = Math.ceil(Math.pow(this.params.particleCount, 1/3));

    // 在容器内创建规则的粒子网格
    let particleId = 0;
    const startX = this.containerBounds.min.x + spacing;
    const startY = this.containerBounds.min.y + spacing;
    const startZ = this.containerBounds.min.z + spacing;

    for (let x = 0; x < particlesPerDim && particleId < this.params.particleCount; x++) {
      for (let y = 0; y < particlesPerDim && particleId < this.params.particleCount; y++) {
        for (let z = 0; z < particlesPerDim && particleId < this.params.particleCount; z++) {
          const position = new THREE.Vector3(
            startX + x * spacing,
            startY + y * spacing,
            startZ + z * spacing
          );

          // 确保粒子在容器内
          if (position.x < this.containerBounds.max.x &&
              position.y < this.containerBounds.max.y &&
              position.z < this.containerBounds.max.z) {
            
            this.particles.push({
              id: particleId++,
              position: position.clone(),
              velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
              ),
              acceleration: new THREE.Vector3(0, 0, 0),
              density: this.params.restDensity,
              pressure: 0,
              force: new THREE.Vector3(0, 0, 0),
              mass: 1.0,
              color: new THREE.Color(0.3, 0.6, 1.0),
              temperature: 298.15, // 室温
              age: 0,
              life: 100 + Math.random() * 200
            });
          }
        }
      }
    }
  }

  private updateSpatialGrid(): void {
    this.spatialGrid.clear();
    for (const particle of this.particles) {
      this.spatialGrid.insert(particle);
    }
  }

  private calculateDensityAndPressure(): void {
    for (const particle of this.particles) {
      let density = particle.mass * SPHKernels.poly6(0, this.params.smoothingRadius);
      
      const neighbors = this.spatialGrid.getNeighbors(
        particle.position, 
        this.params.smoothingRadius
      );

      for (const neighbor of neighbors) {
        if (neighbor.id !== particle.id) {
          const distance = particle.position.distanceTo(neighbor.position);
          density += neighbor.mass * SPHKernels.poly6(distance, this.params.smoothingRadius);
        }
      }

      particle.density = Math.max(density, this.params.restDensity * 0.1);
      
      // Tait方程计算压力
      const densityRatio = particle.density / this.params.restDensity;
      particle.pressure = this.params.stiffness * (Math.pow(densityRatio, 7) - 1);
    }
  }

  private calculateForces(): void {
    for (const particle of this.particles) {
      particle.force.set(0, 0, 0);
      
      // 重力
      particle.force.add(
        this.params.gravity.clone().multiplyScalar(particle.mass)
      );

      const neighbors = this.spatialGrid.getNeighbors(
        particle.position, 
        this.params.smoothingRadius
      );

      for (const neighbor of neighbors) {
        if (neighbor.id !== particle.id) {
          const r = particle.position.clone().sub(neighbor.position);
          const distance = r.length();

          if (distance > 0) {
            // 压力力 (对称形式以保证动量守恒)
            const pressureForce = SPHKernels.spikyGradient(r, this.params.smoothingRadius)
              .multiplyScalar(
                -neighbor.mass * (particle.pressure + neighbor.pressure) / 
                (2 * neighbor.density)
              );
            particle.force.add(pressureForce);

            // 粘性力
            const velocityDiff = neighbor.velocity.clone().sub(particle.velocity);
            const viscosityForce = velocityDiff
              .multiplyScalar(
                this.params.viscosity * neighbor.mass * 
                SPHKernels.viscosityLaplacian(distance, this.params.smoothingRadius) / 
                neighbor.density
              );
            particle.force.add(viscosityForce);

            // 表面张力
            if (this.params.surfaceTension > 0) {
              const surfaceForce = r.clone().normalize()
                .multiplyScalar(
                  this.params.surfaceTension * neighbor.mass *
                  SPHKernels.surfaceTensionKernel(distance, this.params.smoothingRadius)
                );
              particle.force.add(surfaceForce);
            }
          }
        }
      }
    }
  }

  private calculateTemperature(): void {
    if (!this.params.enableTemperature) return;

    for (const particle of this.particles) {
      let temperatureChange = 0;
      
      const neighbors = this.spatialGrid.getNeighbors(
        particle.position, 
        this.params.smoothingRadius
      );

      for (const neighbor of neighbors) {
        if (neighbor.id !== particle.id) {
          const distance = particle.position.distanceTo(neighbor.position);
          const tempDiff = neighbor.temperature - particle.temperature;
          
          temperatureChange += this.params.thermalDiffusivity * neighbor.mass *
            tempDiff * SPHKernels.viscosityLaplacian(distance, this.params.smoothingRadius) /
            neighbor.density;
        }
      }

      particle.temperature += temperatureChange * this.params.timeStep;
    }
  }

  private handleBoundaryCollisions(particle: SPHParticle): void {
    const bounds = this.containerBounds;
    const restitution = 0.6; // 恢复系数
    const friction = 0.1;   // 摩擦系数

    // X边界
    if (particle.position.x <= bounds.min.x) {
      particle.position.x = bounds.min.x;
      particle.velocity.x = Math.abs(particle.velocity.x) * restitution;
      particle.velocity.y *= (1 - friction);
      particle.velocity.z *= (1 - friction);
    } else if (particle.position.x >= bounds.max.x) {
      particle.position.x = bounds.max.x;
      particle.velocity.x = -Math.abs(particle.velocity.x) * restitution;
      particle.velocity.y *= (1 - friction);
      particle.velocity.z *= (1 - friction);
    }

    // Y边界
    if (particle.position.y <= bounds.min.y) {
      particle.position.y = bounds.min.y;
      particle.velocity.y = Math.abs(particle.velocity.y) * restitution;
      particle.velocity.x *= (1 - friction);
      particle.velocity.z *= (1 - friction);
    } else if (particle.position.y >= bounds.max.y) {
      particle.position.y = bounds.max.y;
      particle.velocity.y = -Math.abs(particle.velocity.y) * restitution;
      particle.velocity.x *= (1 - friction);
      particle.velocity.z *= (1 - friction);
    }

    // Z边界
    if (particle.position.z <= bounds.min.z) {
      particle.position.z = bounds.min.z;
      particle.velocity.z = Math.abs(particle.velocity.z) * restitution;
      particle.velocity.x *= (1 - friction);
      particle.velocity.y *= (1 - friction);
    } else if (particle.position.z >= bounds.max.z) {
      particle.position.z = bounds.max.z;
      particle.velocity.z = -Math.abs(particle.velocity.z) * restitution;
      particle.velocity.x *= (1 - friction);
      particle.velocity.y *= (1 - friction);
    }
  }

  private integrate(): void {
    for (const particle of this.particles) {
      // 计算加速度
      particle.acceleration = particle.force.clone().divideScalar(particle.mass);

      // Leapfrog积分
      const newVelocity = particle.velocity.clone()
        .add(particle.acceleration.clone().multiplyScalar(this.params.timeStep));
      
      // 速度限制
      if (newVelocity.length() > this.params.maxVelocity) {
        newVelocity.normalize().multiplyScalar(this.params.maxVelocity);
      }

      const newPosition = particle.position.clone()
        .add(newVelocity.clone().multiplyScalar(this.params.timeStep));

      // 应用阻尼
      newVelocity.multiplyScalar(this.params.damping);

      particle.velocity = newVelocity;
      particle.position = newPosition;

      // 更新粒子生命周期
      particle.age += this.params.timeStep;

      // 边界碰撞处理
      this.handleBoundaryCollisions(particle);
      
      // 根据速度和压力更新颜色
      this.updateParticleColor(particle);
    }
  }

  private updateParticleColor(particle: SPHParticle): void {
    const speed = particle.velocity.length();
    const pressureRatio = Math.max(0, Math.min(particle.pressure / 1000, 1));
    const speedRatio = Math.min(speed / 10, 1);

    // 基于速度和压力的颜色映射
    particle.color.setHSL(
      0.7 - speedRatio * 0.7,  // 色调：蓝色到红色
      0.8 + pressureRatio * 0.2, // 饱和度
      0.4 + speedRatio * 0.4   // 亮度
    );
  }

  public step(): void {
    this.updateSpatialGrid();
    this.calculateDensityAndPressure();
    this.calculateForces();
    
    if (this.params.enableTemperature) {
      this.calculateTemperature();
    }
    
    this.integrate();
    
    this.time += this.params.timeStep;
    this.frameCount++;
  }

  public getParticles(): SPHParticle[] {
    return this.particles;
  }

  public addParticleStream(
    position: THREE.Vector3, 
    velocity: THREE.Vector3, 
    count: number = 1,
    temperature: number = 298.15
  ): void {
    for (let i = 0; i < count && this.particles.length < this.params.particleCount; i++) {
      const jitter = 0.1;
      const newPosition = position.clone().add(
        new THREE.Vector3(
          (Math.random() - 0.5) * jitter,
          (Math.random() - 0.5) * jitter,
          (Math.random() - 0.5) * jitter
        )
      );

      this.particles.push({
        id: this.particles.length,
        position: newPosition,
        velocity: velocity.clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
          )
        ),
        acceleration: new THREE.Vector3(0, 0, 0),
        density: this.params.restDensity,
        pressure: 0,
        force: new THREE.Vector3(0, 0, 0),
        mass: 1.0,
        color: new THREE.Color(0.3, 0.6, 1.0),
        temperature: temperature,
        age: 0,
        life: 100 + Math.random() * 200
      });
    }
  }

  public removeOldParticles(): void {
    this.particles = this.particles.filter(particle => particle.age < particle.life);
  }

  public getSimulationStatistics() {
    const avgDensity = this.particles.reduce((sum, p) => sum + p.density, 0) / this.particles.length;
    const avgPressure = this.particles.reduce((sum, p) => sum + p.pressure, 0) / this.particles.length;
    const avgSpeed = this.particles.reduce((sum, p) => sum + p.velocity.length(), 0) / this.particles.length;
    const avgTemperature = this.particles.reduce((sum, p) => sum + p.temperature, 0) / this.particles.length;

    return {
      particleCount: this.particles.length,
      averageDensity: avgDensity,
      averagePressure: avgPressure,
      averageSpeed: avgSpeed,
      averageTemperature: avgTemperature,
      simulationTime: this.time,
      frameCount: this.frameCount
    };
  }

  public reset(): void {
    this.time = 0;
    this.frameCount = 0;
    this.initializeParticles();
  }

  public updateParameters(newParams: Partial<SPHSimulationParams>): void {
    this.params = { ...this.params, ...newParams };
    
    // 如果粒子数量改变，需要重新初始化
    if (newParams.particleCount !== undefined) {
      this.initializeParticles();
    }
  }
} 