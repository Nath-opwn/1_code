import React from 'react';
import { motion } from 'framer-motion';

const AnalysisPage: React.FC = () => {
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
            数据<span className="text-blue-400">分析</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            深入分析流体仿真数据，探索流动规律
          </p>
        </motion.div>

        <div className="glass-panel p-8">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-6">分析工具</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-panel p-6">
              <h3 className="text-xl font-semibold text-cyan-300 mb-4">
                速度场分析
              </h3>
              <p className="text-blue-100">
                分析流体速度分布，识别流动模式和特征区域。
              </p>
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-xl font-semibold text-cyan-300 mb-4">
                压力场分析
              </h3>
              <p className="text-blue-100">
                研究压力分布，分析流体与固体边界的相互作用。
              </p>
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-xl font-semibold text-cyan-300 mb-4">
                涡量分析
              </h3>
              <p className="text-blue-100">
                检测和量化流体中的涡流结构，研究湍流特性。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage; 