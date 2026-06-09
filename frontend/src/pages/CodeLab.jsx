import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import api from '../utils/api';
import Editor from '@monaco-editor/react';
import { 
  Code2, Play, Send, Sparkles, RefreshCw, 
  Clock, Zap, CheckCircle2, XCircle, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

const CodeLab = () => {
  const { user, rewardXp } = useContext(AppContext);
  
  // Selection states
  const [language, setLanguage] = useState('python');
  const [difficulty, setDifficulty] = useState('Easy');
  const [category, setCategory] = useState('strings');

  // Problem state
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [loadingProblem, setLoadingProblem] = useState(false);

  // Submission/grading state
  const [submittingCode, setSubmittingCode] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Pre-load default daily challenge on first mount
  const loadDailyChallenge = () => {
    setLanguage('python');
    setDifficulty('Easy');
    setCategory('loops');
    setProblem({
      problem_title: "Daily Challenge: FizzBuzz Solver",
      description: "Write a function `fizzbuzz(n)` that returns a list of strings representation of numbers from 1 to `n`. But for multiples of three it should output `Fizz` instead of the number and for the multiples of five output `Buzz`. For numbers which are multiples of both three and five output `FizzBuzz`.",
      starter_code: "def fizzbuzz(n: int) -> list:\n    # Write your python solution here\n    pass",
      test_cases: [
        { "input": "n = 5", "output": "['1', '2', 'Fizz', '4', 'Buzz']" },
        { "input": "n = 15", "output": "...['14', 'FizzBuzz']" }
      ],
      bonus_xp: 40
    });
    setCode("def fizzbuzz(n: int) -> list:\n    # Write your python solution here\n    pass");
  };

  useEffect(() => {
    loadDailyChallenge();
  }, []);

  const generateProblem = async () => {
    try {
      setLoadingProblem(true);
      setFeedback(null);
      
      const res = await api.post('/code/generate', {
        language: language,
        difficulty: difficulty,
        category: category
      });

      setProblem(res.data);
      setCode(res.data.starter_code || '');
      toast.success("New placement problem generated!", { icon: '⚡' });
    } catch (err) {
      toast.error("Failed to generate coding problem.");
    } finally {
      setLoadingProblem(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      toast.error("Please write some code before submitting!");
      return;
    }

    try {
      setSubmittingCode(true);
      setFeedback(null);

      const res = await api.post('/code/submit', {
        problem_title: problem.problem_title,
        code_submitted: code,
        language: language,
        difficulty: difficulty,
        bonus_xp: problem.bonus_xp || 20
      });

      setFeedback(res.data);

      if (res.data.is_correct) {
        toast.success(`Success! Score: ${res.data.score}/100. Correctness verified.`);
        rewardXp(res.data.xp_gained);
      } else {
        toast.error(`Solution failed logic checks. Score: ${res.data.score}/100.`);
      }
    } catch (err) {
      toast.error("Failed to grade your solution.");
    } finally {
      setSubmittingCode(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header controls (Light/Dark-aware cards) */}
      <div className="bg-background-card border border-black/5 dark:border-white/5 p-4 rounded-card flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
        <div className="flex items-center space-x-3">
          <Code2 className="text-primary" />
          <h1 className="text-lg font-serif font-bold text-text-primary">IT Placement Coding Lab</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Language selector */}
          <div className="flex items-center space-x-2 bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-input border border-black/5 dark:border-white/5 text-xs text-text-primary">
            <span className="text-text-secondary font-semibold">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-text-primary outline-none cursor-pointer font-bold"
            >
              <option value="python" className="bg-background text-text-primary">Python</option>
              <option value="sql" className="bg-background text-text-primary">SQL</option>
            </select>
          </div>

          {/* Difficulty selector */}
          <div className="flex items-center space-x-2 bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-input border border-black/5 dark:border-white/5 text-xs text-text-primary">
            <span className="text-text-secondary font-semibold">Diff:</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-transparent text-text-primary outline-none cursor-pointer font-bold"
            >
              {['Easy', 'Medium', 'Hard'].map(d => (
                <option key={d} value={d} className="bg-background text-text-primary">{d}</option>
              ))}
            </select>
          </div>

          {/* Category selector */}
          <div className="flex items-center space-x-2 bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-input border border-black/5 dark:border-white/5 text-xs text-text-primary">
            <span className="text-text-secondary font-semibold">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-text-primary outline-none cursor-pointer font-bold"
            >
              {language === 'python' ? (
                ['strings', 'loops', 'conditions', 'functions', 'lists', 'recursion', 'OOP'].map(c => (
                  <option key={c} value={c} className="bg-background text-text-primary">{c}</option>
                ))
              ) : (
                ['basic SELECT', 'joins', 'aggregates', 'subqueries', 'complex joins'].map(c => (
                  <option key={c} value={c} className="bg-background text-text-primary">{c}</option>
                ))
              )}
            </select>
          </div>

          {/* Secondary Action: Plain text link, no border */}
          <button
            onClick={generateProblem}
            disabled={loadingProblem}
            className="text-xs font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer flex items-center space-x-1"
          >
            {loadingProblem ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>Generate Problem</span>
          </button>
        </div>
      </div>

      {/* 2. Workspace container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Side: Problem Card */}
        <div className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card h-[65vh] overflow-y-auto space-y-5 flex flex-col justify-between shadow-card">
          {loadingProblem ? (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              <p className="text-xs font-mono">Claude is writing the problem specifications...</p>
            </div>
          ) : problem ? (
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-serif font-bold text-text-primary leading-snug">{problem.problem_title}</h2>
                <span className="text-[10px] font-extrabold text-success bg-success-bg px-2.5 py-1 rounded-badge border border-success/35">
                  +{problem.bonus_xp} XP Bonus
                </span>
              </div>
              
              <div className="text-sm text-text-secondary leading-relaxed space-y-3 whitespace-pre-wrap font-serif">
                {problem.description}
              </div>

              {/* Sample Test cases */}
              <div className="space-y-2.5 pt-4 border-t border-black/5 dark:border-white/5">
                <span className="text-xs font-bold text-text-primary flex items-center">
                  <Clock size={14} className="mr-1.5 text-secondary" />
                  <span>Sample Test Cases</span>
                </span>
                <div className="space-y-2">
                  {problem.test_cases && problem.test_cases.map((tc, idx) => (
                    <div key={idx} className="bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 rounded-input p-3 font-mono text-xs text-text-primary">
                      <p><span className="text-primary font-bold">Input:</span> {tc.input}</p>
                      <p className="mt-1"><span className="text-success font-bold">Output:</span> {tc.output}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary text-sm">
              Press "Generate Problem" to load coding challenges.
            </div>
          )}
          
          <div className="text-[10px] text-text-secondary pt-4 border-t border-black/5 dark:border-white/5 flex items-center">
            <AlertCircle size={12} className="mr-1.5 text-primary" />
            <span>Simulated compiler: Syntax logic is verified using mentor metrics.</span>
          </div>
        </div>

        {/* Right Side: Monaco Editor */}
        <div className="bg-background-card border border-black/5 dark:border-white/5 rounded-card overflow-hidden flex flex-col h-[65vh] justify-between shadow-card">
          <div className="bg-black/[0.02] dark:bg-white/[0.02] py-3 px-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">Monaco Code Editor</span>
            <span className="font-mono text-text-secondary uppercase">{language === 'python' ? 'Python3' : 'SQLite'}</span>
          </div>

          <div className="flex-1 min-h-0 bg-[#1e1e1e]">
            <Editor
              height="100%"
              defaultLanguage={language}
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 15, bottom: 15 }
              }}
            />
          </div>

          <div className="p-4 border-t border-black/5 dark:border-white/5 flex items-center justify-end space-x-3 bg-background-card">
            {/* Primary CTA (pill shape rounded-button, Ink bg in light mode) */}
            <button
              onClick={handleSubmitCode}
              disabled={submittingCode || !problem}
              className="py-3 px-6 bg-primary hover:bg-primary/95 text-white font-bold rounded-button text-xs flex items-center space-x-1.5 transition-transform active:scale-[0.98] disabled:opacity-50 shadow-card"
            >
              {submittingCode ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} className="fill-white" />}
              <span>Submit Solution</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. AI FEEDBACK DRAWER */}
      {feedback && (
        <div className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card shadow-card space-y-6 animate-slide-up">
          <div className="flex justify-between items-center pb-3 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center space-x-2">
              <Sparkles size={18} className="text-secondary" />
              <h3 className="font-serif font-bold text-sm text-text-primary">Evaluation Scorecard</h3>
            </div>
            <span className={`text-xs font-bold font-mono px-3 py-1 rounded-badge ${
              feedback.is_correct ? 'bg-success-bg text-success border border-success/35' : 'bg-danger-bg text-danger border border-danger/35'
            }`}>
              {feedback.score}/100 ({feedback.is_correct ? 'Correct' : 'Logic Errors'})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-text-primary">
            
            {/* Left breakdown */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="font-bold text-text-primary flex items-center">
                  <CheckCircle2 size={14} className="mr-1.5 text-success" />
                  <span>Correct Aspects</span>
                </span>
                <p className="text-text-secondary pl-5">{feedback.what_was_right}</p>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-text-primary flex items-center">
                  <XCircle size={14} className="mr-1.5 text-danger" />
                  <span>Algorithmic Bottlenecks</span>
                </span>
                <p className="text-text-secondary pl-5">{feedback.what_was_wrong}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-black/5 dark:bg-background p-3 rounded-card border border-black/5 dark:border-white/5">
                  <span className="text-[9px] text-text-secondary font-bold block uppercase">TIME COMPLEXITY</span>
                  <span className="text-xs font-bold text-text-primary mt-1 block font-mono">{feedback.time_complexity}</span>
                </div>
                <div className="bg-black/5 dark:bg-background p-3 rounded-card border border-black/5 dark:border-white/5">
                  <span className="text-[9px] text-text-secondary font-bold block uppercase">SPACE COMPLEXITY</span>
                  <span className="text-xs font-bold text-text-primary mt-1 block font-mono">{feedback.space_complexity}</span>
                </div>
              </div>
            </div>

            {/* Right solution code box */}
            <div className="space-y-3">
              <span className="font-bold text-text-primary block">AI Optimal Solution:</span>
              <pre className="bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 p-4 rounded-input font-mono text-[11px] text-secondary overflow-x-auto max-h-[180px]">
                <code className="text-text-primary font-mono">{feedback.better_solution}</code>
              </pre>
              
              <div className="pt-2">
                <span className="font-bold text-[9px] text-text-secondary block uppercase mb-1">QUALITY REFACTOR TIPS</span>
                <ul className="list-disc pl-5 space-y-1 text-text-secondary font-medium">
                  {feedback.quality_tips && feedback.quality_tips.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

      {submittingCode && (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-text-secondary">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-3"></div>
          <p className="text-xs font-mono">AI is running syntax checks and compiling code logic...</p>
        </div>
      )}

    </div>
  );
};

export default CodeLab;
