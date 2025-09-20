import React from 'react';
import { motion } from 'framer-motion';

const ExamplesPage: React.FC = () => {
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
            案例<span className="text-blue-400">展示</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            流体力学在各个领域的应用实例
          </p>
        </motion.div>

        <div className="glass-panel p-8">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-6">经典案例</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h3 className="text-xl font-semibold text-cyan-300 mb-4">
                飞机机翼设计
              </h3>
              <p className="text-blue-100 mb-4">
                通过流体仿真优化翼型设计，提高升力并降低阻力。
              </p>
              <div className="bg-blue-900/30 p-4 rounded-lg">
                <p className="text-green-300 text-sm">
                  升力系数提升: 15%<br/>
                  阻力减少: 8%<br/>
                  燃油效率提升: 12%
                </p>
              </div>
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-xl font-semibold text-cyan-300 mb-4">
                汽车空气动力学
              </h3>
              <p className="text-blue-100 mb-4">
                分析车身周围气流，减少风阻，提高燃油经济性。
              </p>
              <div className="bg-blue-900/30 p-4 rounded-lg">
                <p className="text-green-300 text-sm">
                  阻力系数: 0.24<br/>
                  风噪降低: 20%<br/>
                  燃油节省: 6%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamplesPage; 