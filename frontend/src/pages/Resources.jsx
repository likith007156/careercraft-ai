import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Library, CheckCircle2, Bookmark, ExternalLink, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Resources = () => {
  const [resources, setResources] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Python');
  
  // Track completed resources in local storage
  const [completedList, setCompletedList] = useState(() => {
    const list = localStorage.getItem('completed_resources');
    return list ? JSON.parse(list) : [];
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await api.get('/progress/resources');
      setResources(res.data.resources || {});
    } catch (err) {
      toast.error("Failed to load curated resources.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = (name) => {
    const isCompleted = completedList.includes(name);
    let updated;
    if (isCompleted) {
      updated = completedList.filter(item => item !== name);
      toast.success("Resource marked as incomplete.");
    } else {
      updated = [...completedList, name];
      toast.success("Resource completed! +10 XP effort.", { icon: '🎉' });
    }
    setCompletedList(updated);
    localStorage.setItem('completed_resources', JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-text-secondary">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-3"></div>
        <p>Structuring reference resources...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header bar */}
      <div className="bg-background-card border border-black/10 dark:border-white/5 p-6 rounded-card shadow-card flex items-center space-x-4">
        <div className="bg-primary/5 w-12 h-12 rounded-card flex items-center justify-center text-primary shrink-0">
          <Library size={24} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-text-primary tracking-tight">Curated Placement Library</h1>
          <p className="text-text-secondary text-xs mt-1 font-medium">
            Free, expert-vetted courses, books, and visual tools to accelerate your placement preparation.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto space-x-1 bg-background-card border border-black/10 dark:border-white/5 p-1 rounded-badge shadow-card">
        {Object.keys(resources).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-5 rounded-button text-xs font-bold transition-all shrink-0 ${
              activeTab === tab 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Resource cards list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources[activeTab] && resources[activeTab].map((res, i) => {
          const isDone = completedList.includes(res.name);
          return (
            <div 
              key={i} 
              className={`bg-background-card border p-6 rounded-card flex flex-col justify-between shadow-card hover:border-black/20 dark:hover:border-white/10 transition-all ${
                isDone ? 'border-success/30 bg-success-bg' : 'border-black/10 dark:border-white/5'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-badge ${
                    res.type === 'Video' ? 'bg-danger-bg text-danger' : 'bg-skyWash text-ink'
                  }`}>
                    {res.type}
                  </span>
                  <span className="text-[10px] text-text-secondary font-mono font-semibold">{res.time} | {res.difficulty}</span>
                </div>
                
                <h3 className="font-serif font-bold text-lg text-text-primary leading-snug">{res.name}</h3>
                <p className="text-xs text-text-secondary leading-relaxed mt-1">{res.description}</p>
              </div>

              <div className="flex items-center justify-between pt-5 mt-4 border-t border-black/5 dark:border-white/5">
                <label className="flex items-center space-x-2 text-xs text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => handleToggleComplete(res.name)}
                    className="rounded border-black/20 dark:border-white/10 text-primary bg-background focus:ring-primary w-4 h-4 outline-none"
                  />
                  <span>Mark as Completed</span>
                </label>

                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-text-primary hover:underline font-bold text-xs flex items-center space-x-1.5 transition-all"
                >
                  <span>Open Resource</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips box */}
      <div className="bg-apricotWash/20 dark:bg-white/[0.01] border border-rust/10 dark:border-white/5 p-4 rounded-input flex items-start space-x-3 text-xs text-text-secondary">
        <Bookmark className="text-secondary shrink-0 mt-0.5" size={16} />
        <div>
          <span className="font-bold text-text-primary block">Placement Advice:</span>
          <p>Prioritize Harvard CS50P for core programming. Striver A2Z and IndiaBIX worksheets are heavily relied upon during TCS/Cognizant written aptitude screenings.</p>
        </div>
      </div>

    </div>
  );
};

export default Resources;

