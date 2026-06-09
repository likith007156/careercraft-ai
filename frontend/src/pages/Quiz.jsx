import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import api from '../utils/api';
import { 
  Brain, Timer, HelpCircle, Check, X, 
  BookOpen, Sparkles, Award, RefreshCw, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonCard, SkeletonText, SkeletonCircle } from '../components/common/Skeleton';
import { staggerContainer, fadeIn } from '../utils/animations';

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

const cardVariant = {
  hidden: { 
    opacity: 0, 
    y: 24,
    scale: 0.98
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.4, 
      ease: [0.25, 0.46, 0.45, 0.94]
    }
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

const Quiz = () => {
  const { user, rewardXp } = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const queryType = searchParams.get("type");
  const querySubtopic = searchParams.get("subtopic");

  const [activeQuiz, setActiveQuiz] = useState(null); // 'LOBBY' or questions array
  const [quizType, setQuizType] = useState('DAILY_MORNING');
  const [companyName, setCompanyName] = useState('Cognizant');
  const [subtopicName, setSubtopicName] = useState('');

  // Quiz execution states
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // idx -> user answer string
  const [isAnswered, setIsAnswered] = useState(false);
  const [tempTextAnswer, setTempTextAnswer] = useState('');
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins default
  const [timerActive, setTimerActive] = useState(false);

  // Post quiz summary state
  const [quizFinished, setQuizFinished] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // CountUp animated scores for summary screen
  const animatedScore = useCountUp(summaryData ? summaryData.score_percentage : 0, 1200);
  const animatedXp = useCountUp(summaryData ? summaryData.xp_gained : 0, 1200);

  // Trigger from URL query params (e.g. from weak areas on dashboard)
  useEffect(() => {
    if (queryType === 'drill' && querySubtopic) {
      setQuizType('WEAKNESS_DRILL');
      setSubtopicName(querySubtopic);
      startQuiz('WEAKNESS_DRILL', querySubtopic);
    }
  }, [queryType, querySubtopic]);

  // Handle countdown
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          toast.error("Time is up! Submitting your quiz answers.");
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, questions, answers]);

  const startQuiz = async (type = quizType, sub = subtopicName) => {
    try {
      setLoadingQuiz(true);
      setActiveQuiz(null);
      setQuizFinished(false);
      setSummaryData(null);
      setCurrentIndex(0);
      setAnswers({});
      setIsAnswered(false);
      setTempTextAnswer('');

      let url = '/quiz/morning';
      if (type === 'WEEKLY_MEGA') url = '/quiz/mega';
      else if (type === 'COMPANY_SPECIFIC') url = `/quiz/company?company=${encodeURIComponent(companyName)}`;
      else if (type === 'WEAKNESS_DRILL') {
        if (!sub) {
          toast.error("Please select a subtopic for the weakness drill!");
          setLoadingQuiz(false);
          return;
        }
        url = `/quiz/drill?subtopic=${encodeURIComponent(sub)}`;
      }

      const res = await api.get(url);
      if (res.data.error) {
        toast.error(res.data.error);
        return;
      }

      const qList = res.data.questions || [];
      if (qList.length === 0) {
        toast.error("No questions available. Try completing more study lessons first!");
        return;
      }

      setQuestions(qList);
      setActiveQuiz('ACTIVE');
      setTimerActive(true);
      setTimeLeft(type === 'WEEKLY_MEGA' ? 45 * 60 : 15 * 60);
    } catch (err) {
      toast.error("Failed to load quiz questions.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectOption = (opt) => {
    if (isAnswered) return;
    setAnswers(prev => ({ ...prev, [currentIndex]: opt }));
    setIsAnswered(true);
  };

  const handleSubmitTextAnswer = () => {
    if (!tempTextAnswer.trim()) {
      toast.error("Please enter a response!");
      return;
    }
    setAnswers(prev => ({ ...prev, [currentIndex]: tempTextAnswer }));
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsAnswered(false);
      setTempTextAnswer('');
    } else {
      // End of quiz, submit
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    setTimerActive(false);
    try {
      setSubmittingQuiz(true);
      
      const formattedAnswers = {};
      questions.forEach((q, idx) => {
        formattedAnswers[q.id] = answers[idx] || '';
      });

      const res = await api.post('/quiz/submit', {
        quiz_type: quizType,
        topic_name: quizType === 'WEAKNESS_DRILL' ? subtopicName : 'Placement Practice',
        questions: questions,
        answers: formattedAnswers
      });

      setSummaryData(res.data);
      setQuizFinished(true);
      setActiveQuiz('SUMMARY');

      if (res.data.score_percentage >= 70) {
        toast.success(`Quiz completed! You scored ${res.data.score_percentage}%! Passed!`);
        rewardXp(res.data.xp_gained);
        
        if (res.data.score_percentage >= 85) {
          // Massive premium confetti explosion (side cannons)
          const duration = 2.5 * 1000;
          const end = Date.now() + duration;

          (function frame() {
            confetti({
              particleCount: 4,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.7 }
            });
            confetti({
              particleCount: 4,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.7 }
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          }());
        } else {
          // Standard confetti
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.7 }
          });
        }
      } else {
        toast.error(`Quiz completed. Score: ${res.data.score_percentage}%. Keep reviewing!`);
        rewardXp(res.data.xp_gained);
      }
    } catch (err) {
      toast.error("Failed to submit and grade quiz.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="max-w-4xl mx-auto pb-12"
    >
      
      {/* 1. QUIZ LOBBY */}
      {(!activeQuiz || activeQuiz === 'LOBBY') && !loadingQuiz && (
        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          animate="visible" 
          className="space-y-6"
        >
          <motion.div 
            variants={cardVariant}
            whileHover="hover"
            className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card flex items-center space-x-4 shadow-card"
          >
            <div className="bg-primary/10 w-12 h-12 rounded-card flex items-center justify-center text-primary glow-primary shrink-0">
              <Brain size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-text-primary tracking-tight leading-tight">
                Adaptive Assessment Labs
              </h1>
              <p className="text-text-secondary text-xs mt-1">
                Take tests built strictly from subjects you have studied. Strengthen weak modules automatically.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Morning Quiz Panel (Primary CTA - Only ONE per page!) */}
            <motion.div 
              variants={cardVariant}
              whileHover="hover"
              className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card flex flex-col justify-between shadow-card"
            >
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-primary font-bold uppercase">DAILY MORNING QUIZ</span>
                  <span className="text-text-secondary">15 Mins</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-text-primary">Daily Placement Practice</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  10 questions covering yesterday's study modules (50%), weak areas (30%), and revision (20%). Enforces daily consistency points.
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => { setQuizType('DAILY_MORNING'); startQuiz('DAILY_MORNING'); }}
                className="mt-6 w-full py-3 bg-primary hover:bg-primary/95 text-white rounded-button font-bold text-xs shadow-card"
              >
                Launch Morning Test
              </motion.button>
            </motion.div>

            {/* Sunday Mega Quiz */}
            <motion.div 
              variants={cardVariant}
              whileHover="hover"
              className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card flex flex-col justify-between shadow-card"
            >
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gold font-bold uppercase">SUNDAY MEGA QUIZ</span>
                  <span className="text-text-secondary">45 Mins</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-text-primary">Weekly Megapack</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  30 questions covering all concepts learned during the week. Compare progress trends week-over-week.
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => { setQuizType('WEEKLY_MEGA'); startQuiz('WEEKLY_MEGA'); }}
                className="mt-6 text-xs font-bold text-primary hover:underline text-left bg-transparent border-0 cursor-pointer self-start"
              >
                Launch Mega Test &rarr;
              </motion.button>
            </motion.div>

            {/* Company Specific Mock */}
            <motion.div 
              variants={cardVariant}
              whileHover="hover"
              className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card space-y-4 shadow-card"
            >
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-secondary font-bold uppercase">COMPANY SPECIFIC QUIZ</span>
                <span className="text-text-secondary">10 Questions</span>
              </div>
              <h3 className="text-lg font-serif font-bold text-text-primary">IT Company Mock Drills</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Adapts questions to matching recruitment patterns. Python/SQL algorithms for Cognizant, NQT math puzzles for TCS.
              </p>
              
              <div className="flex items-center space-x-3 bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-input border border-black/5 dark:border-white/5">
                <span className="text-xs text-text-secondary font-semibold shrink-0">Company Pattern:</span>
                <select
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-transparent text-xs text-text-primary outline-none cursor-pointer w-full font-bold"
                >
                  {['Cognizant', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'Amazon', 'Google'].map(c => (
                    <option key={c} value={c} className="bg-background text-text-primary">{c}</option>
                  ))}
                </select>
              </div>
              
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => { setQuizType('COMPANY_SPECIFIC'); startQuiz('COMPANY_SPECIFIC'); }}
                className="text-xs font-bold text-primary hover:underline text-left bg-transparent border-0 cursor-pointer block"
              >
                Launch Mock Exam &rarr;
              </motion.button>
            </motion.div>

            {/* Weakness Drills */}
            <motion.div 
              variants={cardVariant}
              whileHover="hover"
              className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card flex flex-col justify-between shadow-card"
            >
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-danger font-bold uppercase">WEAKNESS DRILLS</span>
                  <span className="text-text-secondary">10 Questions</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-text-primary">Focused Improvement</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Triggered when you confuse concepts 3 times. Focuses strictly on a single subtopic to clear critical preparation gaps.
                </p>
              </div>

              <div className="mt-4 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="e.g. JOINS or Variables"
                  value={subtopicName}
                  onChange={(e) => setSubtopicName(e.target.value)}
                  className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-input py-2.5 px-3 text-xs text-text-primary outline-none w-full"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => { setQuizType('WEAKNESS_DRILL'); startQuiz('WEAKNESS_DRILL'); }}
                className="mt-4 text-xs font-bold text-primary hover:underline text-left bg-transparent border-0 cursor-pointer self-start"
              >
                Launch Focused Drill &rarr;
              </motion.button>
            </motion.div>

          </div>
        </motion.div>
      )}

      {/* 2. ACTIVE QUIZ COMPONENT */}
      {activeQuiz === 'ACTIVE' && questions.length > 0 && !loadingQuiz && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 1] }}
            className="bg-background-card border border-black/5 dark:border-white/5 rounded-card p-6 md:p-8 space-y-6 shadow-card"
          >
            {/* Header row */}
            <div className="flex justify-between items-center pb-4 border-b border-black/5 dark:border-white/5 text-xs text-text-secondary">
              <div>
                <span className="font-bold text-text-primary mr-2">Question {currentIndex + 1} of {questions.length}</span>
                <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[10px] uppercase font-bold">{questions[currentIndex].difficulty}</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-badge text-text-primary font-mono font-semibold">
                <Timer size={14} className="text-primary animate-pulse" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-extrabold text-secondary bg-secondary/15 border border-secondary/25 px-2.5 py-1 rounded-badge">
                {questions[currentIndex].question_type || 'MCQ'}
              </span>
              <div className="text-lg font-serif font-bold text-text-primary whitespace-pre-wrap leading-relaxed">
                {questions[currentIndex].question}
              </div>
            </div>

            {/* Options input */}
            <div className="mt-6">
              {questions[currentIndex].question_type === 'WRITE_QUERY' || questions[currentIndex].question_type === 'PREDICT_OUTPUT' ? (
                <div className="space-y-3">
                  <textarea
                    value={tempTextAnswer}
                    onChange={(e) => setTempTextAnswer(e.target.value)}
                    disabled={isAnswered}
                    rows={4}
                    placeholder={questions[currentIndex].question_type === 'WRITE_QUERY' ? "-- Write your SQL query here" : "# Predict the python output"}
                    className="w-full bg-background border border-black/10 dark:border-white/10 rounded-input p-4 font-mono text-xs text-text-primary outline-none focus:border-primary transition-all"
                  />
                  {!isAnswered && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleSubmitTextAnswer}
                      className="py-2.5 px-6 bg-primary hover:bg-primary/95 text-white font-bold rounded-button text-xs flex items-center space-x-1.5 ml-auto shadow-card"
                    >
                      <span>Validate Code</span>
                    </motion.button>
                  )}
                </div>
              ) : (
                // Standard MCQ Choices
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {questions[currentIndex].options.map((opt) => {
                    const answered = answers[currentIndex] === opt;
                    const correct = questions[currentIndex].correct_answer === opt;
                    const isIncorrect = isAnswered && answered && !correct;
                    
                    let btnStyle = 'bg-white dark:bg-background-card border-black/5 dark:border-white/5 text-text-secondary hover:border-black/20 dark:hover:border-white/10 shadow-card';
                    if (isAnswered) {
                      if (correct) {
                        btnStyle = 'bg-success-bg border-success text-success shadow-none';
                      } else if (answered) {
                        btnStyle = 'bg-danger-bg border-danger text-danger shadow-none';
                      } else {
                        btnStyle = 'bg-white dark:bg-background-card border-black/5 dark:border-white/5 text-text-secondary opacity-50 shadow-none';
                      }
                    } else if (answered) {
                      btnStyle = 'bg-primary/10 border-primary text-text-primary shadow-none';
                    }

                    return (
                      <motion.button
                        key={opt}
                        onClick={() => handleSelectOption(opt)}
                        disabled={isAnswered}
                        whileTap={!isAnswered ? { scale: 0.98 } : {}}
                        animate={isIncorrect ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                        transition={isIncorrect ? { duration: 0.4 } : undefined}
                        className={`p-4 text-left rounded-card text-xs font-semibold border transition-all flex items-center justify-between group ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isAnswered && correct && <Check size={14} className="text-success shrink-0" />}
                        {isAnswered && answered && !correct && <X size={14} className="text-danger shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Explanations */}
            {isAnswered && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-5 rounded-card bg-black/[0.01] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-3 text-xs"
              >
                <div className="flex items-center space-x-1.5 font-bold text-text-primary">
                  <Sparkles size={14} className="text-secondary" />
                  <span>AI Explanatory Critique</span>
                </div>
                <p className="text-text-secondary leading-relaxed font-mono">
                  {questions[currentIndex].explanation}
                </p>
                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-start space-x-2 text-[10px] text-text-secondary font-medium">
                  <AlertCircle size={12} className="text-primary shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold text-text-primary">Takeaway:</span> Keep track of spelling scopes, variables declaration structure, and runtime complexities.
                  </p>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="w-full mt-4 bg-primary hover:bg-primary/95 text-white py-3 rounded-button font-bold flex items-center justify-center space-x-2 shadow-card"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}</span>
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* 3. POST QUIZ SUMMARY */}
      {activeQuiz === 'SUMMARY' && summaryData && !loadingQuiz && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-background-card border border-black/5 dark:border-white/5 rounded-card p-6 md:p-8 text-center space-y-6 shadow-card"
        >
          <div className="bg-primary/10 w-16 h-16 rounded-card flex items-center justify-center mx-auto text-primary glow-primary">
            <Award size={32} />
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-secondary">{quizType.replace('_', ' ')} COMPLETE</span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-text-primary">Quiz Scoreboard</h1>
            <p className="text-text-secondary text-xs">You answered {summaryData.correct_count} of {summaryData.total_count} questions correctly.</p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto my-6">
            <div className="bg-black/5 dark:bg-background p-4 rounded-card border border-black/5 dark:border-white/5">
              <span className="text-[9px] text-text-secondary block font-bold uppercase">SCORE</span>
              <span className={`text-xl font-extrabold mt-1 block font-mono ${summaryData.score_percentage >= 70 ? 'text-success' : 'text-danger'}`}>
                {animatedScore}%
              </span>
            </div>
            <div className="bg-black/5 dark:bg-background p-4 rounded-card border border-black/5 dark:border-white/5">
              <span className="text-[9px] text-text-secondary block font-bold uppercase">XP AWARD</span>
              <span className="text-xl font-extrabold text-primary mt-1 block font-mono">+{animatedXp}</span>
            </div>
            <div className="bg-black/5 dark:bg-background p-4 rounded-card border border-black/5 dark:border-white/5">
              <span className="text-[9px] text-text-secondary block font-bold uppercase">PREP LEVEL</span>
              <span className="text-xl font-extrabold text-secondary mt-1 block font-mono">Lvl {summaryData.current_level}</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[260px] overflow-y-auto max-w-lg mx-auto pr-2 text-left">
            {summaryData.results && summaryData.results.map((res, i) => (
              <div key={i} className={`p-4 rounded-card border text-xs space-y-1.5 ${
                res.is_correct ? 'bg-success-bg border-success/35' : 'bg-danger-bg border-danger/35'
              }`}>
                <div className="flex justify-between items-start">
                  <span className="font-bold text-text-primary">Q{i+1}: {res.question}</span>
                  {res.is_correct ? (
                    <span className="text-success font-bold shrink-0 ml-2">Correct</span>
                  ) : (
                    <span className="text-danger font-bold shrink-0 ml-2">Incorrect</span>
                  )}
                </div>
                <p className="text-text-secondary font-medium">Your selection: <span className="font-mono text-text-primary">{res.user_answer || '(Blank)'}</span></p>
                {!res.is_correct && <p className="text-text-secondary font-medium">Expected: <span className="font-mono text-success">{res.correct_answer}</span></p>}
                <p className="text-text-secondary leading-relaxed text-[10px] italic font-mono">{res.explanation}</p>
              </div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveQuiz('LOBBY')}
            className="w-full bg-primary hover:bg-primary/95 text-white py-3.5 rounded-button font-bold text-sm shadow-card"
          >
            Return to Assessment Lobby
          </motion.button>
        </motion.div>
      )}

      {loadingQuiz && (
        <div className="space-y-6">
          <SkeletonCard className="h-24" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-48" />
          </div>
        </div>
      )}

      {submittingQuiz && (
        <div className="bg-background-card border border-black/5 dark:border-white/5 rounded-card p-6 md:p-8 space-y-6 shadow-card">
          <SkeletonCircle className="mx-auto h-16 w-16" />
          <SkeletonText lines={4} className="max-w-lg mx-auto" />
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto my-6">
            <SkeletonCard className="h-16" />
            <SkeletonCard className="h-16" />
            <SkeletonCard className="h-16" />
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default Quiz;
