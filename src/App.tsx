import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import SimulationList from './pages/SimulationList';
import SimulationDetail from './pages/SimulationDetail';
import NewSimulation from './pages/NewSimulation';
import Monitoring from './pages/Monitoring';
import Approvals from './pages/Approvals';
import Exports from './pages/Exports';
import Analytics from './pages/Analytics';
import Recommendations from './pages/Recommendations';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/simulations" element={<SimulationList />} />
          <Route path="/simulations/:id" element={<SimulationDetail />} />
          <Route path="/simulations/new" element={<NewSimulation />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/exports" element={<Exports />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
