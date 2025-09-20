import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FluidSimulation from '../components/3D/FluidSimulation';

const SimulationPage: React.FC = () => {
  const [simulationType, setSimulationType] = useState<string>('cylinder');
  const [reynoldsNumber, setReynoldsNumber] = useState<number>(100);
  const [viscosity, setViscosity] = useState<number>(0.01);
  const [density, setDensity] = useState<number>(1.0);
  const [flowSpeed, setFlowSpeed] = useState<number>(1.0);
  const [obstacleSize, setObstacleSize] = useState<number>(1.0);
  const [visualizationType, setVisualizationType] = useState<string>('velocity');

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-blue-900 to-dark">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-display">
            流体动力学<span className="text-blue-400">仿真实验</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            基于Navier-Stokes方程的实时流体模拟，探索流体在不同条件下的运动规律
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 控制面板 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="glass-panel p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">仿真参数</h2>
              
              {/* 仿真类型 */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  仿真类型
                </label>
                <select
                  value={simulationType}
                  onChange={(e) => setSimulationType(e.target.value)}
                  className="w-full px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cylinder">圆柱绕流</option>
                  <option value="karman">卡门涡街</option>
                  <option value="tunnel">风洞流动</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              {/* 雷诺数 */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  雷诺数: {reynoldsNumber}
                </label>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  value={reynoldsNumber}
                  onChange={(e) => setReynoldsNumber(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* 粘性系数 */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  粘性系数: {viscosity.toFixed(3)}
                </label>
                <input
                  type="range"
                  min="0.001"
                  max="0.1"
                  step="0.001"
                  value={viscosity}
                  onChange={(e) => setViscosity(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* 流体密度 */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  流体密度: {density.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={density}
                  onChange={(e) => setDensity(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* 流速 */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  流速: {flowSpeed.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={flowSpeed}
                  onChange={(e) => setFlowSpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* 障碍物尺寸 */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  障碍物尺寸: {obstacleSize.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={obstacleSize}
                  onChange={(e) => setObstacleSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* 可视化类型 */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  可视化类型
                </label>
                <select
                  value={visualizationType}
                  onChange={(e) => setVisualizationType(e.target.value)}
                  className="w-full px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="velocity">速度场</option>
                  <option value="pressure">压力场</option>
                  <option value="vorticity">涡量场</option>
                  <option value="streamlines">流线</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* 仿真视图 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-3"
          >
            <div className="glass-panel h-[600px] overflow-hidden">
              <FluidSimulation
                className="w-full h-full"
                reynoldsNumber={reynoldsNumber}
                viscosity={viscosity}
                density={density}
                flowSpeed={flowSpeed}
                obstacleSize={obstacleSize}
                simulationType={simulationType}
                visualizationType={visualizationType}
                viewType="free"
                enableDataProbe={true}
              />
            </div>
          </motion.div>
        </div>

        {/* 说明信息 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8"
        >
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-white mb-3">实验说明</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-100">
              <div>
                <h4 className="font-medium text-blue-200 mb-2">雷诺数 (Re)</h4>
                <p className="text-sm">
                  表示流体惯性力与粘性力的比值。低雷诺数时流动为层流，高雷诺数时转为湍流。
                </p>
              </div>
              <div>
                <h4 className="font-medium text-blue-200 mb-2">可视化选项</h4>
                <p className="text-sm">
                  速度场显示流体运动，压力场显示压强分布，涡量场显示流体旋转，流线显示流体路径。
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SimulationPage; 