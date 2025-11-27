
import * as React from 'react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Trash2, Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1, Volume2, Upload, GripVertical, ListMusic } from 'lucide-react';
import { Track, MusicPlaylist, LoopMode } from '../types';

interface MusicProps {
    playlists: MusicPlaylist[];
    activePlaylistId: string | null;
    onUpdatePlaylists: (playlists: MusicPlaylist[]) => void;
    onSelectPlaylist: (id: string) => void;
    
    currentTrackId: string | null;
    isPlaying: boolean;
    onPlay: (trackId: string, playlistId: string) => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    
    volume: number;
    onVolumeChange: (val: number) => void;
    loopMode: LoopMode;
    onToggleLoop: () => void;
    shuffle: boolean;
    onToggleShuffle: () => void;
}

export const Music: React.FC<MusicProps> = ({ 
    playlists, activePlaylistId, onUpdatePlaylists, onSelectPlaylist,
    currentTrackId, isPlaying, onPlay, onPause, onNext, onPrev,
    volume, onVolumeChange, loopMode, onToggleLoop, shuffle, onToggleShuffle
}) => {
    // Playlist Creation State
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [newListName, setNewListName] = useState('');

    // Track Adding State
    const [isAddingTrack, setIsAddingTrack] = useState(false);
    const [addMode, setAddMode] = useState<'url' | 'file'>('url');
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activePlaylist = playlists.find(p => p.id === activePlaylistId);

    // --- PLAYLIST OPS ---
    const createPlaylist = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;
        const newPlaylist: MusicPlaylist = {
            id: Date.now().toString(),
            title: newListName,
            tracks: []
        };
        onUpdatePlaylists([...playlists, newPlaylist]);
        setNewListName('');
        setIsCreatingList(false);
        onSelectPlaylist(newPlaylist.id);
    };

    const deletePlaylist = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const updated = playlists.filter(p => p.id !== id);
        onUpdatePlaylists(updated);
        if (activePlaylistId === id) {
            onSelectPlaylist(updated.length > 0 ? updated[0].id : '');
        }
    };

    // --- TRACK OPS ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newTracks: Track[] = [];
        let errorMsg = "";

        const readFile = (file: File): Promise<Track | null> => {
            return new Promise((resolve) => {
                // Strict limit to avoid crashing localStorage
                if (file.size > 8 * 1024 * 1024) {
                    errorMsg = `Some files skipped (exceeded 8MB limit).`;
                    resolve(null);
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    const result = event.target?.result as string;
                    resolve({
                        // Generate unique ID with random suffix to prevent collisions in batch
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        title: file.name.replace(/\.[^/.]+$/, ""),
                        url: result,
                        addedAt: new Date().toLocaleDateString(),
                        isLocal: true
                    });
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
            });
        };

        // Process all files
        const promises = Array.from(files).map(readFile);
        const results = await Promise.all(promises);

        results.forEach(track => {
            if (track) newTracks.push(track);
        });

        if (newTracks.length > 0 && activePlaylistId) {
             const updatedPlaylists = playlists.map(p => {
                if (p.id === activePlaylistId) {
                    return { ...p, tracks: [...p.tracks, ...newTracks] };
                }
                return p;
            });
            onUpdatePlaylists(updatedPlaylists);
            setIsAddingTrack(false);
            setUploadError(null);
        }

        if (errorMsg) {
            setUploadError(errorMsg);
        }
    };

    const handleUrlAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newUrl.trim()) return;
        addTrackToPlaylist({
            id: Date.now().toString(),
            title: newTitle,
            url: newUrl,
            addedAt: new Date().toLocaleDateString()
        });
    };

    const addTrackToPlaylist = (track: Track) => {
        if (!activePlaylistId) return;
        const updatedPlaylists = playlists.map(p => {
            if (p.id === activePlaylistId) {
                return { ...p, tracks: [...p.tracks, track] };
            }
            return p;
        });
        onUpdatePlaylists(updatedPlaylists);
        setIsAddingTrack(false);
        setNewTitle('');
        setNewUrl('');
        setUploadError(null);
    };

    const removeTrack = (e: React.MouseEvent, trackId: string) => {
        e.stopPropagation();
        if (!activePlaylistId) return;
        const updatedPlaylists = playlists.map(p => {
            if (p.id === activePlaylistId) {
                return { ...p, tracks: p.tracks.filter(t => t.id !== trackId) };
            }
            return p;
        });
        onUpdatePlaylists(updatedPlaylists);
    };

    // Reorder Handler: Ensures new order is saved to LocalStorage via App.tsx
    const handleReorder = (newTracks: Track[]) => {
        if (!activePlaylistId) return;
        
        const updatedPlaylists = playlists.map(p => {
            if (p.id === activePlaylistId) {
                return { ...p, tracks: newTracks };
            }
            return p;
        });
        // This triggers the save in App.tsx
        onUpdatePlaylists(updatedPlaylists);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="w-full h-full pt-24 px-4 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col md:flex-row gap-8"
        >
            {/* LEFT: PLAYLISTS SIDEBAR */}
            <div className="w-full md:w-1/4 h-[300px] md:h-full border-4 border-white p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b-2 border-white/20 pb-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <ListMusic size={16} /> Playlists
                    </h2>
                    <button onClick={() => setIsCreatingList(true)} className="hover:text-blue-300">
                        <Plus size={16} />
                    </button>
                </div>
                
                {isCreatingList && (
                    <form onSubmit={createPlaylist} className="mb-4">
                        <input 
                            autoFocus
                            value={newListName}
                            onChange={e => setNewListName(e.target.value)}
                            placeholder="NAME..."
                            className="w-full bg-transparent border-b border-white text-xs font-bold uppercase outline-none"
                            onBlur={() => !newListName && setIsCreatingList(false)}
                        />
                    </form>
                )}

                <div className="flex-1 overflow-y-auto hide-scrollbar space-y-1">
                    {playlists.map(pl => (
                        <div 
                            key={pl.id}
                            onClick={() => onSelectPlaylist(pl.id)}
                            className={`group flex items-center justify-between px-3 py-2 cursor-pointer border border-transparent hover:border-white/50 transition-all ${activePlaylistId === pl.id ? 'bg-white text-blue-base font-bold' : 'text-white'}`}
                        >
                            <span className="uppercase text-xs truncate">{pl.title}</span>
                            <button onClick={(e) => deletePlaylist(e, pl.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    {playlists.length === 0 && <div className="text-[10px] opacity-50 text-center py-4">NO PLAYLISTS</div>}
                </div>
            </div>

            {/* RIGHT: PLAYER & TRACKS */}
            <div className="w-full md:w-3/4 h-full border-4 border-white flex flex-col relative">
                {activePlaylist ? (
                    <>
                        {/* CONTROLS HEADER */}
                        <div className="p-6 border-b-2 border-white bg-white/5 flex flex-col md:flex-row gap-6 justify-between items-center sticky top-0 z-20 backdrop-blur-md">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-bold uppercase tracking-tighter truncate">{activePlaylist.title}</h1>
                                <div className="text-[10px] font-mono opacity-60 uppercase tracking-widest mt-1">
                                    {activePlaylist.tracks.length} Tracks // {loopMode !== 'off' ? `Loop: ${loopMode}` : 'No Loop'} // {shuffle ? 'Shuffled' : 'Sequential'}
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <button onClick={onToggleShuffle} className={`p-2 transition-colors ${shuffle ? 'text-blue-300' : 'opacity-40 hover:opacity-100'}`} title="Shuffle">
                                        <Shuffle size={16} />
                                    </button>
                                    
                                    <button onClick={onPrev} className="p-2 hover:text-blue-300 transition-colors">
                                        <SkipBack size={24} fill="currentColor" />
                                    </button>
                                    
                                    <button 
                                        onClick={() => activePlaylist.tracks.length > 0 && (isPlaying ? onPause() : onPlay(activePlaylist.tracks[0].id, activePlaylist.id))}
                                        className="w-12 h-12 bg-white text-blue-base flex items-center justify-center rounded-full hover:scale-105 transition-transform"
                                    >
                                        {isPlaying && activePlaylistId === activePlaylist.id ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                                    </button>
                                    
                                    <button onClick={onNext} className="p-2 hover:text-blue-300 transition-colors">
                                        <SkipForward size={24} fill="currentColor" />
                                    </button>

                                    <button onClick={onToggleLoop} className={`p-2 transition-colors flex items-center ${loopMode !== 'off' ? 'text-blue-300' : 'opacity-40 hover:opacity-100'}`} title="Loop">
                                        {loopMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
                                    </button>
                                </div>

                                {/* Volume */}
                                <div className="flex items-center gap-2 w-32 group">
                                    <Volume2 size={14} className="opacity-50" />
                                    <input 
                                        type="range" 
                                        min="0" max="1" step="0.05" 
                                        value={volume}
                                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ADD TRACK BUTTON */}
                        {!isAddingTrack && (
                             <div className="border-b border-white/20 p-2">
                                 <button onClick={() => setIsAddingTrack(true)} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
                                     <Plus size={14} /> Add Track
                                 </button>
                             </div>
                        )}

                        {/* ADD TRACK FORM */}
                        <AnimatePresence>
                            {isAddingTrack && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-blue-900/40 border-b border-white/20 p-4 overflow-hidden"
                                >
                                    <div className="flex gap-4 mb-4 text-xs font-bold uppercase">
                                        <button onClick={() => setAddMode('url')} className={addMode === 'url' ? 'underline' : 'opacity-50'}>Stream URL</button>
                                        <button onClick={() => setAddMode('file')} className={addMode === 'file' ? 'underline' : 'opacity-50'}>Upload File</button>
                                    </div>
                                    
                                    {addMode === 'url' ? (
                                        <form onSubmit={handleUrlAdd} className="flex gap-4">
                                            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="TITLE" className="flex-1 bg-transparent border-b border-white/50 text-sm font-bold uppercase outline-none" autoFocus />
                                            <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL" className="flex-1 bg-transparent border-b border-white/50 text-sm font-mono outline-none" />
                                            <button type="submit" className="border border-white px-4 py-1 text-xs font-bold uppercase hover:bg-white hover:text-blue-base">Add</button>
                                        </form>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                             <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" multiple onChange={handleFileUpload} />
                                             <button onClick={() => fileInputRef.current?.click()} className="border border-dashed border-white/50 p-4 text-center text-xs font-bold uppercase hover:bg-white/10">
                                                 Select Audio File(s)
                                             </button>
                                             {uploadError && <div className="text-red-300 text-[10px] font-bold uppercase">{uploadError}</div>}
                                        </div>
                                    )}
                                    <button onClick={() => setIsAddingTrack(false)} className="mt-2 text-[10px] font-bold uppercase opacity-50 hover:opacity-100">Cancel</button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* TRACK LIST */}
                        <div className="flex-1 overflow-y-auto hide-scrollbar p-2">
                             <Reorder.Group axis="y" values={activePlaylist.tracks} onReorder={handleReorder} className="space-y-1">
                                 {activePlaylist.tracks.map((track) => {
                                     const isActive = currentTrackId === track.id;
                                     return (
                                         <Reorder.Item key={track.id} value={track}>
                                             <div 
                                                className={`group flex items-center gap-4 p-3 border border-transparent transition-all cursor-pointer ${isActive ? 'bg-white text-blue-base font-bold border-white' : 'hover:bg-white/10 hover:border-white/20'}`}
                                                onClick={() => onPlay(track.id, activePlaylist.id)}
                                             >
                                                 <GripVertical className="opacity-20 group-hover:opacity-50 cursor-grab shrink-0" size={14} onPointerDown={(e) => e.preventDefault()} />
                                                 
                                                 <div className="w-8 flex justify-center shrink-0">
                                                     {isActive && isPlaying ? (
                                                         <div className="flex gap-0.5 h-3 items-end">
                                                             <motion.div animate={{ height: ['20%', '100%', '20%'] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-0.5 bg-current" />
                                                             <motion.div animate={{ height: ['50%', '100%', '30%'] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-current" />
                                                             <motion.div animate={{ height: ['20%', '80%', '20%'] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-0.5 bg-current" />
                                                         </div>
                                                     ) : (
                                                         <span className="text-xs opacity-50 font-mono">MP3</span>
                                                     )}
                                                 </div>

                                                 <div className="flex-1 min-w-0 overflow-hidden">
                                                     <div className="truncate text-sm uppercase">{track.title}</div>
                                                     <div className="truncate text-[10px] opacity-60 font-mono">{track.isLocal ? 'LOCAL UPLOAD' : track.url}</div>
                                                 </div>

                                                 <button onClick={(e) => removeTrack(e, track.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1">
                                                     <Trash2 size={14} />
                                                 </button>
                                             </div>
                                         </Reorder.Item>
                                     );
                                 })}
                             </Reorder.Group>
                             {activePlaylist.tracks.length === 0 && (
                                 <div className="text-center py-20 opacity-30 text-sm uppercase tracking-widest">Empty Frequency List</div>
                             )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                         <ListMusic size={48} className="mb-4" />
                         <div className="uppercase tracking-widest">Select Playlist</div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
