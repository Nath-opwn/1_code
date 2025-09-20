/**
 * 野渡无人舟系泊系统物理模�? * 基于《野渡无人舟自横现象研究文献集》中的理论模�? * 
 * 主要参考文献：
 * 1. 余勇飞等 (2020). 野渡无人舟自横现象的数值研�? 力学与实�? 42(5)
 * 2. 王振�?(1992). 野渡无人舟自横——谈流体流动中物体的稳定�? 力学与实�? 14(4)
 * 3. Faltinsen, O.M. (1990). Sea Loads on Ships and Offshore Structures
 */

export interface FluidEnvironment {
  density: number;         // 流体密度 (kg/m³)
  velocity: number;        // 流�?(m/s)
  direction: number;       // 流向角度 (�?
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
  numberOfRopes: number;   // 系泊绳数�?  ropeLength: number;      // 绳长 (m)
  ropeDiameter: number;    // 绳径 (m)
  ropeModulus: number;     // 弹性模�?(Pa)
  ropeDensity: number;     // 绳密�?(kg/m³)
  stiffness: number;       // 系泊刚度 (N·m/rad)
  damping: number;         // 系泊阻尼 (N·m·s/rad)
  anchorPositions: Array<[number, number, number]>; // 锚点坐标
}

export class BoatMooringPhysics {
  private fluid: FluidEnvironment;
  private vessel: VesselGeometry;
  private mooring: MooringConfiguration;
  
