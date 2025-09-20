import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';

// SPH粒子系统参数
interface SPHParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  density: number;
  pressure: number;
  force: THREE.Vector3;
  mass: number;
  id: number;
}

// SPH仿真参数
interface SPHSimulationParams {
  particleCount: number;
  smoothingRadius: number;       // 光滑半径
  restDensity: number;          // 静态密度
  stiffness: number;            // 压力刚度
  viscosity: number;            // 粘性系数
  gravity: number;              // 重力
  damping: number;              // 阻尼系数
  boundaryStiffness: number;    // 边界刚度
  timeStep: number;             // 时间步长
}

// 流体仿真组件属性
interface Real3DParticleFluidSimulationProps {
  className?: string;
  autoRotate?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  containerDepth?: number;
  inletVelocity?: number;
  obstacleType?: 'sphere' | 'cube' | 'cylinder' | 'none';
  obstacleRadius?: number;
  visualizationType?: 'velocity' | 'pressure' | 'density' | 'default';
}

// SPH核函数 (Poly6)
function poly6Kernel(r: number, h: number): number {
  if (r >= h) return 0;
  const ratio = h * h - r * r;
  return (315 / (64 * Math.PI * Math.pow(h, 9))) * ratio * ratio * ratio;
}

// SPH梯度核函数 (Spiky)
function spikyGradientKernel(r: THREE.Vector3, h: number): THREE.Vector3 {
  const length = r.length();
  if (length >= h || length === 0) return new THREE.Vector3(0, 0, 0);
  
  const coefficient = -45 / (Math.PI * Math.pow(h, 6));
  const factor = coefficient * Math.pow(h - length, 2) / length;
  
  return r.clone().multiplyScalar(factor);
}

// SPH拉普拉斯核函数 (用于粘性)
function viscosityLaplacianKernel(r: number, h: number): number {
  if (r >= h) return 0;
  return (45 / (Math.PI * Math.pow(h, 6))) * (h - r);
}

// SPH流体求解器类
class SPHFluidSolver {
  private particles: SPHParticle[] = [];
  private spatialHashMap: Map<string, SPHParticle[]> = new Map();
  private params: SPHSimulationParams;
  private containerBounds: THREE.Box3;

  constructor(params: SPHSimulationParams, containerBounds: THREE.Box3) {
    this.params = params;
    this.containerBounds = containerBounds;
    this.initializeParticles();
  }

