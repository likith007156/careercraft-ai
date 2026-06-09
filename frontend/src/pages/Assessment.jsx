import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import api from '../utils/api';
import { Radar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, RadialLinearScale, PointElement, 
  LineElement, Filler, Tooltip, Legend 
} from 'chart.js';
import { 
  Play, Timer, ChevronRight, CheckCircle2, 
  AlertCircle, ShieldAlert, Sparkles, BookOpen, Star 
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

ChartJS.register(
  RadialLinearScale, PointElement, LineElement, 
  Filler, Tooltip, Legend
);

const QUESTIONS = [
  { id: 1, topic: 'Python Programming', text: 'What is the output of print(type(5 / 2)) in Python?', options: ["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'str'>"], correct: 1 },
  { id: 2, topic: 'Python Programming', text: 'Which of the following syntax is correct to declare/assign a variable in Python?', options: ["var x = 5", "int x = 5", "x = 5", "declare x = 5"], correct: 2 },
  { id: 3, topic: 'Python Programming', text: 'What does the .append() method do on a Python list?', options: ["Adds an element to the beginning", "Removes the last element", "Adds an element to the end", "Sorts the list in ascending order"], correct: 2 },
  { id: 4, topic: 'Python Programming', text: 'How do you define a class constructor function in Python?', options: ["def class(self):", "def __init__(self):", "def MyClass(self):", "def constructor(self):"], correct: 1 },
  
  { id: 5, topic: 'SQL & Database', text: 'Which SQL clause is used to filter rows in a basic SELECT query statement?', options: ["HAVING", "WHERE", "GROUP BY", "ORDER BY"], correct: 1 },
  { id: 6, topic: 'SQL & Database', text: 'What is the default ordering direction when using the ORDER BY clause in SQL?', options: ["Descending", "Ascending", "Random", "Case-sensitive"], correct: 1 },
  { id: 7, topic: 'SQL & Database', text: 'Which SQL JOIN returns all records from the left table and only the matched records from the right table?', options: ["INNER JOIN", "FULL OUTER JOIN", "RIGHT JOIN", "LEFT JOIN"], correct: 3 },
  
  { id: 8, topic: 'AI & GenAI Concepts', text: "What does 'LLM' stand for in the context of modern Artificial Intelligence?", options: ["Logical Language Management", "Large Language Model", "Latent Linear Model", "Learned Logical Mapping"], correct: 1 },
  { id: 9, topic: 'AI & GenAI Concepts', text: 'What is Prompt Engineering?', options: ["Writing code to compile neural networks", "Designing precise text inputs to direct LLM behaviors", "Optimizing SQL query index schemas", "Fine-tuning models with parameter weight decays"], correct: 1 },
  { id: 10, topic: 'AI & GenAI Concepts', text: "In Generative AI, what does 'RAG' stand for?", options: ["Random Analytical Generation", "Retrieval-Augmented Generation", "Recurrent Assembly Graph", "Relational Agent Gateway"], correct: 1 },
  
  { id: 11, topic: 'Quantitative Aptitude', text: 'If a car travels 180 km in 3 hours, what is its average speed in meters per second (m/s)?', options: ["60 m/s", "16.67 m/s", "20 m/s", "15 m/s"], correct: 1 },
  { id: 12, topic: 'Quantitative Aptitude', text: 'An article bought for $120 is sold at a loss of 20%. What was the final selling price?', options: ["$96", "$100", "$80", "$104"], correct: 0 },
  { id: 13, topic: 'Quantitative Aptitude', text: 'A and B can do a work in 12 days, B and C in 15 days, C and A in 20 days. Working together, in how many days will they complete it?', options: ["8 days", "10 days", "12 days", "6 days"], correct: 1 },
  
  { id: 14, topic: 'Logical Reasoning', text: 'Complete the number series: 3, 6, 12, 24, 48, ...?', options: ["60", "96", "72", "84"], correct: 1 },
  { id: 15, topic: 'Logical Reasoning', text: "If 'COLD' is coded as 'DPME' in a code language, how is 'WARM' coded?", options: ["XBSN", "XCTN", "YBSN", "XASM"], correct: 0 },
  { id: 16, topic: 'Logical Reasoning', text: "Pointing to a photograph, Kiran said, 'He is the son of the only daughter of my father.' How is Kiran related to the man?", options: ["Father", "Uncle", "Mother", "Brother"], correct: 2 },
  
  { id: 17, topic: 'Written Communication', text: "Identify the grammatical error in: 'He did not wrote the report despite multiple warnings.'", options: ["'did not wrote' (should be 'did not write')", "'despite'", "'report'", "No error"], correct: 0 },
  { id: 18, topic: 'Spoken Communication', text: 'Which greeting is most appropriate for a formal job application follow-up email to a recruiter?', options: ["Hey dude,", "Dear Hiring Manager,", "What's up team,", "To whomsoever it concerns,"], correct: 1 },
  
  { id: 19, topic: 'Data Structures & Algorithms', text: 'What is the worst-case time complexity of searching in a sorted array using Binary Search?', options: ["O(1)", "O(N)", "O(N^2)", "O(log N)"], correct: 3 },
  { id: 20, topic: 'Data Structures & Algorithms', text: 'Which data structure operates strictly on a Last-In, First-Out (LIFO) access pattern?', options: ["Queue", "Linked List", "Stack", "Binary Tree"], correct: 2 }
];

const Assessment = () => {
  const { setOnboarded, fetchUserData, darkMode } = useContext(AppContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Welcome, 2: Questions, 3: AI Loading, 4: Results, 5: Study Plan
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // qId -> selectedOptionIndex
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes (120s) per question
  const [loadingText, setLoadingText] = useState("Analyzing your answers...");
  
  const [resultsData, setResultsData] = useState(null);
  const [studyPlan, setStudyPlan] = useState([]);

  // Question Timer
  useEffect(() => {
    if (step !== 2) return;
    
    setTimeLeft(120);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          toast.error("Time is up! Advancing to the next question.");
          handleNextQuestion(null);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQIndex, step]);

  // Loading text animator
  useEffect(() => {
    if (step !== 3) return;
    const texts = [
      "Analyzing your strengths and weaknesses...",
      "Claude is computing your baseline scores...",
      "Evaluating technical skills (Python, SQL, DSA)...",
      "Analyzing aptitude and logical capacity...",
      "Formulating a customized 30-day study plan..."
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % texts.length;
      setLoadingText(texts[idx]);
    }, 2500);

    return () => clearInterval(interval);
  }, [step]);

  const handleNextQuestion = (selectedIdx) => {
    const q = QUESTIONS[currentQIndex];
    const updatedAnswers = { ...answers, [q.id]: selectedIdx };
    setAnswers(updatedAnswers);

    if (currentQIndex < QUESTIONS.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      submitResults(updatedAnswers);
    }
  };

  const submitResults = async (finalAnswers) => {
    setStep(3);
    
    const topicScores = {
      "Python Programming": { correct: 0, total: 4 },
      "SQL & Database": { correct: 0, total: 3 },
      "AI & GenAI Concepts": { correct: 0, total: 3 },
      "Data Structures & Algorithms": { correct: 0, total: 2 },
      "Computer Science Basics": { correct: 2, total: 2 },
      "Quantitative Aptitude": { correct: 0, total: 3 },
      "Logical Reasoning": { correct: 0, total: 3 },
      "Written Communication": { correct: 0, total: 1 },
      "Spoken Communication": { correct: 0, total: 1 }
    };

    QUESTIONS.forEach((q) => {
      const userAns = finalAnswers[q.id];
      if (userAns !== undefined && userAns === q.correct) {
        topicScores[q.topic].correct += 1;
      }
    });

    const finalScores = {};
    Object.entries(topicScores).forEach(([topic, data]) => {
      const percentage = (data.correct / data.total) * 10;
      finalScores[topic] = Math.max(1, Math.round(percentage));
    });

    try {
      const res = await api.post('/assessment/submit', { scores: finalScores });
      setResultsData({
        scores: finalScores,
        overallScore: res.data.overall_score
      });
      setStudyPlan(res.data.plan || []);
      
      setTimeout(() => {
        setStep(4);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }, 5000);
    } catch (err) {
      toast.error("Failed to generate your personalized study plan.");
      setStep(1);
    }
  };

  const enterPlatform = () => {
    setOnboarded(true);
    fetchUserData();
    navigate('/dashboard');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTopicCategory = (score) => {
    if (score >= 8) return { name: 'Strength', color: 'text-success bg-success-bg border-success/35', icon: CheckCircle2 };
    if (score >= 5) return { name: 'Needs Work', color: 'text-warning bg-warning-bg border-warning/35', icon: AlertCircle };
    return { name: 'Critical Gap', color: 'text-danger bg-danger-bg border-danger/35', icon: ShieldAlert };
  };

  // Chart styling options
  const gridColor = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const labelColor = darkMode ? '#a0a0b0' : '#777b86';

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      
      {/* STEP 1: WELCOME SCREEN */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-background-card border border-black/5 dark:border-white/5 p-8 md:p-12 rounded-card max-w-xl text-center shadow-card space-y-6"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 180 }}
            className="bg-primary/10 w-16 h-16 rounded-card flex items-center justify-center mx-auto text-primary glow-primary"
          >
            <Sparkles size={32} />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-text-primary tracking-tight leading-tight">
              Welcome to CareerCraft AI
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              Before we map your journey to companies like Cognizant and TCS, let's assess your current skills. This helps us customize your day-by-day prep plan.
            </p>
          </div>
          <div className="p-4 rounded-input bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-left text-xs space-y-2 text-text-secondary">
            <p className="font-bold text-text-primary">📋 Assessment rules:</p>
            <p>• 20 multiple choice questions covering technical and aptitude topics.</p>
            <p>• 2 minutes time limit per question.</p>
            <p>• Takes approximately 15 minutes to complete.</p>
          </div>
          
          {/* Primary CTA (rounded-button, Ink bg) */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setStep(2)}
            className="w-full bg-primary text-white py-4 rounded-button font-bold hover:bg-primary/95 flex items-center justify-center space-x-2 shadow-card"
          >
            <Play size={18} className="fill-white" />
            <span>Let's Find Out Where You Stand</span>
          </motion.button>
        </motion.div>
      )}

      {/* STEP 2: QUESTIONS FLOW */}
      {step === 2 && (
        <div className="bg-background-card border border-black/5 dark:border-white/5 p-6 md:p-8 rounded-card max-w-2xl w-full space-y-6 shadow-card">
          <div className="flex justify-between items-center pb-4 border-b border-black/5 dark:border-white/5 text-xs text-text-secondary">
            <span className="font-bold text-text-primary">Question {currentQIndex + 1} of {QUESTIONS.length}</span>
            <span className="flex items-center space-x-1.5 bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-badge text-text-primary font-bold">
              <Timer size={14} className="text-primary animate-pulse" />
              <span>{formatTime(timeLeft)}</span>
            </span>
          </div>

          <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              className="bg-primary h-full"
              animate={{ width: `${((currentQIndex + 1) / QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-4"
            >
              <span className="text-[10px] uppercase font-extrabold text-primary px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-badge">
                {QUESTIONS[currentQIndex].topic}
              </span>
              <h2 className="text-xl font-serif font-bold text-text-primary leading-relaxed">
                {QUESTIONS[currentQIndex].text}
              </h2>
            </motion.div>
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-3">
            {QUESTIONS[currentQIndex].options.map((opt, idx) => (
              <motion.button
                whileTap={{ scale: 0.98 }}
                key={idx}
                onClick={() => handleNextQuestion(idx)}
                className="w-full text-left p-4 rounded-card bg-white dark:bg-background border border-black/5 dark:border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-bold text-text-primary flex items-center justify-between group shadow-sm"
              >
                <span>{opt}</span>
                <ChevronRight size={16} className="text-text-secondary group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: LOADING SCREEN */}
      {step === 3 && (
        <div className="text-center space-y-6 max-w-sm">
          <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
            <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-primary"></div>
            <Sparkles size={24} className="absolute text-secondary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-serif font-bold text-text-primary tracking-wide">Evaluating Candidate Profile</h2>
            <p className="text-text-secondary text-xs animate-pulse font-medium">{loadingText}</p>
          </div>
        </div>
      )}

      {/* STEP 4: RESULTS RADAR CHART */}
      {step === 4 && resultsData && (
        <div className="bg-background-card border border-black/5 dark:border-white/5 p-6 md:p-8 rounded-card max-w-3xl w-full flex flex-col space-y-6 shadow-card">
          <div className="text-center pb-4 border-b border-black/5 dark:border-white/5">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Analysis Complete</span>
            <h1 className="text-3xl font-serif font-bold text-text-primary mt-1">Your Diagnostic Results</h1>
            <p className="text-text-secondary text-sm mt-1">Starting Readiness Quotient: <span className="text-primary font-extrabold font-mono">{resultsData.overallScore}%</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Radar Chart (Cool blue lines) */}
            <div className="w-full max-w-[280px] mx-auto p-4 bg-black/5 dark:bg-background rounded-card border border-black/5 dark:border-white/5">
              <Radar 
                data={{
                  labels: Object.keys(resultsData.scores).map(k => k.split(' ')[0]),
                  datasets: [{
                    label: 'Score (1-10)',
                    data: Object.values(resultsData.scores),
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#3b82f6'
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

            {/* Categorization list with soft pastel border styles */}
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-sm text-text-primary">Subject Breakdown:</h3>
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-2">
                {Object.entries(resultsData.scores).map(([topic, score]) => {
                  const cat = getTopicCategory(score);
                  const Icon = cat.icon;
                  return (
                    <div key={topic} className={`p-3 rounded-card border ${cat.color} flex items-center justify-between shadow-sm`}>
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-xs text-text-primary truncate">{topic}</p>
                        <p className="text-[10px] text-text-secondary font-mono">Score: {score}/10</p>
                      </div>
                      <span className="flex items-center text-[10px] font-bold space-x-1 shrink-0">
                        <Icon size={12} />
                        <span>{cat.name}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 p-4 rounded-card text-center space-y-2 shadow-sm text-text-primary">
            <h4 className="text-sm font-bold flex items-center justify-center space-x-1.5 font-serif">
              <Sparkles size={16} className="text-secondary" />
              <span>Personalized AI Evaluation</span>
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed font-serif">
              "You have shown solid aptitude parameters in mathematics, but Python dynamic references and SQL relational joins are key gaps. We have customized a 30-day preparation plan beginning with variables, queries, and conversational skills first."
            </p>
          </div>

          {/* Primary CTA (rounded-button, Ink bg) */}
          <button
            onClick={() => setStep(5)}
            className="w-full bg-primary text-white py-4 rounded-button font-bold hover:bg-primary/95 flex items-center justify-center space-x-2 transition-transform active:scale-[0.98] shadow-card"
          >
            <span>Review Your 30-Day Plan</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* STEP 5: 30-DAY STUDY PLAN SCREEN */}
      {step === 5 && (
        <div className="bg-background-card border border-black/5 dark:border-white/5 p-6 md:p-8 rounded-card max-w-3xl w-full flex flex-col space-y-6 shadow-card">
          <div className="text-center pb-4 border-b border-black/5 dark:border-white/5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Syllabus Generated</span>
            <h1 className="text-3xl font-serif font-bold text-text-primary mt-1">Your 30-Day Preparation Path</h1>
            <p className="text-text-secondary text-sm mt-1">Weakest subjects are scheduled first, slowly escalating to intermediate levels.</p>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
            {studyPlan.map((dayItem) => (
              <div key={dayItem.day} className="p-4 rounded-card bg-white dark:bg-background border border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/10 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-primary">Day {dayItem.day}</span>
                    <span className="text-[9px] font-bold text-text-secondary uppercase">{dayItem.topic}</span>
                  </div>
                  <h4 className="text-sm font-bold text-text-primary leading-tight font-serif">{dayItem.subtopic}</h4>
                  <p className="text-xs text-text-secondary">{dayItem.task_description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-text-secondary font-mono">{dayItem.time_estimate_mins} mins</span>
                  {dayItem.urgency === 'High' && (
                    <div className="mt-1 text-[8px] bg-danger-bg text-danger font-extrabold px-1.5 py-0.5 rounded-badge uppercase border border-danger/35 text-center">
                      High Focus
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Primary CTA (rounded-button, Ink bg) */}
          <button
            onClick={enterPlatform}
            className="w-full bg-primary text-white py-4 rounded-button font-bold hover:bg-primary/95 flex items-center justify-center space-x-2 transition-transform active:scale-[0.98] shadow-card"
          >
            <Star size={18} className="fill-white" />
            <span>Unlock Dashboard & Enter Platform</span>
          </button>
        </div>
      )}

    </div>
  );
};

export default Assessment;
