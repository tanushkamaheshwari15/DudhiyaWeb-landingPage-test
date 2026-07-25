import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import BulkCollection from './components/BulkCollection';
import BulkCollectionV1 from './components/BulkCollectionV1';
import PreviewCollections from './components/PreviewCollections';
import PreviewRawCollections from './components/PreviewRawCollections';
import PreviewProRataCollections from './components/PreviewProRataCollections';
import AddRawCollection from './components/AddRawCollection';
import { isAuthenticated } from './services/tokenStorage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import ProRataCollection from './components/ProRataCollection';
import LandingPage from './components/LandingPage';
import { LanguageProvider } from './contexts/LanguageContext';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="App">
          <ToastContainer position="top-center" autoClose={8000} hideProgressBar={false} closeButton={true} closeOnClick={false} />
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bulk-collection"
              element={
                <ProtectedRoute>
                  <BulkCollection />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bulk-collection-v1"
              element={
                <ProtectedRoute>
                  <BulkCollectionV1 />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-raw-collection"
              element={
                <ProtectedRoute>
                  <AddRawCollection />
                </ProtectedRoute>
              }
            />

            <Route
              path="/preview-collections"
              element={
                <ProtectedRoute>
                  <PreviewCollections />
                </ProtectedRoute>
              }
            />

            <Route
              path="/preview-raw-collections"
              element={
                <ProtectedRoute>
                  <PreviewRawCollections />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pro-rata-collection"
              element={
                <ProtectedRoute>
                  <ProRataCollection />
                </ProtectedRoute>
              }
            />

            <Route
              path="/preview-pro-rata-collections"
              element={
                <ProtectedRoute>
                  <PreviewProRataCollections />
                </ProtectedRoute>
              }
            />

            {/* Public landing page at root - redirect to dashboard if authenticated */}
            <Route path="/" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
            <Route path="*" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/"} replace />} />
          </Routes>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
