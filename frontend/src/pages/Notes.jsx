import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import api from '../utils/api';
import { 
  Edit3, Brain, Clipboard, Briefcase, Plus, Star, 
  Trash2, Search, CheckCircle, HelpCircle, Save, Sparkles, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const COMPANY_RESEARCH = {
  "Cognizant": {
    "desc": "Leading global IT service provider, famous for its GenC, GenC Elevate, and GenC Next hiring tiers.",
    "focus": "Generative AI, Web Services, Python/Java OOP concepts, SQL databases, and structured communication tests.",
    "salary": "INR 4.0 LPA – 6.5 LPA",
    "values": "Passion for client success, collaborative growth, and technological adaptability."
  },
  "TCS": {
    "desc": "India's largest IT exporter, executing hiring via the national-level TCS NQT (National Qualifier Test).",
    "focus": "Numerical Aptitude, Logical Reasoning, Advanced Coding (DSA, stacks, strings), and Email Writing.",
    "salary": "INR 3.36 LPA – 7.0 LPA",
    "values": "Leading change, integrity, excellence, and respect for the individual."
  },
  "Infosys": {
    "desc": "Multinational IT consulting giant, recruiting through the Infosys Certification and System Engineer routes.",
    "focus": "Advanced mathematical logic, verbal reasoning, object-oriented concepts, and puzzles.",
    "salary": "INR 3.6 LPA – 6.2 LPA",
    "values": "Client value, leadership by example, integrity, and fairness."
  },
  "Google": {
    "desc": "Global technology company, hiring software developers through strict technical algorithms screenings.",
    "focus": "Complex Data Structures (Trees, Graphs, Dynamic Programming) and Googleyness HR rounds.",
    "salary": "INR 12 LPA – 30+ LPA",
    "values": "Do the right thing, respect each other, and support the community."
  }
};

const CHECKLIST_ITEMS = [
  { id: 1, text: "Night Before: Revise the 2-minute project pitch and print 2 copies of your resume.", cat: "Night Before" },
  { id: 2, text: "Night Before: Sleep for at least 7-8 hours. A fresh mind solves analytical puzzles faster.", cat: "Night Before" },
  { id: 3, text: "Morning Of: Take a formal shower, wear a clean ironed collared shirt, and inspect webcams/mic.", cat: "Morning Of" },
  { id: 4, text: "Interactions: Greet the interviewer with a smile, sit erect, and ask permission before typing.", cat: "Greetings" },
  { id: 5, text: "End of Interview: Ask questions like 'What is the standard tool stack for freshers in your team?'", cat: "Questions to Ask" }
];

const Notes = () => {
  const { rewardXp } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('notes'); // notes | cards | company | checklist

  // Notes States
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteTopic, setNoteTopic] = useState('General');
  const [noteContent, setNoteContent] = useState('');
  const [noteSearch, setNoteSearch] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Flashcard States
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [newCardTopic, setNewCardTopic] = useState('Python');
  const [savingCard, setSavingCard] = useState(false);

  // Checklist state
  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem('interview_checklist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchNotes();
    fetchFlashcards();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/notes');
      setNotes(res.data.notes || []);
      if (res.data.notes && res.data.notes.length > 0 && !activeNoteId) {
        selectNote(res.data.notes[0]);
      }
    } catch (err) {
      console.warn("Failed to load notes.");
    }
  };

  const selectNote = (note) => {
    setActiveNoteId(note.id);
    setNoteTopic(note.topic);
    setNoteContent(note.content);
  };

  const handleCreateNewNote = () => {
    setActiveNoteId(null);
    setNoteTopic('General');
    setNoteContent('');
    toast.success("New note initialized. Type below!");
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) {
      toast.error("Please enter some note content first!");
      return;
    }
    try {
      setSavingNote(true);
      const res = await api.post('/notes', {
        id: activeNoteId,
        topic: noteTopic,
        content: noteContent
      });
      if (res.data.success) {
        toast.success("Note saved! +10 XP.");
        rewardXp(10);
        await fetchNotes();
        if (!activeNoteId) {
          setActiveNoteId(res.data.note_id);
        }
      }
    } catch (err) {
      toast.error("Failed to save note.");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await api.post('/notes/delete', { id });
      toast.success("Note deleted.");
      setActiveNoteId(null);
      setNoteContent('');
      setNoteTopic('General');
      fetchNotes();
    } catch (err) {
      toast.error("Failed to delete note.");
    }
  };

  const fetchFlashcards = async () => {
    try {
      const res = await api.get('/flashcards');
      setFlashcards(res.data.flashcards || []);
    } catch (err) {
      console.warn("Failed to load flashcards.");
    }
  };

  const handleAddCustomFlashcard = async (e) => {
    e.preventDefault();
    if (!newCardFront.trim() || !newCardBack.trim()) {
      toast.error("Please write the question and answer for the flashcard!");
      return;
    }

    try {
      setSavingCard(true);
      const res = await api.post('/flashcards', {
        topic: newCardTopic,
        front_text: newCardFront,
        back_text: newCardBack
      });
      if (res.data.success) {
        toast.success("Flashcard created! +10 XP.");
        rewardXp(10);
        setNewCardFront('');
        setNewCardBack('');
        setShowAddCard(false);
        fetchFlashcards();
      }
    } catch (err) {
      toast.error("Failed to create flashcard.");
    } finally {
      setSavingCard(false);
    }
  };

  const handleReviewCard = async (rating) => {
    const card = flashcards[currentCardIndex];
    try {
      const res = await api.post('/flashcards/review', { id: card.id, rating });
      if (res.data.success) {
        toast.success(`Reviewed card! Interval updated.`);
        rewardXp(5);
        setCardFlipped(false);
        
        if (currentCardIndex < flashcards.length - 1) {
          setCurrentCardIndex(currentCardIndex + 1);
        } else {
          setCurrentCardIndex(0);
          toast.success("Spaced repetition loop finished. Starting again!");
        }
        fetchFlashcards();
      }
    } catch (err) {
      toast.error("Failed to review card.");
    }
  };

  const handleToggleChecklist = (id) => {
    const isChecked = checklist.includes(id);
    let updated;
    if (isChecked) {
      updated = checklist.filter(item => item !== id);
    } else {
      updated = [...checklist, id];
    }
    setChecklist(updated);
    localStorage.setItem('interview_checklist', JSON.stringify(updated));
  };

  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(noteSearch.toLowerCase()) || 
    n.topic.toLowerCase().includes(noteSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Tabs Menu (rounded-button pill shape) */}
      <div className="bg-background-card border border-black/5 dark:border-white/5 p-2 rounded-button flex space-x-2 shadow-card">
        {['notes', 'cards', 'company', 'checklist'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 rounded-button text-xs font-bold capitalize transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === tab ? 'bg-primary text-white shadow-card' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {tab === 'notes' && <Edit3 size={14} />}
            {tab === 'cards' && <Brain size={14} />}
            {tab === 'company' && <Briefcase size={14} />}
            {tab === 'checklist' && <Clipboard size={14} />}
            <span>{tab === 'cards' ? 'Flashcards' : tab === 'company' ? 'Company Cards' : tab}</span>
          </button>
        ))}
      </div>

      {/* TABS 1: STUDY NOTES WRITER */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Notes Sidebar */}
          <div className="bg-background-card border border-black/5 dark:border-white/5 p-4 rounded-card h-[70vh] overflow-y-auto space-y-4 shadow-card">
            <div className="flex items-center space-x-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-input px-3 py-2.5 text-xs text-text-primary">
              <Search size={14} className="text-text-secondary" />
              <input
                type="text"
                placeholder="Search notes..."
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                className="bg-transparent text-text-primary outline-none w-full font-bold"
              />
            </div>

            {/* Secondary Action: Plain text link, no border */}
            <button
              onClick={handleCreateNewNote}
              className="text-xs font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer flex items-center space-x-1 py-1"
            >
              <Plus size={14} />
              <span>Create Note</span>
            </button>

            <div className="space-y-1">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`p-3 rounded-card border text-xs cursor-pointer flex justify-between items-center transition-all ${
                    activeNoteId === note.id 
                      ? 'bg-primary/10 border-primary text-text-primary font-bold' 
                      : 'bg-transparent border-transparent text-text-secondary hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] text-primary uppercase font-extrabold block">{note.topic}</span>
                    <p className="truncate text-text-primary text-xs mt-0.5 font-medium">{note.content.substring(0, 40) || '(Empty)'}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-danger shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Editor (2/3 size) */}
          <div className="md:col-span-2 bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card h-[70vh] flex flex-col justify-between shadow-card">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center space-x-2 bg-black/5 dark:bg-white/5 p-2.5 rounded-input border border-black/5 dark:border-white/5 text-xs text-text-primary">
                <span className="text-text-secondary font-semibold shrink-0">Topic Label:</span>
                <input
                  type="text"
                  value={noteTopic}
                  onChange={(e) => setNoteTopic(e.target.value)}
                  placeholder="e.g. SQL JOINs or HR Answers"
                  className="bg-transparent text-text-primary outline-none font-bold w-full"
                />
              </div>

              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your study notes or questions to review here. Saved to local SQLite database."
                className="w-full flex-1 bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 rounded-input p-4 font-serif text-sm text-text-primary outline-none focus:border-primary transition-all leading-relaxed"
              />
            </div>

            <div className="pt-4 mt-4 border-t border-black/5 dark:border-white/5 flex justify-between items-center bg-background-card text-xs">
              <span className="text-[10px] text-text-secondary font-mono flex items-center font-semibold">
                <Save size={10} className="mr-1" />
                <span>Auto-saved to local database</span>
              </span>
              
              {/* Single Primary CTA (rounded-button, Ink bg) */}
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="py-2.5 px-6 bg-primary hover:bg-primary/95 text-white font-bold rounded-button text-xs flex items-center space-x-1.5 transition-all shadow-card"
              >
                {savingNote ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABS 2: SPACED REPETITION FLASHCARDS */}
      {activeTab === 'cards' && (
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-black/5 dark:border-white/5">
            <h2 className="text-base font-serif font-bold text-text-primary flex items-center">
              <Brain size={18} className="mr-1.5 text-primary" />
              <span>Flashcard Review Arena</span>
            </h2>
            
            {/* Secondary Action: Plain text link, no border */}
            <button
              onClick={() => setShowAddCard(!showAddCard)}
              className="text-xs font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer flex items-center space-x-1"
            >
              <Plus size={14} />
              <span>Create custom card</span>
            </button>
          </div>

          {showAddCard && (
            <form onSubmit={handleAddCustomFlashcard} className="bg-background-card border border-black/5 dark:border-white/5 p-4 rounded-card space-y-3 animate-slide-up text-xs shadow-card text-text-primary">
              <h3 className="font-serif font-bold">Create Custom Flashcard</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-text-secondary font-semibold">Subject Category:</label>
                  <input
                    type="text"
                    value={newCardTopic}
                    onChange={(e) => setNewCardTopic(e.target.value)}
                    className="w-full bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 p-2.5 rounded-input text-text-primary outline-none"
                    placeholder="e.g. Python"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-text-secondary font-semibold">Front Question text:</label>
                <input
                  type="text"
                  value={newCardFront}
                  onChange={(e) => setNewCardFront(e.target.value)}
                  className="w-full bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 p-2.5 rounded-input text-text-primary outline-none"
                  placeholder="What is double equal vs single equal?"
                />
              </div>
              <div className="space-y-1">
                <label className="text-text-secondary font-semibold">Back Answer Explanation:</label>
                <input
                  type="text"
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                  className="w-full bg-black/5 dark:bg-background border border-black/5 dark:border-white/5 p-2.5 rounded-input text-text-primary outline-none"
                  placeholder="== compares values, = assigns references."
                />
              </div>
              {/* Form primary submit CTA (rounded-button, Ink bg) */}
              <button
                type="submit"
                disabled={savingCard}
                className="w-full py-2.5 bg-primary text-white rounded-button font-bold shadow-card"
              >
                Save Flashcard
              </button>
            </form>
          )}

          {/* Flashcard container */}
          {flashcards.length === 0 ? (
            <div className="bg-background-card border border-black/5 dark:border-white/5 p-12 rounded-card text-center text-text-secondary text-sm shadow-card">
              No flashcards generated. Pass quizzes or click 'Create custom card' to begin!
            </div>
          ) : (
            <div className="space-y-6">
              <div 
                onClick={() => setCardFlipped(!cardFlipped)}
                className="perspective-1000 w-full h-64 cursor-pointer group"
              >
                <div className={`w-full h-full transform-style-3d duration-500 relative ${cardFlipped ? 'rotate-y-180' : ''}`}>
                  {/* Front Face */}
                  <div className="absolute inset-0 bg-white dark:bg-background-card border border-black/5 dark:border-white/5 rounded-card p-6 flex flex-col justify-between backface-hidden shadow-card">
                    <span className="text-[9px] uppercase font-extrabold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-badge self-start">
                      {flashcards[currentCardIndex].topic}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-text-primary text-center flex-1 flex items-center justify-center px-4 leading-normal">
                      {flashcards[currentCardIndex].front_text}
                    </h3>
                    <span className="text-[9px] text-text-secondary text-center font-bold">Click card to reveal answer explanation</span>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 bg-white dark:bg-background-card border border-primary/30 rounded-card p-6 flex flex-col justify-between rotate-y-180 backface-hidden shadow-card">
                    <span className="text-[9px] uppercase font-extrabold text-secondary bg-secondary/15 border border-secondary/20 px-2.5 py-1 rounded-badge self-start">
                      Solution
                    </span>
                    <p className="text-sm font-medium text-text-primary text-center leading-relaxed flex-1 flex items-center justify-center px-4 font-serif">
                      {flashcards[currentCardIndex].back_text}
                    </p>
                    <span className="text-[9px] text-text-secondary text-center font-bold">Click card to flip back</span>
                  </div>
                </div>
              </div>

              {/* Review rating buttons */}
              {cardFlipped && (
                <div className="space-y-3 text-center animate-fade-in">
                  <span className="text-[9px] text-text-secondary uppercase font-extrabold block">Grade difficulty to schedule review date:</span>
                  <div className="flex space-x-2 text-xs font-bold text-white">
                    <button
                      onClick={() => handleReviewCard('easy')}
                      className="flex-1 py-2.5 bg-success/20 border border-success/30 hover:bg-success/35 text-success rounded-button"
                    >
                      Easy (7 Days)
                    </button>
                    <button
                      onClick={() => handleReviewCard('medium')}
                      className="flex-1 py-2.5 bg-warning/20 border border-warning/30 hover:bg-warning/35 text-warning rounded-button"
                    >
                      Medium (3 Days)
                    </button>
                    <button
                      onClick={() => handleReviewCard('hard')}
                      className="flex-1 py-2.5 bg-danger/20 border border-danger/30 hover:bg-danger/35 text-danger rounded-button"
                    >
                      Hard (1 Day)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TABS 3: COMPANY RESEARCH CHEATSHEET */}
      {activeTab === 'company' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(COMPANY_RESEARCH).map(([comp, details]) => (
            <div key={comp} className="bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card hover:border-black/15 dark:hover:border-white/10 transition-all space-y-4 shadow-card">
              <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2">
                <h3 className="font-serif font-bold text-base text-text-primary">{comp} overview</h3>
                <span className="text-[10px] text-secondary font-bold font-mono">{details.salary}</span>
              </div>

              <div className="space-y-2 text-xs leading-relaxed text-text-secondary font-medium">
                <p>Description: <span className="text-text-primary">{details.desc}</span></p>
                <p>Written assessment focus: <span className="text-text-primary font-bold">{details.focus}</span></p>
                <p>Corporate Values: <span className="text-primary font-bold italic">{details.values}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABS 4: INTERVIEW DAY CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="max-w-md mx-auto bg-background-card border border-black/5 dark:border-white/5 p-6 rounded-card space-y-6 shadow-card">
          <div className="border-b border-black/5 dark:border-white/5 pb-3">
            <h3 className="font-serif font-bold text-base text-text-primary flex items-center">
              <Clipboard size={18} className="mr-1.5 text-primary" />
              <span>Interview Day checklist</span>
            </h3>
            <p className="text-text-secondary text-xs mt-1">Complete checklists to keep structure during placements.</p>
          </div>

          <div className="space-y-4">
            {['Night Before', 'Morning Of', 'Greetings', 'Questions to Ask'].map(cat => {
              const items = CHECKLIST_ITEMS.filter(i => i.cat === cat);
              return (
                <div key={cat} className="space-y-2">
                  <span className="text-[9px] font-extrabold text-primary uppercase tracking-wider block">{cat}</span>
                  <div className="space-y-2">
                    {items.map(item => {
                      const checked = checklist.includes(item.id);
                      return (
                        <label 
                          key={item.id} 
                          className={`flex items-start p-3 rounded-card border text-xs cursor-pointer select-none transition-all ${
                            checked 
                              ? 'bg-success-bg border-success/35 text-text-secondary line-through' 
                              : 'bg-white dark:bg-background-card border-black/5 dark:border-white/5 text-text-primary hover:border-black/15 dark:hover:border-white/10 shadow-sm'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleChecklist(item.id)}
                            className="rounded border-black/10 dark:border-white/10 text-primary bg-background focus:ring-primary w-4 h-4 outline-none mr-3 mt-0.5 shrink-0"
                          />
                          <span className="font-medium">{item.text}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default Notes;
