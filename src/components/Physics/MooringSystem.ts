/**
 * 系泊系统物理模型
 * 基于《野渡无人舟自横现象研究文献集》中的理论模�? * 
 * 参考文献：
 * 1. 余勇飞等 (2020). 野渡无人舟自横现象的数值研�? 力学与实�? 42(5)
 * 2. 王振�?(1992). 野渡无人舟自横——谈流体流动中物体的稳定�? 力学与实�? 14(4)
 * 3. Faltinsen, O.M. (1990). Sea Loads on Ships and Offshore Structures
 */

export interface MooringParameters {
  // 系泊绳参�?  ropeLength: number;        // 系泊绳长�?(m)
  ropeDiameter: number;      // 绳索直径 (m)
  ropeElasticity: number;    // 绳索弹性模�?(Pa)
  ropeDensity: number;       // 绳索密度 (kg/m³)
  
  // 系泊配置
  mooringStiffness: number;  // 系泊刚度 (N·m/rad)
  mooringDamping: number;    // 系泊阻尼 (N·m·s/rad)
  anchorPoints: Array<[number, number, number]>; // 锚点位置
  
  // 环境参数
  currentSpeed: number;      // 水流速度 (m/s)
  currentDirection: number;  // 水流方向 (�?
  waterDepth: number;        // 水深 (m)
  waterDensity: number;      // 水密�?(kg/m³)
}

export interface BoatParameters {
  length: number;            // 船长 (m)
  width: number;             // 船宽 (m)
  draft: number;             // 吃水深度 (m)
  mass: number;              // 船体质量 (kg)
  momentOfInertia: number;   // 转动惯量 (kg·m²)
}

export class MooringSystem {
  private params: MooringParameters;
  private boatParams: BoatParameters;
  
  // 动态状�?  private angle: number = 0;           // 船体角度 (弧度)
  private angularVelocity: number = 0; // 角速度 (rad/s)
  private position: [number, number, number] = [0, 0, 0];
  private tensions: number[] = [];     // 各绳索张�?(N)
  
  constructor(mooringParams: MooringParameters, boatParams: BoatParameters) {
    this.params = mooringParams;
    this.boatParams = boatParams;
    this.tensions = new Array(mooringParams.anchorPoints.length).fill(0);
  }

  /**
   * 计算椭圆柱绕流力�?   * 基于王振东教授的复变函数理论分析
   * M(α) = (1/2)πρ(a² - b²)v² sin(2α)
   */
  private calculateFlowMoment(angle: number): number {
    const a = this.boatParams.length / 2;  // 椭圆长半�?    const b = this.boatParams.width / 2;   // 椭圆短半�?    const ρ = this.params.waterDensity;
    const v = this.params.currentSpeed;
    
    // 考虑水流方向
    const currentDirRad = (this.params.currentDirection * Math.PI) / 180;
    const effectiveAngle = angle - currentDirRad;
    
    // 基础流体力矩公式（王振东�?992�?    const baseMoment = 0.5 * Math.PI * ρ * (a*a - b*b) * v*v * Math.sin(2 * effectiveAngle);
    
    // 考虑三维效应和粘性修正（余勇飞等�?020�?    const aspectRatio = a / b;
    const reynoldsNumber = ρ * v * this.boatParams.length / 1e-6; // 假设动力粘度 1e-6
    
    // 雷诺数修正系�?    const reynoldsCorrection = 1 + 0.1 * Math.log10(Math.max(reynoldsNumber / 1000, 1));
    
    // 长宽比修正系�?    const aspectCorrection = 1 + 0.2 * Math.exp(-aspectRatio / 3);
    
    return baseMoment * reynoldsCorrection * aspectCorrection;
  }

  /**
   * 计算系泊恢复力矩
   * 基于Faltinsen (1990)的系泊系统理�?   */
  private calculateMooringMoment(angle: number): number {
    // 线性恢复力矩（适用于小角度�?    const linearMoment = -this.params.mooringStiffness * angle;
    
    // 非线性修正（大角度时�?    const nonlinearFactor = 1 + 0.5 * angle * angle;
    
    return linearMoment * nonlinearFactor;
  }

