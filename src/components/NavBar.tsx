import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NavBar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="bg-blue-900/30 backdrop-blur-sm py-4 px-6 fixed top-0 left-0 right-0 z-50 border-b border-blue-900/20">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold font-display text-white tracking-tight">
          流动<span className="text-blue-400 italic">之美</span>
        </Link>
        
        <nav className="hidden md:block">
          <ul className="flex space-x-8">
            <li>
              <Link to="/simulation" className="text-blue-100 hover:text-white transition-all text-sm uppercase tracking-widest">
                仿真实验
              </Link>
            </li>
            <li>
              <Link to="/knowledge" className="text-blue-100 hover:text-white transition-all text-sm uppercase tracking-widest">
                知识库
              </Link>
            </li>
            <li>
              <Link to="/analysis" className="text-blue-100 hover:text-white transition-all text-sm uppercase tracking-widest">
                数据分析
              </Link>
            </li>
            <li>
              <Link to="/examples" className="text-blue-100 hover:text-white transition-all text-sm uppercase tracking-widest">
                案例展示
              </Link>
            </li>
            <li>
              <Link to="/lab" className="text-blue-100 hover:text-white transition-all text-sm uppercase tracking-widest">
                实验室
              </Link>
            </li>
            <li>
              <Link to="/experiments/karman-vortex" className="text-blue-100 hover:text-white transition-all text-sm uppercase tracking-widest bg-blue-500/20 px-3 py-1 rounded-md">
                卡门涡街
              </Link>
            </li>
            <li>
              <Link to="/experiments/boat" className="text-blue-100 hover:text-white transition-all text-sm uppercase tracking-widest bg-amber-500/20 px-3 py-1 rounded-md">
                传统文化
              </Link>
            </li>
          </ul>
        </nav>
        
        <button 
          className="md:hidden text-white z-50 relative"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className={`w-full h-0.5 bg-white transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-full h-0.5 bg-white transition-all ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`w-full h-0.5 bg-white transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </div>
        </button>
        
        {/* 移动端菜单 */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="fixed inset-0 bg-dark/95 backdrop-blur-md z-40 flex items-center justify-center md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.ul className="flex flex-col items-center space-y-8 text-2xl">
                <motion.li 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link to="/simulation" className="text-blue-100" onClick={() => setIsMenuOpen(false)}>仿真实验</Link>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link to="/knowledge" className="text-blue-100" onClick={() => setIsMenuOpen(false)}>知识库</Link>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link to="/analysis" className="text-blue-100" onClick={() => setIsMenuOpen(false)}>数据分析</Link>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link to="/examples" className="text-blue-100" onClick={() => setIsMenuOpen(false)}>案例展示</Link>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Link to="/lab" className="text-blue-100" onClick={() => setIsMenuOpen(false)}>实验室</Link>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Link to="/experiments/karman-vortex" className="text-blue-100 bg-blue-500/20 px-3 py-1 rounded-md" onClick={() => setIsMenuOpen(false)}>
                    卡门涡街实验
                  </Link>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Link to="/experiments/boat" className="text-blue-100 bg-amber-500/20 px-3 py-1 rounded-md" onClick={() => setIsMenuOpen(false)}>
                    野渡无人舟自横
                  </Link>
                </motion.li>
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default NavBar; 