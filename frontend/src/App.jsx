import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GraphPage from './pages/GraphPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ChatWidget from './components/ChatWidget';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      {isAuthenticated && <Sidebar />}
      <div className="flex-1 overflow-auto relative">
        <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/graph"
          element={<ProtectedRoute><GraphPage /></ProtectedRoute>}
        />
        <Route
          path="/analytics"
          element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ChatWidget />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
