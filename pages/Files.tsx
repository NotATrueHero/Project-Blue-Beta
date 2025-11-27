
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Image as ImageIcon, AlertTriangle, HardDrive, X, Download, Maximize2, FileText } from 'lucide-react';
import { FileItem } from '../types';

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
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('blue_files');
    if (saved) setFiles(JSON.parse(saved));
  }, []);

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

  const calculateUsedSpace = () => {
      const json = JSON.stringify(files);
      return (json.length / MAX_STORAGE_BYTES) * 100;
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError("Invalid format. Image files only.");
        return;
    }
    
    // Resize/Compress image before saving to save space
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxWidth = 800;
            const scale = maxWidth / img.width;
            
            // Only resize if bigger than max width
            const width = scale < 1 ? maxWidth : img.width;
            const height = scale < 1 ? img.height * scale : img.height;

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG 0.7
            const base64 = canvas.toDataURL('image/jpeg', 0.7);

            const newFile: FileItem = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type,
                data: base64,
                size: base64.length, // Approximate size in storage
                date: new Date().toLocaleDateString()
            };

            saveFiles([...files, newFile]);
        };
        img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (e: React.MouseEvent | null, id: string) => {
      if (e) e.stopPropagation();
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

  const usagePercent = calculateUsedSpace();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="w-full h-full pt-24 px-6 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col relative"
    >
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b-2 border-white pb-6 gap-6">
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

      {/* Upload Zone */}
      <div 
          className={`border-4 border-dashed border-white/30 p-8 mb-12 text-center transition-all ${isDragging ? 'bg-white/10 border-white' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
          }}
          onClick={() => fileInputRef.current?.click()}
      >
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
          <div className="flex flex-col items-center gap-4 cursor-pointer">
              <Upload size={32} />
              <div>
                  <div className="font-bold text-lg uppercase">Import Schematic</div>
                  <div className="text-xs opacity-60 uppercase tracking-widest mt-1">Images auto-compressed for storage</div>
              </div>
          </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto pb-20 hide-scrollbar">
          {files.map(file => (
              <div 
                key={file.id} 
                onClick={() => setSelectedFile(file)}
                className="group relative border-2 border-white aspect-square bg-black/20 flex flex-col cursor-pointer hover:border-blue-400 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all"
              >
                  <div className="flex-1 relative overflow-hidden">
                      <img src={file.data} alt={file.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                         <Maximize2 className="text-white drop-shadow-md" size={32} />
                      </div>
                  </div>
                  <div className="p-3 border-t-2 border-white/20 bg-white/5 flex justify-between items-center">
                      <div className="overflow-hidden">
                        <div className="font-bold text-xs uppercase truncate mb-1">{file.name}</div>
                        <div className="text-[10px] font-mono opacity-50">{file.date}</div>
                      </div>
                      <button 
                        onClick={(e) => removeFile(e, file.id)} 
                        className="p-1 hover:text-red-400 transition-colors z-10"
                      >
                          <Trash2 size={16} />
                      </button>
                  </div>
              </div>
          ))}

          {files.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-30">
                  <HardDrive size={48} className="mb-4" />
                  <div className="uppercase tracking-widest font-bold">Vault Empty</div>
              </div>
          )}
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
                    className="relative max-w-4xl w-full bg-black/40 border-2 border-white shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-white/20 bg-white/5">
                        <div className="flex items-center gap-3">
                            <FileText size={20} />
                            <div className="font-bold uppercase tracking-wider truncate max-w-[200px] md:max-w-md">
                                {selectedFile.name}
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedFile(null)}
                            className="p-1 hover:bg-white hover:text-black transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                         <div className="relative border border-white/20 bg-black/50 flex items-center justify-center min-h-[300px] max-h-[50vh]">
                            <img 
                                src={selectedFile.data} 
                                alt={selectedFile.name}
                                className="max-w-full max-h-[50vh] object-contain"
                            />
                         </div>
                    </div>

                    {/* Footer / Info Panel */}
                    <div className="p-6 border-t border-white/20 bg-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                        
                        {/* Metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm w-full md:w-auto">
                            <div>
                                <div className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Size</div>
                                <div className="font-mono">{formatBytes(selectedFile.size)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Date</div>
                                <div className="font-mono">{selectedFile.date}</div>
                            </div>
                            <div className="col-span-2 md:col-span-2">
                                <div className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Type</div>
                                <div className="font-mono truncate">{selectedFile.type}</div>
                            </div>
                        </div>

                        {/* Actions */}
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
