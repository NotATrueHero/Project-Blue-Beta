
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Check, X, Layers, Trash2, Edit2, GripVertical } from 'lucide-react';
import { Task, TaskList } from '../types';

export const Tasks: React.FC = () => {
  const [lists, setLists] = useState<TaskList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  
  const [newListTitle, setNewListTitle] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [taskInput, setTaskInput] = useState('');

  // Renaming State
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListTitle, setEditListTitle] = useState('');

  // Load Data
  useEffect(() => {
    const savedLists = localStorage.getItem('blue_task_lists');
    if (savedLists) {
      const parsedLists: TaskList[] = JSON.parse(savedLists);
      setLists(parsedLists);
      if (parsedLists.length > 0) setActiveListId(parsedLists[0].id);
    } else {
      // MIGRATION: Check for legacy flat tasks
      const legacyTasks = localStorage.getItem('blue_tasks');
      if (legacyTasks) {
          const parsedLegacy: Task[] = JSON.parse(legacyTasks);
          const migratedList: TaskList = {
              id: 'default',
              title: 'General Ops',
              tasks: parsedLegacy
          };
          setLists([migratedList]);
          setActiveListId('default');
          localStorage.setItem('blue_task_lists', JSON.stringify([migratedList]));
          // Optional: Clear legacy
          localStorage.removeItem('blue_tasks');
      } else {
          // Default start
          const defaultList: TaskList = { id: 'default', title: 'General Ops', tasks: [] };
          setLists([defaultList]);
          setActiveListId('default');
          localStorage.setItem('blue_task_lists', JSON.stringify([defaultList]));
      }
    }
  }, []);

  const saveLists = (updatedLists: TaskList[]) => {
    setLists(updatedLists);
    localStorage.setItem('blue_task_lists', JSON.stringify(updatedLists));
  };

  const createList = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newListTitle.trim()) return;
      
      const newList: TaskList = {
          id: Date.now().toString(),
          title: newListTitle.toUpperCase(),
          tasks: []
      };
      
      const updated = [...lists, newList];
      saveLists(updated);
      setActiveListId(newList.id);
      setNewListTitle('');
      setIsCreatingList(false);
  };

  const startRename = (e: React.MouseEvent, list: TaskList) => {
      e.stopPropagation();
      setEditingListId(list.id);
      setEditListTitle(list.title);
  };

  const submitRename = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!editingListId) return;

      if (!editListTitle.trim()) {
          setEditingListId(null);
          return; // Cancel if empty
      }

      const updatedLists = lists.map(l => 
          l.id === editingListId ? { ...l, title: editListTitle.toUpperCase() } : l
      );
      saveLists(updatedLists);
      setEditingListId(null);
  };

  const deleteList = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (lists.length <= 1) return;
      
      const updated = lists.filter(l => l.id !== id);
      saveLists(updated);
      
      if (activeListId === id) {
          setActiveListId(updated[0].id);
      }
  };

  // Task Operations
  const addTask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!taskInput.trim() || !activeListId) return;

      const newTask: Task = {
          id: Date.now().toString(),
          text: taskInput,
          completed: false
      };

      const updatedLists = lists.map(list => {
          if (list.id === activeListId) {
              return { ...list, tasks: [newTask, ...list.tasks] };
          }
          return list;
      });

      saveLists(updatedLists);
      setTaskInput('');
  };

  const toggleTask = (taskId: string) => {
      if (!activeListId) return;
      const updatedLists = lists.map(list => {
          if (list.id === activeListId) {
              const updatedTasks = list.tasks.map(t => 
                  t.id === taskId ? { ...t, completed: !t.completed } : t
              );
              return { ...list, tasks: updatedTasks };
          }
          return list;
      });
      saveLists(updatedLists);
  };

  const removeTask = (taskId: string) => {
      if (!activeListId) return;
      const updatedLists = lists.map(list => {
          if (list.id === activeListId) {
              const updatedTasks = list.tasks.filter(t => t.id !== taskId);
              return { ...list, tasks: updatedTasks };
          }
          return list;
      });
      saveLists(updatedLists);
  };

  const handleTaskReorder = (newOrder: Task[]) => {
      if (!activeListId) return;
      const updatedLists = lists.map(list => {
          if (list.id === activeListId) {
              return { ...list, tasks: newOrder };
          }
          return list;
      });
      saveLists(updatedLists);
  };

  const activeList = lists.find(l => l.id === activeListId);
  const completedCount = activeList ? activeList.tasks.filter(t => t.completed).length : 0;
  const totalCount = activeList ? activeList.tasks.length : 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="w-full h-full pt-24 px-4 md:px-12 pb-12 flex flex-col md:flex-row gap-8 max-w-7xl mx-auto"
    >
      {/* Sidebar: Lists */}
      <div className="w-full md:w-1/3 h-[300px] md:h-full border-4 border-white p-4 flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b-2 border-white/20 pb-4">
            <h2 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
                <Layers size={20} /> Operation Lists
            </h2>
            <button 
                onClick={() => setIsCreatingList(!isCreatingList)} 
                className={`p-2 border-2 border-white transition-all ${isCreatingList ? 'bg-white text-blue-base rotate-45' : 'hover:bg-white hover:text-black'}`}
            >
                <Plus size={16} />
            </button>
        </div>

        <AnimatePresence>
            {isCreatingList && (
                <motion.form 
                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                    onSubmit={createList}
                    className="overflow-hidden"
                >
                    <input 
                        type="text"
                        value={newListTitle}
                        onChange={(e) => setNewListTitle(e.target.value)}
                        placeholder="LIST NAME..."
                        autoFocus
                        className="w-full bg-blue-900/30 border-b-2 border-white px-3 py-2 text-sm font-bold uppercase placeholder-white/40 outline-none mb-2"
                    />
                    <button type="submit" className="w-full bg-white text-blue-base font-bold text-xs uppercase py-1 tracking-widest">
                        Create
                    </button>
                </motion.form>
            )}
        </AnimatePresence>
        
        <div className="flex-1 overflow-y-auto hide-scrollbar">
            <Reorder.Group axis="y" values={lists} onReorder={saveLists} className="space-y-2">
                {lists.map(list => (
                    <Reorder.Item 
                        key={list.id} 
                        value={list}
                        className="relative"
                    >
                        <div 
                            onClick={() => activeListId !== list.id && setActiveListId(list.id)}
                            className={`group flex items-center justify-between p-4 border-2 cursor-pointer transition-all ${activeListId === list.id ? 'bg-white text-blue-base border-white' : 'border-white/30 text-white hover:border-white'}`}
                        >
                            <GripVertical className="opacity-20 group-hover:opacity-50 cursor-grab shrink-0 mr-3" size={14} />
                            
                            <div className="flex-1 min-w-0 flex justify-between items-center">
                                {editingListId === list.id ? (
                                    <form onSubmit={submitRename} className="flex-1 mr-2" onClick={e => e.stopPropagation()}>
                                        <input 
                                            type="text"
                                            value={editListTitle}
                                            onChange={(e) => setEditListTitle(e.target.value)}
                                            autoFocus
                                            onBlur={() => submitRename()}
                                            className="w-full bg-transparent border-b border-current font-bold uppercase text-sm outline-none"
                                        />
                                    </form>
                                ) : (
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold uppercase text-sm tracking-wider truncate">{list.title}</div>
                                        <div className="text-[10px] opacity-60 font-mono mt-1">
                                            {list.tasks.filter(t => t.completed).length}/{list.tasks.length} COMPLETE
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity relative z-10 shrink-0">
                                    {editingListId !== list.id && (
                                        <button 
                                            onClick={(e) => startRename(e, list)}
                                            className={`p-1.5 transition-colors ${activeListId === list.id ? 'hover:text-blue-300' : 'hover:text-blue-300'}`}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    )}
                                    
                                    {lists.length > 1 && (
                                        <button 
                                            onClick={(e) => deleteList(e, list.id)}
                                            className={`p-1.5 transition-colors ${activeListId === list.id ? 'hover:text-red-500' : 'hover:text-red-500'}`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Reorder.Item>
                ))}
            </Reorder.Group>
        </div>
      </div>

      {/* Main Content: Tasks */}
      <div className="w-full md:w-2/3 h-full border-4 border-white p-6 md:p-8 flex flex-col">
          {activeList ? (
              <>
                <div className="mb-8">
                    <div className="flex justify-between items-end mb-4">
                        <h1 className="text-3xl md:text-5xl font-bold uppercase leading-none break-all">{activeList.title}</h1>
                        <div className="text-right shrink-0 ml-4">
                             <div className="text-2xl font-bold leading-none">{completedCount} / {totalCount}</div>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-3 border border-white p-0.5">
                        <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-white"
                        />
                    </div>
                </div>

                {/* Input */}
                <form onSubmit={addTask} className="w-full flex gap-4 mb-8">
                    <input 
                    type="text" 
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="NEW DIRECTIVE..."
                    className="flex-1 bg-transparent border-b-2 border-white/50 focus:border-white outline-none py-2 text-lg uppercase font-bold placeholder-white/30 transition-colors"
                    />
                    <button type="submit" className="border-2 border-white px-6 font-bold uppercase hover:bg-white hover:text-blue-base transition-colors">
                    Add
                    </button>
                </form>

                {/* List */}
                <div className="flex-1 overflow-y-auto hide-scrollbar pb-12">
                    <Reorder.Group axis="y" values={activeList.tasks} onReorder={handleTaskReorder} className="space-y-3">
                        {activeList.tasks.map(task => (
                            <Reorder.Item 
                                key={task.id} 
                                value={task}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                            >
                                <div className={`group flex items-center justify-between p-4 border border-white/50 hover:border-white transition-all ${task.completed ? 'opacity-50 bg-white/5' : 'opacity-100'}`}>
                                    <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0" onClick={() => toggleTask(task.id)}>
                                        <GripVertical className="opacity-20 group-hover:opacity-50 cursor-grab shrink-0" size={16} />
                                        <div className={`w-6 h-6 border-2 border-white flex items-center justify-center transition-colors shrink-0 ${task.completed ? 'bg-white text-blue-base' : 'transparent'}`}>
                                            {task.completed && <Check size={16} strokeWidth={4} />}
                                        </div>
                                        <span className={`text-lg font-bold uppercase transition-all truncate ${task.completed ? 'line-through' : ''}`}>
                                            {task.text}
                                        </span>
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2 text-red-300 hover:text-red-500 relative z-10 shrink-0"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                    
                    {activeList.tasks.length === 0 && (
                    <div className="text-center py-20 opacity-40 uppercase tracking-widest">
                        Awaiting Directives...
                    </div>
                    )}
                </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                  <Layers size={48} className="mb-4"/>
                  <div className="uppercase tracking-widest">Select or Create Operation List</div>
              </div>
          )}
      </div>
    </motion.div>
  );
};
