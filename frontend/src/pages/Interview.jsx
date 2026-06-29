import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import api from '../utils/api';
import { 
  Mic, Send, Volume2, VolumeX, Briefcase, 
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, 
  History, Calendar, RefreshCw, BarChart2, Star 
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeIn, cardHover } from '../utils/animations';
import { SkeletonCard, SkeletonText } from '../components/common/Skeleton';

// Typing dots "thinking" indicator
const TypingIndicator = () => (
  <div className="flex items-center space-x-3 max-w-[85%]">
    <div className="w-8 h-8 rounded-card bg-primary shrink-0 flex items-center justify-center font-bold text-white text-xs">
      AI
    </div>
    <div className="p-3.5 bg-white dark:bg-background-card border border-black/5 dark:border-white/5 rounded-card rounded-tl-none shadow-card flex items-center space-x-1.5 px-4">
      {[0, 0.18, 0.36].map((delay, i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  </div>
);

// Animated chat bubble component
const ChatBubble = ({ log, userInitials }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    className="space-y-4"
  >
    {/* AI question bubble – slides in from left */}
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-start space-x-3 max-w-[85%]"
    >
      <div className="w-8 h-8 rounded-card bg-primary shrink-0 flex items-center justify-center font-bold text-white text-xs">
        AI
      </div>
      <div className="p-3.5 bg-white dark:bg-background-card border border-black/5 dark:border-white/5 rounded-card rounded-tl-none text-xs leading-relaxed text-text-primary shadow-card font-serif">
        {log.question}
      </div>
    </motion.div>

    {/* User answer bubble – slides in from right */}
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
      className="flex items-start justify-end space-x-3 max-w-[85%] ml-auto"
    >
      <div className="p-3.5 bg-skyWash text-primary-default dark:bg-skyWash/10 dark:text-blue-400 border border-blue-500/10 dark:border-blue-500/20 rounded-card rounded-tr-none text-xs leading-relaxed font-semibold">
        {log.user_answer}
      </div>
      <div className="w-8 h-8 rounded-full bg-primary/20 shrink-0 flex items-center justify-center font-bold text-primary text-xs uppercase">
        {userInitials}
      </div>
    </motion.div>
  </motion.div>
);

const Interview = () => {
  const { user, rewardXp } = useContext(AppContext);

  // Layout stages: 'SETUP' | 'CHAT' | 'REPORT' | 'HISTORY'
  const [stage, setStage] = useState('SETUP'); 
  const [activeTab, setActiveTab] = useState('practice'); // practice | history

  // Config parameters
  const [company, setCompany] = useState('Cognizant');
  const [interviewType, setInterviewType] = useState('MIXED'); // HR | TECHNICAL | MIXED
  const [difficulty, setDifficulty] = useState('Medium');
  const [projectText, setProjectText] = useState('Built a complete AI resume analyzer using Python Flask and react components.');

  // Voice/Synthesis states
  const [audioOn, setAudioOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState(null);

  // Active chat conversation state
  const [chatHistory, setChatHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentQuestionType, setCurrentQuestionType] = useState('HR');
  const [questionNum, setQuestionNum] = useState(1);
  const [userInput, setUserInput] = useState('');
  
  // Loading flags
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [savingSession, setSavingSession] = useState(false);

  // Saved scores report
  const [finalReport, setFinalReport] = useState(null);

  // Past logs lists
  const [pastInterviews, setPastInterviews] = useState([]);
  const [avgHistoryScore, setAvgHistoryScore] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Auto-scroll ref for chat area
  const chatBottomRef = useRef(null);

  // Max questions per mock session
  const MAX_QUESTIONS = 5;

  useEffect(() => {
    initSpeechRecognition();
  }, []);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, currentQuestion, submittingAnswer]);

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setUserInput((finalTranscript + interimTranscript).trim());
    };
    
    rec.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      let errorMsg = "Speech recognition error occurred.";
      if (event.error === 'not-allowed') {
        errorMsg = "Microphone access blocked. Please enable browser permissions.";
      } else if (event.error === 'no-speech') {
        errorMsg = "No speech was detected. Try speaking closer to the microphone.";
      } else if (event.error === 'audio-capture') {
        errorMsg = "No microphone was found or audio capture failed.";
      } else if (event.error === 'network') {
        errorMsg = "Network error. Speech recognition requires an internet connection.";
      }
      toast.error(errorMsg);
      setIsRecording(false);
    };
    
    rec.onend = () => {
      setIsRecording(false);
    };
    setRecognitionInstance(rec);
  };

  const speakText = (text) => {
    if (!audioOn || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleStartInterview = async () => {
    try {
      setLoadingQuestion(true);
      setStage('CHAT');
      setChatHistory([]);
      setQuestionNum(1);
      setUserInput('');
      setFinalReport(null);

      const res = await api.post('/interview/start', {
        company_name: company,
        interview_type: interviewType,
        difficulty: difficulty
      });

      setCurrentQuestion(res.data.question);
      setCurrentQuestionType(res.data.question_type);
      speakText(res.data.question);
    } catch (err) {
      toast.error("Failed to initiate mock interview.");
      setStage('SETUP');
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleToggleRecord = () => {
    if (!recognitionInstance) {
      toast.error("Microphone speech-to-text not available. Please type your response.");
      return;
    }
    if (isRecording) {
      try {
        recognitionInstance.stop();
      } catch (err) {
        console.error("Failed to stop SpeechRecognition:", err);
      }
      setIsRecording(false);
    } else {
      setUserInput('');
      try {
        recognitionInstance.start();
        setIsRecording(true);
        toast.success("Listening to your voice...");
      } catch (err) {
        console.error("Failed to start SpeechRecognition:", err);
        toast.error("Could not activate microphone. It may already be in use.");
        setIsRecording(false);
      }
    }
  };

  const handleSendAnswer = async () => {
    if (!userInput.trim()) {
      toast.error("Please compose or record an answer first!");
      return;
    }

    try {
      setSubmittingAnswer(true);
      const isFinal = (questionNum >= MAX_QUESTIONS);
      
      const res = await api.post('/interview/answer', {
        company_name: company,
        interview_type: interviewType,
        question: currentQuestion,
        user_answer: userInput,
        question_number: questionNum,
        history: chatHistory,
        is_final: isFinal
      });

      const updatedHistory = res.data.history;
      setChatHistory(updatedHistory);

      if (isFinal) {
        handleSaveSession(updatedHistory);
      } else {
        setQuestionNum(res.data.next_question_number);
        setCurrentQuestion(res.data.next_question);
        setCurrentQuestionType(res.data.next_question_type);
        setUserInput('');
        speakText(res.data.next_question);
      }
    } catch (err) {
      toast.error("Failed to analyze your answer.");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleSaveSession = async (historyLog) => {
    try {
      setSavingSession(true);
      const res = await api.post('/interview/save', {
        company_name: company,
        interview_type: interviewType,
        history: historyLog
      });

      setFinalReport({
        overallScore: res.data.overall_score,
        xpGained: res.data.xp_gained,
        history: historyLog
      });
      rewardXp(res.data.xp_gained);
      setStage('REPORT');
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (err) {
      toast.error("Failed to compile final score metrics.");
    } finally {
      setSavingSession(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/interview/history');
      setPastInterviews(res.data.history || []);
      setAvgHistoryScore(res.data.average_score || 0);
    } catch (err) {
      toast.error("Failed to load interview history logs.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="max-w-4xl mx-auto pb-12"
    >
      
      {/* Lobby tab bar */}
      {stage !== 'CHAT' && (
        <div className="bg-background-card border border-black/5 dark:border-white/5 p-2 rounded-button flex space-x-2 mb-6 shadow-card">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab('practice')}
            className={`flex-1 py-3 rounded-button text-xs font-bold transition-all ${
              activeTab === 'practice' ? 'bg-primary text-white shadow-card' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Mock Simulator
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 rounded-button text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'history' ? 'bg-primary text-white shadow-card' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <History size={14} />
            <span>Interview Log History</span>
          </motion.button>
        </div>
      )}

      {/* STAGE 1: SETUP PANEL */}
      {stage === 'SETUP' && activeTab === 'practice' && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } } }}
            className="bg-background-card border border-black/5 dark:border-white/5 p-6 md:p-8 rounded-card space-y-6 shadow-card"
          >
            <div className="flex items-center space-x-3 pb-4 border-b border-black/5 dark:border-white/5">
              <Briefcase size={22} className="text-primary" />
              <h2 className="text-lg font-serif font-bold text-text-primary">Mock Interview Configurator</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Company */}
              <div className="space-y-2">
                <label className="text-xs text-text-secondary font-semibold">Focus Company:</label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 p-3 rounded-input text-xs text-text-primary outline-none cursor-pointer font-bold"
                >
                  {['Cognizant', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'Amazon', 'Google'].map(c => (
                    <option key={c} value={c} className="bg-background text-text-primary">{c}</option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="text-xs text-text-secondary font-semibold">Interview Format:</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 p-3 rounded-input text-xs text-text-primary outline-none cursor-pointer font-bold"
                >
                  <option value="MIXED" className="bg-background text-text-primary">Mixed HR + Technical</option>
                  <option value="TECHNICAL" className="bg-background text-text-primary">Technical Only</option>
                  <option value="HR" className="bg-background text-text-primary">HR Behavioral Only</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-xs text-text-secondary font-semibold">Grilling Difficulty:</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 p-3 rounded-input text-xs text-text-primary outline-none cursor-pointer font-bold"
                >
                  <option value="Easy" className="bg-background text-text-primary">Easy (Fresher Core)</option>
                  <option value="Medium" className="bg-background text-text-primary">Medium (Placement Level)</option>
                  <option value="Hard" className="bg-background text-text-primary">Hard (Strict Grilling)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-secondary font-semibold">Project Experience Details:</label>
              <textarea
                value={projectText}
                onChange={(e) => setProjectText(e.target.value)}
                rows={3}
                placeholder="Specify team contributions, frameworks (e.g. Flask, SQL) so the AI deep-dives..."
                className="w-full bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 p-4 rounded-input text-xs text-text-primary outline-none focus:border-primary transition-all font-serif"
              />
            </div>

            {/* Primary CTA */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleStartInterview}
              className="w-full py-4 bg-primary hover:bg-primary/95 text-white font-bold rounded-button text-sm shadow-card"
            >
              Launch Interview Session
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* STAGE 2: IMMERSIVE ACTIVE CHAT */}
      {stage === 'CHAT' && (
        <div className="bg-background-card border border-black/5 dark:border-white/5 rounded-card p-6 md:p-8 flex flex-col justify-between h-[75vh] relative shadow-card">
          
          {/* Top Panel headers */}
          <div className="flex justify-between items-center pb-4 border-b border-black/5 dark:border-white/5 text-xs text-text-secondary">
            <div>
              <span className="font-bold text-text-primary mr-2 uppercase">{company} Mock Exam</span>
              <span className="text-[9px] bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-badge uppercase">Question {questionNum} of {MAX_QUESTIONS}</span>
            </div>
            
            {/* Audio Toggle */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setAudioOn(!audioOn)}
              className="p-2 rounded-badge bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary"
              title="Toggle Text to Speech"
            >
              {audioOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </motion.button>
          </div>

          {/* Chat Bubble Area */}
          <div className="flex-1 min-h-0 overflow-y-auto my-6 space-y-5 pr-2">
            {chatHistory.map((log, idx) => (
              <ChatBubble key={idx} log={log} userInitials={user.username.substring(0, 2)} />
            ))}

            {/* Current Active Interviewer Question: slides in from left */}
            <AnimatePresence>
              {currentQuestion && !submittingAnswer && (
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex items-start space-x-3 max-w-[85%]"
                >
                  <div className="w-8 h-8 rounded-card bg-primary shrink-0 flex items-center justify-center font-bold text-white text-xs">
                    AI
                  </div>
                  <div className="p-3.5 bg-white dark:bg-background-card border border-black/5 dark:border-white/5 rounded-card rounded-tl-none text-xs leading-relaxed text-text-primary shadow-card font-serif">
                    {currentQuestion}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Thinking indicator */}
            <AnimatePresence>
              {submittingAnswer && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.25 }}
                >
                  <TypingIndicator />
                </motion.div>
              )}
            </AnimatePresence>

            {/* auto-scroll anchor */}
            <div ref={chatBottomRef} />
          </div>

          {/* Input text/mic buttons */}
          <div className="flex items-center space-x-2 bg-black/5 dark:bg-background p-3 rounded-input border border-black/5 dark:border-white/5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleRecord}
              disabled={submittingAnswer}
              className={`p-2.5 rounded-badge shrink-0 transition-colors ${
                isRecording ? 'bg-danger text-white animate-pulse' : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary'
              }`}
              title="Record voice response"
            >
              <Mic size={16} />
            </motion.button>
            
            <input
              type="text"
              placeholder="Type your structured placement response here..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !submittingAnswer && handleSendAnswer()}
              disabled={submittingAnswer}
              className="bg-transparent text-xs text-text-primary outline-none w-full px-2"
            />

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSendAnswer}
              disabled={submittingAnswer || !userInput.trim()}
              className="p-2.5 bg-primary hover:bg-primary/95 text-white rounded-badge disabled:opacity-50 shadow-card"
            >
              <Send size={14} className="fill-white" />
            </motion.button>
          </div>

          {loadingQuestion && (
            <div className="absolute inset-0 bg-white/95 dark:bg-background/95 flex flex-col items-center justify-center rounded-card text-text-secondary z-50 space-y-4">
              <TypingIndicator />
              <p className="text-xs pl-11">Connecting to recruitment nodes...</p>
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: POST INTERVIEW REPORT CARD */}
      {stage === 'REPORT' && finalReport && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-background-card border border-black/5 dark:border-white/5 p-6 md:p-8 rounded-card shadow-card space-y-6"
        >
          <div className="text-center pb-4 border-b border-black/5 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-extrabold tracking-widest text-success uppercase">EXAM COMPLETED</span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-text-primary">Placement Scorecard Report</h1>
            <p className="text-text-secondary text-xs">Review detailed scoring feedback from our Claude mentor compiler.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-center font-mono my-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="bg-black/5 dark:bg-background p-4 rounded-card border border-black/5 dark:border-white/5"
            >
              <span className="text-[9px] text-text-secondary block font-bold uppercase">INTERVIEW GRADE</span>
              <span className="text-2xl font-extrabold text-success mt-1 block font-mono">{finalReport.overallScore}/100</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="bg-black/5 dark:bg-background p-4 rounded-card border border-black/5 dark:border-white/5"
            >
              <span className="text-[9px] text-text-secondary block font-bold uppercase">XP AWARDED</span>
              <span className="text-2xl font-extrabold text-primary mt-1 block font-mono">+{finalReport.xpGained}</span>
            </motion.div>
          </div>

          {/* Question breakdown lists */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-sm text-text-primary">Itemized Transcript Evaluations:</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {finalReport.history.map((log, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.35 }}
                  className="p-4 bg-white dark:bg-background border border-black/5 dark:border-white/5 rounded-card space-y-3 shadow-card"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-primary font-bold uppercase">Q{idx + 1} Question</span>
                      <p className="text-xs font-bold text-text-primary mt-0.5 font-serif">{log.question}</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-badge bg-primary/15 text-primary shrink-0 ml-2">
                      Score: {log.score}/10
                    </span>
                  </div>

                  <div className="text-[11px] leading-relaxed space-y-1.5 text-text-secondary">
                    <p><span className="font-bold text-text-primary">Your Answer:</span> "{log.user_answer}"</p>
                    <p className="mt-1 bg-black/[0.01] dark:bg-white/[0.02] p-2.5 rounded-input border border-black/5 dark:border-white/10 font-mono">
                      <span className="font-bold text-primary block text-[9px] uppercase mb-0.5 font-sans">Mentor Feedback</span>
                      "{log.feedback}"
                    </p>
                    <p className="mt-1 bg-success-bg p-2.5 rounded-input border border-success/35 font-mono text-success">
                      <span className="font-bold text-success block text-[9px] uppercase mb-0.5 font-sans">Optimal Model Response</span>
                      "{log.better_answer}"
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Checklist reminder box */}
          <div className="bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 p-4 rounded-card flex items-start space-x-3 text-xs text-text-secondary">
            <AlertTriangle className="text-warning shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <span className="font-bold text-text-primary block">Presentation tips checklist:</span>
              <p>Keep eye contact on webcam. Avoid standard verbal repetitions ('you know', 'basically'). Structure situations using STAR templates.</p>
            </div>
          </div>

          {/* Primary CTA */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setStage('SETUP')}
            className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-button text-xs shadow-card"
          >
            Practice New Company Session
          </motion.button>
        </motion.div>
      )}

      {/* STAGE 4: HISTORY VIEW */}
      {activeTab === 'history' && stage !== 'CHAT' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card shadow-card space-y-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-black/5 dark:border-white/5 gap-3">
            <div className="flex items-center space-x-2">
              <History className="text-primary" />
              <h2 className="text-lg font-serif font-bold text-text-primary">Completed Mock Exams History</h2>
            </div>
            
            <div className="bg-black/5 dark:bg-background py-1.5 px-4 rounded-badge border border-black/5 dark:border-white/5 font-mono text-xs text-text-secondary">
              Average Grade Score: <span className="text-success font-bold font-mono">{avgHistoryScore}%</span>
            </div>
          </div>

          {loadingHistory ? (
            <div className="space-y-3">
              <SkeletonCard className="h-20" />
              <SkeletonCard className="h-20" />
              <SkeletonCard className="h-20" />
            </div>
          ) : pastInterviews.length === 0 ? (
            <div className="text-center py-12 text-text-secondary text-sm">
              No mock interviews recorded yet. Start a session to log performance scorecard history!
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {pastInterviews.map((log, idx) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.32 }}
                  className="p-4 bg-white dark:bg-background border border-black/5 dark:border-white/5 rounded-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-card"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-bold text-primary">{log.company_name}</span>
                      <span className="text-[10px] text-text-secondary uppercase">{log.interview_type}</span>
                    </div>
                    <p className="text-xs text-text-primary font-bold truncate max-w-sm font-serif">Q: {log.question}</p>
                    <p className="text-[10px] text-text-secondary flex items-center">
                      <Calendar size={10} className="mr-1" />
                      <span>{log.date}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-mono font-bold px-3 py-1 rounded-badge ${
                      log.ai_score >= 80 ? 'bg-success-bg text-success border border-success/35' :
                      log.ai_score >= 60 ? 'bg-warning-bg text-warning border border-warning/35' :
                      'bg-danger-bg text-danger border border-danger/35'
                    }`}>
                      {log.ai_score}/100 Score
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}

    </motion.div>
  );
};

export default Interview;
