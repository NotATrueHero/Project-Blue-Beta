
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Plus, Trash2, ExternalLink, Activity, AlertTriangle, Monitor, Globe } from 'lucide-react';
import { ServerEndpoint } from '../types';

export const Nexus: React.FC = () => {
    const [endpoints, setEndpoints] = useState<ServerEndpoint[]>([]);
    const [statusMap, setStatusMap] = useState<Record<string, 'online' | 'offline' | 'checking'>>({});
    
    // Add Server State
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');

    // Modal
    const [viewingEndpoint, setViewingEndpoint] = useState<ServerEndpoint | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('blue_nexus_endpoints');
        if (saved) {
            const loaded: ServerEndpoint[] = JSON.parse(saved);
            setEndpoints(loaded);
            checkAllStatuses(loaded);
        }
    }, []);

    const saveEndpoints = (updated: ServerEndpoint[]) => {
        setEndpoints(updated);
        localStorage.setItem('blue_nexus_endpoints', JSON.stringify(updated));
    };

    const checkStatus = async (endpoint: ServerEndpoint) => {
        setStatusMap(prev => ({ ...prev, [endpoint.id]: 'checking' }));
        try {
            // Use no-cors mode to allow opaque responses from local network (which is enough to know it's UP)
            await fetch(endpoint.url, { mode: 'no-cors', cache: 'no-cache' });
            setStatusMap(prev => ({ ...prev, [endpoint.id]: 'online' }));
        } catch (e) {
            setStatusMap(prev => ({ ...prev, [endpoint.id]: 'offline' }));
        }
    };

    const checkAllStatuses = (list: ServerEndpoint[]) => {
        list.forEach(checkStatus);
    };

    // Auto-refresh status every 60s
    useEffect(() => {
        const interval = setInterval(() => {
            checkAllStatuses(endpoints);
        }, 60000);
        return () => clearInterval(interval);
    }, [endpoints]);

    const addServer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newUrl.trim()) return;
        
        let url = newUrl.trim();
        if (!/^https?:\/\//i.test(url)) url = 'http://' + url;

        const newEndpoint: ServerEndpoint = {
            id: Date.now().toString(),
            name: newName.toUpperCase(),
            url: url
        };

        const updated = [...endpoints, newEndpoint];
        saveEndpoints(updated);
        checkStatus(newEndpoint);
        setNewName('');
        setNewUrl('');
        setIsAdding(false);
    };

    const deleteServer = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const updated = endpoints.filter(ep => ep.id !== id);
        saveEndpoints(updated);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="w-full h-full pt-24 px-6 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col"
        >
            <div className="flex justify-between items-end mb-8 border-b-2 border-white pb-6">
                <div>
                    <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Nexus</h1>
                    <p className="text-sm md:text-base uppercase tracking-widest opacity-70">Server Command & Monitoring Hub</p>
                </div>
                <button 
                    onClick={() => setIsAdding(true)} 
                    className="flex items-center gap-2 border-2 border-white px-4 py-2 font-bold uppercase hover:bg-white hover:text-blue-base transition-all text-xs tracking-widest"
                >
                    <Plus size={16} /> Add Node
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.form 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={addServer}
                        className="mb-8 border border-white/50 p-6 bg-white/5 flex flex-col md:flex-row gap-4 overflow-hidden items-end"
                    >
                        <div className="w-full md:w-1/3">
                            <label className="text-xs font-bold uppercase opacity-50 block mb-1">Node Designation</label>
                            <input 
                                autoFocus
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="PROXMOX-01"
                                className="w-full bg-transparent border-b border-white font-bold uppercase outline-none py-1"
                            />
                        </div>
                        <div className="w-full md:w-1/2">
                            <label className="text-xs font-bold uppercase opacity-50 block mb-1">Network Address</label>
                            <input 
                                value={newUrl}
                                onChange={e => setNewUrl(e.target.value)}
                                placeholder="192.168.1.100:8006"
                                className="w-full bg-transparent border-b border-white font-mono outline-none py-1"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button type="submit" className="border border-white px-6 py-1 font-bold uppercase hover:bg-white hover:text-blue-base text-xs h-8">Save</button>
                            <button type="button" onClick={() => setIsAdding(false)} className="border border-white/30 text-white/50 px-4 py-1 font-bold uppercase hover:text-white text-xs h-8">Cancel</button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {endpoints.map(ep => {
                    const status = statusMap[ep.id] || 'checking';
                    return (
                        <div 
                            key={ep.id} 
                            onClick={() => setViewingEndpoint(ep)}
                            className="group relative border-4 border-white bg-black/20 p-6 hover:bg-white/5 transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <Server size={32} className="opacity-50 group-hover:text-blue-300 transition-colors" />
                                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-2 py-1 border ${status === 'online' ? 'border-green-500 text-green-400' : status === 'offline' ? 'border-red-500 text-red-400' : 'border-yellow-500 text-yellow-400'}`}>
                                    <Activity size={12} className={status === 'checking' ? 'animate-spin' : ''} />
                                    {status.toUpperCase()}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-2xl font-bold uppercase tracking-tight truncate">{ep.name}</h3>
                                <div className="text-xs font-mono opacity-50 truncate">{ep.url}</div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); window.open(ep.url, '_blank'); }}
                                    className="flex-1 flex items-center justify-center gap-2 border border-white py-2 text-xs font-bold uppercase hover:bg-white hover:text-black"
                                >
                                    <ExternalLink size={14} /> Launch
                                </button>
                                <button 
                                    onClick={(e) => deleteServer(e, ep.id)}
                                    className="p-2 border border-white/50 hover:border-red-500 hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {endpoints.length === 0 && !isAdding && (
                    <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-white/20 uppercase tracking-widest flex flex-col items-center gap-4">
                        <Globe size={48} strokeWidth={1} />
                        <div>No Active Nodes</div>
                    </div>
                )}
            </div>

            {/* Embedded View Modal */}
            <AnimatePresence>
                {viewingEndpoint && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 flex flex-col"
                    >
                        <div className="h-14 border-b border-white/20 flex items-center justify-between px-6 bg-blue-base">
                            <div className="flex items-center gap-4">
                                <Monitor size={20} />
                                <span className="font-bold uppercase tracking-widest">{viewingEndpoint.name}</span>
                                <span className="text-xs font-mono opacity-50">{viewingEndpoint.url}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <a 
                                    href={viewingEndpoint.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs font-bold uppercase hover:text-blue-300"
                                >
                                    <ExternalLink size={14} /> Open in Tab
                                </a>
                                <button onClick={() => setViewingEndpoint(null)} className="text-xs font-bold uppercase border border-white px-4 py-1 hover:bg-white hover:text-blue-base">
                                    Close Feed
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-white relative">
                            {/* Warning Overlay for Mixed Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 text-black opacity-30">
                                <AlertTriangle size={64} className="mb-4" />
                                <div className="text-xl font-bold uppercase">Establishing Connection...</div>
                                <div className="text-xs max-w-md text-center mt-2">If display remains blank, the target server may block embedding or use HTTP vs HTTPS. Use "Open in Tab".</div>
                            </div>
                            <iframe 
                                src={viewingEndpoint.url} 
                                className="w-full h-full relative z-10" 
                                title={viewingEndpoint.name}
                                allowFullScreen
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
