import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider.tsx';
import { AuthErrorBoundary } from './components/auth/AuthErrorBoundary.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { Toaster } from './components/ui/Toaster.tsx';
import LoginPage from './pages/LoginPage.tsx';
import SignupPage from './pages/SignupPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import IssuesPage from './pages/IssuesPage.tsx';
import IssueDetailPage from './pages/IssueDetailPage.tsx';

function App(): React.JSX.Element {
  return (
    <AuthErrorBoundary>
      <AuthProvider>
        <Router>
          <div className='min-h-screen'>
            <Routes>
              {/* Public routes */}
              <Route path='/login' element={<LoginPage />} />
              <Route path='/signup' element={<SignupPage />} />

              {/* Protected routes */}
              <Route
                path='/dashboard'
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path='/issues'
                element={
                  <ProtectedRoute>
                    <IssuesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path='/issues/:id'
                element={
                  <ProtectedRoute>
                    <IssueDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path='/' element={<Navigate to='/dashboard' replace />} />

              {/* Catch all - redirect to dashboard */}
              <Route path='*' element={<Navigate to='/dashboard' replace />} />
            </Routes>
          </div>
          <Toaster />
        </Router>
      </AuthProvider>
    </AuthErrorBoundary>
  );
}

export default App;
