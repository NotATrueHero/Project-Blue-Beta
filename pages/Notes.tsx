
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Trash2, Save, Folder, FolderPlus, GripVertical, ChevronRight } from 'lucide-react';
import { Note, NoteFolder } from '../types';

export const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null); // null = All Notes
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  useEffect(() => {
    const savedNotes = localStorage.getItem('blue_notes');
    const savedFolders = localStorage.getItem('blue_note_folders');
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedFolders) setFolders(JSON.parse(savedFolders));
  }, []);

  const saveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('blue_notes', JSON.stringify(updatedNotes));
  };

  const saveFolders = (updatedFolders: NoteFolder[]) => {
      setFolders(updatedFolders);
      localStorage.setItem('blue_note_folders', JSON.stringify(updatedFolders));
  };

  const createFolder = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFolderName.trim()) return;
      const folder: NoteFolder = { id: Date.now().toString(), name: newFolderName };
      saveFolders([...folders, folder]);
      setNewFolderName('');
      setIsAddingFolder(false);
  };

  const deleteFolder = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      // Move notes in this folder back to "All Notes" (undefined folderId)
      const updatedNotes = notes.map(n => n.folderId === id ? { ...n, folderId: undefined } : n);
      saveNotes(updatedNotes);
      saveFolders(folders.filter(f => f.id !== id));
      if (activeFolderId === id) setActiveFolderId(null);
  };

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Entry',
      content: '',
      date: new Date().toLocaleDateString(),
      folderId: activeFolderId || undefined
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

  const updateActiveNote = (field: keyof Note, value: string) => {
    if (!activeNote) return;
    const updated = { ...activeNote, [field]: value };
    setActiveNote(updated);
    const updatedList = notes.map(n => n.id === updated.id ? updated : n);
    saveNotes(updatedList);
  };

  const filteredNotes = activeFolderId 
      ? notes.filter(n => n.folderId === activeFolderId) 
      : notes;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="w-full h-full pt-24 px-4 md:px-12 pb-12 flex flex-col md:flex-row gap-8 max-w-7xl mx-auto"
    >
      {/* Sidebar */}
      <div className="w-full md:w-1/3 h-[500px] md:h-full border-4 border-white p-4 flex flex-col gap-6">
        
        {/* Folders Section */}
        <div className="flex flex-col gap-2 pb-4 border-b-2 border-white/20">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-70">Directories</h3>
                <button onClick={() => setIsAddingFolder(true)} className="hover:text-blue-300 transition-colors"><FolderPlus size={16} /></button>
            </div>
            
            {isAddingFolder && (
                <form onSubmit={createFolder} className="mb-2">
                    <input 
                        type="text" 
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        placeholder="DIR NAME..."
                        autoFocus
                        onBlur={() => setIsAddingFolder(false)}
                        className="w-full bg-transparent border-b border-white text-xs font-bold uppercase outline-none"
                    />
                </form>
            )}

            <div 
                onClick={() => setActiveFolderId(null)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer border border-transparent hover:border-white/50 transition-all ${activeFolderId === null ? 'bg-white text-blue-base font-bold' : 'text-white'}`}
            >
                <Folder size={14} /> <span>ALL LOGS</span>
            </div>
            
            <div className="overflow-y-auto max-h-[150px] hide-scrollbar space-y-1">
                {folders.map(folder => (
                    <div 
                        key={folder.id}
                        onClick={() => setActiveFolderId(folder.id)}
                        className={`group flex items-center justify-between px-3 py-2 cursor-pointer border border-transparent hover:border-white/50 transition-all ${activeFolderId === folder.id ? 'bg-white text-blue-base font-bold' : 'text-white'}`}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <ChevronRight size={12} /> <span className="uppercase text-sm truncate">{folder.name}</span>
                        </div>
                        <button onClick={(e) => deleteFolder(e, folder.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500">
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold uppercase tracking-widest">
                    {activeFolderId ? folders.find(f => f.id === activeFolderId)?.name : 'All Logs'}
                </h2>
                <button onClick={createNote} className="p-2 border-2 border-white hover:bg-white hover:text-black transition-colors">
                    <Plus size={16} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar">
                <Reorder.Group axis="y" values={filteredNotes} onReorder={(newOrder) => {
                     // Since filteredNotes is a subset, we need to carefully update the main list
                     // Ideally, we reorder the subset, then splice it back into the main list?
                     // Simplification for UX: We just update local state. 
                     // IMPORTANT: Reorder requires updating state immediately.
                     // Because we are filtering, direct reorder on filtered list needs mapping back.
                     // Strategy: Just save the new order of THESE notes, append the REST of the notes.
                     
                     const otherNotes = notes.filter(n => activeFolderId ? n.folderId !== activeFolderId : false);
                     // Wait, if activeFolderId is null, filteredNotes IS notes.
                     if (!activeFolderId) {
                         saveNotes(newOrder);
                     } else {
                         // Merging is tricky with drag reorder. 
                         // To avoid complexity in a simple backup system, we'll only allow reordering "All Logs" for now or just visual reorder.
                         // Actually, let's just update the list.
                         const reorderedIds = new Set(newOrder.map(n => n.id));
                         const others = notes.filter(n => !reorderedIds.has(n.id));
                         saveNotes([...newOrder, ...others]);
                     }
                }} className="space-y-3">
                    {filteredNotes.length === 0 && <div className="text-center opacity-40 text-xs mt-4">EMPTY DIRECTORY</div>}
                    
                    {filteredNotes.map(note => (
                        <Reorder.Item
                            key={note.id}
                            value={note}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative"
                        >
                            <div
                                onClick={() => setActiveNote(note)}
                                className={`group p-4 border-2 border-white cursor-pointer transition-all flex items-start gap-3 ${activeNote?.id === note.id ? 'bg-white text-black' : 'bg-transparent text-white hover:bg-white/10'}`}
                            >
                                <GripVertical className="opacity-20 group-hover:opacity-50 cursor-grab shrink-0 mt-1" size={16} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold truncate">{note.title || 'Untitled'}</div>
                                            <div className="text-xs opacity-60 mt-1">{note.date}</div>
                                        </div>
                                        <button onClick={(e) => deleteNote(e, note.id)} className="opacity-50 hover:opacity-100 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="w-full md:w-2/3 h-full border-4 border-white p-8 flex flex-col relative">
        {activeNote ? (
          <>
            <div className="flex justify-between items-start mb-6">
                <input 
                    type="text" 
                    value={activeNote.title} 
                    onChange={(e) => updateActiveNote('title', e.target.value)}
                    className="bg-transparent text-3xl md:text-5xl font-bold uppercase outline-none placeholder-white/30 text-white w-full"
                    placeholder="ENTRY TITLE"
                />
                
                {/* Folder Mover */}
                <div className="relative group shrink-0 ml-4">
                     <button className="flex items-center gap-2 text-xs font-bold uppercase border border-white px-2 py-1 opacity-60 hover:opacity-100">
                         <Folder size={12} />
                         {folders.find(f => f.id === activeNote.folderId)?.name || 'NO DIR'}
                     </button>
                     <div className="absolute right-0 top-full mt-1 w-32 bg-blue-base border border-white hidden group-hover:block z-20">
                         <div 
                             className="px-2 py-1 hover:bg-white hover:text-blue-base text-xs font-bold cursor-pointer"
                             onClick={() => updateActiveNote('folderId', '')}
                         >
                             NO DIR
                         </div>
                         {folders.map(f => (
                             <div 
                                key={f.id}
                                className="px-2 py-1 hover:bg-white hover:text-blue-base text-xs font-bold cursor-pointer truncate"
                                onClick={() => updateActiveNote('folderId', f.id)}
                             >
                                 {f.name}
                             </div>
                         ))}
                     </div>
                </div>
            </div>

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
