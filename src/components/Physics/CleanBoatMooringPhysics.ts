/**
 * 船舶系泊物理模型 - 清理版本
 * 基于野渡无人舟自横现象研究
 */

export interface FluidEnvironment {
  density: number;         // 流体密度 (kg/m³)
  velocity: number;        // 流速(m/s)  
  direction: number;       // 流向角度 (度)
  depth: number;          // 水深 (m)
  kinematicViscosity: number; // 运动粘度 (m²/s)
}

export interface VesselGeometry {
  length: number;          // 船长 (m)
  width: number;           // 船宽 (m)
  draft: number;           // 吃水 (m)
  mass: number;            // 质量 (kg)
  momentOfInertia: number; // 绕垂直轴转动惯量 (kg·m²)
}

export interface MooringConfiguration {
  numberOfRopes: number;   // 系泊绳数量
  ropeLength: number;      // 绳长 (m)
  ropeDiameter: number;    // 绳径 (m)
  ropeModulus: number;     // 弹性模量(Pa)
  ropeDensity: number;     // 绳密度(kg/m³)
  stiffness: number;       // 系泊刚度 (N·m/rad)
  damping: number;         // 系泊阻尼 (N·m·s/rad)
  anchorPositions: Array<[number, number, number]>; // 锚点坐标
}

export class CleanBoatMooringPhysics {
  private fluid: FluidEnvironment;
  private vessel: VesselGeometry;
  private mooring: MooringConfiguration;
  
  // 动态状态变量
  private angle: number = 0;           // 船体转角 (弧度)
  private angularVelocity: number = 0; // 角速度 (rad/s)
  private position: [number, number, number] = [0, 0, 0];
  private ropeTensions: number[] = [];

  constructor(
    fluidEnv: FluidEnvironment,
    vesselGeom: VesselGeometry,
    mooringConfig: MooringConfiguration
  ) {
    this.fluid = fluidEnv;
    this.vessel = vesselGeom;
    this.mooring = mooringConfig;
    this.ropeTensions = new Array(mooringConfig.numberOfRopes).fill(0);
  }

  /**
   * 计算椭圆柱绕流力矩
   */
  public calculateFlowMoment(angle: number): number {
    const a = this.vessel.length / 2;  // 椭圆长半轴
    const b = this.vessel.width / 2;   // 椭圆短半轴
    const rho = this.fluid.density;
    const v = this.fluid.velocity;
    
    // 考虑流向影响
    const flowAngleRad = (this.fluid.direction * Math.PI) / 180;
    const effectiveAngle = angle - flowAngleRad;
    
    // 基础力矩公式
    const baseMoment = 0.5 * Math.PI * rho * (a*a - b*b) * v*v * Math.sin(2 * effectiveAngle);
    
    // 雷诺数修正
    const Re = rho * v * this.vessel.length / this.fluid.kinematicViscosity;
    const reynoldsCorrection = 1 + 0.1 * Math.log10(Math.max(Re / 1000, 1));
    
    // 长宽比修正
    const aspectRatio = a / b;
    const aspectCorrection = 1 + 0.2 * Math.exp(-aspectRatio / 3);
    
    return baseMoment * reynoldsCorrection * aspectCorrection;
  }

  /**
   * 计算系泊恢复力矩
   */
  public calculateMooringMoment(angle: number): number {
    // 线性恢复力矩
    const linearMoment = -this.mooring.stiffness * angle;
    
    // 大角度非线性修正
    const nonlinearFactor = 1 + 0.5 * angle * angle;
    
    return linearMoment * nonlinearFactor;
  }

  /**
   * 计算阻尼力矩
   */
  public calculateDampingMoment(angularVel: number): number {
    // 系泊阻尼
    const mooringDamping = -this.mooring.damping * angularVel;
    
    // 流体阻尼（二次型）
    const fluidDamping = -0.1 * this.mooring.damping * Math.abs(angularVel) * angularVel;
    
    return mooringDamping + fluidDamping;
  }

  /**
   * 计算绳索张力
   */
  public calculateRopeTensions(): void {
    for (let i = 0; i < this.mooring.numberOfRopes; i++) {
      const anchor = this.mooring.anchorPositions[i];
      const connectionPoint = this.getRopeConnectionPoint(i);
      
      // 几何计算
      const dx = connectionPoint[0] - anchor[0];
      const dz = connectionPoint[2] - anchor[2];
      const dy = connectionPoint[1] - anchor[1];
      const horizontalDistance = Math.sqrt(dx*dx + dz*dz);
      const totalDistance = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      // 绳重
      const ropeWeight = this.mooring.ropeDensity * Math.PI * 
        (this.mooring.ropeDiameter/2)**2 * 9.81;
      
      if (totalDistance < this.mooring.ropeLength) {
        // 悬垂状态 - 悬链线模型
        const catenary_a = this.ropeTensions[i] / ropeWeight;
        const tensionHorizontal = ropeWeight * catenary_a;
        const sag = catenary_a * (Math.cosh(horizontalDistance / (2 * catenary_a)) - 1);
        this.ropeTensions[i] = Math.sqrt(tensionHorizontal**2 + (ropeWeight * sag)**2);
      } else {
        // 拉紧状态 - 弹性模型
        const strain = (totalDistance - this.mooring.ropeLength) / this.mooring.ropeLength;
        const ropeArea = Math.PI * (this.mooring.ropeDiameter/2)**2;
        const elasticTension = this.mooring.ropeModulus * ropeArea * strain;
        this.ropeTensions[i] = elasticTension + ropeWeight * this.mooring.ropeLength;
      }
      
      // 动态载荷系数
      const dynamicFactor = 1 + 0.2 * Math.abs(this.angularVelocity);
      this.ropeTensions[i] *= dynamicFactor;
    }
  }

