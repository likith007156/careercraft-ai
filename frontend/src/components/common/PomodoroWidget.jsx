import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
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
    <div className="fixed bottom-16 md:bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Expanded Control Box */}
      {isOpen && (
        <div className="bg-background-card border border-black/10 dark:border-white/5 rounded-card shadow-card p-5 mb-3 w-64 glass glow-primary animate-fade-in text-text-primary transition-all duration-300">
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

          <div className="text-center my-4">
            <h2 className="text-4xl font-bold font-mono tracking-wider text-text-primary">
              {formatTime(pomodoro.timeLeft)}
            </h2>
            <div className="w-full bg-black/5 dark:bg-white/10 rounded-badge h-1 mt-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${pomodoro.isStudy ? 'bg-primary' : 'bg-success'}`}
                style={{ width: `${(pomodoro.timeLeft / (pomodoro.isStudy ? 25 * 60 : 5 * 60)) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3 mt-4">
            <button
              onClick={toggleTimer}
              className="p-2.5 rounded-full bg-primary hover:opacity-90 text-white shadow-md transition-transform active:scale-95"
              title={pomodoro.isRunning ? 'Pause' : 'Start'}
            >
              {pomodoro.isRunning ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={resetTimer}
              className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all active:scale-95"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-text-secondary">
            <span className="flex items-center space-x-1">
              <Clock size={12} />
              <span>Today's focus:</span>
            </span>
            <span className="font-bold text-text-primary">{pomodoro.totalFocusMins} mins</span>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 py-2.5 px-4 rounded-badge shadow-card border border-black/10 dark:border-white/10 transition-all duration-300 ${
          pomodoro.isRunning 
            ? 'bg-primary text-white animate-pulse glow-primary' 
            : 'bg-background-card hover:bg-background-cardHover text-text-primary'
        }`}
      >
        <Timer size={18} className={pomodoro.isRunning ? 'animate-spin' : ''} />
        <span className="font-mono text-sm font-semibold">
          {formatTime(pomodoro.timeLeft)}
        </span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
    </div>
  );
};

export default PomodoroWidget;
