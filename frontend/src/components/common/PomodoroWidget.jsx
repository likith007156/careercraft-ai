import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Clock, Timer, ChevronUp, ChevronDown } from 'lucide-react';

const PomodoroWidget = () => {
  const { pomodoro, toggleTimer, resetTimer } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Expanded Control Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-background-card border border-black/10 dark:border-white/5 rounded-card shadow-card p-5 mb-3 w-64 glass glow-primary text-text-primary overflow-hidden"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center space-x-2 text-sm font-serif font-bold">
                <Timer size={18} className="text-primary" />
                <span>{pomodoro.isStudy ? 'Focus Study' : 'Break Time'}</span>
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-badge font-bold ${
                pomodoro.isStudy ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
              }`}>
                {pomodoro.isStudy ? '25 Min' : '5 Min'}
              </span>
            </div>

            {/* Circular Countdown Ring */}
            <div className="relative flex items-center justify-center my-6 h-36 w-36 mx-auto">
              <svg className="w-full h-full transform -rotate-90 absolute">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="stroke-black/5 dark:stroke-white/5 fill-transparent"
                  strokeWidth="6"
                />
                <motion.circle
                  cx="72"
                  cy="72"
                  r="60"
                  className={pomodoro.isStudy ? 'stroke-primary fill-transparent' : 'stroke-success fill-transparent'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: 377 - (377 * pomodoro.timeLeft) / (pomodoro.isStudy ? 25 * 60 : 5 * 60) }}
                  transition={{ duration: 0.5, ease: "linear" }}
                  style={{ strokeDasharray: 377, willChange: 'stroke-dashoffset' }}
                />
              </svg>
              <div className="flex flex-col items-center justify-center z-10">
                <h2 className="text-3xl font-bold font-mono tracking-wide text-text-primary">
                  {formatTime(pomodoro.timeLeft)}
                </h2>
                <span className="text-[10px] text-text-secondary uppercase tracking-widest mt-1 font-semibold">
                  {pomodoro.isStudy ? 'Focus' : 'Break'}
                </span>
              </div>
            </div>

            {/* Control Buttons with Tactile Feedbacks */}
            <div className="flex items-center justify-center space-x-3 mt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={toggleTimer}
                className="p-2.5 rounded-full bg-primary hover:opacity-90 text-white shadow-md cursor-pointer border-none"
                title={pomodoro.isRunning ? 'Pause' : 'Start'}
              >
                {pomodoro.isRunning ? <Pause size={18} /> : <Play size={18} />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={resetTimer}
                className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary cursor-pointer border-none"
                title="Reset"
              >
                <RotateCcw size={18} />
              </motion.button>
            </div>

            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-text-secondary">
              <span className="flex items-center space-x-1">
                <Clock size={12} />
                <span>Today's focus:</span>
              </span>
              <span className="font-bold text-text-primary">{pomodoro.totalFocusMins} mins</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 py-2.5 px-4 rounded-badge shadow-card border border-black/10 dark:border-white/10 cursor-pointer ${
          pomodoro.isRunning 
            ? 'bg-primary text-white animate-pulse glow-primary' 
            : 'bg-background-card hover:bg-background-cardHover text-text-primary'
        }`}
      >
        <Timer size={18} className={pomodoro.isRunning ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
        <span className="font-mono text-sm font-semibold">
          {formatTime(pomodoro.timeLeft)}
        </span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </motion.button>
    </div>
  );
};

export default PomodoroWidget;
