import React, { useContext, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import Sidebar from './components/common/Sidebar';
import PomodoroWidget from './components/common/PomodoroWidget';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { SkeletonCard, SkeletonChart } from './components/common/Skeleton';

// Static load lightweight pages for instant navigation
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import Learn from './pages/Learn';
import Quiz from './pages/Quiz';
import Communication from './pages/Communication';
import Interview from './pages/Interview';
import MyProject from './pages/MyProject';
import Resources from './pages/Resources';
import Notes from './pages/Notes';

// Lazy load heavy components to improve initial paint performance
const CodeLab = lazy(() => import('./pages/CodeLab'));
const Progress = lazy(() => import('./pages/Progress'));

// Shared Page Transition Wrapper
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ 
      duration: 0.3, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    }}
    style={{ willChange: 'transform, opacity' }}
  >
    {children}
  </motion.div>
);

// Onboarding route interceptor and layouts
const MainLayout = ({ children }) => {
  const { onboarded, loading, sidebarCollapsed } = useContext(AppContext);
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
      
      <main className={`flex-1 min-w-0 transition-all duration-300 ${!isAssessmentPage ? (sidebarCollapsed ? 'md:pl-20' : 'md:pl-64') + ' pb-20 md:pb-6' : ''}`}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <PomodoroWidget />
    </div>
  );
};

// Animated Router containing Page Wrapper definitions
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/assessment" element={<PageWrapper><Assessment /></PageWrapper>} />
        <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/learn" element={<PageWrapper><Learn /></PageWrapper>} />
        <Route path="/quiz" element={<PageWrapper><Quiz /></PageWrapper>} />
        <Route 
          path="/code" 
          element={
            <Suspense fallback={<PageWrapper><SkeletonCard className="h-96" /></PageWrapper>}>
              <PageWrapper><CodeLab /></PageWrapper>
            </Suspense>
          } 
        />
        <Route path="/communication" element={<PageWrapper><Communication /></PageWrapper>} />
        <Route path="/interview" element={<PageWrapper><Interview /></PageWrapper>} />
        <Route path="/myproject" element={<PageWrapper><MyProject /></PageWrapper>} />
        <Route 
          path="/progress" 
          element={
            <Suspense fallback={<PageWrapper><SkeletonChart className="h-96" /></PageWrapper>}>
              <PageWrapper><Progress /></PageWrapper>
            </Suspense>
          } 
        />
        <Route path="/resources" element={<PageWrapper><Resources /></PageWrapper>} />
        <Route path="/notes" element={<PageWrapper><Notes /></PageWrapper>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
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
          <AnimatedRoutes />
        </MainLayout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
