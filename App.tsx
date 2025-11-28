
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
import { Chronos } from './pages/Chronos';
import { Cipher } from './pages/Cipher';
import { Whiteboard } from './pages/Whiteboard';
import { Games } from './pages/Games';
import { Weather } from './pages/Weather';
import { News } from './pages/News';
import { IDE } from './pages/IDE';
import { Calculator } from './pages/Calculator';
import { Nexus } from './pages/Nexus';
import { Theme, MusicPlaylist, ViewMode, LoopMode, Track, WidgetPosition, QuickLink, LinkOpenMode, FluidAccent, FluidBackground, ServerEndpoint } from './types';

const App: React.FC = () => {
  const [bootStatus, setBootStatus] = useState<'booting' | 'locked' | 'unlocked'>('booting');
  const [sessionPin, setSessionPin] = useState<string>('1969');
  
  // --- SETTINGS STATE ---
  const [theme, setTheme] = useState<Theme>('standard');
  const [fluidAccent, setFluidAccent] = useState<FluidAccent>('teal');
  const [fluidBackground, setFluidBackground] = useState<FluidBackground>('deep');
  const [linkOpenMode, setLinkOpenMode] = useState<LinkOpenMode>('new_tab');
  const [callsign, setCallsign] = useState<string>('');
  const [crtEnabled, setCrtEnabled] = useState<boolean>(false);
  const [autoLockSeconds, setAutoLockSeconds] = useState<number>(0);
  const [widgetPosition, setWidgetPosition] = useState<WidgetPosition>('tool');
  const [greetingEnabled, setGreetingEnabled] = useState(false);
  const [greetingText, setGreetingText] = useState('WELCOME COMMANDER');
  const [authEnabled, setAuthEnabled] = useState(true);
  const [nexusEnabled, setNexusEnabled] = useState(false);

  // --- UI STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { pathname } = useLocation();

  // --- DASHBOARD STATE ---
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('blue_view_mode');
    return saved === ViewMode.GRID ? ViewMode.GRID : ViewMode.LIST;
  });
  const [showViewToggle, setShowViewToggle] = useState(false);

  // --- AUDIO ENGINE 2.0 STATE ---
  const [audioElement] = useState(() => new Audio());
  const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [loopMode, setLoopMode] = useState<LoopMode>('off');
  const [shuffle, setShuffle] = useState(false);
  const [shuffledQueue, setShuffledQueue] = useState<string[]>([]);

  // --- AUTO LOCK TIMER REF ---
  const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- INIT & MIGRATION ---
  useEffect(() => {
    // 1. Session & Auth
    const cachedPin = localStorage.getItem('blue_pin');
    const cachedTheme = localStorage.getItem('blue_theme') as Theme;
    const cachedFluidAccent = localStorage.getItem('blue_fluid_accent') as FluidAccent;
    const cachedFluidBg = localStorage.getItem('blue_fluid_bg') as FluidBackground;
    const cachedLinkMode = localStorage.getItem('blue_link_mode') as LinkOpenMode;
    const cachedCallsign = localStorage.getItem('blue_callsign');
    const cachedCrt = localStorage.getItem('blue_crt');
    const cachedAutoLock = localStorage.getItem('blue_autolock');
    const cachedWidgetPos = localStorage.getItem('blue_widget_pos') as WidgetPosition;
    
    const cachedGreetingEnabled = localStorage.getItem('blue_greeting_enabled');
    const cachedGreetingText = localStorage.getItem('blue_greeting_text');
    const cachedNexusEnabled = localStorage.getItem('blue_nexus_enabled');
    
    // Auth Enabled check (default true if missing)
    const cachedAuthEnabled = localStorage.getItem('blue_auth_enabled');
    const isAuthEnabled = cachedAuthEnabled !== 'false';
    setAuthEnabled(isAuthEnabled);

    if (cachedPin) {
      setSessionPin(cachedPin);
      if (cachedTheme) setTheme(cachedTheme);
      if (cachedFluidAccent) setFluidAccent(cachedFluidAccent);
      if (cachedFluidBg) setFluidBackground(cachedFluidBg);
      if (cachedLinkMode) setLinkOpenMode(cachedLinkMode);
      if (cachedCallsign) setCallsign(cachedCallsign);
      if (cachedCrt) setCrtEnabled(cachedCrt === 'true');
      if (cachedAutoLock) setAutoLockSeconds(parseInt(cachedAutoLock));
      if (cachedWidgetPos) setWidgetPosition(cachedWidgetPos);
      if (cachedGreetingEnabled) setGreetingEnabled(cachedGreetingEnabled === 'true');
      if (cachedGreetingText) setGreetingText(cachedGreetingText);
      if (cachedNexusEnabled) setNexusEnabled(cachedNexusEnabled === 'true');
      
      setBootStatus(isAuthEnabled ? 'locked' : 'unlocked');
    }

    // 2. Audio Data Migration
    const cachedPlaylists = localStorage.getItem('blue_music_playlists');
    const legacyPlaylist = localStorage.getItem('blue_playlist');
    
    if (cachedPlaylists) {
        setPlaylists(JSON.parse(cachedPlaylists));
    } else if (legacyPlaylist) {
        const tracks: Track[] = JSON.parse(legacyPlaylist);
        const newList: MusicPlaylist = {
            id: 'default-migrated',
            title: 'Default Frequency',
            tracks
        };
        setPlaylists([newList]);
        localStorage.setItem('blue_music_playlists', JSON.stringify([newList]));
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

  // --- AUTO LOCK LOGIC ---
  const resetActivityTimer = useCallback(() => {
    if (bootStatus !== 'unlocked' || autoLockSeconds <= 0 || !authEnabled) return;

    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);

    activityTimerRef.current = setTimeout(() => {
        setBootStatus('locked');
    }, autoLockSeconds * 1000);
  }, [bootStatus, autoLockSeconds, authEnabled]);

  useEffect(() => {
      if (bootStatus === 'unlocked' && autoLockSeconds > 0 && authEnabled) {
          window.addEventListener('mousemove', resetActivityTimer);
          window.addEventListener('keydown', resetActivityTimer);
          window.addEventListener('click', resetActivityTimer);
          resetActivityTimer();
      } else {
          if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      }

      return () => {
          window.removeEventListener('mousemove', resetActivityTimer);
          window.removeEventListener('keydown', resetActivityTimer);
          window.removeEventListener('click', resetActivityTimer);
          if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      };
  }, [bootStatus, autoLockSeconds, authEnabled, resetActivityTimer]);


  // --- AUDIO LOGIC ---
  const activePlaylist = playlists.find(p => p.id === activePlaylistId);
  const currentTrack = activePlaylist?.tracks.find(t => t.id === currentTrackId);

  useEffect(() => {
      if (shuffle && activePlaylist) {
          const ids = activePlaylist.tracks.map(t => t.id);
          for (let i = ids.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [ids[i], ids[j]] = [ids[j], ids[i]];
          }
          setShuffledQueue(ids);
      } else {
          setShuffledQueue([]);
      }
  }, [shuffle, activePlaylistId, activePlaylist?.tracks.length]);

  useEffect(() => {
      audioElement.volume = volume;
  }, [volume, audioElement]);

  useEffect(() => {
      if (currentTrack) {
          if (audioElement.src !== currentTrack.url) {
              audioElement.src = currentTrack.url;
              if (isPlaying) {
                  audioElement.play().catch(e => console.error("Play error", e));
              }
          } else {
              if (isPlaying) {
                  audioElement.play().catch(e => console.error("Play error", e));
              } else {
                  audioElement.pause();
              }
          }
      } else {
          audioElement.pause();
          setIsPlaying(false);
      }
  }, [currentTrack, isPlaying, audioElement]);

  const playNext = useCallback(() => {
      if (!activePlaylist || activePlaylist.tracks.length === 0) return;
      
      let nextTrackId: string | undefined;

      if (shuffle && shuffledQueue.length > 0) {
          const currentQueueIndex = shuffledQueue.indexOf(currentTrackId || '');
          let nextIndex = currentQueueIndex + 1;
          
          if (nextIndex >= shuffledQueue.length) {
              if (loopMode === 'all') {
                  nextIndex = 0;
              } else {
                  setIsPlaying(false);
                  return;
              }
          }
          nextTrackId = shuffledQueue[nextIndex];

      } else {
          const currentIndex = activePlaylist.tracks.findIndex(t => t.id === currentTrackId);
          let nextIndex = currentIndex + 1;
          if (nextIndex >= activePlaylist.tracks.length) {
              if (loopMode === 'all') nextIndex = 0;
              else {
                  setIsPlaying(false);
                  return;
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
    const handleEnded = () => {
        if (loopMode === 'one') {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => console.error("Replay error", e));
        } else {
            playNext();
        }
    };

    audioElement.addEventListener('ended', handleEnded);
    return () => audioElement.removeEventListener('ended', handleEnded);
  }, [playNext, loopMode, audioElement]); 

  // --- STATE SETTERS ---
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

  const handleBootComplete = (
      pin: string, 
      requiresAuth: boolean, 
      loadedTheme?: Theme, 
      loadedPlaylists?: MusicPlaylist[],
      loadedCallsign?: string,
      loadedCrt?: boolean,
      loadedAutoLock?: number,
      loadedWidgetPos?: WidgetPosition,
      quickLinks?: QuickLink[],
      loadedGreetingEnabled?: boolean,
      loadedGreetingText?: string,
      loadedAuthEnabled?: boolean,
      loadedLinkOpenMode?: LinkOpenMode,
      loadedFluidAccent?: FluidAccent,
      loadedFluidBackground?: FluidBackground,
      loadedNexusEndpoints?: ServerEndpoint[],
      loadedNexusEnabled?: boolean
  ) => {
    setSessionPin(pin);
    if (loadedTheme) setTheme(loadedTheme);
    if (loadedFluidAccent) setFluidAccent(loadedFluidAccent);
    if (loadedFluidBackground) setFluidBackground(loadedFluidBackground);
    if (loadedLinkOpenMode) setLinkOpenMode(loadedLinkOpenMode);
    if (loadedPlaylists) setPlaylists(loadedPlaylists);
    if (loadedCallsign) setCallsign(loadedCallsign);
    if (loadedCrt !== undefined) setCrtEnabled(loadedCrt);
    if (loadedAutoLock !== undefined) setAutoLockSeconds(loadedAutoLock);
    if (loadedWidgetPos) setWidgetPosition(loadedWidgetPos);
    if (loadedGreetingEnabled !== undefined) setGreetingEnabled(loadedGreetingEnabled);
    if (loadedGreetingText) setGreetingText(loadedGreetingText);
    if (loadedNexusEnabled !== undefined) setNexusEnabled(loadedNexusEnabled);
    
    // Nexus endpoints are handled internally by Nexus page via localStorage, 
    // but we load them here just to confirm data integrity if needed, 
    // though Config/Nexus usually read directly. BootLoader seeds localStorage.
    
    const shouldAuth = loadedAuthEnabled !== undefined ? loadedAuthEnabled : true;
    setAuthEnabled(shouldAuth);
    
    if (quickLinks && quickLinks.length > 0) localStorage.setItem('blue_quick_links', JSON.stringify(quickLinks));
    
    setBootStatus((requiresAuth && shouldAuth) ? 'locked' : 'unlocked');
  };

  const handleSystemReset = () => {
    setBootStatus('booting');
  };

  const updateTheme = (newTheme: Theme) => {
      setTheme(newTheme);
      localStorage.setItem('blue_theme', newTheme);
  };

  const updateFluidAccent = (accent: FluidAccent) => {
      setFluidAccent(accent);
      localStorage.setItem('blue_fluid_accent', accent);
  };

  const updateFluidBackground = (bg: FluidBackground) => {
      setFluidBackground(bg);
      localStorage.setItem('blue_fluid_bg', bg);
  };

  const updateLinkOpenMode = (mode: LinkOpenMode) => {
      setLinkOpenMode(mode);
      localStorage.setItem('blue_link_mode', mode);
  }
  
  const updateCallsign = (name: string) => {
      setCallsign(name);
      localStorage.setItem('blue_callsign', name);
  };
  
  const updateCrt = (enabled: boolean) => {
      setCrtEnabled(enabled);
      localStorage.setItem('blue_crt', String(enabled));
  };

  const updateAutoLock = (seconds: number) => {
      setAutoLockSeconds(seconds);
      localStorage.setItem('blue_autolock', String(seconds));
  };

  const updateWidgetPosition = (pos: WidgetPosition) => {
      setWidgetPosition(pos);
      localStorage.setItem('blue_widget_pos', pos);
  };

  const updateGreetingEnabled = (enabled: boolean) => {
      setGreetingEnabled(enabled);
      localStorage.setItem('blue_greeting_enabled', String(enabled));
  };

  const updateGreetingText = (text: string) => {
      setGreetingText(text);
      localStorage.setItem('blue_greeting_text', text);
  };

  const updateAuthEnabled = (enabled: boolean) => {
      setAuthEnabled(enabled);
      localStorage.setItem('blue_auth_enabled', String(enabled));
  };

  const updateNexusEnabled = (enabled: boolean) => {
      setNexusEnabled(enabled);
      localStorage.setItem('blue_nexus_enabled', String(enabled));
  };

  if (bootStatus === 'booting') {
      return <BootLoader onLoadComplete={handleBootComplete} />;
  }

  if (bootStatus === 'locked') {
    return <LockScreen targetPin={sessionPin} onUnlock={() => setBootStatus('unlocked')} onReset={handleSystemReset} callsign={callsign} />;
  }

  let content;
  if (pathname === '/notes') content = <Notes />;
  else if (pathname === '/tasks') content = <Tasks />;
  else if (pathname === '/oracle') content = <Oracle />;
  else if (pathname === '/uplink') content = <Bookmarks linkOpenMode={linkOpenMode} />;
  else if (pathname === '/files') content = <Files />;
  else if (pathname === '/nexus') content = <Nexus />;
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
  } else if (pathname === '/chronos') {
      content = <Chronos />;
  } else if (pathname === '/cipher') {
      content = <Cipher />;
  } else if (pathname === '/whiteboard') {
      content = <Whiteboard />;
  } else if (pathname === '/games') {
      content = <Games />;
  } else if (pathname === '/weather') {
      content = <Weather />;
  } else if (pathname === '/news') {
      content = <News linkOpenMode={linkOpenMode} />;
  } else if (pathname === '/ide') {
      content = <IDE />;
  } else if (pathname === '/calculator') {
      content = <Calculator />;
  }
  else if (pathname === '/config') {
      content = <Config 
          currentTheme={theme} 
          onThemeChange={updateTheme}
          fluidAccent={fluidAccent}
          onFluidAccentChange={updateFluidAccent}
          fluidBackground={fluidBackground}
          onFluidBackgroundChange={updateFluidBackground}
          linkOpenMode={linkOpenMode}
          onLinkOpenModeChange={updateLinkOpenMode}
          callsign={callsign}
          onCallsignChange={updateCallsign}
          crtEnabled={crtEnabled}
          onCrtChange={updateCrt}
          autoLockSeconds={autoLockSeconds}
          onAutoLockChange={updateAutoLock}
          widgetPosition={widgetPosition}
          onWidgetPositionChange={updateWidgetPosition}
          greetingEnabled={greetingEnabled}
          onGreetingEnabledChange={updateGreetingEnabled}
          greetingText={greetingText}
          onGreetingTextChange={updateGreetingText}
          authEnabled={authEnabled}
          onAuthEnabledChange={updateAuthEnabled}
          nexusEnabled={nexusEnabled}
          onNexusEnabledChange={updateNexusEnabled}
          musicPlaylists={playlists} 
          audioState={{ volume, loopMode, shuffle }} 
      />;
  }
  else content = (
      <Dashboard 
        viewMode={viewMode} 
        onHeroIntersect={(visible) => setShowViewToggle(!visible)} 
        widgetPosition={widgetPosition} 
        greetingEnabled={greetingEnabled}
        greetingText={greetingText}
        linkOpenMode={linkOpenMode}
        theme={theme}
        fluidAccent={fluidAccent}
        fluidBackground={fluidBackground}
        sidebarOpen={sidebarOpen}
        nexusEnabled={nexusEnabled}
      />
  );

  return (
    <Layout 
        theme={theme} 
        fluidAccent={fluidAccent}
        fluidBackground={fluidBackground}
        callsign={callsign} 
        crtEnabled={crtEnabled}
        isPlaying={isPlaying} 
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        showViewToggle={showViewToggle && (pathname === '/' || pathname === '')}
        viewMode={viewMode}
        onToggleView={() => {
            const newMode = viewMode === ViewMode.LIST ? ViewMode.GRID : ViewMode.LIST;
            setViewMode(newMode);
            localStorage.setItem('blue_view_mode', newMode);
        }}
        greetingEnabled={greetingEnabled}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
    >
      {content}
    </Layout>
  );
};

export default App;
