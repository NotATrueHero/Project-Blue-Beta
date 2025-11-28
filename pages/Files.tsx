
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Upload, Trash2, Image as ImageIcon, AlertTriangle, HardDrive, X, Download, Maximize2, FileText, FolderPlus, Folder, ChevronRight, CornerDownRight, ChevronDown, Edit2, GripVertical, FileCode } from 'lucide-react';
import { FileItem, FileFolder } from '../types';

const MAX_STORAGE_BYTES = 4.5 * 1024 * 1024; // ~4.5MB safe limit for localStorage

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const Files: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  
  // Folder Creation / Renaming
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('blue_files');
    const savedFolders = localStorage.getItem('blue_file_folders');
    if (saved) setFiles(JSON.parse(saved));
    if (savedFolders) setFolders(JSON.parse(savedFolders));
  }, []);

  useEffect(() => {
      // Decode content when a text file is selected
      if (selectedFile && selectedFile.type.startsWith('text/')) {
          try {
              // Extract base64 part if standard data URI
              const base64 = selectedFile.data.split(',')[1];
              if (base64) {
                  const decoded = decodeURIComponent(escape(atob(base64)));
                  setFileContent(decoded);
              } else {
                  setFileContent("Error: Invalid Data Format");
              }
          } catch (e) {
              setFileContent("Error: Could not decode text content.");
          }
      } else {
          setFileContent(null);
      }
  }, [selectedFile]);

  const saveFiles = (updated: FileItem[]) => {
    try {
        const json = JSON.stringify(updated);
        if (json.length > MAX_STORAGE_BYTES) {
            throw new Error("Storage quota exceeded.");
        }
        localStorage.setItem('blue_files', json);
        setFiles(updated);
        setError(null);
    } catch (e) {
        setError("Storage Full. Delete items to free space.");
    }
  };

  const saveFolders = (updatedFolders: FileFolder[]) => {
      setFolders(updatedFolders);
      localStorage.setItem('blue_file_folders', JSON.stringify(updatedFolders));
  };

  const calculateUsedSpace = () => {
      const json = JSON.stringify(files);
      return (json.length / MAX_STORAGE_BYTES) * 100;
  };

  // --- Folder Operations ---
  const createFolder = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFolderName.trim()) return;
      const folder: FileFolder = { 
          id: Date.now().toString(), 
          name: newFolderName.toUpperCase(),
          parentId: activeFolderId || undefined
      };
      saveFolders([...folders, folder]);
      setNewFolderName('');
      setIsAddingFolder(false);
  };

  const deleteFolder = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const updatedFiles = files.map(f => f.folderId === id ? { ...f, folderId: undefined } : f);
      const idsToDelete = [id];
      const findChildren = (pid: string) => {
          folders.forEach(f => {
              if (f.parentId === pid) {
                  idsToDelete.push(f.id);
                  findChildren(f.id);
              }
          });
      };
      findChildren(id);
      
      const updatedFolders = folders.filter(f => !idsToDelete.includes(f.id));
      
      saveFiles(updatedFiles);
      saveFolders(updatedFolders);
      
      if (activeFolderId && idsToDelete.includes(activeFolderId)) setActiveFolderId(null);
  };

  const moveFile = (fileId: string, folderId: string | undefined) => {
      const updatedFiles = files.map(f => f.id === fileId ? { ...f, folderId } : f);
      saveFiles(updatedFiles);
      if (selectedFile?.id === fileId) {
          setSelectedFile({ ...selectedFile, folderId });
      }
  };

  const handleRename = (id: string, type: 'file' | 'folder', currentName: string) => {
      setRenamingId(id);
      setRenameValue(currentName);
  };

  const confirmRename = () => {
      if (!renamingId || !renameValue.trim()) {
          setRenamingId(null);
          return;
      }
      
      const isFolder = folders.some(f => f.id === renamingId);
      
      if (isFolder) {
          const updated = folders.map(f => f.id === renamingId ? { ...f, name: renameValue.toUpperCase() } : f);
          saveFolders(updated);
      } else {
          const updated = files.map(f => f.id === renamingId ? { ...f, name: renameValue.toUpperCase() } : f);
          saveFiles(updated);
          if (selectedFile?.id === renamingId) setSelectedFile({ ...selectedFile, name: renameValue.toUpperCase() });
      }
      setRenamingId(null);
  };

  // --- File Operations ---
  const handleFileUpload = (file: File) => {
    // Determine type
    const isImage = file.type.startsWith('image/');
    const isText = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.js') || file.name.endsWith('.ts');

    if (!isImage && !isText) {
        setError("Invalid format. Image or Text files only.");
        return;
    }
    
    const reader = new FileReader();
    
    if (isImage) {
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxWidth = 800;
                const scale = maxWidth / img.width;
                const width = scale < 1 ? maxWidth : img.width;
                const height = scale < 1 ? img.height * scale : img.height;
                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);
                const base64 = canvas.toDataURL('image/jpeg', 0.7);
                addFile(file, base64);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    } else {
        reader.onload = (e) => {
            const text = e.target?.result as string;
            // Base64 encode text
            const base64 = `data:${file.type || 'text/plain'};base64,${btoa(unescape(encodeURIComponent(text)))}`;
            addFile(file, base64);
        };
        reader.readAsText(file);
    }
  };

  const addFile = (file: File, data: string) => {
      const newFile: FileItem = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type || (file.name.endsWith('.md') ? 'text/markdown' : 'text/plain'),
        data: data,
        size: data.length, // Rough estimate
        date: new Date().toLocaleDateString(),
        folderId: activeFolderId || undefined 
    };
    saveFiles([...files, newFile]);
  };

  const removeFile = (e: React.MouseEvent | null, id: string) => {
      if (e) { e.stopPropagation(); e.preventDefault(); }
      if (selectedFile?.id === id) setSelectedFile(null);
      saveFiles(files.filter(f => f.id !== id));
  };

  const downloadFile = (file: FileItem) => {
      const link = document.createElement("a");
      link.href = file.data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleFileReorder = (newOrder: FileItem[]) => {
      const others = files.filter(f => f.folderId !== activeFolderId);
      // Determine if we are in root (activeFolderId is null) or a folder
      // The newOrder only contains files in the current view
      // We need to merge them back with 'others'
      
      // If we are at root, we need to preserve files that HAVE a folderId (others)
      // If we are in a folder, we need to preserve files that have DIFFERENT folderId (others)
      
      // The issue with Reorder is that it might lose items if not careful.
      // Safest way: 
      saveFiles([...others, ...newOrder]);
  };

  const handleDragEnd = (event: any, info: any, fileId: string) => {
      // Logic to detect drop on folder
      const dropTarget = document.elementFromPoint(info.point.x, info.point.y);
      const folderElement = dropTarget?.closest('[data-folder-id]');
      
      if (folderElement) {
          const targetId = folderElement.getAttribute('data-folder-id');
          // If dropping on "Root" sidebar item
          if (targetId === 'root') {
              if (activeFolderId !== null) moveFile(fileId, undefined);
          } 
          // If dropping on a folder card or sidebar item
          else if (targetId && targetId !== activeFolderId) {
              moveFile(fileId, targetId);
          }
      }
  };

  const usagePercent = calculateUsedSpace();
  
  // Filter files for current view
  const currentViewFiles = activeFolderId 
    ? files.filter(f => f.folderId === activeFolderId) 
    : files.filter(f => f.folderId === undefined);

  // Filter folders for current view (Sub-folders)
  const currentViewFolders = activeFolderId
    ? folders.filter(f => f.parentId === activeFolderId)
    : folders.filter(f => !f.parentId);

  const FolderTreeItem: React.FC<{ folder: FileFolder, depth: number }> = ({ folder, depth }) => {
      const children = folders.filter(f => f.parentId === folder.id);
      const isOpen = activeFolderId === folder.id || children.some(c => c.id === activeFolderId) || (activeFolderId && folders.find(f => f.id === activeFolderId)?.parentId === folder.id);
      const [expanded, setExpanded] = useState(isOpen);

      return (
          <div className="select-none">
              <div 
                  data-folder-id={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`group flex items-center justify-between px-3 py-2 cursor-pointer border border-transparent hover:border-white/50 transition-all ${activeFolderId === folder.id ? 'bg-white text-blue-base font-bold' : 'text-white'}`}
                  style={{ paddingLeft: `${depth * 12 + 12}px` }}
              >
                  <div className="flex items-center gap-2 truncate flex-1 pointer-events-none">
                      {children.length > 0 && (
                          <div onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="pointer-events-auto">
                              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </div>
                      )}
                      {children.length === 0 && <span className="w-3" />}
                      
                      {renamingId === folder.id ? (
                          <input 
                              autoFocus 
                              value={renameValue} 
                              onChange={(e) => setRenameValue(e.target.value)} 
                              onBlur={confirmRename}
                              onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-transparent border-b border-current w-full outline-none text-xs uppercase pointer-events-auto"
                          />
                      ) : (
                        <span className="uppercase text-xs truncate pointer-events-auto" onDoubleClick={() => handleRename(folder.id, 'folder', folder.name)}>{folder.name}</span>
                      )}
                  </div>
                  
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => {e.stopPropagation(); handleRename(folder.id, 'folder', folder.name); }} className="hover:text-blue-300 mr-1"><Edit2 size={10} /></button>
                        <button onClick={(e) => deleteFolder(e, folder.id)} className="hover:text-red-500"><Trash2 size={10} /></button>
                  </div>
              </div>
              {expanded && children.map(child => <FolderTreeItem key={child.id} folder={child} depth={depth + 1} />)}
          </div>
      );
  };

  const getBreadcrumbs = () => {
      const path = [];
      let curr = activeFolderId ? folders.find(f => f.id === activeFolderId) : null;
      while (curr) {
          path.unshift(curr);
          curr = curr.parentId ? folders.find(f => f.id === curr?.parentId) : null;
      }
      return path;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="w-full h-full pt-24 px-4 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col relative"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b-2 border-white pb-6 gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Intel Vault</h1>
          <p className="text-sm md:text-base uppercase tracking-widest opacity-70">Secure Encoded Storage</p>
        </div>
        
        <div className="w-full md:w-64">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 opacity-70">
                <span>Storage</span>
                <span>{usagePercent.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-white/20">
                <div 
                    className={`h-full transition-all duration-500 ${usagePercent > 90 ? 'bg-red-500' : 'bg-white'}`} 
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
            </div>
        </div>
      </div>

      {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 p-4 flex items-center gap-3 text-red-200 uppercase font-bold tracking-wider">
              <AlertTriangle size={20} />
              {error}
          </div>
      )}

      {/* Main Layout: Sidebar + Grid */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
          
          {/* Sidebar */}
          <div className="w-full md:w-1/4 h-[200px] md:h-full border-4 border-white p-4 flex flex-col gap-4">
               <div className="flex justify-between items-center pb-2 border-b border-white/20">
                    <h3 className="text-xs font-bold uppercase tracking-widest opacity-70">Directories</h3>
                    <button onClick={() => setIsAddingFolder(true)} className="hover:text-blue-300 transition-colors"><FolderPlus size={16} /></button>
               </div>

               {isAddingFolder && (
                    <form onSubmit={createFolder} className="mb-2">
                        <input 
                            type="text" 
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            placeholder="DIR NAME..."
                            autoFocus
                            onBlur={() => setIsAddingFolder(false)}
                            className="w-full bg-transparent border-b border-white text-xs font-bold uppercase outline-none"
                        />
                    </form>
               )}

               <div className="flex-1 overflow-y-auto hide-scrollbar space-y-1">
                   <div 
                        data-folder-id="root"
                        onClick={() => setActiveFolderId(null)}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer border border-transparent hover:border-white/50 transition-all ${activeFolderId === null ? 'bg-white text-blue-base font-bold' : 'text-white'}`}
                    >
                        <HardDrive size={14} /> <span>ROOT INTEL</span>
                    </div>
                    {folders.filter(f => !f.parentId).map(folder => (
                        <FolderTreeItem key={folder.id} folder={folder} depth={0} />
                    ))}
               </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col h-full min-h-0">
               <div className="flex justify-between items-center mb-4">
                   <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest overflow-hidden">
                       <span 
                            onClick={() => setActiveFolderId(null)} 
                            className={`cursor-pointer hover:text-blue-300 ${!activeFolderId ? 'text-blue-300' : ''}`}
                       >
                           ROOT
                       </span>
                       {getBreadcrumbs().map((f, i) => (
                           <React.Fragment key={f.id}>
                               <ChevronRight size={12} className="opacity-50" />
                               <span 
                                    onClick={() => setActiveFolderId(f.id)}
                                    className={`cursor-pointer hover:text-blue-300 whitespace-nowrap ${i === getBreadcrumbs().length - 1 ? 'text-blue-300' : ''}`}
                               >
                                   {f.name}
                               </span>
                           </React.Fragment>
                       ))}
                   </div>

                   <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="shrink-0 flex items-center gap-2 border border-white px-4 py-2 text-xs font-bold uppercase hover:bg-white hover:text-blue-base transition-colors"
                   >
                       <Upload size={14} /> Import
                   </button>
               </div>

                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                
                <div 
                    className={`flex-1 overflow-y-auto hide-scrollbar relative border-2 border-transparent transition-all ${isDragging ? 'bg-white/10 border-white border-dashed' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handleFileUpload(file);
                    }}
                >
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                        {/* Render Sub-Folders first (Not Reorderable in this grid) */}
                        {currentViewFolders.map(folder => (
                            <div
                                key={folder.id}
                                data-folder-id={folder.id}
                                onClick={() => setActiveFolderId(folder.id)}
                                className="aspect-square border-2 border-white/50 bg-white/5 hover:bg-white/20 hover:border-white cursor-pointer flex flex-col items-center justify-center gap-2 transition-all p-4 text-center group"
                            >
                                <Folder size={32} className="text-blue-300 group-hover:text-white" />
                                <div className="text-xs font-bold uppercase truncate w-full px-2">{folder.name}</div>
                            </div>
                        ))}

                        {/* Render Files (Reorderable) */}
                        <Reorder.Group axis="y" values={currentViewFiles} onReorder={handleFileReorder} className="contents">
                            {currentViewFiles.map(file => (
                                <Reorder.Item 
                                    key={file.id} 
                                    value={file} 
                                    layout // CRITICAL: Fixes overlapping during drag
                                    onDragEnd={(e, info) => handleDragEnd(e, info, file.id)}
                                    className="relative aspect-square"
                                >
                                    <div 
                                        onClick={() => setSelectedFile(file)}
                                        className="group w-full h-full relative border-2 border-white bg-black/20 flex flex-col cursor-pointer hover:border-blue-400 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all"
                                    >
                                        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <GripVertical className="cursor-grab active:cursor-grabbing text-white drop-shadow-md" size={24} />
                                        </div>

                                        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/40">
                                            {file.type.startsWith('image/') ? (
                                                <img src={file.data} alt={file.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <div className="text-white opacity-50 group-hover:opacity-100 group-hover:text-blue-300 transition-all flex flex-col items-center">
                                                    <FileCode size={48} strokeWidth={1} />
                                                    <div className="text-[10px] font-mono mt-2">{file.name.split('.').pop()?.toUpperCase()}</div>
                                                </div>
                                            )}
                                            
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                <Maximize2 className="text-white drop-shadow-md" size={32} />
                                            </div>
                                        </div>
                                        <div className="p-3 border-t-2 border-white/20 bg-white/5 flex justify-between items-center">
                                            <div className="overflow-hidden w-full mr-2">
                                                {renamingId === file.id ? (
                                                    <input 
                                                        autoFocus
                                                        value={renameValue}
                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                        onBlur={confirmRename}
                                                        onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-full bg-transparent border-b border-white text-xs font-bold uppercase outline-none"
                                                    />
                                                ) : (
                                                    <div 
                                                        className="font-bold text-xs uppercase truncate mb-1"
                                                        onDoubleClick={(e) => { e.stopPropagation(); handleRename(file.id, 'file', file.name); }}
                                                    >
                                                        {file.name}
                                                    </div>
                                                )}
                                                <div className="text-[10px] font-mono opacity-50">{file.date}</div>
                                            </div>
                                            <button 
                                                onClick={(e) => removeFile(e, file.id)} 
                                                className="p-1 hover:text-red-400 transition-colors z-10 shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>

                    {currentViewFiles.length === 0 && currentViewFolders.length === 0 && (
                        <div className="w-full h-full flex flex-col items-center justify-center opacity-30 absolute top-0 left-0 pointer-events-none">
                            <HardDrive size={48} className="mb-4" />
                            <div className="uppercase tracking-widest font-bold">No Intel Found</div>
                            <div className="text-xs mt-2">Drag files here to upload</div>
                        </div>
                    )}
                </div>
          </div>
      </div>

      {/* Inspector Modal */}
      <AnimatePresence>
        {selectedFile && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                onClick={() => setSelectedFile(null)}
            >
                <motion.div 
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="relative max-w-4xl w-full bg-black/40 border-2 border-white shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-white/20 bg-white/5">
                        <div className="flex items-center gap-3 w-full">
                            {selectedFile.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                            {renamingId === selectedFile.id ? (
                                <input 
                                    autoFocus
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onBlur={confirmRename}
                                    onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                                    className="bg-transparent border-b border-white font-bold uppercase tracking-wider outline-none w-1/2"
                                />
                            ) : (
                                <div className="flex items-center gap-2 font-bold uppercase tracking-wider truncate max-w-[200px] md:max-w-md">
                                    {selectedFile.name}
                                    <button onClick={() => handleRename(selectedFile.id, 'file', selectedFile.name)} className="opacity-50 hover:opacity-100 hover:text-blue-300"><Edit2 size={12} /></button>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => setSelectedFile(null)}
                            className="p-1 hover:bg-white hover:text-black transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content Viewer */}
                    <div className="p-0 bg-black/50 flex-1 overflow-hidden flex flex-col">
                         <div className="relative flex items-center justify-center h-full overflow-auto">
                            {selectedFile.type.startsWith('image/') ? (
                                <img 
                                    src={selectedFile.data} 
                                    alt={selectedFile.name}
                                    className="max-w-full max-h-[60vh] object-contain"
                                />
                            ) : (
                                <div className="w-full h-full min-h-[400px] p-6 text-left font-mono text-sm text-white/80 overflow-auto bg-[#0d1117]">
                                    <pre className="whitespace-pre-wrap break-all">{fileContent || "Loading content..."}</pre>
                                </div>
                            )}
                         </div>
                    </div>

                    {/* Footer / Info Panel */}
                    <div className="p-6 border-t border-white/20 bg-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm w-full md:w-auto">
                            <div>
                                <div className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Size</div>
                                <div className="font-mono">{formatBytes(selectedFile.size)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Date</div>
                                <div className="font-mono">{selectedFile.date}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Location</div>
                                <div className="relative group inline-block">
                                     <div className="font-mono cursor-pointer flex items-center gap-1 hover:text-blue-300">
                                         {folders.find(f => f.id === selectedFile.folderId)?.name || 'ROOT'} <CornerDownRight size={10} />
                                     </div>
                                     
                                     <div className="absolute bottom-full left-0 mb-1 w-40 bg-blue-base border border-white hidden group-hover:block z-50 max-h-40 overflow-y-auto">
                                         <div 
                                            onClick={() => moveFile(selectedFile.id, undefined)}
                                            className="px-2 py-1 text-xs font-bold hover:bg-white hover:text-blue-base cursor-pointer"
                                         >
                                             MOVE TO ROOT
                                         </div>
                                         {folders.map(f => (
                                             <div 
                                                key={f.id}
                                                onClick={() => moveFile(selectedFile.id, f.id)}
                                                className="px-2 py-1 text-xs font-bold hover:bg-white hover:text-blue-base cursor-pointer truncate"
                                             >
                                                 {f.name}
                                             </div>
                                         ))}
                                     </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button 
                                onClick={() => downloadFile(selectedFile)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-white px-6 py-3 font-bold uppercase hover:bg-white hover:text-black transition-colors text-sm tracking-wider"
                            >
                                <Download size={16} /> Download
                            </button>
                            <button 
                                onClick={(e) => { removeFile(null, selectedFile.id); }}
                                className="flex-none border border-red-500/50 text-red-300 px-4 py-3 font-bold uppercase hover:bg-red-500 hover:text-white transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