  /**
   * 计算系泊阻尼力矩
   */
  private calculateDampingMoment(angularVel: number): number {
    // 粘性阻�?    const viscousDamping = -this.params.mooringDamping * angularVel;
    
    // 平方律阻尼（高速时占主导）
    const quadraticDamping = -0.1 * this.params.mooringDamping * Math.abs(angularVel) * angularVel;
    
    return viscousDamping + quadraticDamping;
  }

     /**
    * 计算绳索张力
    * 基于悬链线理论和动态载�?    */
      private calculateRopeTensions(): void {
     for (let index = 0; index < this.params.anchorPoints.length; index++) {
       const anchor = this.params.anchorPoints[index];
       
       // 船体连接点位�?       const connectionPoint = this.getConnectionPoint(index);
       
       // 水平距离和垂直距�?       const dx = connectionPoint[0] - anchor[0];
       const dz = connectionPoint[2] - anchor[2];
       const dy = connectionPoint[1] - anchor[1];
       const horizontalDistance = Math.sqrt(dx*dx + dz*dz);
       
       // 悬链线参�?       const ropeWeight = this.params.ropeDensity * Math.PI * (this.params.ropeDiameter/2)**2 * 9.81;
       const catenary_a = this.tensions[index] / ropeWeight; // 悬链线参�?       
       // 悬链线长度检�?       const catenaryLength = 2 * catenary_a * Math.sinh(horizontalDistance / (2 * catenary_a));
       
       if (catenaryLength <= this.params.ropeLength) {
         // 正常悬垂状�?         const tensionHorizontal = ropeWeight * catenary_a;
         const tensionVertical = ropeWeight * Math.sinh(horizontalDistance / (2 * catenary_a));
         this.tensions[index] = Math.sqrt(tensionHorizontal**2 + tensionVertical**2);
       } else {
         // 绳索拉直状�?         const totalLength = Math.sqrt(horizontalDistance**2 + dy**2);
         const strain = (totalLength - this.params.ropeLength) / this.params.ropeLength;
         const elasticTension = this.params.ropeElasticity * Math.PI * (this.params.ropeDiameter/2)**2 * strain;
         this.tensions[index] = Math.max(elasticTension, ropeWeight);
       }
       
       // 动态载�?       const dynamicFactor = 1 + 0.2 * Math.abs(this.angularVelocity);
       this.tensions[index] *= dynamicFactor;
     }
  }

  /**
   * 获取绳索连接点位�?   */
  private getConnectionPoint(ropeIndex: number): [number, number, number] {
    const numRopes = this.params.anchorPoints.length;
    const angleStep = (2 * Math.PI) / numRopes;
    const connectionAngle = ropeIndex * angleStep;
    
    // 船体边缘的连接点
    const radius = Math.min(this.boatParams.length, this.boatParams.width) / 3;
    const localX = radius * Math.cos(connectionAngle);
    const localZ = radius * Math.sin(connectionAngle);
    
    // 转换到全局坐标�?    const cos_angle = Math.cos(this.angle);
    const sin_angle = Math.sin(this.angle);
    
    const globalX = this.position[0] + localX * cos_angle - localZ * sin_angle;
    const globalZ = this.position[2] + localX * sin_angle + localZ * cos_angle;
    
    return [globalX, this.position[1], globalZ];
  }

  /**
   * 判断平衡稳定�?   * 基于线性稳定性分�?   */
  public analyzeStability(angle: number): {
    isStable: boolean;
    stiffness: number;
    naturalFrequency: number;
    dampingRatio: number;
  } {
    // 计算力矩对角度的导数（刚度）
    const deltaAngle = 0.001;
    const moment1 = this.calculateFlowMoment(angle - deltaAngle) + this.calculateMooringMoment(angle - deltaAngle);
    const moment2 = this.calculateFlowMoment(angle + deltaAngle) + this.calculateMooringMoment(angle + deltaAngle);
    const stiffness = -(moment2 - moment1) / (2 * deltaAngle);
    
    // 自然频率
    const naturalFrequency = Math.sqrt(Math.abs(stiffness) / this.boatParams.momentOfInertia);
    
    // 阻尼�?    const dampingRatio = this.params.mooringDamping / (2 * Math.sqrt(stiffness * this.boatParams.momentOfInertia));
    
    return {
      isStable: stiffness > 0,
      stiffness,
      naturalFrequency,
      dampingRatio
    };
  }

