
export interface Note {
  id: string;
  folderId?: string;
  title: string;
  content: string;
  date: string;
}

export interface NoteFolder {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskList {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
}

export interface BookmarkCategory {
  id: string;
  title: string;
  bookmarks: Bookmark[];
}

export interface QuickLink {
    id: string;
    title: string;
    url: string;
}

export interface ToolItem {
  id: string;
  number: string;
  category: string;
  title: string;
  description: string;
  path: string;
  imageText: string;
}

export interface FileFolder {
  id: string;
  parentId?: string;
  name: string;
}

export interface FileItem {
  id: string;
  folderId?: string;
  name: string;
  type: string;
  data: string;
  size: number;
  date: string;
}

export type Theme = 'standard' | 'stealth';
export type LinkOpenMode = 'new_tab' | 'current_tab';

export interface Track {
    id: string;
    title: string;
    url: string;
    addedAt: string;
    isLocal?: boolean;
}

export interface MusicPlaylist {
    id: string;
    title: string;
    tracks: Track[];
}

export type LoopMode = 'off' | 'all' | 'one';

export type WidgetPosition = 'hero' | 'tool' | 'hidden';

export interface UserData {
  version: string;
  pin: string;
  authEnabled?: boolean;
  callsign?: string; 
  theme: Theme;
  linkOpenMode?: LinkOpenMode;
  crtEnabled?: boolean; 
  autoLockSeconds?: number;
  widgetPosition?: WidgetPosition;
  
  // Greeting Config
  greetingEnabled?: boolean;
  greetingText?: string;

  apiKey?: string;
  
  // Audio State
  musicPlaylists: MusicPlaylist[];
  volume: number;
  loopMode: LoopMode;
  shuffle: boolean;

  notes: Note[];
  noteFolders: NoteFolder[];
  taskLists: TaskList[];
  bookmarkCategories: BookmarkCategory[];
  quickLinks?: QuickLink[]; 
  files: FileItem[];
  fileFolders: FileFolder[]; 
}

export enum ViewMode {
  LIST = 'LIST',
  GRID = 'GRID'
}
