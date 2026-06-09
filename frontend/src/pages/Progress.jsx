import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AppContext } from '../context/AppContext';
import { Radar, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, RadialLinearScale, PointElement, 
  LineElement, CategoryScale, LinearScale, Tooltip, Legend, Filler 
} from 'chart.js';
import { 
  BarChart3, Calendar, Award, Sparkles, 
  Grid, Compass, TrendingUp, CheckCircle, AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeIn, fadeUp } from '../utils/animations';
import { SkeletonCard, SkeletonChart, SkeletonText } from '../components/common/Skeleton';

ChartJS.register(
  RadialLinearScale, PointElement, LineElement, 
  CategoryScale, LinearScale, Tooltip, Legend, Filler
);

// Typewriter hook – reveals text character by character
const useTypewriter = (text, speed = 15, enabled = true) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayed(text || '');
      setDone(true);
      return;
    }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, enabled]);

  return { displayed, done };
};

const Progress = () => {
  const { darkMode } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flaws, setFlaws] = useState([]);

  // Selected subtopic info modal
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);

  // Typewriter for weekly report (only runs when data loads)
  const { displayed: typedReport } = useTypewriter(data?.weekly_report || '', 12, !!data);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/progress/analytics');
      setData(res.data);
      try {
        const flawsRes = await api.get('/progress/flaws');
        setFlaws(flawsRes.data.flaws || []);
      } catch (err) {
        console.warn("Failed to load flaws list.");
      }
    } catch (err) {
      toast.error("Failed to load progress analytics.");
    } finally {
      setLoading(false);
    }
  };

  const handleFixFlaw = async (flawId) => {
    try {
      const res = await api.post('/progress/flaws/fix', { flaw_id: flawId });
      if (res.data.success) {
        toast.success(res.data.message);
        const resAnalytics = await api.get('/progress/analytics');
        setData(resAnalytics.data);
        const flawsRes = await api.get('/progress/flaws');
        setFlaws(flawsRes.data.flaws || []);
      }
    } catch (err) {
      toast.error("Failed to resolve flaw.");
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6 pb-12">
        <SkeletonCard className="h-20" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonCard className="h-36" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonCard className="h-64" />
          </div>
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // CONSISTENCY CONTRIBUTION MAP (BLUE ACTIVE)
  // ----------------------------------------
  const renderGithubCalendar = () => {
    const calendarDays = [];
    const today = new Date();
    
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364);
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const contributionDates = new Set(data.streak_calendar || []);

    for (let w = 0; w < 53; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (w * 7) + d);
        
        const dateStr = currentDate.toISOString().split('T')[0];
        const isFuture = currentDate > today;
        const contributed = contributionDates.has(dateStr);

        week.push({
          date: dateStr,
          contributed,
          isFuture
        });
      }
      calendarDays.push(week);
    }

    return (
      <div className="flex space-x-1.5 overflow-x-auto pb-4 pr-4 border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-background p-4 rounded-card max-w-full">
        {calendarDays.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col space-y-1">
            {week.map((day, dIdx) => (
              <motion.div
                key={dIdx}
                initial={day.contributed ? { scale: 0, opacity: 0 } : false}
                animate={day.contributed ? { scale: 1, opacity: 1 } : false}
                transition={{ delay: (wIdx * 7 + dIdx) * 0.0015, duration: 0.25, type: 'spring' }}
                className={`w-[10px] h-[10px] rounded-[2px] transition-colors ${
                  day.isFuture 
                    ? 'bg-transparent' 
                    : day.contributed 
                      ? 'bg-primary border border-primary/30 shadow shadow-primary/35' 
                      : 'bg-black/10 dark:bg-white/[0.03] border border-black/[0.01] dark:border-white/[0.01]'
                }`}
                title={day.isFuture ? '' : `${day.date}: ${day.contributed ? 'Studied' : 'No activity'}`}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Chart grid & font options based on theme toggle
  const gridColor = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const labelColor = darkMode ? '#a0a0b0' : '#777b86';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6 pb-12"
    >
      
      {/* 1. Top row header */}
      <motion.div
        variants={fadeUp}
        className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card"
      >
        <div className="flex items-center space-x-3">
          <BarChart3 className="text-primary" />
          <h1 className="text-lg font-serif font-bold text-text-primary">Performance Analytics Dashboard</h1>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-primary/10 py-1.5 px-4 rounded-badge border border-primary/20 text-xs font-bold text-primary font-mono text-center"
        >
          Placement Readiness Indicator: {data.readiness_score}%
        </motion.div>
      </motion.div>

      {/* 2. Charts Grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Radar subject mastery */}
        <div className="bg-skyWash border border-blue-500/10 dark:bg-background-card dark:border-white/5 p-6 rounded-card space-y-4 flex flex-col items-center shadow-card">
          <h3 className="font-serif font-bold text-sm text-text-primary self-start flex items-center">
            <Compass size={16} className="mr-2 text-primary" />
            <span>Subject Mastery Radar Index</span>
          </h3>
          
          <div className="w-full max-w-[280px]">
            <Radar 
              data={{
                labels: Object.keys(data.radar),
                datasets: [{
                  label: 'Baseline Mastery (1-10)',
                  data: Object.values(data.radar),
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  borderColor: '#3b82f6',
                  borderWidth: 2,
                  pointBackgroundColor: '#3b82f6',
                  pointBorderColor: '#fff',
                }]
              }}
              options={{
                scales: {
                  r: {
                    angleLines: { color: gridColor },
                    grid: { color: gridColor },
                    pointLabels: { color: labelColor, font: { size: 10, weight: 'bold' } },
                    ticks: { display: false, stepSize: 2 },
                    min: 0,
                    max: 10
                  }
                },
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>

        {/* Readiness line progression */}
        <div className="bg-skyWash border border-blue-500/10 dark:bg-background-card dark:border-white/5 p-6 rounded-card space-y-4 shadow-card">
          <h3 className="font-serif font-bold text-sm text-text-primary flex items-center">
            <TrendingUp size={16} className="mr-2 text-secondary" />
            <span>30-Day Readiness Score progression</span>
          </h3>

          <div className="h-[250px] w-full">
            <Line 
              data={{
                labels: data.trend.map(row => row.date.split('-').slice(1).join('/')),
                datasets: [{
                  label: 'Readiness %',
                  data: data.trend.map(row => row.overall_score),
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  tension: 0.3,
                  fill: true,
                  borderWidth: 2
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    grid: { color: gridColor },
                    ticks: { color: labelColor, font: { size: 10 } },
                    min: 0,
                    max: 100
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: labelColor, font: { size: 10 } }
                  }
                },
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>

      </motion.div>

      {/* 3. Consistency map */}
      <motion.div
        variants={fadeUp}
        className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card space-y-4 shadow-card"
      >
        <h3 className="font-serif font-bold text-sm text-text-primary flex items-center">
          <Calendar size={16} className="mr-2 text-primary" />
          <span>Preparation Consistency Contribution Map</span>
        </h3>
        
        {renderGithubCalendar()}
        
        <div className="flex items-center justify-between text-[10px] text-text-secondary font-medium">
          <span>* Study contribution counts increment upon passes in lesson quizzes or mock evaluations.</span>
          <div className="flex items-center space-x-1 font-bold">
            <span>Less</span>
            <div className="w-[10px] h-[10px] bg-black/5 dark:bg-white/5 rounded-[2px] border border-black/[0.01] dark:border-white/[0.01]"></div>
            <div className="w-[10px] h-[10px] bg-primary rounded-[2px] border border-primary/30"></div>
            <span>More</span>
          </div>
        </div>
      </motion.div>

      {/* 4. Mastery map & AI Weekly Report */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Mastery Map Grid with staggered tile reveals */}
        <div className="lg:col-span-2 bg-skyWash border border-blue-500/10 dark:bg-background-card dark:border-white/5 p-6 rounded-card space-y-4 shadow-card">
          <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2">
            <h3 className="font-serif font-bold text-sm text-text-primary flex items-center">
              <Grid size={16} className="mr-2 text-secondary" />
              <span>Syllabus Mastery Grid map</span>
            </h3>
            <span className="text-[10px] text-text-secondary font-mono font-bold">Syllabus Complete: {data.completion_rate}%</span>
          </div>
          
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 overflow-y-auto max-h-[200px] pr-2">
            {data.mastery_map && data.mastery_map.map((topic, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.025, duration: 0.3, type: 'spring', stiffness: 200 }}
                onClick={() => setSelectedSubtopic(topic)}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                className={`aspect-square rounded-card flex items-center justify-center font-bold text-xs cursor-pointer border shadow-sm ${
                  topic.mastery_level === 5 ? 'bg-apricotWash border-rust/35 text-rust' :
                  topic.completion_percentage >= 85 ? 'bg-success-bg border-success text-success' :
                  topic.completion_percentage >= 60 ? 'bg-warning-bg border-warning text-warning' :
                  topic.completion_percentage > 0 ? 'bg-danger-bg border-danger text-danger' :
                  'bg-white dark:bg-background border-black/5 dark:border-white/5 text-text-secondary'
                }`}
                title={`${topic.subtopic_name}: ${topic.completion_percentage}% complete`}
              >
                {topic.subtopic_name.substring(0, 2)}
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Weekly Status Report – typewriter reveal */}
        <div className="bg-apricotWash border border-rust/10 dark:bg-background-card dark:border-white/5 p-6 rounded-card flex flex-col justify-between shadow-card text-rust dark:text-text-primary">
          <div>
            <h3 className="font-serif font-bold text-sm text-rust dark:text-text-primary flex items-center mb-4 border-b border-rust/15 dark:border-white/5 pb-2">
              <Sparkles size={16} className="mr-2 text-rust dark:text-primary animate-pulse" />
              <span>AI Weekly Status Report</span>
            </h3>
            
            <p className="text-xs italic leading-relaxed font-serif font-medium min-h-[80px]">
              "{typedReport}"
              {typedReport.length < (data.weekly_report?.length || 0) && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-0.5 h-3 bg-rust dark:bg-primary ml-0.5 align-middle"
                />
              )}
            </p>
          </div>

          <div className="mt-6 pt-3 border-t border-rust/15 dark:border-white/5 flex items-center justify-between text-xs font-bold font-sans">
            <span>Interview Readiness target:</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="font-mono"
            >
              {data.estimated_days_to_ready} Days
            </motion.span>
          </div>
        </div>

      </motion.div>

      {/* 5. Personal Flaw Detector */}
      <motion.div
        variants={fadeUp}
        className="bg-white dark:bg-background-card border border-rust/20 dark:border-white/5 p-6 rounded-card space-y-4 shadow-card"
      >
        <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2">
          <h3 className="font-serif font-bold text-sm text-text-primary flex items-center">
            <AlertTriangle size={16} className="mr-2 text-rust dark:text-danger animate-pulse" />
            <span>Personal Flaw Detector & Correction Monitor</span>
          </h3>
          <span className="text-[10px] text-text-secondary font-mono">Automatically flags conceptual technical & communication errors</span>
        </div>

        {flaws && flaws.filter(f => !f.is_fixed).length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {flaws.filter(f => !f.is_fixed).map((flaw, idx) => (
              <motion.div
                key={flaw.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.35 }}
                className="p-4 rounded-input bg-danger-bg border border-danger/35 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="space-y-1 text-danger">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-danger/10 border border-danger/25 font-mono">
                      {flaw.flaw_type}
                    </span>
                    {flaw.related_topic && (
                      <span className="text-[10px] font-bold">
                        Topic: {flaw.related_topic}
                      </span>
                    )}
                    <span className="text-[10px] opacity-75 font-medium">
                      Detected: {flaw.first_detected_date} | Freq: {flaw.frequency_count}
                    </span>
                  </div>
                  <p className="text-xs font-bold mt-1 leading-relaxed">{flaw.flaw_description}</p>
                </div>
                
                {/* Secondary Action: Plain text link */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleFixFlaw(flaw.id)}
                  className="text-xs font-bold text-success hover:underline bg-transparent border-0 cursor-pointer block"
                >
                  Resolve Flaw (+80 XP) &rarr;
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-6 text-text-secondary text-xs">
            🎉 No active flaws detected! Keep up the good work in coding quizzes and mock interviews.
          </div>
        )}
      </motion.div>

      {/* Selected subtopic detail overlay modal */}
      <AnimatePresence>
        {selectedSubtopic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedSubtopic(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card max-w-sm w-full text-xs space-y-4 relative shadow-card text-text-primary"
            >
              <h4 className="font-serif font-bold text-sm pb-2 border-b border-black/5 dark:border-white/5">{selectedSubtopic.subtopic_name}</h4>
              <div className="space-y-2 text-text-secondary font-medium">
                <p>Main Syllabus Group: <span className="text-text-primary font-bold">{selectedSubtopic.topic_name}</span></p>
                <p>Completion: <span className="text-text-primary font-mono">{selectedSubtopic.completion_percentage}%</span></p>
                <p>Prep Mastery rank: <span className="text-text-primary font-mono">{selectedSubtopic.mastery_level}/5</span></p>
              </div>
              
              {/* Primary CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedSubtopic(null)}
                className="w-full py-2 bg-primary text-white rounded-button font-bold"
              >
                Close Detail Panel
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Progress;
