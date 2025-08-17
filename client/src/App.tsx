import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Layout Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import MediaLibrary from './pages/Media/MediaLibrary';
import MediaUpload from './pages/Media/MediaUpload';
import MediaPlayer from './pages/Media/MediaPlayer';
import Playlists from './pages/Playlists/Playlists';
import PlaylistDetail from './pages/Playlists/PlaylistDetail';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';
import Search from './pages/Search/Search';
import NotFound from './pages/NotFound';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <div className="min-h-screen bg-dark-900 text-white">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/media/:id" element={<MediaPlayer />} />
                  <Route path="/search" element={<Search />} />
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/library" element={
                    <ProtectedRoute>
                      <Layout>
                        <MediaLibrary />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/upload" element={
                    <ProtectedRoute>
                      <Layout>
                        <MediaUpload />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/playlists" element={
                    <ProtectedRoute>
                      <Layout>
                        <Playlists />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/playlists/:id" element={
                    <ProtectedRoute>
                      <Layout>
                        <PlaylistDetail />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Layout>
                        <Settings />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                
                {/* Global Toaster */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#1e293b',
                      color: '#fff',
                      border: '1px solid #475569',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
