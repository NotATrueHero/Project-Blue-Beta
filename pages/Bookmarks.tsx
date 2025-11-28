
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Globe, Trash2, ExternalLink, Edit2, FolderPlus, ArrowUpDown, Calendar, Clock, Type } from 'lucide-react';
import { Bookmark, BookmarkCategory, LinkOpenMode } from '../types';

interface BookmarksProps {
    linkOpenMode: LinkOpenMode;
}

type SortMode = 'newest' | 'oldest' | 'alpha';

export const Bookmarks: React.FC<BookmarksProps> = ({ linkOpenMode }) => {
  const [categories, setCategories] = useState<BookmarkCategory[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  
  // Adding Bookmark State
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newBookmarkUrl, setNewBookmarkUrl] = useState('');

  // Adding Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');

  // Renaming State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  useEffect(() => {
    const savedCats = localStorage.getItem('blue_uplink_categories');
    const savedSort = localStorage.getItem('blue_uplink_sort');
    
    if (savedCats) {
        setCategories(JSON.parse(savedCats));
    } else {
        // Fallback migration check happens in BootLoader, but safe check here
        const legacy = localStorage.getItem('blue_uplinks');
        if (legacy) {
            const legacyBookmarks: Bookmark[] = JSON.parse(legacy);
            const defaultCat: BookmarkCategory = {
                id: 'default',
                title: 'General',
                bookmarks: legacyBookmarks
            };
            setCategories([defaultCat]);
            localStorage.setItem('blue_uplink_categories', JSON.stringify([defaultCat]));
        } else {
            // Empty State
            const defaultCat: BookmarkCategory = {
                id: 'default',
                title: 'General',
                bookmarks: []
            };
            setCategories([defaultCat]);
            localStorage.setItem('blue_uplink_categories', JSON.stringify([defaultCat]));
        }
    }

    if (savedSort) {
        setSortMode(savedSort as SortMode);
    }
  }, []);

  const saveCategories = (updated: BookmarkCategory[]) => {
    setCategories(updated);
    localStorage.setItem('blue_uplink_categories', JSON.stringify(updated));
  };

  const cycleSortMode = () => {
      let next: SortMode = 'newest';
      if (sortMode === 'newest') next = 'oldest';
      else if (sortMode === 'oldest') next = 'alpha';
      else next = 'newest';
      
      setSortMode(next);
      localStorage.setItem('blue_uplink_sort', next);
  };

  const getSortedData = () => {
      // Clone to avoid mutating state directly during sort
      const sortedCats = [...categories];

      // 1. Sort Categories
      if (sortMode === 'alpha') {
          sortedCats.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortMode === 'newest') {
          sortedCats.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      } else if (sortMode === 'oldest') {
          sortedCats.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      }

      // 2. Sort Bookmarks within Categories
      return sortedCats.map(cat => {
          const sortedBookmarks = [...cat.bookmarks];
          if (sortMode === 'alpha') {
              sortedBookmarks.sort((a, b) => a.title.localeCompare(b.title));
          } else if (sortMode === 'newest') {
              sortedBookmarks.sort((a, b) => parseInt(b.id) - parseInt(a.id));
          } else if (sortMode === 'oldest') {
              sortedBookmarks.sort((a, b) => parseInt(a.id) - parseInt(b.id));
          }
          return { ...cat, bookmarks: sortedBookmarks };
      });
  };

  const addCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCategoryTitle.trim()) return;
      const newCat: BookmarkCategory = {
          id: Date.now().toString(),
          title: newCategoryTitle.toUpperCase(),
          bookmarks: []
      };
      saveCategories([...categories, newCat]);
      setNewCategoryTitle('');
      setIsAddingCategory(false);
  };

  const deleteCategory = (id: string) => {
      if (categories.length <= 1) return; // Prevent deleting last category
      const updated = categories.filter(c => c.id !== id);
      saveCategories(updated);
  };

  const startRenameCategory = (id: string, title: string) => {
      setEditingCategoryId(id);
      setRenameTitle(title);
  };

  const finishRenameCategory = () => {
      if (!editingCategoryId) return;
      const updated = categories.map(c => c.id === editingCategoryId ? { ...c, title: renameTitle.toUpperCase() } : c);
      saveCategories(updated);
      setEditingCategoryId(null);
  };

  const initiateAddBookmark = (categoryId: string) => {
      setTargetCategoryId(categoryId);
      setIsAddingBookmark(true);
  };

  const confirmAddBookmark = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBookmarkTitle.trim() || !newBookmarkUrl.trim() || !targetCategoryId) return;

      let formattedUrl = newBookmarkUrl;
      if (!/^https?:\/\//i.test(newBookmarkUrl)) {
        formattedUrl = 'https://' + newBookmarkUrl;
      }

      const newBm: Bookmark = {
          id: Date.now().toString(),
          title: newBookmarkTitle,
          url: formattedUrl
      };

      const updated = categories.map(c => {
          if (c.id === targetCategoryId) {
              return { ...c, bookmarks: [...c.bookmarks, newBm] };
          }
          return c;
      });
      saveCategories(updated);
      setNewBookmarkTitle('');
      setNewBookmarkUrl('');
      setIsAddingBookmark(false);
      setTargetCategoryId(null);
  };

  const deleteBookmark = (catId: string, bmId: string) => {
      const updated = categories.map(c => {
          if (c.id === catId) {
              return { ...c, bookmarks: c.bookmarks.filter(b => b.id !== bmId) };
          }
          return c;
      });
      saveCategories(updated);
  };

  const sortedCategories = getSortedData();

  const getSortIcon = () => {
      switch(sortMode) {
          case 'newest': return <Clock size={14} />;
          case 'oldest': return <Calendar size={14} />;
          case 'alpha': return <Type size={14} />;
      }
  };

  const getSortLabel = () => {
      switch(sortMode) {
          case 'newest': return 'NEWEST';
          case 'oldest': return 'OLDEST';
          case 'alpha': return 'A - Z';
      }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="w-full h-full pt-24 px-6 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col"
    >
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b-2 border-white pb-6 gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Uplink</h1>
          <p className="text-sm md:text-base uppercase tracking-widest opacity-70">Secure External Network Bridge</p>
        </div>
        
        <div className="flex gap-4">
            <button 
                onClick={cycleSortMode}
                className="flex items-center gap-2 border border-white/50 px-4 py-2 font-bold uppercase hover:bg-white hover:text-blue-base transition-colors text-xs tracking-widest"
                title="Change Sort Order"
            >
                {getSortIcon()} {getSortLabel()}
            </button>

            <button 
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center gap-2 border-2 border-white px-4 py-2 font-bold uppercase hover:bg-white hover:text-blue-base transition-colors text-xs tracking-widest"
            >
                <FolderPlus size={16} /> New Sector
            </button>
        </div>
      </div>

      <AnimatePresence>
          {isAddingCategory && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={addCategory}
                className="mb-8 border border-white/50 p-4 bg-white/5 flex gap-4 overflow-hidden"
              >
                  <input 
                    autoFocus
                    value={newCategoryTitle}
                    onChange={e => setNewCategoryTitle(e.target.value)}
                    placeholder="SECTOR NAME..."
                    className="flex-1 bg-transparent border-b border-white font-bold uppercase outline-none"
                  />
                  <button type="submit" className="text-xs font-bold uppercase border border-white px-4 hover:bg-white hover:text-black">Confirm</button>
                  <button type="button" onClick={() => setIsAddingCategory(false)} className="text-xs font-bold uppercase text-red-300">Cancel</button>
              </motion.form>
          )}

          {isAddingBookmark && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <motion.form 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onSubmit={confirmAddBookmark}
                    className="w-full max-w-lg bg-blue-base border-4 border-white p-8"
                  >
                      <h3 className="text-xl font-bold uppercase mb-6">New Coordinate</h3>
                      <div className="space-y-4 mb-6">
                          <div>
                              <label className="block text-xs font-bold uppercase opacity-70 mb-1">Designation</label>
                              <input 
                                autoFocus
                                value={newBookmarkTitle}
                                onChange={e => setNewBookmarkTitle(e.target.value)}
                                className="w-full bg-transparent border-b-2 border-white py-2 font-bold text-lg outline-none"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold uppercase opacity-70 mb-1">Target URL</label>
                              <input 
                                value={newBookmarkUrl}
                                onChange={e => setNewBookmarkUrl(e.target.value)}
                                className="w-full bg-transparent border-b-2 border-white py-2 font-mono outline-none"
                              />
                          </div>
                      </div>
                      <div className="flex gap-4">
                          <button type="submit" className="flex-1 border-2 border-white py-3 font-bold uppercase hover:bg-white hover:text-blue-base">Save</button>
                          <button type="button" onClick={() => { setIsAddingBookmark(false); setTargetCategoryId(null); }} className="flex-1 border-2 border-transparent py-3 font-bold uppercase hover:text-red-300">Cancel</button>
                      </div>
                  </motion.form>
              </div>
          )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
          <div className="space-y-12">
              {sortedCategories.map(category => (
                  <motion.div layout key={category.id} className="relative">
                      {/* CATEGORY HEADER */}
                      <div className="flex items-center gap-4 mb-4 border-b border-white/20 pb-2 group">
                          <div className="flex-1">
                              {editingCategoryId === category.id ? (
                                  <input 
                                    autoFocus
                                    value={renameTitle}
                                    onChange={e => setRenameTitle(e.target.value)}
                                    onBlur={finishRenameCategory}
                                    onKeyDown={e => e.key === 'Enter' && finishRenameCategory()}
                                    className="bg-transparent border-b border-white font-bold text-2xl uppercase outline-none w-full"
                                  />
                              ) : (
                                  <h2 className="text-2xl font-bold uppercase tracking-widest">{category.title}</h2>
                              )}
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startRenameCategory(category.id, category.title)} className="p-2 hover:text-blue-300"><Edit2 size={16} /></button>
                              {categories.length > 1 && (
                                <button onClick={() => deleteCategory(category.id)} className="p-2 hover:text-red-500"><Trash2 size={16} /></button>
                              )}
                              <button 
                                onClick={() => initiateAddBookmark(category.id)} 
                                className="ml-4 flex items-center gap-2 border border-white px-3 py-1 text-xs font-bold uppercase hover:bg-white hover:text-blue-base"
                              >
                                  <Plus size={12} /> Add Link
                              </button>
                          </div>
                      </div>

                      {/* BOOKMARKS GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <AnimatePresence>
                            {category.bookmarks.map(bm => (
                                <motion.div 
                                    layout
                                    key={bm.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="relative h-full"
                                >
                                    <div className="group relative h-40 border-4 border-white p-6 flex flex-col justify-between hover:bg-white hover:text-blue-base transition-all duration-300 hover:-translate-y-1 cursor-default overflow-hidden bg-black/20">
                                        
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <button onClick={(e) => { e.stopPropagation(); deleteBookmark(category.id, bm.id); }} className="p-1 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <a 
                                            href={bm.url} 
                                            target={linkOpenMode === 'new_tab' ? "_blank" : "_self"} 
                                            rel="noopener noreferrer" 
                                            className="absolute inset-0 z-10" 
                                        />

                                        <Globe className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div className="w-full">
                                            <div className="text-xl font-bold uppercase leading-tight mb-2 break-words line-clamp-1">{bm.title}</div>
                                            <div className="flex items-center gap-2 text-xs font-mono opacity-60 group-hover:opacity-100 truncate w-full">
                                                <ExternalLink size={12} className="shrink-0" />
                                                <span className="truncate">{bm.url}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                          </AnimatePresence>
                      </div>

                      {category.bookmarks.length === 0 && (
                          <div className="border-2 border-dashed border-white/20 p-8 text-center opacity-40 text-xs font-bold uppercase tracking-widest">
                              Empty Sector
                          </div>
                      )}
                  </motion.div>
              ))}
          </div>
      </div>
    </motion.div>
  );
};
