import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Login } from './components/Login';
import { Dashboard } from './pages/Dashboard';
import { VideoList } from './pages/VideoList';
import VideoDetails from './pages/VideoDetails';
import ClipStudio from './pages/ClipStudio';
import Header from './components/Header';
import { useAuth } from './hooks/useAuth';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-dark-bg)' }}>
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/videos"
            element={
              <ProtectedRoute>
                <VideoList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/videos/:id"
            element={
              <ProtectedRoute>
                <VideoDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clip-studio/:id"
            element={
              <ProtectedRoute>
                <ClipStudio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clips"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
};

export default App;
