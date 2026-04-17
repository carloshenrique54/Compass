import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './views/Dashboard';
import { MapView } from './views/MapView';
import { RoutesList } from './views/RoutesList';
import { Vehicles } from './views/Vehicles';
import { Operators } from './views/Operators';
import { Reports } from './views/Reports';
import { Stock } from './views/Stock';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/routes" element={<RoutesList />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/operators" element={<Operators />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Layout>
        <Toaster position="bottom-right" richColors />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
