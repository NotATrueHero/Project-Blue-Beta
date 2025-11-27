
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save } from 'lucide-react';
import { Note } from '../types';

export const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('blue_notes');
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  const saveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('blue_notes', JSON.stringify(updatedNotes));
  };

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Entry',
      content: '',
      date: new Date().toLocaleDateString()
    };
    saveNotes([newNote, ...notes]);
    setActiveNote(newNote);
  };

  const deleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
    if (activeNote?.id === id) setActiveNote(null);
  };

  const updateActiveNote = (field: 'title' | 'content', value: string) => {
    if (!activeNote) return;
    const updated = { ...activeNote, [field]: value };
    setActiveNote(updated);
    const updatedList = notes.map(n => n.id === updated.id ? updated : n);
    saveNotes(updatedList);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="w-full h-full pt-24 px-4 md:px-12 pb-12 flex flex-col md:flex-row gap-8 max-w-7xl mx-auto"
    >
      {/* Sidebar List */}
      <div className="w-full md:w-1/3 h-[300px] md:h-full border-4 border-white p-4 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold uppercase tracking-widest">Logs</h2>
          <button onClick={createNote} className="p-2 border-2 border-white hover:bg-white hover:text-black transition-colors">
            <Plus />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4">
          <AnimatePresence>
            {notes.map(note => (
              <motion.div
                key={note.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                onClick={() => setActiveNote(note)}
                className={`p-4 border-2 border-white cursor-pointer transition-all hover:translate-x-2 ${activeNote?.id === note.id ? 'bg-white text-black' : 'bg-transparent text-white'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold truncate max-w-[150px]">{note.title || 'Untitled'}</div>
                    <div className="text-xs opacity-60 mt-1">{note.date}</div>
                  </div>
                  <button onClick={(e) => deleteNote(e, note.id)} className="opacity-50 hover:opacity-100 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {notes.length === 0 && (
            <div className="text-center opacity-50 mt-10 italic">No logs found in memory.</div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="w-full md:w-2/3 h-full border-4 border-white p-8 flex flex-col relative">
        {activeNote ? (
          <>
            <input 
              type="text" 
              value={activeNote.title} 
              onChange={(e) => updateActiveNote('title', e.target.value)}
              className="bg-transparent text-3xl md:text-5xl font-bold uppercase mb-6 outline-none placeholder-white/30 text-white"
              placeholder="ENTRY TITLE"
            />
            <div className="w-full h-[2px] bg-white/20 mb-6" />
            <textarea 
              value={activeNote.content}
              onChange={(e) => updateActiveNote('content', e.target.value)}
              className="flex-1 bg-transparent resize-none outline-none text-lg leading-relaxed font-light placeholder-white/30 text-white"
              placeholder="Begin typing secure log..."
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-50">
              <Save size={14} /> Auto-Saved
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40">
            <div className="text-6xl font-bold mb-4">SELECT LOG</div>
            <p className="uppercase tracking-widest">Or create a new entry to begin</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
