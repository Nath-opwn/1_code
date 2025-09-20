import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { BoatMooringPhysics, createStandardBoatMooring } from './Physics/BoatMooringPhysics';

// 船体3D模型组件
function BoatMesh({ position, rotation }: { position: [number, number, number], rotation: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...position);
      meshRef.current.rotation.y = rotation;
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* 船体 - 椭圆形状 */}
      <boxGeometry args={[5, 0.5, 2]} />
      <meshStandardMaterial color="#8B4513" />
      
      {/* 船头标记 */}
      <mesh position={[2.2, 0.3, 0]}>
        <coneGeometry args={[0.3, 0.6, 8]} />
        <meshStandardMaterial color="#FF6B6B" />
      </mesh>
    </mesh>
  );
}

// 系泊绳组件
function MooringRope({ 
  start, 
  end, 
  tension 
}: { 
  start: [number, number, number], 
  end: [number, number, number],
  tension: number 
}) {
  // 绳索颜色根据张力变化
  const tensionColor = tension > 2000 ? '#FF0000' : tension > 1000 ? '#FF8800' : '#00AA00';
  
  // 创建悬链线路径
  const points = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = start[0] + t * (end[0] - start[0]);
    const z = start[2] + t * (end[2] - start[2]);
    // 简化的悬链线近似
    const sag = 0.5 * Math.sin(Math.PI * t) * Math.min(tension / 1000, 2);
    const y = start[1] + t * (end[1] - start[1]) - sag;
    points.push(new THREE.Vector3(x, y, z));
  }

  return (
    <Line
      points={points}
      color={tensionColor}
      lineWidth={3}
    />
  );
}

// 锚点标记组件
function AnchorPoint({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.2, 0.3, 0.5, 8]} />
      <meshStandardMaterial color="#555555" />
    </mesh>
  );
}

