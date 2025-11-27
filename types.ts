
export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
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

export interface ToolItem {
  id: string;
  number: string;
  category: string;
  title: string;
  description: string;
  path: string;
  imageText: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  data: string;
  size: number;
  date: string;
}

export type Theme = 'standard' | 'stealth';

export interface UserData {
  version: string;
  pin: string;
  theme: Theme;
  apiKey?: string;
  notes: Note[];
  taskLists: TaskList[];
  bookmarks: Bookmark[];
  files: FileItem[];
}

export enum ViewMode {
  LIST = 'LIST',
  GRID = 'GRID'
}
