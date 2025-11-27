import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X } from 'lucide-react';
import { Task } from '../types';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('blue_tasks');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem('blue_tasks', JSON.stringify(updated));
  };

  const addTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      text: input,
      completed: false
    };
    saveTasks([newTask, ...tasks]);
    setInput('');
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks(updated);
  };

  const removeTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }}
      className="w-full h-full pt-24 px-6 md:px-0 flex flex-col items-center max-w-4xl mx-auto"
    >
      <div className="w-full mb-10 flex justify-between items-end border-b-2 border-white pb-4">
        <h1 className="text-4xl md:text-6xl font-bold uppercase">Operations</h1>
        <div className="text-right">
          <div className="text-2xl font-bold">{completedCount} / {tasks.length}</div>
          <div className="text-xs uppercase tracking-widest opacity-60">Completed</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-4 border-2 border-white mb-12 p-1">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-white"
        />
      </div>

      {/* Input */}
      <form onSubmit={addTask} className="w-full flex gap-4 mb-12">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="NEW DIRECTIVE..."
          className="flex-1 bg-transparent border-b-2 border-white/50 focus:border-white outline-none py-4 text-xl uppercase font-bold placeholder-white/30"
        />
        <button type="submit" className="border-2 border-white px-8 font-bold uppercase hover:bg-white hover:text-blue-base transition-colors">
          Add
        </button>
      </form>

      {/* List */}
      <div className="w-full flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-20">
        <AnimatePresence>
          {tasks.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`group flex items-center justify-between p-6 border-2 border-white transition-all ${task.completed ? 'opacity-50' : 'opacity-100'}`}
            >
              <div className="flex items-center gap-6 cursor-pointer flex-1" onClick={() => toggleTask(task.id)}>
                <div className={`w-8 h-8 border-2 border-white flex items-center justify-center transition-colors ${task.completed ? 'bg-white text-blue-base' : 'transparent'}`}>
                  {task.completed && <Check size={20} strokeWidth={4} />}
                </div>
                <span className={`text-xl font-bold uppercase transition-all ${task.completed ? 'line-through' : ''}`}>
                  {task.text}
                </span>
              </div>
              
              <button 
                onClick={() => removeTask(task.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500 hover:border-red-500 border-2 border-transparent"
              >
                <X />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {tasks.length === 0 && (
          <div className="text-center py-20 opacity-40 uppercase tracking-widest text-xl">
            No active directives.
          </div>
        )}
      </div>
    </motion.div>
  );
};