/**
 * 流体求解器主模块导出
 */

// 导出主模块类和配置
export {
  FluidSimulator,
  FluidSimulationConfig,
  createDefaultConfig,
  createFluidSimulator
} from '../../components/3D/FluidSolverMain';

// 导出基础数据结构
export {
  FluidField,
  BoundaryType,
  BoundaryConditions,
  createFluidField,
  createDefaultBoundaryConditions,
  addCircularObstacle,
  addRectangularObstacle,
  initializeFluidField
} from '../../components/3D/FluidSolver';

// 导出求解器功能模块
export { diffuse, advect } from '../../components/3D/FluidSolverDynamics';
export { project } from '../../components/3D/FluidSolverPressure';
export { applyAllBoundaryConditions, applyExternalForces } from '../../components/3D/FluidSolverBoundary';

// 导出可视化功能
export {
  FluidVisualizationData,
  generateVisualizationData,
  generateStreamline,
  getProbeData
} from '../../components/3D/FluidSolverVisual'; 