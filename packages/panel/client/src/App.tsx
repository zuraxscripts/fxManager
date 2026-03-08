import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Console from './pages/Console';
import Players from './pages/Players';
import Bans from './pages/Bans';
import Settings from './pages/Settings';
import { usePanelWS } from './hooks/usePanelWS';

export default function App() {
  const ws = usePanelWS();

  return (
    <Layout serverState={ws.serverState} connected={ws.connected}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard serverState={ws.serverState} />} />
        <Route
          path="/console"
          element={<Console logs={ws.consoleLogs} sendCommand={ws.sendCommand} />}
        />
        <Route path="/players" element={<Players />} />
        <Route path="/bans" element={<Bans />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
