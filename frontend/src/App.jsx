import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import Sidebar from './components/common/Sidebar';
import PomodoroWidget from './components/common/PomodoroWidget';
import { Toaster } from 'react-hot-toast';

// Lazy load pages
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import Learn from './pages/Learn';
import Quiz from './pages/Quiz';
import CodeLab from './pages/CodeLab';
import Communication from './pages/Communication';
import Interview from './pages/Interview';
import MyProject from './pages/MyProject';
import Progress from './pages/Progress';
import Resources from './pages/Resources';
import Notes from './pages/Notes';

// Onboarding route interceptor
const MainLayout = ({ children }) => {
  const { onboarded, loading } = useContext(AppContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-text-secondary text-sm">Synchronizing CareerCraft AI Engine...</p>
        </div>
      </div>
    );
  }

  // Force onboarding if they haven't done it and are not on the assessment page
  if (!onboarded && location.pathname !== '/assessment') {
    return <Navigate to="/assessment" replace />;
  }

  // Hide sidebar on the assessment flow to keep it immersive
  const isAssessmentPage = location.pathname === '/assessment';

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col md:flex-row">
      {!isAssessmentPage && <Sidebar />}
      
      <main className={`flex-1 min-w-0 transition-all duration-300 ${!isAssessmentPage ? 'md:pl-64 pb-20 md:pb-6' : ''}`}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <PomodoroWidget />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            },
          }}
        />
        <MainLayout>
          <Routes>
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/code" element={<CodeLab />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/myproject" element={<MyProject />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
