import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import api from '../utils/api';
import { 
  MessageSquare, Edit3, Mic, Users, Play, Send, StopCircle, 
  Sparkles, CheckCircle2, AlertTriangle, Book, Volume2, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../utils/animations';

const Communication = () => {
  const { rewardXp } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('write'); // write | speak | gd

  // Section A: Written Trainer States
  const [emailType, setEmailType] = useState('Formal request email');
  const [emailText, setEmailText] = useState('');
  const [vocab, setVocab] = useState([]);
  const [writingFeedback, setWritingFeedback] = useState(null);
  const [analyzingWrite, setAnalyzingWrite] = useState(false);

  // Section B: Speaking Trainer States
  const [speakTopic, setSpeakTopic] = useState('Introduce yourself');
  const [isRecording, setIsRecording] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [recognitionInstance, setRecognitionInstance] = useState(null);
  const [analyzingSpeech, setAnalyzingSpeech] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState(null);

  // Section C: GD Simulator States
  const [gdActive, setGdActive] = useState(false);
  const [gdTopic, setGdTopic] = useState('');
  const [gdHistory, setGdHistory] = useState([]);
  const [gdRound, setGdRound] = useState(1);
  const [gdInput, setGdInput] = useState('');
  const [submittingGd, setSubmittingGd] = useState(false);
  const [gdScorecard, setGdScorecard] = useState(null);

  // Preload vocab and initiate Web Speech Recognition
  useEffect(() => {
    fetchVocab();
    initSpeechRecognition();
  }, []);

  const fetchVocab = async () => {
    try {
      const res = await api.get('/communication/vocabulary');
      setVocab(res.data.vocabulary || []);
    } catch (err) {
      console.warn("Could not fetch daily vocabulary.");
    }
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setSpeechText((finalTranscript + interimTranscript).trim());
    };

    recognition.onerror = (event) => {
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

    recognition.onend = () => {
      setIsRecording(false);
    };

    setRecognitionInstance(recognition);
  };

  // ----------------------------------------
  // SECTION A: EMAIL EVALUATION HANDLER
  // ----------------------------------------
  const handleEvaluateEmail = async () => {
    if (!emailText.trim()) {
      toast.error("Please write your email draft first!");
      return;
    }
    try {
      setAnalyzingWrite(true);
      setWritingFeedback(null);
      const res = await api.post('/communication/write/evaluate', {
        text: emailText,
        email_type: emailType
      });
      setWritingFeedback(res.data.analysis);
      rewardXp(res.data.xp_gained);
      toast.success(`Email analyzed! Gained ${res.data.xp_gained} XP.`);
    } catch (err) {
      toast.error("Failed to score the email.");
    } finally {
      setAnalyzingWrite(false);
    }
  };

  // ----------------------------------------
  // SECTION B: SPEAKING HANDLERS
  // ----------------------------------------
  const handleToggleRecord = () => {
    if (!recognitionInstance) {
      toast.error("Speech Recognition not supported or allowed in this browser. Please type your answer directly in the box!");
      return;
    }

    if (isRecording) {
      try {
        recognitionInstance.stop();
      } catch (err) {
        console.error("Failed to stop SpeechRecognition:", err);
      }
      setIsRecording(false);
      toast.success("Recording complete. Speech converted to text!");
    } else {
      setSpeechText('');
      setSpeechFeedback(null);
      try {
        recognitionInstance.start();
        setIsRecording(true);
        toast.success("Microphone active. Speak now...");
      } catch (err) {
        console.error("Failed to start SpeechRecognition:", err);
        toast.error("Could not activate microphone. It may already be in use.");
        setIsRecording(false);
      }
    }
  };

  const handleEvaluateSpeech = async () => {
    if (!speechText.trim()) {
      toast.error("Speak or type something to analyze!");
      return;
    }
    try {
      setAnalyzingSpeech(true);
      setSpeechFeedback(null);
      const res = await api.post('/communication/speak/evaluate', {
        text: speechText,
        topic: speakTopic
      });
      setSpeechFeedback(res.data.analysis);
      rewardXp(res.data.xp_gained);
      toast.success(`Speech graded! Gained ${res.data.xp_gained} XP.`);
    } catch (err) {
      toast.error("Failed to analyze speech.");
    } finally {
      setAnalyzingSpeech(false);
    }
  };

  // ----------------------------------------
  // SECTION C: GD SIMULATOR HANDLERS
  // ----------------------------------------
  const handleStartGd = async () => {
    try {
      setSubmittingGd(true);
      setGdScorecard(null);
      const res = await api.post('/communication/gd/start');
      setGdTopic(res.data.topic);
      setGdHistory(res.data.history);
      setGdRound(res.data.round);
      setGdActive(true);
    } catch (err) {
      toast.error("Failed to start GD session.");
    } finally {
      setSubmittingGd(false);
    }
  };

  const handleSendGdMessage = async () => {
    if (!gdInput.trim()) {
      toast.error("Please enter your argument!");
      return;
    }
    try {
      setSubmittingGd(true);
      const res = await api.post('/communication/gd/respond', {
        topic: gdTopic,
        user_message: gdInput,
        history: gdHistory,
        round: gdRound
      });

      setGdHistory(res.data.history);
      setGdRound(res.data.round);
      setGdInput('');

      if (res.data.completed) {
        setGdScorecard(res.data.scorecard);
        setGdActive(false);
        rewardXp(res.data.scorecard.xp_gained);
        toast.success(`GD Completed! Gained ${res.data.scorecard.xp_gained} XP.`);
      }
    } catch (err) {
      toast.error("Group participants failed to reply.");
    } finally {
      setSubmittingGd(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="space-y-6 pb-12"
    >
      
      {/* Tabs selector */}
      <div className="bg-background-card border border-black/10 dark:border-white/5 p-1 rounded-badge shadow-card flex space-x-1">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveTab('write')}
          className={`flex-1 py-2.5 rounded-button text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'write'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'
          }`}
        >
          <Edit3 size={16} />
          <span>Written Trainer</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveTab('speak')}
          className={`flex-1 py-2.5 rounded-button text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'speak'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'
          }`}
        >
          <Mic size={16} />
          <span>Speaking Trainer</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveTab('gd')}
          className={`flex-1 py-2.5 rounded-button text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'gd'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'
          }`}
        >
          <Users size={16} />
          <span>GD Simulator</span>
        </motion.button>
      </div>

      {/* SECTION A: WRITTEN EMAIL TRAINER */}
      {activeTab === 'write' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 bg-background-card border border-black/10 dark:border-white/5 p-6 rounded-card shadow-card space-y-4">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-text-primary flex items-center">
              <Edit3 size={18} className="mr-2 text-primary" />
              <span>Email Composition Trainer</span>
            </h2>

            <div className="flex items-center space-x-3 bg-black/5 dark:bg-white/5 p-3 rounded-input border border-black/5 dark:border-white/5">
              <span className="text-xs text-text-secondary font-semibold shrink-0">Exercise type:</span>
              <select
                value={emailType}
                onChange={(e) => setEmailType(e.target.value)}
                className="bg-transparent text-xs text-text-primary outline-none cursor-pointer w-full font-bold"
              >
                {['Formal request email', 'Complaint email', 'Thank you email', 'Follow up email', 'Introduction email'].map(c => (
                  <option key={c} value={c} className="bg-background-card text-text-primary">{c}</option>
                ))}
              </select>
            </div>

            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              rows={8}
              placeholder="Write your email draft here. Use formal headers, salutations, body details, and call to action signatures."
              className="w-full bg-background border border-black/10 dark:border-white/5 rounded-input p-4 font-mono text-xs text-text-primary outline-none focus:border-primary transition-all leading-relaxed"
            />

            <button
              onClick={handleEvaluateEmail}
              disabled={analyzingWrite}
              className="w-full py-3 bg-primary hover:opacity-90 text-white font-bold rounded-button text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
            >
              {analyzingWrite ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} className="fill-white" />}
              <span>Score Email Draft</span>
            </button>
          </div>

          {/* Sidebar Vocabulary Cards */}
          <div className="bg-background-card border border-black/10 dark:border-white/5 p-6 rounded-card shadow-card space-y-4">
            <h3 className="font-serif font-bold text-base text-text-primary flex items-center">
              <Book size={16} className="mr-2 text-secondary" />
              <span>Daily Vocabulary Builder</span>
            </h3>
            
            <div className="space-y-3">
              {vocab.map((v, i) => (
                <div key={i} className="p-3.5 bg-skyWash/20 dark:bg-white/5 border border-skyWash/30 dark:border-white/5 rounded-input space-y-1 hover:border-skyWash/50 transition-colors">
                  <h4 className="text-sm font-bold text-text-primary font-mono">{v.word}</h4>
                  <p className="text-xs text-text-secondary leading-normal">{v.meaning}</p>
                  <p className="text-xs text-text-primary italic mt-0.5">" {v.example} "</p>
                  <p className="text-xs text-secondary font-semibold font-sans mt-1">Tip: {v.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: SPEAKING TRAINER */}
      {activeTab === 'speak' && (
        <div className="bg-background-card border border-black/10 dark:border-white/5 p-6 md:p-8 rounded-card max-w-2xl mx-auto shadow-card space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-text-primary flex items-center">
              <Mic size={18} className="mr-2 text-primary animate-pulse" />
              <span>Spoken Speech Evaluator</span>
            </h2>
            
            <select
              value={speakTopic}
              onChange={(e) => setSpeakTopic(e.target.value)}
              className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-button py-1.5 px-3 text-xs text-text-primary outline-none cursor-pointer font-semibold"
            >
              {['Introduce yourself', 'Describe your hackathon project', 'Explain what an AI agent is simply', 'Your strengths and weaknesses', 'Why you want to join this company'].map(t => (
                <option key={t} value={t} className="bg-background-card text-text-primary">{t}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-background/50 rounded-card border border-black/5 dark:border-white/5 space-y-4">
            <button
              onClick={handleToggleRecord}
              className={`p-6 rounded-full transition-all duration-300 transform active:scale-95 shadow-md ${
                isRecording ? 'bg-danger text-white animate-pulse' : 'bg-primary text-white hover:opacity-90'
              }`}
            >
              {isRecording ? <StopCircle size={28} /> : <Mic size={28} />}
            </button>
            <span className="text-xs font-semibold text-text-secondary font-mono">
              {isRecording ? 'Recording voice feed... Click STOP to end' : 'Press MIC and speak for 60 seconds'}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-text-secondary font-semibold">Transcribed Voice Text (or type fallback):</span>
            <textarea
              value={speechText}
              onChange={(e) => setSpeechText(e.target.value)}
              disabled={isRecording}
              rows={4}
              placeholder="Captured speech text appears here..."
              className="w-full bg-background border border-black/10 dark:border-white/5 rounded-input p-4 font-mono text-xs text-text-primary outline-none focus:border-primary transition-all leading-relaxed"
            />
          </div>

          <button
            onClick={handleEvaluateSpeech}
            disabled={analyzingSpeech || isRecording}
            className="w-full py-3.5 bg-primary hover:opacity-90 text-white font-bold rounded-button text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all"
          >
            {analyzingSpeech ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} className="fill-white" />}
            <span>Evaluate Spoken Transcript</span>
          </button>
        </div>
      )}

      {/* SECTION C: GD SIMULATOR */}
      {activeTab === 'gd' && (
        <div className="bg-background-card border border-black/10 dark:border-white/5 p-6 rounded-card max-w-3xl mx-auto shadow-card space-y-6">
          {!gdActive && !gdScorecard && (
            <div className="text-center py-12 space-y-6">
              <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-primary">
                <Users size={32} />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-text-primary">Interactive Group Discussion Arena</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Participate in a simulated Group Discussion on hot industry topics. Argue, counter, and collaborate for 5 rounds against digital peers to earn communication badges.
                </p>
              </div>
              <button
                onClick={handleStartGd}
                disabled={submittingGd}
                className="py-3 px-8 bg-primary hover:opacity-90 text-white font-bold rounded-button text-xs shadow-md transition-all"
              >
                Start Group Discussion
              </button>
            </div>
          )}

          {gdActive && (
            <div className="space-y-4 flex flex-col justify-between h-[65vh]">
              {/* Header Topic */}
              <div className="bg-skyWash/20 dark:bg-white/5 p-4 rounded-input border border-skyWash/30 dark:border-white/5 flex justify-between items-center text-xs">
                <span className="font-bold text-text-primary truncate max-w-md">GD Topic: {gdTopic}</span>
                <span className="text-secondary font-bold shrink-0 ml-2">Round {gdRound} / 5</span>
              </div>

              {/* Chat thread */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-black/5 dark:bg-background/50 border border-black/5 dark:border-white/5 rounded-input">
                {gdHistory.map((chat, idx) => {
                  const isUser = chat.speaker === 'You';
                  const isMod = chat.speaker === 'Moderator';
                  return (
                    <div 
                      key={idx} 
                      className={`flex flex-col max-w-[80%] ${
                        isUser ? 'ml-auto items-end' : isMod ? 'mx-auto text-center items-center' : 'items-start'
                      }`}
                    >
                      <span className="text-[10px] text-text-secondary font-bold font-mono mb-1">{chat.speaker}</span>
                      <div className={`p-3 rounded-card text-xs leading-relaxed ${
                        isUser 
                          ? 'bg-skyWash text-ink rounded-tr-none border border-black/5 shadow-sm' 
                          : isMod 
                            ? 'bg-apricotWash/30 dark:bg-white/5 text-secondary italic border border-rust/10 dark:border-white/5 text-center' 
                            : 'bg-background border border-black/10 dark:border-white/5 text-text-primary rounded-tl-none p-3 shadow-sm'
                      }`}>
                        {chat.message}
                      </div>
                    </div>
                  );
                })}
                {submittingGd && (
                  <div className="flex items-center space-x-2 text-xs text-text-secondary">
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Peer is thinking of a counter...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex items-center space-x-2 bg-background p-2 rounded-input border border-black/10 dark:border-white/5">
                <input
                  type="text"
                  placeholder="Type your argument or counter statement here..."
                  value={gdInput}
                  onChange={(e) => setGdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendGdMessage()}
                  disabled={submittingGd}
                  className="bg-transparent text-xs text-text-primary outline-none w-full px-2"
                />
                <button
                  onClick={handleSendGdMessage}
                  disabled={submittingGd || !gdInput.trim()}
                  className="p-2.5 rounded-button bg-primary hover:opacity-90 text-white disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  <Send size={14} className="fill-white" />
                </button>
              </div>
            </div>
          )}

          {gdScorecard && (
            <div className="space-y-6 text-center animate-fade-in">
              <div className="bg-success-bg w-14 h-14 rounded-badge flex items-center justify-center mx-auto text-success">
                <CheckCircle2 size={28} />
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-success">Discussion Complete</span>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-text-primary">Group Discussion Scorecard</h3>
                <p className="text-xs text-text-secondary max-w-md mx-auto">{gdScorecard.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-xs my-4">
                <div className="bg-skyWash/20 dark:bg-background p-3 rounded-card border border-skyWash/30 dark:border-white/5 text-center">
                  <span className="text-[10px] text-text-secondary font-bold block uppercase">OVERALL SCORE</span>
                  <span className="text-2xl font-serif font-bold text-text-primary mt-1 block">{gdScorecard.overall_score}/100</span>
                </div>
                <div className="bg-apricotWash/20 dark:bg-background p-3 rounded-card border border-apricotWash/30 dark:border-white/5 text-center">
                  <span className="text-[10px] text-text-secondary font-bold block uppercase">COLLABORATION</span>
                  <span className="text-2xl font-serif font-bold text-text-primary mt-1 block">{gdScorecard.politeness_score}/10</span>
                </div>
              </div>

              <div className="p-5 bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-card text-left text-xs max-w-md mx-auto space-y-1.5 text-text-secondary shadow-sm">
                <span className="font-bold text-text-primary flex items-center">
                  <Sparkles size={12} className="mr-1.5 text-secondary" />
                  <span>Coach Feedback</span>
                </span>
                <p className="leading-relaxed">{gdScorecard.feedback}</p>
              </div>

              <button
                onClick={() => setGdScorecard(null)}
                className="py-3 px-8 bg-primary hover:opacity-90 text-white font-bold rounded-button text-xs shadow-md transition-all"
              >
                Practice Another Topic
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. WRITTEN REVIEW DRAWER CARD */}
      {activeTab === 'write' && writingFeedback && (
        <div className="bg-background-card border border-black/10 dark:border-primary/20 p-6 rounded-card shadow-card space-y-6 animate-slide-up">
          <div className="flex justify-between items-center pb-3 border-b border-black/5 dark:border-white/5">
            <h3 className="font-serif font-bold text-base text-text-primary flex items-center">
              <Sparkles size={16} className="mr-2 text-secondary" />
              <span>Email Composition Critique</span>
            </h3>
            <span className="text-sm font-bold font-mono px-3 py-1 bg-success-bg text-success rounded-badge">
              Overall Grade: {writingFeedback.overall_score}/100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
            
            {/* Dimensions grids */}
            <div className="space-y-4">
              <h4 className="font-bold text-text-primary">Scoring Metrics:</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Grammar Accuracy', score: writingFeedback.grammar_score },
                  { name: 'Concept Clarity', score: writingFeedback.clarity_score },
                  { name: 'Business Tone', score: writingFeedback.tone_score },
                  { name: 'Structure Format', score: writingFeedback.structure_score },
                ].map((m, i) => (
                  <div key={i} className="bg-black/5 dark:bg-background p-3 rounded-card border border-black/5 dark:border-white/5">
                    <span className="text-[10px] text-text-secondary font-bold block uppercase">{m.name}</span>
                    <span className="text-sm font-bold text-text-primary mt-1 block font-mono">{m.score}/10</span>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <span className="font-bold text-text-primary block">Detailed Grammar Fixes:</span>
                <div className="space-y-2">
                  {writingFeedback.corrections && writingFeedback.corrections.map((c, i) => (
                    <div key={i} className="p-3 bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 rounded-input">
                      <p className="text-danger line-through font-mono">Original: "{c.original}"</p>
                      <p className="text-success font-semibold font-mono mt-0.5">Corrected: "{c.corrected}"</p>
                      <p className="text-text-secondary text-xs italic mt-1">{c.explanation}</p>
                    </div>
                  ))}
                  {(!writingFeedback.corrections || writingFeedback.corrections.length === 0) && (
                    <p className="text-text-secondary italic">No major grammar errors detected! Excellent writing precision.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Polished copy */}
            <div className="space-y-3">
              <span className="font-bold text-text-primary block">Polished Mentor Email Version:</span>
              <div className="p-4 bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 rounded-input font-mono text-text-secondary leading-relaxed whitespace-pre-wrap max-h-[260px] overflow-y-auto">
                {writingFeedback.corrected_text}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. SPOKEN REVIEW DRAWER CARD */}
      {activeTab === 'speak' && speechFeedback && (
        <div className="bg-background-card border border-black/10 dark:border-primary/20 p-6 rounded-card shadow-card space-y-6 animate-slide-up">
          <div className="flex justify-between items-center pb-3 border-b border-black/5 dark:border-white/5">
            <h3 className="font-serif font-bold text-base text-text-primary flex items-center">
              <Sparkles size={16} className="mr-2 text-secondary" />
              <span>Voice Presentation Critique</span>
            </h3>
            <span className="text-sm font-bold font-mono px-3 py-1 bg-success-bg text-success rounded-badge">
              Presentation Grade: {speechFeedback.overall_score}/100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
            
            {/* Left feedback stats */}
            <div className="space-y-4">
              <h4 className="font-bold text-text-primary">Speaking Metrics:</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black/5 dark:bg-background p-3 rounded-card border border-black/5 dark:border-white/5 text-center">
                  <span className="text-[9px] text-text-secondary font-bold block uppercase">WORD COUNT</span>
                  <span className="text-sm font-bold text-text-primary mt-1 block font-mono">{speechFeedback.word_count} words</span>
                </div>
                <div className="bg-black/5 dark:bg-background p-3 rounded-card border border-black/5 dark:border-white/5 text-center">
                  <span className="text-[9px] text-text-secondary font-bold block uppercase">SPEECH PACE</span>
                  <span className="text-xs font-bold text-text-primary mt-1 block font-mono">{speechFeedback.pace_description?.split(' ')[0] || 'Optimal'}</span>
                </div>
                <div className="bg-black/5 dark:bg-background p-3 rounded-card border border-black/5 dark:border-white/5 text-center">
                  <span className="text-[9px] text-text-secondary font-bold block uppercase">VOCAB LEVEL</span>
                  <span className="text-sm font-bold text-text-primary mt-1 block font-mono">{speechFeedback.professional_language_score}/10</span>
                </div>
              </div>

              {/* Filler words list */}
              <div className="p-4 bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 rounded-card space-y-2">
                <span className="font-bold text-text-primary flex items-center text-[10px] uppercase">
                  <AlertTriangle size={12} className="mr-1 text-warning" />
                  <span>Filler Words Counter</span>
                </span>
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  {Object.entries(speechFeedback.filler_words || {}).map(([word, count]) => (
                    <div key={word} className={`p-2 rounded-input border ${count > 0 ? 'bg-danger-bg border-danger text-danger font-bold' : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-text-secondary'}`}>
                      <span className="block text-[10px]">{word}</span>
                      <span className="block text-xs mt-0.5">{count}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-text-secondary italic pt-1">
                  * Cognitive filters suggest maintaining filler word frequencies below 2 per minute to retain professional attention.
                </p>
              </div>
            </div>

            {/* Right corrections and tips */}
            <div className="space-y-3">
              <span className="font-bold text-text-primary block">Presentation Coach Feedback:</span>
              <div className="space-y-2">
                {speechFeedback.corrections && speechFeedback.corrections.map((c, i) => (
                  <div key={i} className="p-3 bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 rounded-input">
                    <p className="text-danger line-through font-mono">Spoken: "{c.original}"</p>
                    <p className="text-success font-semibold font-mono mt-0.5">Polished: "{c.corrected}"</p>
                    <p className="text-text-secondary text-xs italic mt-1">{c.explanation}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-skyWash/20 dark:bg-white/[0.01] border border-skyWash/30 dark:border-white/5 rounded-input text-[10px] text-text-secondary">
                <span className="font-semibold text-text-primary block mb-0.5">Speech Polish Tip:</span>
                "Try practicing breathing exercises and introducing silent pauses in place of verbal gaps ('um' / 'like'). Slow down by 10% to enunciate clearly."
              </div>
            </div>

          </div>
        </div>
      )}

    </motion.div>
  );
};

export default Communication;

