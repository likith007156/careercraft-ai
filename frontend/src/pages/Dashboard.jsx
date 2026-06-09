import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Award, Briefcase, Calendar, AlertTriangle, 
  CheckCircle, Play, ChevronRight, RefreshCw, Quote 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Custom CountUp Hook
const useCountUp = (end, duration = 1000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    if (!end || end === 0) {
      setCount(0);
      return;
    }
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return count;
};

// Animation variants
const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1
    }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  rest: { 
    y: 0,
    scale: 1,
    boxShadow: 'rgba(4,23,43,0.05) 0px 0px 0px 1px, rgba(0,0,0,0.1) 0px 4px 6px -2px'
  },
  hover: { 
    y: -4,
    scale: 1.005,
    boxShadow: 'rgba(4,23,43,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.15) 0px 20px 25px -5px, rgba(0,0,0,0.1) 0px 8px 10px -6px',
    transition: { duration: 0.2, ease: 'easeOut' }
  }
};

const Dashboard = () => {
  const { user, updateCompanyFocus, rewardXp } = useContext(AppContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/dashboard');
      setDashboardData(res.data);
    } catch (err) {
      toast.error("Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Set up animation counters
  const readinessCount = useCountUp(dashboardData?.readiness_score || 0, 1200);
  const streakCount = useCountUp(dashboardData?.streak || 0, 1200);
  const masteredCount = useCountUp(dashboardData?.stats?.mastered_count || 0, 1000);
  const quizAvgCount = useCountUp(dashboardData?.stats?.quiz_average || 0, 1000);
  const streakDaysCount = useCountUp(dashboardData?.stats?.streak_days || 0, 1000);
  const totalXpCount = useCountUp(dashboardData?.stats?.total_xp || 0, 1000);

  const handleCompanyChange = async (e) => {
    const company = e.target.value;
    setRefreshing(true);
    await updateCompanyFocus(company);
    await fetchDashboard(true);
  };

  const handleCompleteTask = async (taskId, xp) => {
    try {
      const res = await api.post('/dashboard/tasks/complete', { task_id: taskId });
      if (res.data.success) {
        toast.success(res.data.message);
        rewardXp(xp);
        fetchDashboard(true);
      }
    } catch (err) {
      toast.error("Could not complete task.");
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-text-secondary">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mb-4"></div>
        <p className="text-xs font-mono">Formulating dashboard panels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 overflow-hidden">
      {/* Top Welcome Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center bg-background-card p-6 rounded-card border border-black/5 dark:border-white/5 relative overflow-hidden shadow-card"
      >
        <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-text-primary tracking-tight leading-tight">
            {dashboardData.greeting}
          </h1>
          <p className="text-text-secondary text-xs flex items-center mt-1 font-medium">
            <Calendar size={14} className="mr-1.5" />
            <span>{dashboardData.day}, {dashboardData.date}</span>
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-4 md:mt-0 z-10">
          <motion.div 
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="flex items-center bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 py-1.5 px-4 rounded-button space-x-2 text-xs"
          >
            <Briefcase size={16} className="text-secondary" />
            <select
              value={dashboardData.company_focus}
              onChange={handleCompanyChange}
              className="bg-transparent font-bold text-text-primary outline-none cursor-pointer"
            >
              {['Cognizant', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'Amazon', 'Google'].map(c => (
                <option key={c} value={c} className="bg-background text-text-primary">{c}</option>
              ))}
            </select>
            {refreshing && <RefreshCw size={14} className="animate-spin text-text-secondary" />}
          </motion.div>

          <div className="flex items-center space-x-1.5 bg-apricotWash/30 dark:bg-orange-500/10 border border-rust/10 dark:border-orange-500/20 py-1.5 px-4 rounded-badge text-rust dark:text-orange-400 font-bold text-xs" title="Daily study streak count!">
            <motion.span
              animate={{ scale: [1, 1.35, 1] }}
              transition={{ delay: 0.8, duration: 0.5, type: 'spring' }}
              className="inline-block"
            >
              <Flame size={16} className="fill-rust dark:fill-orange-400" />
            </motion.span>
            <span>{streakCount} Days</span>
          </div>
        </div>
      </motion.div>

      {/* Grid: Gauge / XP Level / Motivational Quote */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        
        {/* Readiness Circular Progress Gauge */}
        <motion.div 
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card flex flex-col items-center justify-center text-center shadow-card relative overflow-hidden"
        >
          <h3 className="text-text-secondary font-semibold text-sm mb-2">Interview Readiness</h3>
          
          <div className="relative flex items-center justify-center py-6 h-40 w-40 mt-2">
            {/* SVG Circle Gauge drawing on load */}
            <svg className="w-full h-full transform -rotate-90 absolute">
              <circle
                cx="80"
                cy="80"
                r="65"
                className="stroke-black/5 dark:stroke-white/5 fill-transparent"
                strokeWidth="6"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="65"
                className="stroke-primary fill-transparent"
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ strokeDashoffset: 408.4 }}
                animate={{ strokeDashoffset: 408.4 - (408.4 * dashboardData.readiness_score) / 100 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                style={{ strokeDasharray: 408.4, willChange: 'stroke-dashoffset' }}
              />
            </svg>
            <div className="flex flex-col items-center justify-center z-10">
              <span className="text-4xl font-bold font-serif text-text-primary tracking-tight">
                {readinessCount}%
              </span>
            </div>
          </div>
          
          <span className="text-[10px] text-text-secondary uppercase tracking-widest mt-4 font-semibold font-mono">
            Calculated Ready Quotient
          </span>
          <p className="text-xs text-text-secondary mt-2 max-w-[200px] leading-relaxed">
            Based on tech subjects, mock interviews, communication, and consistency.
          </p>
        </motion.div>

        {/* XP Level Bar Card */}
        <motion.div 
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card flex flex-col justify-between shadow-card"
        >
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] px-2.5 py-1 rounded-badge bg-primary/10 text-primary font-bold uppercase tracking-wider">
                Rank Progression
              </span>
              <Award size={20} className="text-gold animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            
            <h2 className="text-lg font-serif font-bold text-text-primary mt-3">Level {dashboardData.level} Preparation</h2>
            <p className="text-xs text-text-secondary mt-1">
              {dashboardData.level === 10 ? 'Job Ready! Master of IT selection tests.' : 'Beginner status. Grow XP to unlock higher levels.'}
            </p>
          </div>

          <div className="space-y-2 mt-6">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-text-secondary">Level Progress ({dashboardData.total_xp % 500} / 500 XP)</span>
              <span className="text-text-primary font-mono">{dashboardData.total_xp} Total XP</span>
            </div>
            <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-3 overflow-hidden border border-black/5 dark:border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(dashboardData.total_xp % 500) / 5}%` }}
                transition={{ duration: 1.0, ease: "easeOut", delay: 0.1 }}
                className="bg-primary h-full rounded-full"
                style={{ willChange: 'width' }}
              ></motion.div>
            </div>
            <p className="text-[10px] text-text-secondary text-right font-mono">
              {500 - (dashboardData.total_xp % 500)} XP to Next Level
            </p>
          </div>
        </motion.div>

        {/* Motivational Card */}
        <motion.div 
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card flex flex-col justify-between relative overflow-hidden shadow-card"
        >
          <div className="absolute right-3 top-3 opacity-[0.03] text-text-primary select-none pointer-events-none">
            <Quote size={80} />
          </div>
          <div>
            <span className="text-[10px] px-2.5 py-1 rounded-badge bg-secondary/10 text-secondary font-bold uppercase tracking-wider">
              AI Daily Motivation
            </span>
            <p className="italic text-text-primary font-serif font-medium text-sm leading-relaxed mt-5">
              "{dashboardData.motivational_quote}"
            </p>
          </div>
          <div className="text-xs text-text-secondary mt-6 flex items-center justify-end font-semibold">
            <span>— CareerCraft Mentor AI</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Row: Today's Schedule & Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Schedule */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card space-y-4 shadow-card"
        >
          <div className="flex justify-between items-center pb-2 border-b border-black/5 dark:border-white/5">
            <h2 className="text-lg font-serif font-bold text-text-primary flex items-center">
              <Calendar size={18} className="mr-2 text-primary" />
              <span>Today's Study Plan</span>
            </h2>
            <button
              onClick={() => navigate('/learn')}
              className="text-xs text-primary font-bold hover:underline flex items-center space-x-0.5 cursor-pointer bg-transparent border-none"
            >
              <span>View Full Syllabus</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {dashboardData.schedule && dashboardData.schedule.map((task, index) => (
              <motion.div 
                key={task.id} 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                className={`p-4 rounded-input border flex justify-between items-center transition-all ${
                  task.is_completed 
                    ? 'bg-success/5 border-success/20 opacity-75' 
                    : 'bg-black/[0.01] dark:bg-white/[0.01] border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10'
                }`}
              >
                <div className="space-y-1 mr-4">
                  <div className="flex items-center space-x-2">
                    {!task.is_completed && (
                      <motion.span
                        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="w-2 h-2 rounded-full bg-secondary shrink-0"
                        style={{ willChange: 'transform, opacity' }}
                      />
                    )}
                    <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded ${
                      task.task_type === 'STUDY' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' :
                      task.task_type === 'PRACTICE' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' :
                      'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                    }`}>
                      {task.task_type}
                    </span>
                    <span className="text-xs text-text-secondary font-semibold">{task.topic_name}</span>
                  </div>
                  <h4 className="text-sm font-bold text-text-primary leading-tight">{task.task_description}</h4>
                  <p className="text-[11px] text-text-secondary font-mono">{task.time_estimate_mins} Mins | +{task.xp_points} XP</p>
                </div>

                <div className="shrink-0">
                  {task.is_completed ? (
                    <span className="text-success flex items-center text-xs font-bold space-x-1">
                      <CheckCircle size={16} />
                      <span className="hidden sm:inline">Awarded</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCompleteTask(task.id, task.xp_points)}
                      className="text-xs font-bold text-primary hover:underline transition-colors bg-transparent border-0 py-1 px-2 cursor-pointer"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Primary CTA button (animated scale click) */}
            <motion.button 
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                const uncompleted = dashboardData.schedule?.find(t => !t.is_completed);
                if (uncompleted) {
                  navigate('/learn');
                } else {
                  toast.success("All daily tasks completed! Good job!");
                }
              }}
              className="w-full bg-primary hover:bg-primary/95 text-white py-3.5 rounded-button font-bold text-sm shadow-card flex items-center justify-center space-x-2 transition-transform cursor-pointer"
            >
              <Play size={16} className="fill-white" />
              <span>Start Today's Plan</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Top 3 Weak Areas */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card space-y-4 shadow-card"
        >
          <h2 className="text-lg font-serif font-bold text-text-primary flex items-center">
            <AlertTriangle size={18} className="mr-2 text-rust dark:text-danger animate-pulse" />
            <span>Critical Weak Areas</span>
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            These areas need immediate quiz practice to boost your readiness.
          </p>

          <div className="space-y-3 mt-4">
            {dashboardData.weak_areas && dashboardData.weak_areas.map((weak, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1, duration: 0.35, ease: 'easeOut' }}
                className="relative p-4 rounded-card bg-white dark:bg-background-card border border-black/5 dark:border-white/5 overflow-hidden flex flex-col justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer shadow-card"
                onClick={() => navigate(`/quiz?type=drill&subtopic=${encodeURIComponent(weak.subtopic_name)}`)}
              >
                {/* ScaleY left-border indicator on load */}
                <motion.div 
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.5 + idx * 0.1, duration: 0.4 }}
                  className="absolute left-0 top-0 bottom-0 w-1 bg-rust dark:bg-danger"
                  style={{ transformOrigin: 'top', willChange: 'transform' }}
                />

                <div className="pl-2">
                  <h4 className="text-[10px] text-rust dark:text-danger font-extrabold uppercase tracking-wider">{weak.topic_name}</h4>
                  <h3 className="text-sm font-bold text-text-primary mt-1">{weak.subtopic_name}</h3>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-black/5 dark:border-white/5 pl-2">
                  <span className="text-[10px] text-text-secondary font-semibold">Mastery Level: {weak.mastery_level}/5</span>
                  <span className="text-[10px] text-rust dark:text-danger font-bold hover:underline">Start Drill &rarr;</span>
                </div>
              </motion.div>
            ))}
            
            {(!dashboardData.weak_areas || dashboardData.weak_areas.length === 0) && (
              <div className="text-center py-6 text-text-secondary text-xs">
                🎉 No weak areas found yet! Keep up the good work.
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* Row: Quick Stats */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { title: 'Mastered This Week', val: masteredCount, desc: 'Topics above 85%', type: 'tech' },
          { title: 'Quiz Avg Score', val: `${quizAvgCount}%`, desc: 'Average of all history', type: 'tech' },
          { title: 'Streak Days', val: `${streakDaysCount} 🔥`, desc: 'Consecutive study logs', type: 'streak' },
          { title: 'Total XP Earned', val: totalXpCount, desc: 'Life time points', type: 'xp' }
        ].map((stat, idx) => {
          let bgClass = "bg-background-card border border-black/5 dark:border-white/5 text-text-primary";
          if (stat.type === 'streak') {
            bgClass = "bg-apricotWash text-rust dark:bg-apricotWash/10 dark:text-orange-400 border border-rust/10 dark:border-orange-500/20";
          } else if (stat.type === 'tech') {
            bgClass = "bg-skyWash text-primary-default dark:bg-skyWash/10 dark:text-blue-400 border border-blue-500/10 dark:border-blue-500/20";
          }
          
          return (
            <motion.div 
              key={idx} 
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className={`${bgClass} p-5 rounded-card shadow-card cursor-pointer`}
              style={{ willChange: 'transform, opacity' }}
            >
              <p className="text-xs font-semibold opacity-75">{stat.title}</p>
              <h3 className="text-2xl font-bold mt-2 font-mono">{stat.val}</h3>
              <p className="text-[10px] opacity-75 mt-1">{stat.desc}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Dashboard;