// 3D场景组件
function Scene({ physics }: { physics: BoatMooringPhysics }) {
  const [systemState, setSystemState] = useState(physics.getSystemState());

  useFrame((state, delta) => {
    physics.updatePhysics(delta);
    setSystemState(physics.getSystemState());
  });

  return (
    <>
      {/* 环境光照 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      
      {/* 水面 */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#4A90E2" transparent opacity={0.7} />
      </mesh>
      
      {/* 船体 */}
      <BoatMesh 
        position={systemState.position} 
        rotation={systemState.angle}
      />
      
      {/* 系泊绳 */}
      {systemState.position && (
        <>
          <MooringRope
            start={[-8, 0, -3]}
            end={[systemState.position[0] - 1.5, systemState.position[1], systemState.position[2] - 0.8]}
            tension={physics.getRopeTensions()[0] || 0}
          />
          <MooringRope
            start={[-8, 0, 3]}
            end={[systemState.position[0] - 1.5, systemState.position[1], systemState.position[2] + 0.8]}
            tension={physics.getRopeTensions()[1] || 0}
          />
        </>
      )}
      
      {/* 锚点 */}
      <AnchorPoint position={[-8, 0, -3]} />
      <AnchorPoint position={[-8, 0, 3]} />
      
      {/* 水流指示箭头 */}
      <mesh position={[-15, 2, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.5, 2, 8]} />
        <meshStandardMaterial color="#00CCFF" />
      </mesh>
      
      {/* 状态文本显示 */}
      <Text
        position={[-10, 5, 0]}
        fontSize={0.8}
        color="white"
        anchorX="left"
        anchorY="top"
      >
        {`角度: ${systemState.angleDegrees.toFixed(1)}°
角速度: ${systemState.angularVelocity.toFixed(3)} rad/s
最大张力: ${systemState.maxTension.toFixed(0)} N
稳定性: ${systemState.stability.isStable ? '稳定' : '不稳定'}`}
      </Text>
    </>
  );
}

// 控制面板组件
function ControlPanel({ 
  physics, 
  onReset 
}: { 
  physics: BoatMooringPhysics, 
  onReset: () => void 
}) {
  const [currentSpeed, setCurrentSpeed] = useState(0.3);
  const [ropeStiffness, setRopeStiffness] = useState(500);
  const [initialAngle, setInitialAngle] = useState(0);

  const handleSpeedChange = (speed: number) => {
    setCurrentSpeed(speed);
    physics['fluid'].velocity = speed;
  };

  const handleStiffnessChange = (stiffness: number) => {
    setRopeStiffness(stiffness);
    physics['mooring'].stiffness = stiffness;
  };

  const handleAngleChange = (angle: number) => {
    setInitialAngle(angle);
    physics.setAngleDegrees(angle);
    physics.setAngularVelocity(0);
  };

  const systemState = physics.getSystemState();

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">野渡无人舟系泊系统控制</h3>
      
      {/* 参数控制 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            水流速度: {currentSpeed.toFixed(2)} m/s
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={currentSpeed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            系泊刚度: {ropeStiffness} N·m/rad
          </label>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={ropeStiffness}
            onChange={(e) => handleStiffnessChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            初始角度: {initialAngle}°
          </label>
          <input
            type="range"
            min="-90"
            max="90"
            step="5"
            value={initialAngle}
            onChange={(e) => handleAngleChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* 实时状态显示 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-sm text-gray-600">当前角度</div>
          <div className="text-lg font-semibold text-blue-600">
            {systemState.angleDegrees.toFixed(1)}°
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded">
          <div className="text-sm text-gray-600">角速度</div>
          <div className="text-lg font-semibold text-green-600">
            {systemState.angularVelocity.toFixed(3)} rad/s
          </div>
        </div>
        
        <div className="bg-orange-50 p-3 rounded">
          <div className="text-sm text-gray-600">最大张力</div>
          <div className="text-lg font-semibold text-orange-600">
            {systemState.maxTension.toFixed(0)} N
          </div>
        </div>
        
        <div className={`p-3 rounded ${systemState.stability.isStable ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-sm text-gray-600">稳定性</div>
          <div className={`text-lg font-semibold ${systemState.stability.isStable ? 'text-green-600' : 'text-red-600'}`}>
            {systemState.stability.isStable ? '稳定' : '不稳定'}
          </div>
        </div>
      </div>

      {/* 力矩分析 */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3 text-gray-800">力矩分析</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-sm text-gray-600">流体力矩</div>
            <div className="text-lg font-semibold text-purple-600">
              {systemState.flowMoment.toFixed(1)} N·m
            </div>
          </div>
          
          <div className="bg-indigo-50 p-3 rounded">
            <div className="text-sm text-gray-600">系泊恢复力矩</div>
            <div className="text-lg font-semibold text-indigo-600">
              {systemState.mooringMoment.toFixed(1)} N·m
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">阻尼力矩</div>
            <div className="text-lg font-semibold text-gray-600">
              {systemState.dampingMoment.toFixed(1)} N·m
            </div>
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex gap-4">
        <button
          onClick={onReset}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          重置模拟
        </button>
        
        <button
          onClick={() => {
            physics.setAngleDegrees(45);
            physics.setAngularVelocity(0);
          }}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          扰动测试
        </button>
      </div>

      {/* 理论说明 */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="text-md font-semibold mb-2 text-gray-800">理论基础</h4>
        <p className="text-sm text-gray-600 mb-2">
          基于王振东教授的椭圆柱绕流理论：M(α) = (1/2)πρ(a² - b²)v² sin(2α)
        </p>
        <p className="text-sm text-gray-600 mb-2">
          结合Faltinsen的海洋工程系泊理论和余勇飞等人的数值研究成果
        </p>
        <p className="text-sm text-gray-600">
          模拟展现了"野渡无人舟自横"现象 - 船舶在水流中的自发横向稳定行为
        </p>
      </div>
    </div>
  );
}

// 主组件
export default function BoatMooringSimulation() {
  const [physics] = useState(() => createStandardBoatMooring(0.3, 10));

  const resetSimulation = useCallback(() => {
    physics.setAngle(0);
    physics.setAngularVelocity(0);
    physics.setPosition([0, 0, 0]);
  }, [physics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-cyan-100">
      {/* 标题 */}
      <div className="pt-8 pb-6 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          野渡无人舟自横现象模拟
        </h1>
        <p className="text-lg text-gray-600">
          基于流体力学理论的系泊系统物理建模
        </p>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 3D可视化 */}
          <div className="xl:col-span-2">
            <div className="bg-black rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <Canvas camera={{ position: [15, 10, 15], fov: 60 }}>
                <Scene physics={physics} />
                <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
              </Canvas>
            </div>
          </div>

          {/* 控制面板 */}
          <div className="xl:col-span-1">
            <ControlPanel physics={physics} onReset={resetSimulation} />
          </div>
        </div>

        {/* 底部说明 */}
        <div className="mt-8 pb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-800">模拟说明</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-2 text-gray-700">物理模型特点</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 基于椭圆柱绕流的复变函数理论</li>
                  <li>• 包含雷诺数和长宽比修正</li>
                  <li>• 悬链线系泊绳模型</li>
                  <li>• 4阶Runge-Kutta数值积分</li>
                  <li>• 线性稳定性分析</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2 text-gray-700">操作指南</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 调节水流速度观察自横现象</li>
                  <li>• 改变系泊刚度测试稳定性</li>
                  <li>• 设置初始角度模拟扰动</li>
                  <li>• 鼠标拖拽旋转查看3D场景</li>
                  <li>• 观察绳索颜色变化（张力）</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 