  /**
   * 获取绳索连接点位置
   */
  private getRopeConnectionPoint(ropeIndex: number): [number, number, number] {
    const angleStep = (2 * Math.PI) / this.mooring.numberOfRopes;
    const connectionAngle = ropeIndex * angleStep;
    
    // 船体边缘连接点
    const radius = Math.min(this.vessel.length, this.vessel.width) / 3;
    const localX = radius * Math.cos(connectionAngle);
    const localZ = radius * Math.sin(connectionAngle);
    
    // 转换到全局坐标
    const cosTheta = Math.cos(this.angle);
    const sinTheta = Math.sin(this.angle);
    
    const globalX = this.position[0] + localX * cosTheta - localZ * sinTheta;
    const globalZ = this.position[2] + localX * sinTheta + localZ * cosTheta;
    
    return [globalX, this.position[1], globalZ];
  }

  /**
   * 数值积分求解运动方程
   */
  public integrate(dt: number): void {
    // 计算总力矩
    const flowMoment = this.calculateFlowMoment(this.angle);
    const mooringMoment = this.calculateMooringMoment(this.angle);
    const dampingMoment = this.calculateDampingMoment(this.angularVelocity);
    
    const totalMoment = flowMoment + mooringMoment + dampingMoment;
    
    // 角加速度
    const angularAcceleration = totalMoment / this.vessel.momentOfInertia;
    
    // 更新角速度和角度
    this.angularVelocity += angularAcceleration * dt;
    this.angle += this.angularVelocity * dt;
    
    // 限制角度范围
    this.angle = ((this.angle + Math.PI) % (2 * Math.PI)) - Math.PI;
    
    // 更新绳索张力
    this.calculateRopeTensions();
  }

  /**
   * 稳定性分析
   */
  public analyzeStability(angle: number): {
    isStable: boolean;
    restoreStiffness: number;
    naturalFrequency: number;
    dampingRatio: number;
  } {
    // 数值微分计算刚度
    const deltaAngle = 0.001;
    const moment1 = this.calculateFlowMoment(angle - deltaAngle) + 
                   this.calculateMooringMoment(angle - deltaAngle);
    const moment2 = this.calculateFlowMoment(angle + deltaAngle) + 
                   this.calculateMooringMoment(angle + deltaAngle);
    
    const restoreStiffness = -(moment2 - moment1) / (2 * deltaAngle);
    
    // 自然频率
    const naturalFrequency = Math.sqrt(Math.abs(restoreStiffness) / this.vessel.momentOfInertia);
    
    // 阻尼比
    const criticalDamping = 2 * Math.sqrt(restoreStiffness * this.vessel.momentOfInertia);
    const dampingRatio = this.mooring.damping / criticalDamping;
    
    return {
      isStable: restoreStiffness > 0,
      restoreStiffness,
      naturalFrequency,
      dampingRatio
    };
  }

  // Getters
  public getAngle(): number { return this.angle; }
  public getAngularVelocity(): number { return this.angularVelocity; }
  public getPosition(): [number, number, number] { return [...this.position]; }
  public getRopeTensions(): number[] { return [...this.ropeTensions]; }
  
  // Setters
  public setAngle(angle: number): void { this.angle = angle; }
  public setAngleDegrees(angleDeg: number): void { this.angle = angleDeg * Math.PI / 180; }
  public setAngularVelocity(velocity: number): void { this.angularVelocity = velocity; }
  public setPosition(pos: [number, number, number]): void { this.position = [...pos]; }

  /**
   * 获取系统状态 (兼容旧接口)
   */
  public getSystemState() {
    const stability = this.analyzeStability(this.angle);
    return {
      angle: this.angle,
      angleDegrees: this.angle * 180 / Math.PI,
      angularVelocity: this.angularVelocity,
      position: this.position,
      ropeTensions: this.ropeTensions,
      maxTension: Math.max(...this.ropeTensions),
      avgTension: this.ropeTensions.reduce((a, b) => a + b, 0) / this.ropeTensions.length,
      flowMoment: this.calculateFlowMoment(this.angle),
      mooringMoment: this.calculateMooringMoment(this.angle),
      dampingMoment: this.calculateDampingMoment(this.angularVelocity),
      stability
    };
  }

  /**
   * 更新物理状态 (兼容旧接口)
   */
  public updatePhysics(dt: number = 0.01) {
    this.integrate(dt);
  }
}

/**
 * 创建标准船舶系泊配置
 */
export function createStandardBoatMooring() {
  const fluidEnv = {
    density: 1025,      // 海水密度
    velocity: 2.0,      // 流速 2 m/s
    direction: 0,       // 流向角度
    depth: 10,          // 水深
    kinematicViscosity: 1.19e-6  // 海水运动粘度
  };

  const vesselGeom = {
    length: 20,         // 船长 20m
    width: 6,           // 船宽 6m
    draft: 2,           // 吃水 2m
    mass: 50000,        // 质量 50吨
    momentOfInertia: 500000  // 转动惯量
  };

  const mooringConfig = {
    numberOfRopes: 4,
    ropeLength: 50,
    ropeDiameter: 0.1,
    ropeModulus: 1e8,
    ropeDensity: 900,
    stiffness: 100000,
    damping: 5000,
    anchorPositions: [
      [30, -8, 0],
      [0, -8, 30],
      [-30, -8, 0],
      [0, -8, -30]
    ] as Array<[number, number, number]>
  };

  return new CleanBoatMooringPhysics(fluidEnv, vesselGeom, mooringConfig);
} 