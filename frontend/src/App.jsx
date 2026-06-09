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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-screen bg-background"
      >
        <div className="flex flex-col items-center space-y-6 max-w-xs w-full px-8">
          <div className="w-12 h-12 rounded-card bg-primary flex items-center justify-center font-bold text-white text-xl">CC</div>
          <div className="w-full space-y-3">
            <SkeletonCard className="h-6 rounded-full" />
            <SkeletonCard className="h-4 rounded-full w-3/4 mx-auto" />
          </div>
          <p className="text-text-secondary text-xs font-mono animate-pulse">Synchronizing CareerCraft AI Engine...</p>
        </div>
      </motion.div>
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
            duration: 3500,
            style: {
              background: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: '600',
              padding: '12px 16px',
              boxShadow: 'rgba(4,23,43,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.12) 0px 8px 24px -4px',
            },
            success: {
              iconTheme: { primary: '#2e7d32', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#c62828', secondary: '#fff' },
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