  private initializeParticles(): void {
    this.particles = [];
    const spacing = this.params.smoothingRadius * 0.6;
    
    // 在容器左侧创建粒子网格
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 8; y++) {
        for (let z = 0; z < 8; z++) {
          const position = new THREE.Vector3(
            this.containerBounds.min.x + spacing + x * spacing,
            this.containerBounds.min.y + spacing + y * spacing,
            this.containerBounds.min.z + spacing + z * spacing
          );

          this.particles.push({
            position: position.clone(),
            velocity: new THREE.Vector3(2, 0, 0), // 初始向右的速度
            acceleration: new THREE.Vector3(0, 0, 0),
            density: this.params.restDensity,
            pressure: 0,
            force: new THREE.Vector3(0, 0, 0),
            mass: 1.0,
            id: this.particles.length
          });
        }
      }
    }
  }

  private updateSpatialHash(): void {
    this.spatialHashMap.clear();
    const cellSize = this.params.smoothingRadius;

    for (const particle of this.particles) {
      const cellX = Math.floor(particle.position.x / cellSize);
      const cellY = Math.floor(particle.position.y / cellSize);
      const cellZ = Math.floor(particle.position.z / cellSize);
      const key = `${cellX},${cellY},${cellZ}`;

      if (!this.spatialHashMap.has(key)) {
        this.spatialHashMap.set(key, []);
      }
      this.spatialHashMap.get(key)!.push(particle);
    }
  }

  private getNeighbors(particle: SPHParticle): SPHParticle[] {
    const neighbors: SPHParticle[] = [];
    const cellSize = this.params.smoothingRadius;
    const cellX = Math.floor(particle.position.x / cellSize);
    const cellY = Math.floor(particle.position.y / cellSize);
    const cellZ = Math.floor(particle.position.z / cellSize);

    // 检查周围的27个网格单元
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${cellX + dx},${cellY + dy},${cellZ + dz}`;
          const particles = this.spatialHashMap.get(key);
          if (particles) {
            for (const neighbor of particles) {
              if (neighbor.id !== particle.id) {
                const distance = particle.position.distanceTo(neighbor.position);
                if (distance < this.params.smoothingRadius) {
                  neighbors.push(neighbor);
                }
              }
            }
          }
        }
      }
    }

    return neighbors;
  }

  private calculateDensityAndPressure(): void {
    for (const particle of this.particles) {
      let density = particle.mass * poly6Kernel(0, this.params.smoothingRadius);
      const neighbors = this.getNeighbors(particle);

      for (const neighbor of neighbors) {
        const distance = particle.position.distanceTo(neighbor.position);
        density += neighbor.mass * poly6Kernel(distance, this.params.smoothingRadius);
      }

      particle.density = Math.max(density, this.params.restDensity);
      
      // 计算压力 (Tait equation)
      particle.pressure = this.params.stiffness * (particle.density - this.params.restDensity);
    }
  }

  private calculateForces(): void {
    for (const particle of this.particles) {
      particle.force.set(0, 0, 0);
      
      // 重力
      particle.force.add(new THREE.Vector3(0, -this.params.gravity * particle.mass, 0));

      const neighbors = this.getNeighbors(particle);

      for (const neighbor of neighbors) {
        const r = particle.position.clone().sub(neighbor.position);
        const distance = r.length();

        if (distance > 0) {
          // 压力力
          const pressureForce = spikyGradientKernel(r, this.params.smoothingRadius)
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
              viscosityLaplacianKernel(distance, this.params.smoothingRadius) / 
              neighbor.density
            );
          particle.force.add(viscosityForce);
        }
      }
    }
  }

  private handleBoundaryCollisions(particle: SPHParticle): void {
    const bounds = this.containerBounds;
    const restitution = 0.5; // 恢复系数

    // X边界
    if (particle.position.x <= bounds.min.x) {
      particle.position.x = bounds.min.x;
      particle.velocity.x = Math.abs(particle.velocity.x) * restitution;
    } else if (particle.position.x >= bounds.max.x) {
      particle.position.x = bounds.max.x;
      particle.velocity.x = -Math.abs(particle.velocity.x) * restitution;
    }

    // Y边界
    if (particle.position.y <= bounds.min.y) {
      particle.position.y = bounds.min.y;
      particle.velocity.y = Math.abs(particle.velocity.y) * restitution;
    } else if (particle.position.y >= bounds.max.y) {
      particle.position.y = bounds.max.y;
      particle.velocity.y = -Math.abs(particle.velocity.y) * restitution;
    }

    // Z边界
    if (particle.position.z <= bounds.min.z) {
      particle.position.z = bounds.min.z;
      particle.velocity.z = Math.abs(particle.velocity.z) * restitution;
    } else if (particle.position.z >= bounds.max.z) {
      particle.position.z = bounds.max.z;
      particle.velocity.z = -Math.abs(particle.velocity.z) * restitution;
    }
  }

  private integrate(): void {
    for (const particle of this.particles) {
      // 计算加速度
      particle.acceleration = particle.force.clone().divideScalar(particle.mass);

      // Verlet积分
      const newVelocity = particle.velocity.clone()
        .add(particle.acceleration.clone().multiplyScalar(this.params.timeStep));
      
      const newPosition = particle.position.clone()
        .add(newVelocity.clone().multiplyScalar(this.params.timeStep));

      // 应用阻尼
      newVelocity.multiplyScalar(this.params.damping);

      particle.velocity = newVelocity;
      particle.position = newPosition;

      // 边界碰撞处理
      this.handleBoundaryCollisions(particle);
    }
  }

  public step(): void {
    this.updateSpatialHash();
    this.calculateDensityAndPressure();
    this.calculateForces();
    this.integrate();
  }

  public getParticles(): SPHParticle[] {
    return this.particles;
  }

  public addParticleStream(position: THREE.Vector3, velocity: THREE.Vector3): void {
    if (this.particles.length < this.params.particleCount) {
      this.particles.push({
        position: position.clone(),
        velocity: velocity.clone(),
        acceleration: new THREE.Vector3(0, 0, 0),
        density: this.params.restDensity,
        pressure: 0,
        force: new THREE.Vector3(0, 0, 0),
        mass: 1.0,
        id: this.particles.length
      });
    }
  }
}

// 3D粒子渲染组件
const ParticleRenderer: React.FC<{
  particles: SPHParticle[];
  visualizationType: string;
}> = ({ particles, visualizationType }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colorAttribute = useRef<THREE.InstancedBufferAttribute>();

  const geometry = useMemo(() => new THREE.SphereGeometry(0.05, 8, 8), []);
  const material = useMemo(() => new THREE.MeshPhongMaterial({
    color: 0x4a90e2,
    transparent: true,
    opacity: 0.8
  }), []);

  useEffect(() => {
    if (meshRef.current && particles.length > 0) {
      const mesh = meshRef.current;
      const matrix = new THREE.Matrix4();
      const colors = new Float32Array(particles.length * 3);

      particles.forEach((particle, i) => {
        // 设置粒子位置
        matrix.setPosition(particle.position);
        mesh.setMatrixAt(i, matrix);

        // 根据可视化类型设置颜色
        let color = new THREE.Color();
        switch (visualizationType) {
          case 'velocity':
            const speed = particle.velocity.length();
            color.setHSL(0.7 - Math.min(speed / 10, 0.7), 1.0, 0.5);
            break;
          case 'pressure':
            const pressureRatio = Math.max(0, Math.min(particle.pressure / 100, 1));
            color.setHSL(0.0, pressureRatio, 0.5);
            break;
          case 'density':
            const densityRatio = (particle.density - 800) / 400;
            color.setHSL(0.6, 1.0, 0.3 + densityRatio * 0.4);
            break;
          default:
            color.setRGB(0.3, 0.6, 1.0);
        }

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      });

      mesh.instanceMatrix.needsUpdate = true;

      // 更新颜色
      if (!colorAttribute.current) {
        colorAttribute.current = new THREE.InstancedBufferAttribute(colors, 3);
        mesh.geometry.setAttribute('color', colorAttribute.current);
        material.vertexColors = true;
      } else {
        colorAttribute.current.array = colors;
        colorAttribute.current.needsUpdate = true;
      }
    }
  }, [particles, visualizationType, material]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, particles.length]}
      castShadow
      receiveShadow
    />
  );
};

// 容器组件
const FluidContainer: React.FC<{
  width: number;
  height: number;
  depth: number;
}> = ({ width, height, depth }) => {
  const edges = useMemo(() => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    return new THREE.EdgesGeometry(geometry);
  }, [width, height, depth]);

  return (
    <group>
      {/* 容器边框 */}
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={0x666666} />
      </lineSegments>
      
      {/* 底面 */}
      <mesh position={[0, -height / 2, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshPhongMaterial color={0xcccccc} transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

// 障碍物组件
const Obstacle: React.FC<{
  type: string;
  radius: number;
  position: THREE.Vector3;
}> = ({ type, radius, position }) => {
  if (type === 'none') return null;

  const geometry = useMemo(() => {
    switch (type) {
      case 'sphere':
        return new THREE.SphereGeometry(radius, 16, 16);
      case 'cube':
        return new THREE.BoxGeometry(radius * 2, radius * 2, radius * 2);
      case 'cylinder':
        return new THREE.CylinderGeometry(radius, radius, radius * 2, 16);
      default:
        return new THREE.SphereGeometry(radius, 16, 16);
    }
  }, [type, radius]);

  return (
    <mesh position={position} castShadow>
      <primitive object={geometry} />
      <meshPhongMaterial color={0x8b4513} />
    </mesh>
  );
};

// 主仿真场景
const SPHFluidScene: React.FC<Omit<Real3DParticleFluidSimulationProps, 'className' | 'autoRotate'>> = ({
  containerWidth = 8,
  containerHeight = 6,
  containerDepth = 4,
  inletVelocity = 3,
  obstacleType = 'sphere',
  obstacleRadius = 0.8,
  visualizationType = 'default'
}) => {
  const solverRef = useRef<SPHFluidSolver>();
  const [particles, setParticles] = useState<SPHParticle[]>([]);
  const { camera } = useThree();

  // 初始化SPH求解器
  useEffect(() => {
    const params: SPHSimulationParams = {
      particleCount: 1000,
      smoothingRadius: 0.3,
      restDensity: 1000,
      stiffness: 200,
      viscosity: 0.5,
      gravity: 9.81,
      damping: 0.95,
      boundaryStiffness: 50000,
      timeStep: 0.016
    };

    const bounds = new THREE.Box3(
      new THREE.Vector3(-containerWidth/2, -containerHeight/2, -containerDepth/2),
      new THREE.Vector3(containerWidth/2, containerHeight/2, containerDepth/2)
    );

    solverRef.current = new SPHFluidSolver(params, bounds);
    camera.position.set(10, 8, 10);
    camera.lookAt(0, 0, 0);
  }, [containerWidth, containerHeight, containerDepth, camera]);

  // 仿真循环
  useFrame(() => {
    if (solverRef.current) {
      // 每帧运行多次仿真步骤以提高稳定性
      for (let i = 0; i < 3; i++) {
        solverRef.current.step();
      }
      
      // 添加新的粒子流
      if (Math.random() < 0.3) {
        const inletPosition = new THREE.Vector3(-containerWidth/2 + 0.5, 0, 0);
        const inletVel = new THREE.Vector3(inletVelocity, Math.random() - 0.5, Math.random() - 0.5);
        solverRef.current.addParticleStream(inletPosition, inletVel);
      }

      setParticles([...solverRef.current.getParticles()]);
    }
  });

  const obstaclePosition = new THREE.Vector3(2, 0, 0);

  return (
    <>
      {/* 光照 */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, 5]} intensity={0.3} />

      {/* 容器 */}
      <FluidContainer 
        width={containerWidth}
        height={containerHeight}
        depth={containerDepth}
      />

      {/* 障碍物 */}
      <Obstacle
        type={obstacleType}
        radius={obstacleRadius}
        position={obstaclePosition}
      />

      {/* 粒子系统 */}
      <ParticleRenderer
        particles={particles}
        visualizationType={visualizationType}
      />

      {/* 标题 */}
      <Text
        position={[0, containerHeight/2 + 1, 0]}
        fontSize={0.5}
        color="#2c3e50"
        anchorX="center"
        anchorY="middle"
      >
        真实3D SPH流体粒子仿真
      </Text>

      {/* 粒子计数显示 */}
      <Text
        position={[-containerWidth/2, containerHeight/2 + 0.5, 0]}
        fontSize={0.3}
        color="#34495e"
        anchorX="left"
        anchorY="middle"
      >
        {`粒子数量: ${particles.length}`}
      </Text>
    </>
  );
};

// 主组件
const Real3DParticleFluidSimulation: React.FC<Real3DParticleFluidSimulationProps> = ({
  className = '',
  autoRotate = false,
  ...props
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        shadows
        camera={{ position: [10, 8, 10], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <SPHFluidScene {...props} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default Real3DParticleFluidSimulation; 