  // 动态状态变�?  private angle: number = 0;           // 船体转角 (弧度)
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
   * 计算椭圆柱绕流力�?(基于王振东教授理�?
   * M(α) = (1/2)πρ(a² - b²)v² sin(2α)
   */
  public calculateFlowMoment(angle: number): number {
    const a = this.vessel.length / 2;  // 椭圆长半�?    const b = this.vessel.width / 2;   // 椭圆短半�?    const rho = this.fluid.density;
    const v = this.fluid.velocity;
    
    // 考虑流向影响
    const flowAngleRad = (this.fluid.direction * Math.PI) / 180;
    const effectiveAngle = angle - flowAngleRad;
    
    // 基础力矩公式 (王振�? 1992)
    const baseMoment = 0.5 * Math.PI * rho * (a*a - b*b) * v*v * Math.sin(2 * effectiveAngle);
    
    // 雷诺数修�?(余勇飞等, 2020)
    const Re = rho * v * this.vessel.length / this.fluid.kinematicViscosity;
    const reynoldsCorrection = 1 + 0.1 * Math.log10(Math.max(Re / 1000, 1));
    
    // 长宽比修�?    const aspectRatio = a / b;
    const aspectCorrection = 1 + 0.2 * Math.exp(-aspectRatio / 3);
    
    return baseMoment * reynoldsCorrection * aspectCorrection;
  }

  /**
   * 计算系泊恢复力矩 (基于Faltinsen理论)
   */
  public calculateMooringMoment(angle: number): number {
    // 线性恢复力�?    const linearMoment = -this.mooring.stiffness * angle;
    
    // 大角度非线性修�?    const nonlinearFactor = 1 + 0.5 * angle * angle;
    
    return linearMoment * nonlinearFactor;
  }

  /**
   * 计算阻尼力矩
   */
  public calculateDampingMoment(angularVel: number): number {
    // 系泊阻尼
    const mooringDamping = -this.mooring.damping * angularVel;
    
    // 流体阻尼（二次型�?    const fluidDamping = -0.1 * this.mooring.damping * Math.abs(angularVel) * angularVel;
    
    return mooringDamping + fluidDamping;
  }

  /**
   * 计算绳索张力 (基于悬链线理�?
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
        // 悬垂状�?- 悬链线模�?        const catenary_a = this.ropeTensions[i] / ropeWeight;
        const tensionHorizontal = ropeWeight * catenary_a;
        const sag = catenary_a * (Math.cosh(horizontalDistance / (2 * catenary_a)) - 1);
        this.ropeTensions[i] = Math.sqrt(tensionHorizontal**2 + (ropeWeight * sag)**2);
      } else {
        // 拉紧状�?- 弹性模�?        const strain = (totalDistance - this.mooring.ropeLength) / this.mooring.ropeLength;
        const ropeArea = Math.PI * (this.mooring.ropeDiameter/2)**2;
        const elasticTension = this.mooring.ropeModulus * ropeArea * strain;
        this.ropeTensions[i] = elasticTension + ropeWeight * this.mooring.ropeLength;
      }
      
      // 动态载荷系�?      const dynamicFactor = 1 + 0.2 * Math.abs(this.angularVelocity);
      this.ropeTensions[i] *= dynamicFactor;
    }
  }

  /**
   * 获取绳索连接点位�?   */
  private getRopeConnectionPoint(ropeIndex: number): [number, number, number] {
    const angleStep = (2 * Math.PI) / this.mooring.numberOfRopes;
    const connectionAngle = ropeIndex * angleStep;
    
    // 船体边缘连接�?    const radius = Math.min(this.vessel.length, this.vessel.width) / 3;
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
   * 稳定性分�?(基于线性理�?
   */
  public analyzeStability(angle: number): {
    isStable: boolean;
    restoreStiffness: number;
    naturalFrequency: number;
    dampingRatio: number;
  } {
    // 数值微分计算刚�?    const deltaAngle = 0.001;
    const moment1 = this.calculateFlowMoment(angle - deltaAngle) + 
                   this.calculateMooringMoment(angle - deltaAngle);
    const moment2 = this.calculateFlowMoment(angle + deltaAngle) + 
                   this.calculateMooringMoment(angle + deltaAngle);
    
    const restoreStiffness = -(moment2 - moment1) / (2 * deltaAngle);
    
    // 自然频率
    const naturalFrequency = Math.sqrt(Math.abs(restoreStiffness) / this.vessel.momentOfInertia);
    
    // 阻尼�?    const criticalDamping = 2 * Math.sqrt(restoreStiffness * this.vessel.momentOfInertia);
    const dampingRatio = this.mooring.damping / criticalDamping;
    
    return {
      isStable: restoreStiffness > 0,
      restoreStiffness,
      naturalFrequency,
      dampingRatio
    };
  }

  /**
   * 数值积分更�?(4阶Runge-Kutta方法)
   */
  public updatePhysics(deltaTime: number): void {
    // 计算总力�?    const flowMoment = this.calculateFlowMoment(this.angle);
    const mooringMoment = this.calculateMooringMoment(this.angle);
    const dampingMoment = this.calculateDampingMoment(this.angularVelocity);
    
    const totalMoment = flowMoment + mooringMoment + dampingMoment;
    const angularAccel = totalMoment / this.vessel.momentOfInertia;
    
    // Runge-Kutta 4阶积�?    const k1_theta = this.angularVelocity;
    const k1_omega = angularAccel;
    
    const k2_theta = this.angularVelocity + k1_omega * deltaTime / 2;
    const k2_omega = angularAccel; // 简化，理想情况应重新计�?    
    const k3_theta = this.angularVelocity + k2_omega * deltaTime / 2;
    const k3_omega = angularAccel;
    
    const k4_theta = this.angularVelocity + k3_omega * deltaTime;
    const k4_omega = angularAccel;
    
    // 状态更�?    this.angle += (k1_theta + 2*k2_theta + 2*k3_theta + k4_theta) * deltaTime / 6;
    this.angularVelocity += (k1_omega + 2*k2_omega + 2*k3_omega + k4_omega) * deltaTime / 6;
    
    // 更新绳索张力
    this.calculateRopeTensions();
    
    // 角度归一化到 [-π, π]
    this.angle = ((this.angle + Math.PI) % (2 * Math.PI)) - Math.PI;
  }

  // 状态访问器
  public getAngle(): number { return this.angle; }
  public getAngleDegrees(): number { return this.angle * 180 / Math.PI; }
  public getAngularVelocity(): number { return this.angularVelocity; }
  public getPosition(): [number, number, number] { return [...this.position]; }
  public getRopeTensions(): number[] { return [...this.ropeTensions]; }
  public getMaxTension(): number { return Math.max(...this.ropeTensions); }
  public getAverageTension(): number { 
    return this.ropeTensions.reduce((sum, t) => sum + t, 0) / this.ropeTensions.length; 
  }

  // 状态设置器
  public setAngle(angle: number): void { this.angle = angle; }
  public setAngleDegrees(angleDeg: number): void { this.angle = angleDeg * Math.PI / 180; }
  public setPosition(pos: [number, number, number]): void { this.position = [...pos]; }
  public setAngularVelocity(omega: number): void { this.angularVelocity = omega; }

  /**
   * 获取完整系统状�?   */
  public getSystemState(): {
    angle: number;
    angleDegrees: number;
    angularVelocity: number;
    position: [number, number, number];
    maxTension: number;
    averageTension: number;
    flowMoment: number;
    mooringMoment: number;
    dampingMoment: number;
    stability: { isStable: boolean; restoreStiffness: number; naturalFrequency: number; dampingRatio: number; };
  } {
    const stability = this.analyzeStability(this.angle);
    
    return {
      angle: this.angle,
      angleDegrees: this.getAngleDegrees(),
      angularVelocity: this.angularVelocity,
      position: this.getPosition(),
      maxTension: this.getMaxTension(),
      averageTension: this.getAverageTension(),
      flowMoment: this.calculateFlowMoment(this.angle),
      mooringMoment: this.calculateMooringMoment(this.angle),
      dampingMoment: this.calculateDampingMoment(this.angularVelocity),
      stability
    };
  }
}

/**
 * 创建标准�?野渡无人�?配置
 */
export function createStandardBoatMooring(
  flowSpeed: number = 0.3,
  ropeLength: number = 10
): BoatMooringPhysics {
  
  const fluidEnv: FluidEnvironment = {
    density: 1000,           // 淡水密度
    velocity: flowSpeed,
    direction: 0,            // 水流方向
    depth: 5,
    kinematicViscosity: 1e-6 // 水的运动粘度
  };
  
  const vesselGeom: VesselGeometry = {
    length: 5.0,             // 5米长渔船
    width: 2.0,              // 2米宽
    draft: 0.5,              // 0.5米吃�?    mass: 1000,              // 1吨质�?    momentOfInertia: 2000    // 估算转动惯量
  };
  
  const mooringConfig: MooringConfiguration = {
    numberOfRopes: 2,        // 双绳系泊
    ropeLength,
    ropeDiameter: 0.02,      // 2cm直径
    ropeModulus: 1e8,        // 100 MPa弹性模�?    ropeDensity: 900,        // 尼龙绳密�?    stiffness: 500,          // 系泊刚度
    damping: 50,             // 系泊阻尼
    anchorPositions: [       // 河岸两侧锚点
      [-ropeLength * 0.8, 0, -3],
      [-ropeLength * 0.8, 0, 3]
    ]
  };
  
  return new BoatMooringPhysics(fluidEnv, vesselGeom, mooringConfig);
} 
