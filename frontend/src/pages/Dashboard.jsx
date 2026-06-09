import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import api from '../utils/api';
import { 
  Flame, Award, Briefcase, Calendar, AlertTriangle, 
  CheckCircle, Play, ChevronRight, RefreshCw, Quote 
} from 'lucide-react';
import toast from 'react-hot-toast';

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
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-background-card p-6 rounded-card border border-black/5 dark:border-white/5 relative overflow-hidden shadow-card">
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
          <div className="flex items-center bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 py-1.5 px-4 rounded-button space-x-2 text-xs">
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
          </div>

          <div className="flex items-center space-x-1.5 bg-apricotWash/30 dark:bg-orange-500/10 border border-rust/10 dark:border-orange-500/20 py-1.5 px-4 rounded-badge text-rust dark:text-orange-400 font-bold text-xs" title="Daily study streak count!">
            <Flame size={16} className="fill-rust dark:fill-orange-400" />
            <span>{dashboardData.streak} Days</span>
          </div>
        </div>
      </div>

      {/* Grid: Gauge / XP Level / Motivational Quote */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Readiness Large Serif Number */}
        <div className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card flex flex-col items-center justify-center text-center shadow-card">
          <h3 className="text-text-secondary font-semibold text-sm mb-2">Interview Readiness</h3>
          
          <div className="flex flex-col items-center justify-center py-4">
            <span className="text-7xl font-bold font-serif text-text-primary tracking-tight">
              {dashboardData.readiness_score}%
            </span>
            <span className="text-[10px] text-text-secondary uppercase tracking-widest mt-2 font-semibold font-mono">
              Calculated Ready Quotient
            </span>
          </div>
          
          <p className="text-xs text-text-secondary mt-4 max-w-[200px] leading-relaxed">
            Based on tech subjects, mock interviews, communication, and consistency.
          </p>
        </div>

        {/* XP Level Bar Card */}
        <div className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card flex flex-col justify-between shadow-card">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] px-2.5 py-1 rounded-badge bg-primary/10 text-primary font-bold uppercase tracking-wider">
                Rank Progression
              </span>
              <Award size={20} className="text-gold" />
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
              <div 
                className="bg-primary h-full rounded-full transition-all duration-1000"
                style={{ width: `${(dashboardData.total_xp % 500) / 5}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-text-secondary text-right font-mono">
              {500 - (dashboardData.total_xp % 500)} XP to Next Level
            </p>
          </div>
        </div>

        {/* Motivational Card */}
        <div className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card flex flex-col justify-between relative overflow-hidden shadow-card">
          <div className="absolute right-3 top-3 opacity-[0.03] text-text-primary">
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
        </div>
      </div>

      {/* Main Row: Today's Schedule & Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card space-y-4 shadow-card">
          <div className="flex justify-between items-center pb-2 border-b border-black/5 dark:border-white/5">
            <h2 className="text-lg font-serif font-bold text-text-primary flex items-center">
              <Calendar size={18} className="mr-2 text-primary" />
              <span>Today's Study Plan</span>
            </h2>
            <button
              onClick={() => navigate('/learn')}
              className="text-xs text-primary font-bold hover:underline flex items-center space-x-0.5"
            >
              <span>View Full Syllabus</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {dashboardData.schedule && dashboardData.schedule.map((task) => (
              <div 
                key={task.id} 
                className={`p-4 rounded-input border flex justify-between items-center transition-all ${
                  task.is_completed 
                    ? 'bg-success/5 border-success/20 opacity-75' 
                    : 'bg-black/[0.01] dark:bg-white/[0.01] border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10'
                }`}
              >
                <div className="space-y-1 mr-4">
                  <div className="flex items-center space-x-2">
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
              </div>
            ))}

            {/* Primary CTA button (rounded-button/full, Ink bg in light mode) */}
            <button 
              onClick={() => {
                const uncompleted = dashboardData.schedule?.find(t => !t.is_completed);
                if (uncompleted) {
                  navigate('/learn');
                } else {
                  toast.success("All daily tasks completed! Good job!");
                }
              }}
              className="w-full bg-primary hover:bg-primary/95 text-white py-3.5 rounded-button font-bold text-sm shadow-card flex items-center justify-center space-x-2 transition-transform active:scale-[0.99]"
            >
              <Play size={16} className="fill-white" />
              <span>Start Today's Plan</span>
            </button>
          </div>
        </div>

        {/* Top 3 Weak Areas */}
        <div className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card space-y-4 shadow-card">
          <h2 className="text-lg font-serif font-bold text-text-primary flex items-center">
            <AlertTriangle size={18} className="mr-2 text-rust dark:text-danger animate-pulse" />
            <span>Critical Weak Areas</span>
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            These areas need immediate quiz practice to boost your readiness.
          </p>

          <div className="space-y-3 mt-4">
            {dashboardData.weak_areas && dashboardData.weak_areas.map((weak, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-card bg-white dark:bg-background-card border border-rust/25 dark:border-danger/20 flex flex-col justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer shadow-card"
                onClick={() => navigate(`/quiz?type=drill&subtopic=${encodeURIComponent(weak.subtopic_name)}`)}
              >
                <div>
                  <h4 className="text-xs text-rust dark:text-danger font-extrabold uppercase tracking-wider">{weak.topic_name}</h4>
                  <h3 className="text-sm font-bold text-text-primary mt-1">{weak.subtopic_name}</h3>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-text-secondary font-semibold">Mastery Level: {weak.mastery_level}/5</span>
                  <span className="text-[10px] text-rust dark:text-danger font-bold hover:underline">Start Drill &rarr;</span>
                </div>
              </div>
            ))}
            
            {(!dashboardData.weak_areas || dashboardData.weak_areas.length === 0) && (
              <div className="text-center py-6 text-text-secondary text-xs">
                🎉 No weak areas found yet! Keep up the good work.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Row: Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Mastered This Week', val: dashboardData.stats.mastered_count, desc: 'Topics above 85%', type: 'tech' },
          { title: 'Quiz Avg Score', val: `${dashboardData.stats.quiz_average}%`, desc: 'Average of all history', type: 'tech' },
          { title: 'Streak Days', val: `${dashboardData.stats.streak_days} 🔥`, desc: 'Consecutive study logs', type: 'streak' },
          { title: 'Total XP Earned', val: dashboardData.stats.total_xp, desc: 'Life time points', type: 'xp' }
        ].map((stat, idx) => {
          let bgClass = "bg-background-card border border-black/5 dark:border-white/5 text-text-primary";
          if (stat.type === 'streak') {
            bgClass = "bg-apricotWash text-rust dark:bg-apricotWash/10 dark:text-orange-400 border border-rust/10 dark:border-orange-500/20";
          } else if (stat.type === 'tech') {
            bgClass = "bg-skyWash text-primary-default dark:bg-skyWash/10 dark:text-blue-400 border border-blue-500/10 dark:border-blue-500/20";
          }
          
          return (
            <div key={idx} className={`${bgClass} p-5 rounded-card shadow-card transition-all`}>
              <p className="text-xs font-semibold opacity-75">{stat.title}</p>
              <h3 className="text-2xl font-bold mt-2 font-mono">{stat.val}</h3>
              <p className="text-[10px] opacity-75 mt-1">{stat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
