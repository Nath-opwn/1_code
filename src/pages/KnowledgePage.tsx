import React, { useState } from 'react';
import { motion } from 'framer-motion';

const KnowledgePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-blue-900 to-dark">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-display">
            流体力学<span className="text-blue-400">知识库</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            探索流体力学的奥秘，从基础理论到工程应用
          </p>
        </motion.div>

        <div className="glass-panel p-8">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-6">基础理论</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-panel p-6">
              <h3 className="text-xl font-semibold text-cyan-300 mb-4">
                Navier-Stokes方程
              </h3>
              <p className="text-blue-100 mb-4">
                描述粘性流体运动的基本方程组，是流体力学的核心理论基础。
              </p>
              <div className="bg-blue-900/30 p-4 rounded-lg">
                <code className="text-green-300 text-sm">
                  ∂u/∂t + (u·∇)u = -∇p/ρ + ν∇²u + f
                </code>
              </div>
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-xl font-semibold text-cyan-300 mb-4">
                雷诺数
              </h3>
              <p className="text-blue-100 mb-4">
                表征流体惯性力与粘性力相对大小的无量纲数。
              </p>
              <div className="bg-blue-900/30 p-4 rounded-lg">
                <code className="text-green-300 text-sm">
                  Re = ρVL/μ = VL/ν
                </code>
              </div>
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-xl font-semibold text-cyan-300 mb-4">
                伯努利方程
              </h3>
              <p className="text-blue-100 mb-4">
                描述理想流体在稳定流动中能量守恒的基本方程。
              </p>
              <div className="bg-blue-900/30 p-4 rounded-lg">
                <code className="text-green-300 text-sm">
                  p + ½ρv² + ρgh = constant
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgePage; 