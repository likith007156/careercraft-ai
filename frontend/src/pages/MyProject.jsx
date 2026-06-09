import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import api from '../utils/api';
import { 
  Star, Send, Sparkles, BookOpen, Clock, 
  CheckCircle, ArrowRight, RefreshCw, HelpCircle, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

const MyProject = () => {
  const { rewardXp } = useContext(AppContext);
  const [formData, setFormData] = useState({
    project_name: 'E-commerce Recommendation AI',
    problem_solved: 'Traditional filtering searches are slow and lead to user conversion drops.',
    tech_used: 'React, Python, Flask, SQLite, Pandas, Claude API',
    role: 'Lead Backend Developer',
    key_features: 'Built a vectorized query matching algorithm and integrated Claude endpoints for sentiment tags.',
    challenges: 'High response latency from LLM calls during peak matching requests.',
    results: 'Reduced search-to-cart latency by 35% and increased conversion rates by 12%.',
    duration: '3 Months'
  });

  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);

  // Accordion active index
  const [activeFAQIndex, setActiveFAQIndex] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.project_name || !formData.problem_solved || !formData.tech_used) {
      toast.error("Please fill in the project title, problem, and technology stack!");
      return;
    }

    try {
      setGenerating(true);
      setResults(null);

      const res = await api.post('/project/explain', formData);
      setResults(res.data.results);
      rewardXp(res.data.xp_gained);
      toast.success(`Project explained! Gained ${res.data.xp_gained} XP. Guides generated!`, { icon: '✨' });
    } catch (err) {
      toast.error("Failed to generate project explanation.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12">
      <div className="bg-background-card border border-black/10 dark:border-white/5 p-6 rounded-card shadow-card flex items-center space-x-4 mb-6">
        <div className="bg-primary/5 w-12 h-12 rounded-card flex items-center justify-center text-primary shrink-0">
          <Star size={24} className="fill-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-text-primary tracking-tight">My Project Explainer</h1>
          <p className="text-text-secondary text-xs mt-1 font-medium">
            Fill in your college project details, and our AI compiler will draft scripts, FAQ lists, and resume polishers.
          </p>
        </div>
      </div>

      {/* Grid: Form vs outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Form Inputs (2/5 size) */}
        <form 
          onSubmit={handleSubmit}
          className="lg:col-span-2 bg-background-card border border-black/10 dark:border-white/5 p-5 rounded-card shadow-card space-y-4"
        >
          <h3 className="font-serif font-bold text-base text-text-primary">Project Parameters</h3>
          
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-text-secondary font-semibold">Project Title Name:</label>
              <input
                type="text"
                value={formData.project_name}
                onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                className="w-full bg-background border border-black/10 dark:border-white/5 p-3 rounded-input text-text-primary outline-none focus:border-primary transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-text-secondary font-semibold">Problem Solved (Pain point):</label>
              <textarea
                value={formData.problem_solved}
                onChange={(e) => setFormData(prev => ({ ...prev, problem_solved: e.target.value }))}
                rows={2}
                className="w-full bg-background border border-black/10 dark:border-white/5 p-3 rounded-input text-text-primary outline-none focus:border-primary transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-text-secondary font-semibold">Technology Stack (Comma separated):</label>
              <input
                type="text"
                value={formData.tech_used}
                onChange={(e) => setFormData(prev => ({ ...prev, tech_used: e.target.value }))}
                className="w-full bg-background border border-black/10 dark:border-white/5 p-3 rounded-input text-text-primary outline-none focus:border-primary transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-text-secondary font-semibold">Your Role:</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-background border border-black/10 dark:border-white/5 p-3 rounded-input text-text-primary outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-text-secondary font-semibold">Duration:</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full bg-background border border-black/10 dark:border-white/5 p-3 rounded-input text-text-primary outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-text-secondary font-semibold">Key Features Built:</label>
              <textarea
                value={formData.key_features}
                onChange={(e) => setFormData(prev => ({ ...prev, key_features: e.target.value }))}
                rows={2}
                className="w-full bg-background border border-black/10 dark:border-white/5 p-3 rounded-input text-text-primary outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-text-secondary font-semibold">Key Challenges Faced:</label>
              <textarea
                value={formData.challenges}
                onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))}
                rows={2}
                className="w-full bg-background border border-black/10 dark:border-white/5 p-3 rounded-input text-text-primary outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-text-secondary font-semibold">Impact Results Achieved:</label>
              <textarea
                value={formData.results}
                onChange={(e) => setFormData(prev => ({ ...prev, results: e.target.value }))}
                rows={2}
                className="w-full bg-background border border-black/10 dark:border-white/5 p-3 rounded-input text-text-primary outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full py-3 bg-primary hover:opacity-90 text-white font-bold rounded-button text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md disabled:opacity-50"
          >
            {generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} className="fill-white" />}
            <span>Generate Pitch & Prep Manual</span>
          </button>
        </form>        {/* Results output layout (3/5 size) */}
        <div className="lg:col-span-3 space-y-6">
          {generating ? (
            <div className="bg-background-card border border-black/10 dark:border-white/5 p-12 rounded-card text-center space-y-3 shadow-card">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
              <p className="text-xs text-text-secondary font-mono">Claude is refining project statistics and drafting FAQs...</p>
            </div>
          ) : results ? (
            <div className="space-y-6 animate-fade-in text-xs">
              
              {/* Pitch tabs */}
              <div className="bg-background-card border border-black/10 dark:border-white/5 p-5 rounded-card shadow-card space-y-3">
                <span className="font-serif font-bold text-sm text-text-primary block mb-2 uppercase tracking-wide">Verbal Pitch Scripts</span>
                
                <div className="space-y-3">
                  <div className="p-3 bg-skyWash/20 dark:bg-background border border-skyWash/30 dark:border-white/5 rounded-input">
                    <div className="flex justify-between items-center text-[10px] text-primary font-bold mb-1.5">
                      <span>30-SECOND ELEVATOR PITCH</span>
                      <span className="flex items-center"><Clock size={10} className="mr-0.5" /> 30s</span>
                    </div>
                    <p className="text-text-secondary leading-relaxed font-mono">
                      "{results.elevator_pitch_30s}"
                    </p>
                  </div>

                  <div className="p-3 bg-apricotWash/20 dark:bg-background border border-apricotWash/30 dark:border-white/5 rounded-input">
                    <div className="flex justify-between items-center text-[10px] text-secondary font-bold mb-1.5">
                      <span>2-MINUTE VERBAL PRESENTATION</span>
                      <span className="flex items-center"><Clock size={10} className="mr-0.5" /> 2m</span>
                    </div>
                    <p className="text-text-secondary leading-relaxed font-mono">
                      "{results.verbal_script_2min}"
                    </p>
                  </div>
                </div>
              </div>

              {/* 10 Placement FAQ Accordion */}
              <div className="bg-background-card border border-black/10 dark:border-white/5 p-5 rounded-card shadow-card space-y-3">
                <span className="font-serif font-bold text-sm text-text-primary block mb-2 uppercase tracking-wide">10 Common Interview Questions</span>
                <div className="space-y-2">
                  {results.common_questions && results.common_questions.map((faq, idx) => {
                    const open = activeFAQIndex === idx;
                    return (
                      <div key={idx} className="border border-black/10 dark:border-white/5 rounded-input bg-background overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setActiveFAQIndex(open ? null : idx)}
                          className="w-full text-left p-3 text-xs font-bold text-text-primary flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <span>{idx+1}. {faq.question}</span>
                          <span className="text-primary font-bold">{open ? '−' : '+'}</span>
                        </button>
                        {open && (
                          <div className="p-4 bg-black/5 dark:bg-white/[0.01] border-t border-black/10 dark:border-white/5 text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Technical Deep Dive drill */}
              <div className="bg-background-card border border-black/10 dark:border-white/5 p-5 rounded-card shadow-card space-y-3">
                <span className="font-serif font-bold text-sm text-text-primary block mb-2 uppercase tracking-wide">Technical Deep Dive Drill</span>
                <div className="space-y-3">
                  {results.technical_deep_dive && results.technical_deep_dive.map((tech, idx) => (
                    <div key={idx} className="p-4 bg-background border border-black/10 dark:border-white/5 rounded-input space-y-1 animate-fade-in shadow-sm">
                      <span className="text-[10px] text-secondary font-extrabold uppercase">Expected Question</span>
                      <h4 className="font-bold text-text-primary text-xs">{tech.question}</h4>
                      <p className="text-xs text-text-secondary mt-1.5 leading-relaxed font-mono">
                        <span className="text-success font-bold font-sans text-[10px] uppercase block mb-0.5">Suggested Response:</span>
                        "{tech.suggested_answer}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact refactor recommendations */}
              <div className="bg-background-card border border-black/10 dark:border-white/5 p-5 rounded-card shadow-card space-y-3">
                <span className="font-serif font-bold text-sm text-text-primary block mb-2 uppercase tracking-wide">How to Make It Sound More Impressive</span>
                <div className="space-y-2 pl-2">
                  {results.impact_improvements && results.impact_improvements.map((imp, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-text-secondary leading-relaxed">
                      <CheckCircle size={12} className="text-success shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-background-card border border-black/10 dark:border-white/5 p-12 rounded-card shadow-card text-center text-text-secondary text-xs">
              <Sparkles size={24} className="mx-auto text-primary mb-3" />
              <span>Fill out the form and submit to receive interview presentation blueprints.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MyProject;
