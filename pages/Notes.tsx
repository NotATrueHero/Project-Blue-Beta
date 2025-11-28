
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Trash2, Save, Folder, FolderPlus, GripVertical, ChevronRight, Eye, Edit3, FileText, Download, HardDrive, Hash, List, Type, Bold, Italic } from 'lucide-react';
import { Note, NoteFolder, FileItem } from '../types';

export const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  
  // Markdown State
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [notification, setNotification] = useState<string | null>(null);

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
      const updatedNotes = notes.map(n => n.folderId === id ? { ...n, folderId: undefined } : n);
      saveNotes(updatedNotes);
      saveFolders(folders.filter(f => f.id !== id));
      if (activeFolderId === id) setActiveFolderId(null);
  };

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Protocol',
      content: '# New Entry\n\nBegin secure log...',
      date: new Date().toLocaleDateString(),
      folderId: activeFolderId || undefined
    };
    saveNotes([newNote, ...notes]);
    setActiveNote(newNote);
    setViewMode('edit');
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

  // --- ACTIONS ---
  const downloadNote = () => {
      if (!activeNote) return;
      const blob = new Blob([activeNote.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification("DOWNLOAD COMPLETE");
  };

  const uploadToVault = () => {
      if (!activeNote) return;
      
      const fileData = btoa(unescape(encodeURIComponent(activeNote.content))); // Simple base64 for text
      const newFile: FileItem = {
          id: Date.now().toString(),
          name: `${activeNote.title}.md`,
          type: 'text/markdown',
          data: `data:text/markdown;base64,${fileData}`, // Add data URI prefix for consistency
          size: activeNote.content.length,
          date: new Date().toLocaleDateString(),
          folderId: undefined
      };

      const existingFiles = JSON.parse(localStorage.getItem('blue_files') || '[]');
      // Check quota
      if (JSON.stringify([...existingFiles, newFile]).length > 4.5 * 1024 * 1024) {
          showNotification("VAULT FULL: CANNOT UPLOAD");
          return;
      }

      localStorage.setItem('blue_files', JSON.stringify([...existingFiles, newFile]));
      showNotification("ENCRYPTED TO VAULT");
  };

  const showNotification = (msg: string) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 2000);
  };

  const insertText = (before: string, after: string = '') => {
      const textarea = document.getElementById('note-editor') as HTMLTextAreaElement;
      if (!textarea || !activeNote) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = activeNote.content;
      const selection = text.substring(start, end);
      
      const newText = text.substring(0, start) + before + selection + after + text.substring(end);
      updateActiveNote('content', newText);
      
      // Restore focus/cursor next tick
      setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + before.length, end + before.length);
      }, 0);
  };

  // --- MARKDOWN RENDERER ---
  const handleWikiLink = (linkName: string) => {
      const target = notes.find(n => n.title.toLowerCase() === linkName.toLowerCase());
      if (target) {
          setActiveNote(target);
          setViewMode('preview'); // Stay in preview when following links
      } else {
          showNotification(`LINK NOT FOUND: ${linkName}`);
      }
  };

  const renderMarkdown = (text: string) => {
      if (!text) return null;

      // 1. Split by newlines to handle blocks
      const lines = text.split('\n');
      const rendered: React.ReactNode[] = [];
      
      let inCodeBlock = false;
      
      lines.forEach((line, idx) => {
          // Code Block
          if (line.trim().startsWith('```')) {
              inCodeBlock = !inCodeBlock;
              return; // Skip the marker line
          }
          if (inCodeBlock) {
              rendered.push(<div key={idx} className="font-mono text-xs bg-black/40 text-green-400 p-1 pl-4 border-l-2 border-green-500/50">{line}</div>);
              return;
          }

          // Headers
          if (line.startsWith('# ')) {
              rendered.push(<h1 key={idx} className="text-3xl font-bold mt-6 mb-4 border-b border-white/20 pb-2 uppercase tracking-tighter">{processInline(line.slice(2))}</h1>);
              return;
          }
          if (line.startsWith('## ')) {
              rendered.push(<h2 key={idx} className="text-2xl font-bold mt-5 mb-3 text-blue-200 uppercase tracking-wide">{processInline(line.slice(3))}</h2>);
              return;
          }
          if (line.startsWith('### ')) {
              rendered.push(<h3 key={idx} className="text-xl font-bold mt-4 mb-2 text-blue-300">{processInline(line.slice(4))}</h3>);
              return;
          }

          // Blockquote
          if (line.startsWith('> ')) {
              rendered.push(<blockquote key={idx} className="border-l-4 border-white/50 pl-4 py-2 my-2 italic bg-white/5">{processInline(line.slice(2))}</blockquote>);
              return;
          }

          // Lists
          if (line.trim().startsWith('- ')) {
              rendered.push(<li key={idx} className="ml-6 list-disc marker:text-blue-400 pl-1 my-1">{processInline(line.replace('- ', ''))}</li>);
              return;
          }

          // Paragraph (default)
          if (line.trim() === '') {
              rendered.push(<div key={idx} className="h-4" />);
          } else {
              rendered.push(<p key={idx} className="leading-relaxed mb-1">{processInline(line)}</p>);
          }
      });

      return rendered;
  };

  const processInline = (text: string): React.ReactNode[] => {
      // Regex for Bold, Italic, WikiLinks
      // Need to split by tokens and map
      // This is a simplified parser
      const parts: React.ReactNode[] = [];
      
      // Helper to push text
      // const pushText = (t: string) => parts.push(t); // Unused

      // We'll process WikiLinks [[Link]] first as they are most complex
      const wikiRegex = /\[\[(.*?)\]\]/g;
      let lastIndex = 0;
      let match;

      while ((match = wikiRegex.exec(text)) !== null) {
          // Text before link
          if (match.index > lastIndex) {
              parts.push(...processFormatting(text.substring(lastIndex, match.index)));
          }
          
          // The Link
          const linkText = match[1];
          parts.push(
              <span 
                key={`wiki-${match.index}`} 
                onClick={() => handleWikiLink(linkText)}
                className="text-[#a78bfa] font-bold cursor-pointer hover:underline bg-[#a78bfa]/10 px-1 rounded"
              >
                  {linkText}
              </span>
          );
          
          lastIndex = wikiRegex.lastIndex;
      }
      
      if (lastIndex < text.length) {
          parts.push(...processFormatting(text.substring(lastIndex)));
      }

      return parts;
  };

  const processFormatting = (text: string): React.ReactNode[] => {
      // Bold **text**
      const parts: React.ReactNode[] = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(text)) !== null) {
          if (match.index > lastIndex) parts.push(processItalic(text.substring(lastIndex, match.index)));
          parts.push(<strong key={`b-${match.index}`} className="font-bold text-white">{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < text.length) parts.push(processItalic(text.substring(lastIndex)));
      return parts;
  };

  const processItalic = (text: string): React.ReactNode => {
      // Simple logic: returns array or string
      const parts: React.ReactNode[] = [];
      const regex = /\*(.*?)\*/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
          parts.push(<em key={`i-${match.index}`} className="italic text-blue-200">{match[1]}</em>);
          lastIndex = regex.lastIndex;
      }
      if (lastIndex < text.length) parts.push(text.substring(lastIndex));
      return parts;
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
      <div className="w-full md:w-1/3 h-[300px] md:h-full border-4 border-white p-4 flex flex-col gap-6 bg-black/20">
        
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
                <h2 className="text-xl font-bold uppercase tracking-widest truncate">
                    {activeFolderId ? folders.find(f => f.id === activeFolderId)?.name : 'All Logs'}
                </h2>
                <button onClick={createNote} className="p-2 border-2 border-white hover:bg-white hover:text-black transition-colors" title="New Entry">
                    <Plus size={16} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar">
                <Reorder.Group axis="y" values={filteredNotes} onReorder={(newOrder) => {
                     if (!activeFolderId) {
                         saveNotes(newOrder);
                     } else {
                         const reorderedIds = new Set(newOrder.map(n => n.id));
                         const others = notes.filter(n => !reorderedIds.has(n.id));
                         saveNotes([...newOrder, ...others]);
                     }
                }} className="space-y-2">
                    {filteredNotes.length === 0 && <div className="text-center opacity-40 text-xs mt-4">EMPTY DIRECTORY</div>}
                    
                    {filteredNotes.map(note => (
                        <Reorder.Item
                            key={note.id}
                            value={note}
                            className="relative"
                        >
                            <div
                                onClick={() => setActiveNote(note)}
                                className={`group p-3 border-l-4 cursor-pointer transition-all flex items-start gap-3 hover:bg-white/5 ${activeNote?.id === note.id ? 'border-white bg-white/10' : 'border-white/20'}`}
                            >
                                <GripVertical className="opacity-20 group-hover:opacity-50 cursor-grab shrink-0 mt-1" size={14} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <div className={`font-bold truncate text-sm uppercase tracking-wider ${activeNote?.id === note.id ? 'text-blue-200' : 'text-white'}`}>{note.title || 'Untitled'}</div>
                                            <div className="text-[10px] opacity-50 mt-1 font-mono">{note.date}</div>
                                        </div>
                                        <button onClick={(e) => deleteNote(e, note.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1">
                                            <Trash2 size={12} />
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
      <div className="w-full md:w-2/3 h-full border-4 border-white flex flex-col relative bg-[#020617]">
        {activeNote ? (
          <>
            {/* Toolbar */}
            <div className="h-12 border-b border-white/20 flex items-center justify-between px-4 bg-white/5 shrink-0">
                <div className="flex gap-1">
                    <button onClick={() => insertText('**', '**')} className="p-1.5 hover:bg-white/10 rounded text-xs" title="Bold"><Bold size={14} /></button>
                    <button onClick={() => insertText('*', '*')} className="p-1.5 hover:bg-white/10 rounded text-xs" title="Italic"><Italic size={14} /></button>
                    <button onClick={() => insertText('# ')} className="p-1.5 hover:bg-white/10 rounded text-xs" title="Heading"><Type size={14} /></button>
                    <button onClick={() => insertText('- ')} className="p-1.5 hover:bg-white/10 rounded text-xs" title="List"><List size={14} /></button>
                    <button onClick={() => insertText('[[', ']]')} className="p-1.5 hover:bg-white/10 rounded text-xs text-purple-300" title="WikiLink"><Hash size={14} /></button>
                </div>

                <div className="flex gap-4">
                    <button onClick={uploadToVault} className="p-1.5 hover:text-blue-300 transition-colors" title="Encrypt to Vault">
                        <HardDrive size={16} />
                    </button>
                    <button onClick={downloadNote} className="p-1.5 hover:text-blue-300 transition-colors" title="Download .MD">
                        <Download size={16} />
                    </button>
                    <div className="w-px h-4 bg-white/20 self-center" />
                    <button 
                        onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                        className={`flex items-center gap-2 text-xs font-bold uppercase px-3 py-1 rounded transition-colors ${viewMode === 'preview' ? 'bg-blue-600 text-white' : 'hover:bg-white/10'}`}
                    >
                        {viewMode === 'edit' ? <Eye size={14} /> : <Edit3 size={14} />}
                        {viewMode === 'edit' ? 'Preview' : 'Editor'}
                    </button>
                </div>
            </div>

            {/* Note Title Input */}
            <div className="px-8 pt-6 pb-2 shrink-0">
                <input 
                    type="text" 
                    value={activeNote.title} 
                    onChange={(e) => updateActiveNote('title', e.target.value)}
                    className="bg-transparent text-3xl md:text-4xl font-bold uppercase outline-none placeholder-white/30 text-white w-full border-none"
                    placeholder="PROTOCOL TITLE"
                />
                
                <div className="flex items-center gap-2 mt-2 text-xs opacity-50 uppercase tracking-widest">
                    <Folder size={12} />
                    {folders.find(f => f.id === activeNote.folderId)?.name || 'ROOT DIRECTORY'}
                </div>
            </div>

            {/* Editor / Preview Content */}
            <div className="flex-1 relative overflow-hidden">
                {viewMode === 'edit' ? (
                    <textarea 
                        id="note-editor"
                        value={activeNote.content}
                        onChange={(e) => updateActiveNote('content', e.target.value)}
                        className="w-full h-full bg-transparent resize-none outline-none text-sm md:text-base leading-relaxed font-mono placeholder-white/20 text-white/90 p-8 pt-4 selection:bg-blue-500/50"
                        placeholder="Enter directives..."
                        spellCheck={false}
                    />
                ) : (
                    <div className="w-full h-full overflow-y-auto p-8 pt-4 markdown-body">
                        {renderMarkdown(activeNote.content)}
                    </div>
                )}
            </div>

            <div className="absolute bottom-2 right-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-30 pointer-events-none">
              <Save size={10} /> Auto-Saved // Markdown Enabled
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-blue-base px-4 py-2 font-bold uppercase text-xs tracking-widest shadow-lg"
                    >
                        {notification}
                    </motion.div>
                )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
            <FileText size={64} className="mb-6 stroke-1" />
            <div className="text-2xl font-bold uppercase tracking-widest mb-2">Select Log</div>
            <p className="text-xs uppercase tracking-widest">Or initiate new entry to begin</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};