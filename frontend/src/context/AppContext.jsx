import React, { createContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState({
    username: 'Kiran',
    companyFocus: 'Cognizant',
    streak: 0,
    readinessScore: 0,
    level: 1,
    totalXp: 0,
    stats: {
      mastered_count: 0,
      quiz_average: 0.0,
      streak_days: 0,
      total_xp: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(true); // Default true, checking DB/local storage
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false; // default to light mode
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Pomodoro Timer State
  const [pomodoro, setPomodoro] = useState({
    timeLeft: 25 * 60,
    isStudy: true,
    isRunning: false,
    totalFocusMins: 0
  });

  const timerRef = useRef(null);

  // Fetch initial stats from backend
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      const data = res.data;
      
      setUser({
        username: data.greeting.split(', ')[1].replace('!', ''),
        companyFocus: data.company_focus,
        streak: data.streak,
        readinessScore: data.readiness_score,
        level: data.level,
        totalXp: data.total_xp,
        stats: data.stats
      });

      // If user has 0 overall_score and has not studied any topics, check onboarding
      // We check if they have done the onboarding test
      const studiedRes = await api.get('/learning/paths');
      const hasStudied = Object.values(studiedRes.data.syllabus || {}).some(
        (sections) => sections.some(
          (topic) => topic.subtopics.some(sub => sub.completion > 0)
        )
      );

      // Onboarding is required if overall_score is 0 and they haven't completed any topic
      if (data.readiness_score === 0 && !hasStudied) {
        setOnboarded(false);
      } else {
        setOnboarded(true);
      }
    } catch (error) {
      console.error("Error loading user progress:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Update focus company
  const updateCompanyFocus = async (company) => {
    try {
      await api.post('/dashboard/company', { company_focus: company });
      setUser(prev => ({ ...prev, companyFocus: company }));
      toast.success(`Active focus company changed to ${company}!`);
    } catch (error) {
      toast.error("Failed to update company focus.");
    }
  };

  // Update username
  const updateUsername = async (name) => {
    try {
      await api.post('/dashboard/name', { username: name });
      setUser(prev => ({ ...prev, username: name }));
      toast.success("Name updated successfully!");
    } catch (error) {
      toast.error("Failed to update name.");
    }
  };

  // Action: Add XP helper in frontend UI for immediate update
  const rewardXp = (amount) => {
    setUser(prev => {
      const newXp = prev.totalXp + amount;
      // Recalculate level locally
      const brackets = [100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
      let newLevel = 1;
      for (let i = 0; i < brackets.length; i++) {
        if (newXp >= brackets[i]) newLevel = i + 2;
        else break;
      }
      return {
        ...prev,
        totalXp: newXp,
        level: Math.min(10, newLevel)
      };
    });
  };

  // Pomodoro Actions
  useEffect(() => {
    if (pomodoro.isRunning) {
      timerRef.current = setInterval(() => {
        setPomodoro(prev => {
          if (prev.timeLeft <= 1) {
            // Trigger audio beep or alert
            playBeep();
            
            const nextMode = !prev.isStudy;
            const nextTime = nextMode ? 25 * 60 : 5 * 60;
            toast(
              nextMode ? "Break is over! Time to study. 📚" : "Study session complete! Take a 5 min break. ☕",
              { icon: '⏰', duration: 5000 }
            );

            // If study session finished, add focus minutes
            let addedMins = prev.totalFocusMins;
            if (prev.isStudy) {
              addedMins += 25;
            }

            return {
              timeLeft: nextTime,
              isStudy: nextMode,
              isRunning: false, // pause on mode change
              totalFocusMins: addedMins
            };
          }
          return {
            ...prev,
            timeLeft: prev.timeLeft - 1
          };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pomodoro.isRunning]);

  const toggleTimer = () => {
    setPomodoro(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetTimer = () => {
    setPomodoro(prev => ({
      ...prev,
      timeLeft: prev.isStudy ? 25 * 60 : 5 * 60,
      isRunning: false
    }));
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5); // beep for 0.5s
    } catch (e) {
      console.warn("Speech/audio context not allowed or failed:", e);
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      loading,
      onboarded,
      setOnboarded,
      fetchUserData,
      updateCompanyFocus,
      updateUsername,
      rewardXp,
      pomodoro,
      toggleTimer,
      resetTimer,
      darkMode,
      toggleDarkMode
    }}>
      {children}
    </AppContext.Provider>
  );
};
