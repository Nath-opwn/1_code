import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LabPage from './pages/LabPage';
import SimulationPage from './pages/SimulationPage';
import AnalysisPage from './pages/AnalysisPage';
import KnowledgePage from './pages/KnowledgePage';
import ExamplesPage from './pages/ExamplesPage';
import ErrorBoundary from './components/ErrorBoundary';

// 实验页面导入
import BernoulliExperiment from './pages/BernoulliExperiment';
import ReynoldsExperiment from './pages/ReynoldsExperiment';
import DragExperiment from './pages/DragExperiment';
import VenturiExperiment from './pages/VenturiExperiment';
import PitotTubeExperiment from './pages/PitotTubeExperiment';
import BoundaryLayerExperiment from './pages/BoundaryLayerExperiment';
import ShockWaveExperiment from './pages/ShockWaveExperiment';
import KarmanVortexExperiment from './pages/KarmanVortexExperiment';
import BoatDriftingExperiment from './pages/BoatDriftingExperiment';
import AncientHydraulicsExperiment from './pages/AncientHydraulicsExperiment';

import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <NavBar />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/lab" element={<LabPage />} />
              <Route path="/simulation" element={<SimulationPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/examples" element={<ExamplesPage />} />
              
              {/* 实验路由 */}
              <Route path="/experiments/bernoulli" element={<BernoulliExperiment />} />
              <Route path="/experiments/reynolds" element={<ReynoldsExperiment />} />
              <Route path="/experiments/drag" element={<DragExperiment />} />
              <Route path="/experiments/venturi" element={<VenturiExperiment />} />
              <Route path="/experiments/pitot" element={<PitotTubeExperiment />} />
              <Route path="/experiments/boundary" element={<BoundaryLayerExperiment />} />
              <Route path="/experiments/shock" element={<ShockWaveExperiment />} />
              <Route path="/experiments/karman-vortex" element={<KarmanVortexExperiment />} />
              <Route path="/experiments/boat" element={<BoatDriftingExperiment />} />
              <Route path="/experiments/ancient" element={<AncientHydraulicsExperiment />} />
            </Routes>
          </Layout>
    </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 