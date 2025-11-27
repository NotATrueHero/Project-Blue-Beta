import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Globe, Trash2, ExternalLink } from 'lucide-react';
import { Bookmark } from '../types';

export const Bookmarks: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('blue_uplinks');
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  const saveBookmarks = (updated: Bookmark[]) => {
    setBookmarks(updated);
    localStorage.setItem('blue_uplinks', JSON.stringify(updated));
  };

  const addBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    
    // Ensure URL has protocol
    let formattedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      formattedUrl = 'https://' + url;
    }

    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      title,
      url: formattedUrl
    };
    saveBookmarks([...bookmarks, newBookmark]);
    setTitle('');
    setUrl('');
    setIsAdding(false);
  };

  const removeBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = bookmarks.filter(b => b.id !== id);
    saveBookmarks(updated);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="w-full h-full pt-24 px-6 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col"
    >
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b-2 border-white pb-6 gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Uplink</h1>
          <p className="text-sm md:text-base uppercase tracking-widest opacity-70">Secure External Network Bridge</p>
        </div>
        
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)} 
            className="flex items-center gap-2 border-2 border-white px-6 py-3 font-bold uppercase hover:bg-white hover:text-blue-base transition-colors"
          >
            <Plus size={20} />
            <span>New Coordinates</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={addBookmark}
            className="w-full bg-blue-base/50 border-2 border-white p-6 mb-12 flex flex-col md:flex-row gap-4 items-end overflow-hidden"
          >
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-70">Designation</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Command Center"
                className="w-full bg-transparent border-b-2 border-white/30 focus:border-white outline-none py-2 text-lg font-bold placeholder-white/20"
                autoFocus
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-70">Target URL</label>
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="google.com"
                className="w-full bg-transparent border-b-2 border-white/30 focus:border-white outline-none py-2 text-lg font-bold placeholder-white/20"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                <button type="submit" className="flex-1 md:flex-none border-2 border-white px-6 py-2 font-bold uppercase hover:bg-white hover:text-blue-base transition-colors">
                    Save
                </button>
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 md:flex-none border-2 border-transparent px-6 py-2 font-bold uppercase hover:text-red-300 transition-colors">
                    Cancel
                </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 overflow-y-auto hide-scrollbar">
        {bookmarks.map((bookmark) => (
          <a
            key={bookmark.id}
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative h-48 border-4 border-white p-6 flex flex-col justify-between hover:bg-white hover:text-blue-base transition-all duration-300 hover:-translate-y-1 block"
          >
             <div className="flex justify-between items-start">
               <Globe className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
               <button 
                  onClick={(e) => removeBookmark(e, bookmark.id)}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all z-10"
               >
                  <Trash2 size={20} />
               </button>
             </div>
             
             <div>
                <div className="text-2xl font-bold uppercase leading-tight mb-2 break-words line-clamp-2">{bookmark.title}</div>
                <div className="flex items-center gap-2 text-xs font-mono opacity-60 group-hover:opacity-100 truncate">
                   <ExternalLink size={12} />
                   <span className="truncate">{bookmark.url}</span>
                </div>
             </div>
          </a>
        ))}
        
        {bookmarks.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center opacity-40 border-4 border-white/20 border-dashed">
             <Globe size={48} className="mb-4" />
             <div className="text-xl font-bold uppercase tracking-widest">No Active Links</div>
             <p className="mt-2">Initialize new coordinates to begin.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};