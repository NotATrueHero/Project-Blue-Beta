
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
  parentId?: string; // Added for nesting
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
  callsign?: string; 
  theme: Theme;
  crtEnabled?: boolean; 
  autoLockSeconds?: number;
  widgetPosition?: WidgetPosition;
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
  files: FileItem[];
  fileFolders: FileFolder[]; 
}

export enum ViewMode {
  LIST = 'LIST',
  GRID = 'GRID'
}
