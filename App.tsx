
import * as React from 'react';
import { useState } from 'react';
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
import { Theme } from './types';

const App: React.FC = () => {
  const [bootStatus, setBootStatus] = useState<'booting' | 'locked' | 'unlocked'>('booting');
  const [sessionPin, setSessionPin] = useState<string>('1969');
  const [theme, setTheme] = useState<Theme>('standard');
  const { pathname } = useLocation();

  const handleBootComplete = (pin: string, requiresAuth: boolean, loadedTheme?: Theme) => {
    setSessionPin(pin);
    if (loadedTheme) setTheme(loadedTheme);
    setBootStatus(requiresAuth ? 'locked' : 'unlocked');
  };

  const updateTheme = (newTheme: Theme) => {
      setTheme(newTheme);
      localStorage.setItem('blue_theme', newTheme);
  };

  if (bootStatus === 'booting') {
      return <BootLoader onLoadComplete={handleBootComplete} />;
  }

  if (bootStatus === 'locked') {
    return <LockScreen targetPin={sessionPin} onUnlock={() => setBootStatus('unlocked')} />;
  }

  let content;
  if (pathname === '/' || pathname === '') {
    content = <Dashboard />;
  } else if (pathname === '/notes') {
    content = <Notes />;
  } else if (pathname === '/tasks') {
    content = <Tasks />;
  } else if (pathname === '/oracle') {
    content = <Oracle />;
  } else if (pathname === '/uplink') {
    content = <Bookmarks />;
  } else if (pathname === '/files') {
    content = <Files />;
  } else if (pathname === '/config') {
    content = <Config currentTheme={theme} onThemeChange={updateTheme} />;
  } else {
    content = <Dashboard />;
  }

  return (
    <Layout theme={theme}>
      {content}
    </Layout>
  );
};

export default App;
