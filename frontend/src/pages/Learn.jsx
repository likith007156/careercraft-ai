import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import api from '../utils/api';
import { 
  BookOpen, ChevronRight, HelpCircle, CheckCircle, 
  XCircle, Clock, Sparkles, Star, AlertTriangle, ArrowRight 
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const Learn = () => {
  const { user, rewardXp } = useContext(AppContext);
  const [syllabus, setSyllabus] = useState(null);
  const [loadingPaths, setLoadingPaths] = useState(true);
  
  // Active Topic State
  const [activeTopic, setActiveTopic] = useState("Python Programming");
  const [activeSubtopic, setActiveSubtopic] = useState("Variables and Data Types");
  
  // Lesson Content State
  const [lesson, setLesson] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Post Lesson Quiz state
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [userAnswers, setUserAnswers] = useState({}); // q_id -> option text
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [scoring, setScoring] = useState(false);

  // Failure re-education state
  const [failedAnalogy, setFailedAnalogy] = useState(null);

  const handleScroll = (e) => {
    const element = e.target;
    const totalHeight = element.scrollHeight - element.clientHeight;
    if (totalHeight > 0) {
      setScrollProgress(Math.min(100, Math.round((element.scrollTop / totalHeight) * 100)));
    }
  };

  const fetchPaths = async () => {
    try {
      setLoadingPaths(true);
      const res = await api.get('/learning/paths');
      setSyllabus(res.data.syllabus);
    } catch (err) {
      toast.error("Failed to load syllabus items.");
    } finally {
      setLoadingPaths(false);
    }
  };

  const loadLesson = async (topic, subtopic) => {
    try {
      setLoadingLesson(true);
      setLesson(null);
      setQuizQuestions(null);
      setQuizSubmitted(false);
      setQuizResults(null);
      setFailedAnalogy(null);
      setUserAnswers({});
      
      const res = await api.get(`/learning/lesson?topic=${encodeURIComponent(topic)}&subtopic=${encodeURIComponent(subtopic)}`);
      setLesson(res.data);
    } catch (err) {
      toast.error("Failed to generate lesson content.");
    } finally {
      setLoadingLesson(false);
    }
  };

  useEffect(() => {
    fetchPaths();
  }, []);

  useEffect(() => {
    if (activeTopic && activeSubtopic) {
      loadLesson(activeTopic, activeSubtopic);
    }
  }, [activeTopic, activeSubtopic]);

  const handleSubtopicClick = (topicName, subName) => {
    if (quizQuestions && !quizSubmitted) {
      toast.error("You must complete the active lesson quiz before leaving!");
      return;
    }
    setActiveTopic(topicName);
    setActiveSubtopic(subName);
  };

  const handleReadLesson = async () => {
    try {
      setScoring(true);
      const res = await api.post('/learning/read', {
        topic: activeTopic,
        subtopic: activeSubtopic,
        content: lesson.content
      });
      if (res.data.success) {
        setQuizQuestions(res.data.questions);
        toast.success("Read registered! Lesson quiz unlocked below.", { icon: '📝' });
        setTimeout(() => {
          document.getElementById('quiz-anchor')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    } catch (err) {
      toast.error("Could not trigger quiz questions.");
    } finally {
      setScoring(false);
    }
  };

  const handleSelectOption = (qId, optionText) => {
    if (quizSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qId]: optionText }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(userAnswers).length < quizQuestions.length) {
      toast.error("Please answer all 5 questions before submitting!");
      return;
    }

    try {
      setScoring(true);
      const res = await api.post('/learning/submit_quiz', {
        topic: activeTopic,
        subtopic: activeSubtopic,
        questions: quizQuestions,
        answers: userAnswers,
        lesson_content: lesson.content
      });

      setQuizResults(res.data);
      setQuizSubmitted(true);

      if (res.data.passed) {
        toast.success(`Congratulations! Passed with ${res.data.score_percentage}%.`);
        rewardXp(res.data.xp_gained);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.8 }
        });
        fetchPaths();
      } else {
        toast.error(`Fail. Score: ${res.data.score_percentage}%. Need 70% to pass.`);
        setFailedAnalogy(res.data.re_explanation);
        setQuizQuestions(res.data.new_questions);
        setUserAnswers({});
        setQuizSubmitted(false);
        setQuizResults(null);
      }
    } catch (err) {
      toast.error("Failed to grade quiz answers.");
    } finally {
      setScoring(false);
    }
  };

  // Helper to parse formatting (editorial typography)
  const renderFormattedMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n\n').map((block, idx) => {
      if (block.startsWith('```')) {
        const lines = block.split('\n');
        const codeText = lines.slice(1, -1).join('\n');
        return (
          <pre key={idx} className="bg-black/5 dark:bg-background p-4 rounded-input border border-black/5 dark:border-white/5 font-mono text-xs text-secondary overflow-x-auto my-4 shadow-sm">
            <code className="text-text-primary font-mono">{codeText}</code>
          </pre>
        );
      }
      
      if (block.startsWith('### ')) {
        return <h3 key={idx} className="text-lg font-serif font-bold text-text-primary mt-6 mb-2">{block.replace('### ', '')}</h3>;
      }
      if (block.startsWith('## ')) {
        return <h2 key={idx} className="text-xl font-serif font-bold text-text-primary mt-8 mb-3 border-b border-black/5 dark:border-white/5 pb-1">{block.replace('## ', '')}</h2>;
      }
      
      if (block.startsWith('* ') || block.startsWith('- ')) {
        return (
          <ul key={idx} className="list-disc pl-5 space-y-1.5 my-3 text-text-secondary text-sm">
            {block.split('\n').map((line, lidx) => (
              <li key={lidx}>{line.substring(2)}</li>
            ))}
          </ul>
        );
      }

      return (
        <p 
          key={idx} 
          className="text-text-primary text-[15px] font-serif leading-relaxed my-3" 
          dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
        />
      );
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in pb-12">
      
      {/* 1. PROGRESS SIDEBAR (Fog background) */}
      <div className="lg:col-span-1 bg-background-sidebar border border-black/5 dark:border-white/5 p-4 rounded-card h-[80vh] overflow-y-auto space-y-4 shadow-card">
        <h2 className="font-serif font-bold text-sm text-text-primary px-2 flex items-center">
          <BookOpen size={16} className="mr-2 text-primary" />
          <span>Syllabus Map</span>
        </h2>
        
        {loadingPaths ? (
          <div className="space-y-4 py-8">
            <div className="h-6 bg-black/5 dark:bg-white/5 rounded animate-skeleton w-3/4 mx-auto"></div>
            <div className="h-24 bg-black/5 dark:bg-white/5 rounded animate-skeleton"></div>
          </div>
        ) : (
          syllabus && Object.entries(syllabus).map(([section, topics]) => (
            <div key={section} className="space-y-2">
              <span className="text-[9px] font-extrabold tracking-wider text-primary uppercase px-2">{section}</span>
              <div className="space-y-1">
                {topics.map((item) => (
                  <div key={item.topic} className="space-y-1">
                    <p className="text-xs font-bold text-text-secondary px-2 mt-2 leading-tight">{item.topic}</p>
                    <div className="space-y-0.5">
                      {item.subtopics.map((sub) => {
                        const active = activeSubtopic === sub.name && activeTopic === item.topic;
                        return (
                          <button
                            key={sub.name}
                            onClick={() => handleSubtopicClick(item.topic, sub.name)}
                            className={`w-full text-left py-2 px-3 rounded-card text-xs font-semibold border flex items-center justify-between transition-all ${
                              active 
                                ? 'bg-primary text-white font-bold shadow-card' 
                                : 'bg-transparent border-transparent text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'
                            }`}
                          >
                            <span className="truncate pr-2">{sub.name}</span>
                            
                            {/* Pastel mastery status indicators */}
                            {sub.color === 'gold' ? (
                              <span className="flex items-center space-x-0.5 bg-apricotWash px-1.5 py-0.5 rounded-badge text-[9px] text-rust border border-rust/10 font-extrabold">
                                <span>⭐</span>
                                <span className="hidden xl:inline text-[8px] uppercase">Mast</span>
                              </span>
                            ) : (
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                sub.color === 'green' ? 'bg-success-bg border-success text-success' :
                                sub.color === 'yellow' ? 'bg-warning-bg border-warning text-warning' :
                                sub.color === 'red' ? 'bg-danger-bg border-danger text-danger' :
                                'bg-black/5 dark:bg-white/5 border-dove/30 text-dove'
                              }`} title={`Status: ${sub.color || 'Not Started'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
 
      {/* 2. LESSON VIEWER (White card, editorial typography) */}
      <div className="lg:col-span-3 flex flex-col space-y-6">
        
        {/* Scroll reading progress bar */}
        <div className="bg-background-card border border-black/5 dark:border-white/5 p-4 rounded-card flex items-center justify-between shadow-card">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-extrabold text-primary">{activeTopic}</span>
            <h1 className="text-lg md:text-xl font-serif font-bold text-text-primary truncate">{activeSubtopic}</h1>
          </div>
          {lesson && (
            <div className="flex items-center space-x-3 shrink-0">
              <span className="text-xs text-text-secondary flex items-center font-mono">
                <Clock size={12} className="mr-1" />
                <span>{lesson.read_time_mins} min read</span>
              </span>
              <div className="w-16 bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden hidden sm:block">
                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${scrollProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Lesson Body Box (White card) */}
        <div 
          onScroll={handleScroll}
          className="bg-white dark:bg-background-card border border-black/5 dark:border-white/5 rounded-card p-6 md:p-8 h-[60vh] overflow-y-auto scroll-smooth shadow-card"
        >
          {loadingLesson ? (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-3"></div>
              <p className="text-xs font-mono">Claude is writing the lesson plan...</p>
            </div>
          ) : lesson ? (
            <div className="space-y-6">
              {/* Failed quiz re-education analogy */}
              {failedAnalogy && (
                <div className="p-4 rounded-card bg-danger-bg border border-danger/25 text-xs space-y-2 animate-pulse mb-6 text-danger">
                  <h4 className="font-serif font-bold flex items-center text-sm">
                    <AlertTriangle size={14} className="mr-1.5" />
                    <span>Alternative Analogy Study</span>
                  </h4>
                  <p className="leading-relaxed italic">
                    "{failedAnalogy}"
                  </p>
                </div>
              )}

              {/* Takeaways Grid */}
              <div className="p-4 rounded-card bg-black/[0.01] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                <h4 className="text-xs font-extrabold text-text-primary flex items-center mb-2">
                  <Sparkles size={14} className="mr-1.5 text-secondary" />
                  <span>Key Points to Master</span>
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-text-secondary">
                  {lesson.key_points && lesson.key_points.map((pt, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-primary mr-1.5">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Markdown Content */}
              <div className="prose dark:prose-invert max-w-none font-serif">
                {renderFormattedMarkdown(lesson.content)}
              </div>

              {/* Single Primary CTA Button (rounded-button, Ink bg) */}
              {!quizQuestions && (
                <div className="pt-6 border-t border-black/5 dark:border-white/5">
                  <button
                    onClick={handleReadLesson}
                    disabled={scoring}
                    className="w-full bg-primary hover:bg-primary/95 text-white py-4 rounded-button font-bold flex items-center justify-center space-x-2 transition-transform active:scale-[0.99] disabled:opacity-50 shadow-card"
                  >
                    {scoring ? 'Synchronizing Quiz...' : 'I Have Read This Lesson'}
                    {!scoring && <ArrowRight size={16} />}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary text-sm">
              Please select a topic to begin studying.
            </div>
          )}
        </div>

        {/* 3. POST LESSON QUIZ PANEL */}
        {quizQuestions && (
          <div id="quiz-anchor" className="bg-background-card border border-black/5 dark:border-white/5 rounded-card p-6 shadow-card space-y-6 animate-slide-up">
            <div className="flex justify-between items-center pb-3 border-b border-black/5 dark:border-white/5">
              <h3 className="font-serif font-bold text-sm text-text-primary flex items-center">
                <HelpCircle size={16} className="mr-2 text-primary" />
                <span>Post-Lesson Evaluation</span>
              </h3>
              <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-badge">
                Required to Pass (70%+)
              </span>
            </div>

            <div className="space-y-6">
              {quizQuestions.map((q, idx) => {
                const answer = userAnswers[q.id];
                const isSelected = (opt) => answer === opt;
                
                return (
                  <div key={q.id} className="space-y-3">
                    <p className="text-xs font-bold text-text-secondary">
                      Question {idx + 1}: {q.question}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleSelectOption(q.id, opt)}
                          disabled={quizSubmitted}
                          className={`p-3 text-left rounded-card text-xs font-semibold border transition-all ${
                            isSelected(opt)
                              ? 'bg-primary/10 border-primary text-text-primary'
                              : 'bg-white dark:bg-background-card border-black/5 dark:border-white/5 text-text-secondary hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Single Primary CTA */}
              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={scoring}
                  className="w-full bg-primary hover:bg-primary/95 text-white py-3.5 rounded-button font-bold text-sm transition-transform active:scale-[0.99] disabled:opacity-50 shadow-card"
                >
                  {scoring ? 'Evaluating Solutions...' : 'Submit Evaluation Answers'}
                </button>
              ) : (
                quizResults && (
                  <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-text-secondary">Overall Evaluation Score:</span>
                      <span className={quizResults.passed ? 'text-success' : 'text-danger font-bold'}>
                        {quizResults.score_percentage}% ({quizResults.passed ? 'PASSED' : 'FAILED'})
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                      {quizResults.results.map((res, i) => (
                        <div key={i} className={`p-3 rounded-card border text-xs space-y-1.5 ${
                          res.is_correct ? 'bg-success-bg border-success/35 text-success' : 'bg-danger-bg border-danger/35 text-danger'
                        }`}>
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-text-primary">Q{i+1}: {res.question}</span>
                            {res.is_correct ? (
                              <CheckCircle size={14} className="text-success shrink-0 ml-2" />
                            ) : (
                              <XCircle size={14} className="text-danger shrink-0 ml-2" />
                            )}
                          </div>
                          <p className="text-text-secondary font-medium">Your Answer: <span className="font-mono text-text-primary">{res.user_answer}</span></p>
                          {!res.is_correct && <p className="text-text-secondary font-medium">Correct Answer: <span className="font-mono text-success">{res.correct_answer}</span></p>}
                          <p className="text-text-secondary text-[10px] leading-relaxed italic font-mono">{res.explanation}</p>
                        </div>
                      ))}
                    </div>

                    {/* Secondary Link: Plain text, no border */}
                    <button
                      onClick={() => loadLesson(activeTopic, activeSubtopic)}
                      className="text-xs font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer block mx-auto mt-4"
                    >
                      Reset and Re-Study Lesson &rarr;
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default Learn;
