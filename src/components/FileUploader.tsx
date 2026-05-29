import React, { useCallback, useState } from 'react';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from './ui/Button';

interface FileUploaderProps {
  onUpload: (files: File[]) => void;
  isLoading: boolean;
}

export function FileUploader({ onUpload, isLoading }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const pDFs = Array.from<File>(e.dataTransfer.files as Iterable<File> | ArrayLike<File>).filter((f: File) => f.type === 'application/pdf');
      setSelectedFiles(prev => [...prev, ...pDFs]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const pDFs = Array.from<File>(e.target.files as Iterable<File> | ArrayLike<File>).filter((f: File) => f.type === 'application/pdf');
      setSelectedFiles(prev => [...prev, ...pDFs]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitFiles = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      <div 
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center text-center",
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100",
          isLoading && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          multiple 
          accept="application/pdf" 
          onChange={handleChange} 
          disabled={isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <UploadCloud className="w-10 h-10 text-gray-400 mb-4" />
        <h3 className="text-sm font-semibold text-gray-900 mb-1">点击或拖拽PDF文件至此</h3>
        <p className="text-xs text-gray-500">仅支持PDF格式文件</p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="flex flex-col space-y-3">
          <h4 className="text-sm font-medium text-gray-700">已选择的文件</h4>
          <div className="flex flex-col space-y-2">
            {selectedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <File className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 truncate">{f.name}</span>
                </div>
                <button 
                  onClick={() => removeFile(i)} 
                  disabled={isLoading}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  aria-label="移除文件"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <Button onClick={submitFiles} disabled={isLoading} className="self-end mt-2">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                提取中...
              </>
            ) : "处理文档"}
          </Button>
        </div>
      )}
    </div>
  );
}