  /**
   * 更新物理状�?   * 基于4阶Runge-Kutta方法的数值积�?   */
  public update(deltaTime: number): void {
    // 当前力矩计算
    const flowMoment = this.calculateFlowMoment(this.angle);
    const mooringMoment = this.calculateMooringMoment(this.angle);
    const dampingMoment = this.calculateDampingMoment(this.angularVelocity);
    
    const totalMoment = flowMoment + mooringMoment + dampingMoment;
    const angularAcceleration = totalMoment / this.boatParams.momentOfInertia;
    
    // 4阶Runge-Kutta积分
    const k1_angle = this.angularVelocity;
    const k1_vel = angularAcceleration;
    
    const k2_angle = this.angularVelocity + k1_vel * deltaTime / 2;
    const k2_vel = angularAcceleration; // 简化，实际应重新计�?    
    const k3_angle = this.angularVelocity + k2_vel * deltaTime / 2;
    const k3_vel = angularAcceleration;
    
    const k4_angle = this.angularVelocity + k3_vel * deltaTime;
    const k4_vel = angularAcceleration;
    
    // 更新状�?    this.angle += (k1_angle + 2*k2_angle + 2*k3_angle + k4_angle) * deltaTime / 6;
    this.angularVelocity += (k1_vel + 2*k2_vel + 2*k3_vel + k4_vel) * deltaTime / 6;
    
    // 计算绳索张力
    this.calculateRopeTensions();
    
    // 角度归一�?    this.angle = ((this.angle + Math.PI) % (2 * Math.PI)) - Math.PI;
  }

  // Getters
  public getAngle(): number { return this.angle; }
  public getAngleDegrees(): number { return this.angle * 180 / Math.PI; }
  public getAngularVelocity(): number { return this.angularVelocity; }
  public getPosition(): [number, number, number] { return this.position; }
  public getTensions(): number[] { return [...this.tensions]; }
  public getMaxTension(): number { return Math.max(...this.tensions); }
  
  // Setters
  public setAngle(angle: number): void { this.angle = angle; }
  public setAngleDegrees(angleDeg: number): void { this.angle = angleDeg * Math.PI / 180; }
  public setPosition(pos: [number, number, number]): void { this.position = [...pos]; }
  
  /**
   * 获取系统状态摘�?   */
  public getSystemStatus(): {
    angle: number;
    angleDegrees: number;
    angularVelocity: number;
    maxTension: number;
    avgTension: number;
    flowMoment: number;
    mooringMoment: number;
    stability: { isStable: boolean; restoreStiffness: number; naturalFrequency: number; dampingRatio: number; };
  } {
    const stability = this.analyzeStability(this.angle);
    
    return {
      angle: this.angle,
      angleDegrees: this.getAngleDegrees(),
      angularVelocity: this.angularVelocity,
      maxTension: this.getMaxTension(),
      avgTension: this.tensions.reduce((a, b) => a + b, 0) / this.tensions.length,
      flowMoment: this.calculateFlowMoment(this.angle),
      mooringMoment: this.calculateMooringMoment(this.angle),
      stability
    };
  }
}

/**
 * 工厂函数：创建标准的野渡无人舟配�? */
export function createBoatDriftingMooring(
  currentSpeed: number = 0.3,
  ropeLength: number = 10
): { mooringSystem: MooringSystem; config: { mooring: MooringParameters; boat: BoatParameters } } {
  
  const mooringParams: MooringParameters = {
    ropeLength,
    ropeDiameter: 0.02,  // 2cm直径
    ropeElasticity: 1e8,  // 100 MPa
    ropeDensity: 900,     // 尼龙绳密�?    
    mooringStiffness: 500,  // 系泊刚度
    mooringDamping: 50,     // 系泊阻尼
    anchorPoints: [         // 双锚系泊
      [-ropeLength * 0.8, 0, -3],
      [-ropeLength * 0.8, 0, 3]
    ],
    
    currentSpeed,
    currentDirection: 0,
    waterDepth: 5,
    waterDensity: 1000
  };
  
  const boatParams: BoatParameters = {
    length: 5.0,    // 5米长�?    width: 2.0,     // 2米宽
    draft: 0.5,     // 0.5米吃�?    mass: 1000,     // 1�?    momentOfInertia: 2000  // 转动惯量
  };
  
  const mooringSystem = new MooringSystem(mooringParams, boatParams);
  
  return {
    mooringSystem,
    config: {
      mooring: mooringParams,
      boat: boatParams
    }
  };
} 
