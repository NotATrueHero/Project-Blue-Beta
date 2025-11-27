
import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { BootLoader } from './components/BootLoader';
import { LockScreen } from './components/LockScreen';
import { Layout, useLocation } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Notes } from './pages/Notes';
import { Tasks } from './pages/Tasks';
import { Oracle } from './pages/Oracle';
import { Bookmarks } from './pages/Bookmarks';
import { Config } from './pages/Config';
import { Files } from './pages/Files';
import { Music } from './pages/Music';
import { Theme, MusicPlaylist, ViewMode, LoopMode, Track } from './types';

const App: React.FC = () => {
  const [bootStatus, setBootStatus] = useState<'booting' | 'locked' | 'unlocked'>('booting');
  const [sessionPin, setSessionPin] = useState<string>('1969');
  const [theme, setTheme] = useState<Theme>('standard');
  const { pathname } = useLocation();

  // --- DASHBOARD STATE ---
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('blue_view_mode');
    return saved === ViewMode.GRID ? ViewMode.GRID : ViewMode.LIST;
  });
  const [showViewToggle, setShowViewToggle] = useState(false);

  // --- AUDIO ENGINE 2.0 STATE ---
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [loopMode, setLoopMode] = useState<LoopMode>('off');
  const [shuffle, setShuffle] = useState(false);
  const [shuffledQueue, setShuffledQueue] = useState<string[]>([]);

  // --- INIT & MIGRATION ---
  useEffect(() => {
    // 1. Session & Auth
    const cachedPin = localStorage.getItem('blue_pin');
    const cachedTheme = localStorage.getItem('blue_theme') as Theme;
    if (cachedPin) {
      setSessionPin(cachedPin);
      if (cachedTheme) setTheme(cachedTheme);
      setBootStatus('locked');
    }

    // 2. Audio Data Migration
    const cachedPlaylists = localStorage.getItem('blue_music_playlists');
    const legacyPlaylist = localStorage.getItem('blue_playlist');
    
    if (cachedPlaylists) {
        setPlaylists(JSON.parse(cachedPlaylists));
    } else if (legacyPlaylist) {
        // Migration: Convert old single playlist to new structure
        const tracks: Track[] = JSON.parse(legacyPlaylist);
        const newList: MusicPlaylist = {
            id: 'default-migrated',
            title: 'Default Frequency',
            tracks
        };
        setPlaylists([newList]);
        localStorage.setItem('blue_music_playlists', JSON.stringify([newList]));
        // Clean up legacy
        localStorage.removeItem('blue_playlist');
    }

    // 3. Audio Settings
    const savedVol = localStorage.getItem('blue_volume');
    if (savedVol) setVolume(parseFloat(savedVol));
    const savedLoop = localStorage.getItem('blue_loop_mode');
    if (savedLoop) setLoopMode(savedLoop as LoopMode);
    const savedShuffle = localStorage.getItem('blue_shuffle');
    if (savedShuffle) setShuffle(savedShuffle === 'true');

    // 4. Default Playlist Selection
    if (!activePlaylistId && playlists.length > 0) {
        setActivePlaylistId(playlists[0].id);
    }

  }, []); // Run once on mount

  // --- AUDIO LOGIC ---
  const activePlaylist = playlists.find(p => p.id === activePlaylistId);
  const currentTrack = activePlaylist?.tracks.find(t => t.id === currentTrackId);

  // Manage Shuffle Queue
  useEffect(() => {
      if (shuffle && activePlaylist) {
          // Generate a shuffled order of IDs
          const ids = activePlaylist.tracks.map(t => t.id);
          // Fisher-Yates Shuffle
          for (let i = ids.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [ids[i], ids[j]] = [ids[j], ids[i]];
          }
          setShuffledQueue(ids);
      } else {
          setShuffledQueue([]);
      }
  }, [shuffle, activePlaylistId, activePlaylist?.tracks.length]);

  // Audio Event Listeners
  // Sync Audio Element
  useEffect(() => {
      const audio = audioRef.current;
      audio.volume = volume;
  }, [volume]);

  useEffect(() => {
      const audio = audioRef.current;
      if (currentTrack) {
          if (audio.src !== currentTrack.url) {
              audio.src = currentTrack.url;
              if (isPlaying) audio.play().catch(e => console.error("Play error", e));
          } else {
              if (isPlaying) audio.play();
              else audio.pause();
          }
      } else {
          audio.pause();
          setIsPlaying(false);
      }
  }, [currentTrack, isPlaying]);

  // Player Controls
  const playNext = useCallback(() => {
      if (!activePlaylist || activePlaylist.tracks.length === 0) return;
      
      let nextTrackId: string | undefined;

      if (shuffle && shuffledQueue.length > 0) {
          // Use Shuffled Queue
          const currentQueueIndex = shuffledQueue.indexOf(currentTrackId || '');
          let nextIndex = currentQueueIndex + 1;
          
          if (nextIndex >= shuffledQueue.length) {
              // End of shuffled queue
              if (loopMode === 'all') {
                  nextIndex = 0; // Restart shuffle queue
              } else {
                  setIsPlaying(false);
                  return;
              }
          }
          nextTrackId = shuffledQueue[nextIndex];

      } else {
          // Normal Sequential
          const currentIndex = activePlaylist.tracks.findIndex(t => t.id === currentTrackId);
          let nextIndex = currentIndex + 1;
          if (nextIndex >= activePlaylist.tracks.length) {
              if (loopMode === 'all') nextIndex = 0;
              else {
                  setIsPlaying(false);
                  return; // Stop at end
              }
          }
          nextTrackId = activePlaylist.tracks[nextIndex].id;
      }
      
      if (nextTrackId) {
          setCurrentTrackId(nextTrackId);
          setIsPlaying(true);
      }
  }, [activePlaylist, currentTrackId, shuffle, loopMode, shuffledQueue]);

  const playPrev = useCallback(() => {
      if (!activePlaylist || activePlaylist.tracks.length === 0) return;

      let prevTrackId: string | undefined;

      if (shuffle && shuffledQueue.length > 0) {
          const currentQueueIndex = shuffledQueue.indexOf(currentTrackId || '');
          let prevIndex = currentQueueIndex - 1;
          if (prevIndex < 0) {
              // Wrap around in shuffle mode to last song in shuffled queue
              prevIndex = shuffledQueue.length - 1; 
          }
          prevTrackId = shuffledQueue[prevIndex];
      } else {
          const currentIndex = activePlaylist.tracks.findIndex(t => t.id === currentTrackId);
          let prevIndex = currentIndex - 1;
          if (prevIndex < 0) prevIndex = activePlaylist.tracks.length - 1;
          prevTrackId = activePlaylist.tracks[prevIndex].id;
      }

      if (prevTrackId) {
          setCurrentTrackId(prevTrackId);
          setIsPlaying(true);
      }
  }, [activePlaylist, currentTrackId, shuffle, shuffledQueue]);

  useEffect(() => {
    const audio = audioRef.current;
    
    const handleEnded = () => {
        if (loopMode === 'one') {
            audio.currentTime = 0;
            audio.play();
        } else {
            playNext();
        }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [playNext, loopMode]); // Depend on playNext which changes with state

  // --- STATE SETTERS (With Persistence) ---
  const updatePlaylists = (newPlaylists: MusicPlaylist[]) => {
      setPlaylists(newPlaylists);
      localStorage.setItem('blue_music_playlists', JSON.stringify(newPlaylists));
  };

  const handleVolumeChange = (v: number) => {
      setVolume(v);
      localStorage.setItem('blue_volume', String(v));
  };

  const toggleLoop = () => {
      const modes: LoopMode[] = ['off', 'all', 'one'];
      const next = modes[(modes.indexOf(loopMode) + 1) % modes.length];
      setLoopMode(next);
      localStorage.setItem('blue_loop_mode', next);
  };

  const toggleShuffle = () => {
      const newVal = !shuffle;
      setShuffle(newVal);
      localStorage.setItem('blue_shuffle', String(newVal));
  };

  const handleBootComplete = (pin: string, requiresAuth: boolean, loadedTheme?: Theme, loadedPlaylists?: MusicPlaylist[]) => {
    setSessionPin(pin);
    if (loadedTheme) setTheme(loadedTheme);
    if (loadedPlaylists) setPlaylists(loadedPlaylists);
    setBootStatus(requiresAuth ? 'locked' : 'unlocked');
  };

  const handleSystemReset = () => {
    setBootStatus('booting');
  };

  const updateTheme = (newTheme: Theme) => {
      setTheme(newTheme);
      localStorage.setItem('blue_theme', newTheme);
  };

  if (bootStatus === 'booting') {
      return <BootLoader onLoadComplete={handleBootComplete} />;
  }

  if (bootStatus === 'locked') {
    return <LockScreen targetPin={sessionPin} onUnlock={() => setBootStatus('unlocked')} onReset={handleSystemReset} />;
  }

  let content;
  if (pathname === '/notes') content = <Notes />;
  else if (pathname === '/tasks') content = <Tasks />;
  else if (pathname === '/oracle') content = <Oracle />;
  else if (pathname === '/uplink') content = <Bookmarks />;
  else if (pathname === '/files') content = <Files />;
  else if (pathname === '/music') {
      content = <Music 
          playlists={playlists}
          activePlaylistId={activePlaylistId || (playlists[0]?.id)}
          onUpdatePlaylists={updatePlaylists}
          onSelectPlaylist={setActivePlaylistId}
          currentTrackId={currentTrackId}
          isPlaying={isPlaying}
          onPlay={(trackId, playlistId) => {
              if (activePlaylistId !== playlistId) setActivePlaylistId(playlistId);
              setCurrentTrackId(trackId);
              setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onNext={playNext}
          onPrev={playPrev}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          loopMode={loopMode}
          onToggleLoop={toggleLoop}
          shuffle={shuffle}
          onToggleShuffle={toggleShuffle}
      />;
  }
  else if (pathname === '/config') {
      content = <Config 
          currentTheme={theme} 
          onThemeChange={updateTheme} 
          musicPlaylists={playlists} 
          audioState={{ volume, loopMode, shuffle }} 
      />;
  }
  else content = <Dashboard viewMode={viewMode} onHeroIntersect={(visible) => setShowViewToggle(!visible)} />;

  return (
    <Layout 
        theme={theme} 
        isPlaying={isPlaying} 
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        showViewToggle={showViewToggle && (pathname === '/' || pathname === '')}
        viewMode={viewMode}
        onToggleView={() => {
            const newMode = viewMode === ViewMode.LIST ? ViewMode.GRID : ViewMode.LIST;
            setViewMode(newMode);
            localStorage.setItem('blue_view_mode', newMode);
        }}
    >
      {content}
    </Layout>
  );
};

export default App;
